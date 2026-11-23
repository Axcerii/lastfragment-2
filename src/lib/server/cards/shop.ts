// Boutique des cartes : les offres préparées par le MJ, et l'échange lui-même.
//
// Un échange se fait en une transaction : l'offre est verrouillée (ses limites se comptent un
// échange à la fois), les fragments (champ `points`) ne sont retirés que s'il y en a assez, et chaque carte cédée ne
// change de mains que si elle appartient encore au joueur. Le moindre accroc annule tout : rien
// n'est payé sans être reçu, rien n'est reçu sans être payé. Les cartes cédées vont dans la
// réserve du MJ, avec leur historique, comme une carte retirée.

import { randomInt } from 'crypto';
import { Prisma, type CardShopOffer } from '@prisma/client';
import { drawSlot } from '$lib/cards/booster';
import {
	checkPicks,
	isEmptyPrice,
	isEmptyReward,
	offerRefs,
	parsePrice,
	parseReward,
	SHOP_LIMITS,
	type CopyFacts,
	type HeldReward,
	type PurchaseDetail,
	type RewardCard,
	type ShopPrice,
	type ShopReward
} from '$lib/cards/shop';
import type { OwnedCard, PackView, TemplateView } from '$lib/cards/types';
import { prisma } from '../prisma';
import { addStock, ensureWallet, PACK_ORDER, packsOf, printCopy, withRetry } from './boosters';
import { CardError, getRules } from './settings';
import { backReader, forReader, ownedForReader, READ_ALL, type Viewer } from './secrets';
import { line } from './text';
import { expireTradesFor } from './trades';
import { collectorName, COPY_INCLUDE, ownedView, setTotals, templateView } from './views';

type Tx = Prisma.TransactionClient;
const rand = (max: number) => randomInt(max);

/** Offres ouvertes à cet instant. */
function openWhere(now: Date): Prisma.CardShopOfferWhereInput {
	return {
		active: true,
		AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gt: now } }] }]
	};
}

const isOpen = (o: CardShopOffer, now: Date) =>
	o.active && (!o.startsAt || o.startsAt <= now) && (!o.endsAt || o.endsAt > now);

// ─── Ce que citent les offres ────────────────────────────────────────────

export interface ShopSet {
	id: number;
	name: string;
	code: string;
	color: string;
	special: boolean;
	packs: PackView[];
}

export interface ShopRefs {
	templates: Record<number, TemplateView>;
	sets: Record<number, ShopSet>;
	/** Paquet du booster « All », pour dessiner les boosters de la réserve (page des joueurs). */
	allPack?: PackView;
}

/** Modèles et séries cités par ces offres, vus par `canRead` (verso scellé sinon). */
async function loadRefs(
	parsed: { price: ShopPrice; reward: ShopReward }[],
	canRead: (templateId: number) => boolean
): Promise<ShopRefs & { draft: Set<number> }> {
	const templateIds = new Set<number>();
	const setIds = new Set<number>();
	for (const { price, reward } of parsed) {
		const refs = offerRefs(price, reward);
		refs.templates.forEach((id) => templateIds.add(id));
		refs.sets.forEach((id) => setIds.add(id));
	}
	const [templates, sets, packs, totals] = await Promise.all([
		templateIds.size ? prisma.cardTemplate.findMany({ where: { id: { in: [...templateIds] } }, include: { set: true } }) : [],
		setIds.size ? prisma.cardSet.findMany({ where: { id: { in: [...setIds] } } }) : [],
		setIds.size ? prisma.cardPack.findMany({ where: { setId: { in: [...setIds] } }, orderBy: PACK_ORDER }) : [],
		setTotals()
	]);
	const result: ShopRefs & { draft: Set<number> } = { templates: {}, sets: {}, draft: new Set() };
	for (const t of templates) {
		if (t.status === 'brouillon') result.draft.add(t.id);
		result.templates[t.id] = forReader(templateView(t, totals), canRead);
	}
	for (const s of sets) {
		result.sets[s.id] = { id: s.id, name: s.name, code: s.code, color: s.color, special: s.special, packs: packsOf(s, packs) };
	}
	return result;
}

/** Ce qui manque à une offre pour être proposée : une carte ou une série supprimée, un brouillon. */
function refsProblem(price: ShopPrice, reward: ShopReward, refs: ShopRefs & { draft: Set<number> }): string | null {
	const { templates, sets } = offerRefs(price, reward);
	if (templates.some((id) => !refs.templates[id])) return 'Une carte citée n’existe plus.';
	if (sets.some((id) => !refs.sets[id])) return 'Une série citée n’existe plus.';
	if (templates.some((id) => refs.draft.has(id))) return 'Une carte citée est encore en brouillon.';
	return null;
}

// ─── Page des joueurs ────────────────────────────────────────────────────

const isExhausted = (t: TemplateView | undefined) => !!t && t.maxPrints !== null && t.printed >= t.maxPrints;

export interface ShopOfferView {
	id: number;
	name: string;
	description: string | null;
	price: ShopPrice;
	reward: ShopReward;
	endsAt: string | null;
	perPlayer: number | null;
	/** Échanges déjà faits par celui qui regarde. */
	mine: number;
	/** Échanges encore possibles en tout (null : sans limite). */
	left: number | null;
	/** Ce qui empêche l'échange quoi qu'ait le joueur (épuisée, limite atteinte), sinon null. */
	blocked: string | null;
}

/**
 * Offres ouvertes, vues par `viewer`. Une offre mal réglée (carte supprimée, brouillon) n'est pas
 * montrée aux joueurs : le MJ la voit signalée dans son espace.
 */
export async function shopFor(viewer: Viewer): Promise<{ offers: ShopOfferView[]; refs: ShopRefs }> {
	const offers = await prisma.cardShopOffer.findMany({ where: openWhere(new Date()), orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] });
	const parsed = offers.flatMap((offer) => {
		const price = parsePrice(offer.price);
		const reward = parseReward(offer.reward);
		return price.ok && reward.ok ? [{ offer, price: price.value, reward: reward.value }] : [];
	});
	const ids = parsed.map((p) => p.offer.id);
	const [refs, mine, total] = await Promise.all([
		loadRefs(parsed, viewer.isAdmin ? READ_ALL : await backReader(viewer)),
		ids.length
			? prisma.cardShopPurchase.groupBy({ by: ['offerId'], where: { offerId: { in: ids }, playerId: viewer.id }, _count: { _all: true } })
			: [],
		ids.length ? prisma.cardShopPurchase.groupBy({ by: ['offerId'], where: { offerId: { in: ids } }, _count: { _all: true } }) : []
	]);
	const mineOf = new Map(mine.map((m) => [m.offerId, m._count._all]));
	const totalOf = new Map(total.map((m) => [m.offerId, m._count._all]));

	const views: ShopOfferView[] = [];
	for (const { offer, price, reward } of parsed) {
		if (refsProblem(price, reward, refs)) continue;
		const done = mineOf.get(offer.id) ?? 0;
		const left = offer.stock === null ? null : Math.max(0, offer.stock - (totalOf.get(offer.id) ?? 0));
		const soldOut = reward.cards.some((c) => c.templateId && isExhausted(refs.templates[c.templateId]));
		views.push({
			id: offer.id,
			name: offer.name,
			description: offer.description,
			price,
			reward,
			endsAt: offer.endsAt?.toISOString() ?? null,
			perPlayer: offer.perPlayer,
			mine: done,
			left,
			blocked:
				left === 0 || soldOut
					? 'Épuisée'
					: offer.perPlayer !== null && done >= offer.perPlayer
						? offer.perPlayer === 1
							? 'Déjà obtenue'
							: 'Limite atteinte'
						: null
		});
	}
	// Les séries et cartes des offres cachées ne partent pas avec la page.
	const shown: ShopRefs = { templates: {}, sets: {} };
	for (const view of views) {
		const used = offerRefs(view.price, view.reward);
		for (const id of used.templates) shown.templates[id] = refs.templates[id];
		for (const id of used.sets) shown.sets[id] = refs.sets[id];
	}
	if (views.some((v) => v.reward.boosters > 0)) {
		const allPacks = await prisma.cardPack.findMany({ where: { setId: null }, orderBy: PACK_ORDER });
		shown.allPack = packsOf(null, allPacks)[0];
	}
	return { offers: views, refs: shown };
}

// ─── Échange ─────────────────────────────────────────────────────────────

export interface RedeemResult {
	offer: string;
	cards: OwnedCard[];
	pointsEarned: number;
	pointsSpent: number;
	boosters: number;
	held: (HeldReward & { name: string })[];
	points: number;
}

/** Carte tirée au hasard pour une récompense : la rareté selon les taux des boosters, puis la carte selon son poids. */
async function drawReward(tx: Tx, card: RewardCard, rates: Record<number, number>): Promise<number | null> {
	const rows = await tx.cardTemplate.findMany({
		where: { status: 'publiee', ...(card.setId ? { setId: card.setId } : {}), ...(card.rarity ? { rarity: card.rarity } : {}) },
		select: { id: true, rarity: true, weight: true, maxPrints: true, printed: true }
	});
	const pool = rows.map((r) => ({ id: r.id, rarity: r.rarity, weight: r.weight, remaining: r.maxPrints === null ? null : r.maxPrints - r.printed }));
	return drawSlot(pool, 1, [], rates, rand)?.id ?? null;
}

/**
 * Conclut un échange : `rawPicks` donne, pour chaque ligne de cartes du prix, les exemplaires que
 * le joueur cède (vérifiés ici).
 */
export async function redeemOffer(playerId: number, offerId: number, rawPicks: unknown): Promise<RedeemResult> {
	const now = new Date();
	const offer = await prisma.cardShopOffer.findUnique({ where: { id: offerId } });
	if (!offer || !isOpen(offer, now)) throw new CardError('Cette offre n’est plus proposée.', 404);
	const priceRead = parsePrice(offer.price);
	const rewardRead = parseReward(offer.reward);
	if (!priceRead.ok || !rewardRead.ok) throw new CardError('Cette offre est mal réglée : préviens le MJ.', 409);
	const price = priceRead.value;
	const reward = rewardRead.value;
	const refs = await loadRefs([{ price, reward }], READ_ALL);
	if (refsProblem(price, reward, refs)) throw new CardError('Cette offre n’est pas prête : préviens le MJ.', 409);

	const owned = price.cards.length
		? await prisma.card.findMany({
				where: { ownerId: playerId },
				select: { id: true, templateId: true, wear: true, pinned: true, template: { select: { setId: true, rarity: true } } }
			})
		: [];
	const mine = new Map<number, CopyFacts>(
		owned.map((c) => [c.id, { id: c.id, templateId: c.templateId, setId: c.template.setId, rarity: c.template.rarity, wear: c.wear, pinned: c.pinned }])
	);
	const picks = checkPicks(price.cards, rawPicks, mine);
	if (!picks.ok) throw new CardError(picks.error);
	const given = picks.value.flat();

	const rules = await getRules();
	await ensureWallet(playerId, rules);

	const { received } = await withRetry(() =>
		prisma.$transaction(
			async (tx) => {
				// Verrou de l'offre jusqu'à la fin de la transaction : deux échanges simultanés ne
				// dépassent pas ses limites.
				await tx.$queryRaw`SELECT id FROM card_shop_offers WHERE id = ${offerId} FOR UPDATE`;
				if (offer.stock !== null && (await tx.cardShopPurchase.count({ where: { offerId } })) >= offer.stock) {
					throw new CardError('Cette offre est épuisée.', 409);
				}
				if (offer.perPlayer !== null && (await tx.cardShopPurchase.count({ where: { offerId, playerId } })) >= offer.perPlayer) {
					throw new CardError(offer.perPlayer === 1 ? 'Tu as déjà obtenu cette offre.' : 'Tu as atteint la limite de cette offre.', 409);
				}

				if (price.points > 0) {
					const paid = await tx.cardWallet.updateMany({
						where: { playerId, points: { gte: price.points } },
						data: { points: { decrement: price.points } }
					});
					if (paid.count !== 1) throw new CardError('Tu n’as pas assez de fragments.', 409);
				}
				if (given.length) {
					const moved = await tx.card.updateMany({
						where: { id: { in: given }, ownerId: playerId },
						data: { ownerId: null, pinned: false }
					});
					if (moved.count !== given.length) throw new CardError('Une des cartes choisies a changé de mains : recharge la page.', 409);
					await tx.cardEvent.createMany({ data: given.map((cardId) => ({ cardId, kind: 'boutique', fromId: playerId })) });
				}

				if (reward.points > 0) await tx.cardWallet.update({ where: { playerId }, data: { points: { increment: reward.points } } });
				if (reward.boosters > 0) await addStock(tx, playerId, reward.boosters, rules);
				for (const h of reward.held) {
					await tx.cardHeldBooster.upsert({
						where: { playerId_setId: { playerId, setId: h.setId } },
						create: { playerId, setId: h.setId, count: h.count },
						update: { count: { increment: h.count } }
					});
				}
				const received: number[] = [];
				for (const card of reward.cards) {
					for (let i = 0; i < card.count; i++) {
						const templateId = card.templateId ?? (await drawReward(tx, card, rules.rates));
						const copy = templateId ? await printCopy(tx, templateId, playerId, 'boutique', card.wear ?? undefined) : null;
						if (!copy) throw new CardError('Une carte de cette offre n’est plus disponible.', 409);
						received.push(copy.id);
					}
				}
				if (received.length) {
					await tx.cardEvent.createMany({ data: received.map((cardId) => ({ cardId, kind: 'boutique', toId: playerId })) });
				}

				const detail: PurchaseDetail = {
					given,
					received,
					pointsSpent: price.points,
					pointsEarned: reward.points,
					boosters: reward.boosters,
					held: reward.held
				};
				await tx.cardShopPurchase.create({ data: { offerId, playerId, detail: detail as unknown as Prisma.InputJsonValue } });
				return { received };
			},
			{ timeout: 15_000 }
		)
	);

	await expireTradesFor(given);
	const [rows, totals, wallet] = await Promise.all([
		received.length ? prisma.card.findMany({ where: { id: { in: received } }, include: COPY_INCLUDE }) : [],
		setTotals(),
		prisma.cardWallet.findUniqueOrThrow({ where: { playerId }, select: { points: true } })
	]);
	return {
		offer: offer.name,
		// Cartes que le joueur vient de recevoir : elles sont à lui, il en lit tout le verso.
		cards: rows.sort((a, b) => b.template.rarity - a.template.rarity).map((row) => ownedForReader(ownedView(row, totals), READ_ALL)),
		pointsEarned: reward.points,
		pointsSpent: price.points,
		boosters: reward.boosters,
		held: reward.held.map((h) => ({ ...h, name: refs.sets[h.setId]?.name ?? 'Booster' })),
		points: wallet.points
	};
}

// ─── Espace MJ ───────────────────────────────────────────────────────────

export interface OfferInput {
	name: string;
	description: string | null;
	price: unknown;
	reward: unknown;
	active: boolean;
	startsAt: Date | null;
	endsAt: Date | null;
	perPlayer: number | null;
	stock: number | null;
	sortOrder: number;
}

const MAX_JSON = 8_000;

function dateOrNull(value: FormDataEntryValue | null): Date | null {
	const text = String(value ?? '').trim();
	if (!text) return null;
	const date = new Date(text);
	return Number.isNaN(date.getTime()) ? null : date;
}

function intOrNull(value: FormDataEntryValue | null, min: number, max: number): number | null {
	const text = String(value ?? '').trim();
	if (!/^\d{1,9}$/.test(text)) return null;
	const n = Number(text);
	return n >= min && n <= max ? n : null;
}

function json(value: FormDataEntryValue | null): unknown {
	const text = String(value ?? '');
	if (text.length > MAX_JSON) throw new CardError('Offre trop chargée.');
	try {
		return JSON.parse(text);
	} catch {
		throw new CardError('Offre illisible.');
	}
}

export function readOfferForm(form: FormData): OfferInput {
	return {
		name: line(form.get('name'), SHOP_LIMITS.name),
		description: line(form.get('description'), SHOP_LIMITS.description) || null,
		price: json(form.get('price')),
		reward: json(form.get('reward')),
		active: form.get('active') === 'on',
		startsAt: dateOrNull(form.get('startsAt')),
		endsAt: dateOrNull(form.get('endsAt')),
		perPlayer: intOrNull(form.get('perPlayer'), 1, SHOP_LIMITS.perPlayer),
		stock: intOrNull(form.get('stock'), 1, SHOP_LIMITS.stock),
		sortOrder: intOrNull(form.get('sortOrder'), 0, 9999) ?? 0
	};
}

/** Crée (`id` null) ou met à jour une offre ; renvoie son id. */
export async function saveOffer(id: number | null, input: OfferInput): Promise<number> {
	if (!input.name) throw new CardError('Donne un nom à l’offre.');
	const price = parsePrice(input.price);
	if (!price.ok) throw new CardError(price.error);
	const reward = parseReward(input.reward);
	if (!reward.ok) throw new CardError(reward.error);
	if (isEmptyReward(reward.value)) throw new CardError('L’offre ne donne rien : ajoute des fragments, des boosters ou des cartes.');
	if (isEmptyPrice(price.value) && input.perPlayer === null) {
		throw new CardError('Une offre gratuite doit être limitée par joueur (sinon elle se prend à l’infini).');
	}
	if (input.startsAt && input.endsAt && input.endsAt <= input.startsAt) throw new CardError('La fin doit venir après le début.');

	const refs = offerRefs(price.value, reward.value);
	const [templates, sets] = await Promise.all([
		prisma.cardTemplate.count({ where: { id: { in: refs.templates } } }),
		prisma.cardSet.count({ where: { id: { in: refs.sets } } })
	]);
	if (templates !== refs.templates.length) throw new CardError('Une des cartes choisies n’existe plus.');
	if (sets !== refs.sets.length) throw new CardError('Une des séries choisies n’existe plus.');

	const data = {
		name: input.name,
		description: input.description,
		price: price.value as unknown as Prisma.InputJsonValue,
		reward: reward.value as unknown as Prisma.InputJsonValue,
		active: input.active,
		startsAt: input.startsAt,
		endsAt: input.endsAt,
		perPlayer: input.perPlayer,
		stock: input.stock,
		sortOrder: input.sortOrder
	};
	if (id) {
		const done = await prisma.cardShopOffer.updateMany({ where: { id }, data });
		if (done.count !== 1) throw new CardError('Offre introuvable.', 404);
		return id;
	}
	return (await prisma.cardShopOffer.create({ data })).id;
}

/** Supprime une offre que personne n'a encore prise ; sinon, elle se désactive. */
export async function deleteOffer(id: number) {
	const taken = await prisma.cardShopPurchase.count({ where: { offerId: id } });
	if (taken > 0) throw new CardError(`Déjà prise ${taken} fois : désactive-la plutôt, l’historique est gardé.`);
	await prisma.cardShopOffer.deleteMany({ where: { id } });
}

export interface AdminOffer {
	id: number;
	name: string;
	description: string;
	price: ShopPrice;
	reward: ShopReward;
	active: boolean;
	startsAt: string | null;
	endsAt: string | null;
	perPlayer: number | null;
	stock: number | null;
	sortOrder: number;
	purchases: number;
	/** Pourquoi les joueurs ne la voient pas (mal réglée), sinon null. */
	problem: string | null;
}

/** Offres, cartes et séries à choisir, et derniers échanges, pour l'Espace MJ. */
export async function adminShop() {
	const [offers, counts, templates, sets, recent] = await Promise.all([
		prisma.cardShopOffer.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }),
		prisma.cardShopPurchase.groupBy({ by: ['offerId'], _count: { _all: true } }),
		prisma.cardTemplate.findMany({
			orderBy: [{ setId: 'asc' }, { number: 'asc' }, { name: 'asc' }],
			select: { id: true, name: true, number: true, rarity: true, status: true, setId: true }
		}),
		prisma.cardSet.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], select: { id: true, name: true, code: true, special: true } }),
		prisma.cardShopPurchase.findMany({
			orderBy: { id: 'desc' },
			take: 30,
			include: { offer: { select: { name: true } }, player: { select: { id: true, login: true, character: { select: { name: true } } } } }
		})
	]);
	const countOf = new Map(counts.map((c) => [c.offerId, c._count._all]));
	const status = new Map(templates.map((t) => [t.id, t.status]));
	const setIds = new Set(sets.map((s) => s.id));

	const list: AdminOffer[] = offers.map((o) => {
		const price = parsePrice(o.price);
		const reward = parseReward(o.reward);
		let problem: string | null = null;
		if (!price.ok || !reward.ok) problem = 'Offre illisible : enregistre-la à nouveau.';
		else {
			const refs = offerRefs(price.value, reward.value);
			if (refs.templates.some((id) => !status.has(id))) problem = 'Une carte citée n’existe plus.';
			else if (refs.sets.some((id) => !setIds.has(id))) problem = 'Une série citée n’existe plus.';
			else if (refs.templates.some((id) => status.get(id) === 'brouillon')) problem = 'Une carte citée est en brouillon : les joueurs ne voient pas l’offre.';
		}
		return {
			id: o.id,
			name: o.name,
			description: o.description ?? '',
			price: price.ok ? price.value : { points: 0, cards: [] },
			reward: reward.ok ? reward.value : { points: 0, boosters: 0, held: [], cards: [] },
			active: o.active,
			startsAt: o.startsAt?.toISOString() ?? null,
			endsAt: o.endsAt?.toISOString() ?? null,
			perPlayer: o.perPlayer,
			stock: o.stock,
			sortOrder: o.sortOrder,
			purchases: countOf.get(o.id) ?? 0,
			problem
		};
	});

	return {
		offers: list,
		templates,
		sets,
		recent: recent.map((p) => {
			const detail = (p.detail ?? {}) as Partial<PurchaseDetail>;
			return {
				id: p.id,
				offer: p.offer.name,
				player: { id: p.player.id, name: collectorName(p.player), login: p.player.login },
				at: p.createdAt.toISOString(),
				given: Array.isArray(detail.given) ? detail.given.length : 0,
				received: Array.isArray(detail.received) ? detail.received.length : 0
			};
		})
	};
}

/** Le MJ fixe les fragments (points de boutique) d'un joueur. */
export async function setPoints(playerId: number, points: number) {
	if (!Number.isInteger(points) || points < 0 || points > SHOP_LIMITS.points) {
		throw new CardError(`Fragments entre 0 et ${SHOP_LIMITS.points}.`);
	}
	if (!(await prisma.player.findUnique({ where: { id: playerId }, select: { id: true } }))) throw new CardError('Joueur introuvable.', 404);
	await ensureWallet(playerId, await getRules());
	await prisma.cardWallet.update({ where: { playerId }, data: { points } });
}

/** Plus grand don (ou retrait) de fragments en une fois par le MJ. */
export const MAX_FRAGMENT_GIFT = 100_000;

/**
 * Le MJ donne des fragments à des joueurs, ou en reprend (`amount` négatif) sans jamais descendre
 * sous zéro. Renvoie le nombre de joueurs servis. Chaque compte est modifié sous condition : deux
 * dons simultanés s'additionnent, rien n'est perdu.
 */
export async function giftFragments(playerIds: number[], amount: number): Promise<number> {
	if (!Number.isInteger(amount) || amount === 0 || Math.abs(amount) > MAX_FRAGMENT_GIFT) {
		throw new CardError(`Fragments entre -${MAX_FRAGMENT_GIFT} et ${MAX_FRAGMENT_GIFT} (hors 0).`);
	}
	const ids = [...new Set(playerIds.filter((id) => Number.isInteger(id) && id > 0))];
	const players = await prisma.player.findMany({ where: { id: { in: ids } }, select: { id: true } });
	if (players.length === 0) throw new CardError('Joueur introuvable.', 404);
	const rules = await getRules();
	for (const { id } of players) {
		await ensureWallet(id, rules);
		if (amount > 0) {
			// Plafond : un compte ne dépasse jamais la limite des fragments.
			const added = await prisma.cardWallet.updateMany({
				where: { playerId: id, points: { lte: SHOP_LIMITS.points - amount } },
				data: { points: { increment: amount } }
			});
			if (added.count !== 1) await prisma.cardWallet.update({ where: { playerId: id }, data: { points: SHOP_LIMITS.points } });
		} else {
			const taken = await prisma.cardWallet.updateMany({
				where: { playerId: id, points: { gte: -amount } },
				data: { points: { decrement: -amount } }
			});
			if (taken.count !== 1) await prisma.cardWallet.update({ where: { playerId: id }, data: { points: 0 } });
		}
	}
	return players.length;
}
