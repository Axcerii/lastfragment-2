// Réserve et ouverture des boosters. Tout le hasard est tiré ici, avec `crypto.randomInt` ;
// le navigateur ne reçoit le contenu d'un booster qu'une fois les cartes créées.
//
// Deux ouvertures simultanées (double clic, deux onglets) ne peuvent pas consommer le même
// booster : la réserve est mise à jour par « compare-and-set » (la ligne n'est modifiée que si
// elle n'a pas changé depuis sa lecture), dans la transaction qui crée les cartes.

import { randomInt } from 'crypto';
import { Prisma, type Card, type CardPack, type CardSet } from '@prisma/client';
import { accrue, consume, drawSlot, drawWear, rollGodPack, slotMinimum, type PoolCard } from '$lib/cards/booster';
import type { OwnedCard, PackView, SetView } from '$lib/cards/types';
import { prisma } from '../prisma';
import { CardError, getRules, type CardRules } from './settings';
import { COPY_INCLUDE, ownedView, setTotals, setView } from './views';

const rand = (max: number) => randomInt(max);

type Tx = Prisma.TransactionClient;

export interface WalletView {
	stock: number;
	max: number;
	/** Arrivée du prochain booster (ISO), ou null si la réserve est pleine. */
	nextAt: string | null;
	minutes: number;
	opened: number;
}

async function ensureWallet(playerId: number, rules: CardRules) {
	const existing = await prisma.cardWallet.findUnique({ where: { playerId } });
	if (existing) return existing;
	try {
		return await prisma.cardWallet.create({ data: { playerId, stock: rules.starter, since: new Date() } });
	} catch (e) {
		// Créée au même instant par une autre requête.
		if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
			return prisma.cardWallet.findUniqueOrThrow({ where: { playerId } });
		}
		throw e;
	}
}

export async function walletOf(playerId: number, rules?: CardRules): Promise<WalletView> {
	rules ??= await getRules();
	const wallet = await ensureWallet(playerId, rules);
	const state = accrue({ stock: wallet.stock, since: wallet.since.getTime() }, rules, Date.now());
	return {
		stock: state.stock,
		max: rules.max,
		nextAt: state.nextAt === null ? null : new Date(state.nextAt).toISOString(),
		minutes: rules.minutes,
		opened: wallet.opened
	};
}

/** Séries dont la bannière est ouverte à cet instant. */
export function bannerWhere(now: Date): Prisma.CardSetWhereInput {
	return {
		active: true,
		AND: [
			{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
			{ OR: [{ endsAt: null }, { endsAt: { gt: now } }] }
		]
	};
}

/** Modèles qui peuvent tomber d'un booster : publiés, et pas encore épuisés. */
async function poolOf(setId: number | null): Promise<PoolCard[]> {
	const rows = await prisma.cardTemplate.findMany({
		where: { status: 'publiee', ...(setId === null ? { inAll: true } : { setId }) },
		select: { id: true, rarity: true, weight: true, maxPrints: true, printed: true }
	});
	return rows
		.filter((r) => r.maxPrints === null || r.printed < r.maxPrints)
		.map((r) => ({
			id: r.id,
			rarity: r.rarity,
			weight: r.weight,
			remaining: r.maxPrints === null ? null : r.maxPrints - r.printed
		}));
}

// ─── Paquets ─────────────────────────────────────────────────────────────

export const ALL_PACK: PackView = { id: null, name: 'Booster All', color: '#cfdfc4', image: null, showText: true };

const packView = (p: CardPack): PackView => ({ id: p.id, name: p.name, color: p.color, image: p.image, showText: p.showText });

/** Paquets d'une série (ou du booster All) ; sans paquet dessiné, celui par défaut. */
function packsOf(set: CardSet | null, packs: CardPack[]): PackView[] {
	const own = packs.filter((p) => p.setId === (set?.id ?? null)).map(packView);
	if (own.length) return own;
	// Paquet par défaut : la bannière de la série dans la fenêtre, avec les textes du site.
	return [set ? { id: null, name: set.name, color: set.color, image: null, showText: true, banner: set.banner } : ALL_PACK];
}

const PACK_ORDER = [{ sortOrder: 'asc' as const }, { id: 'asc' as const }];

export interface BannerChoice extends SetView {
	/** Cartes différentes qui peuvent encore en tomber. */
	pool: number;
	packs: PackView[];
}

/** Boosters proposés : « All » et les bannières ouvertes, chacun avec ses paquets au choix. */
export async function boosterChoices(): Promise<{ all: { pool: number; packs: PackView[] }; banners: BannerChoice[] }> {
	const now = new Date();
	const [sets, totals, all, packs] = await Promise.all([
		prisma.cardSet.findMany({ where: bannerWhere(now), orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }),
		setTotals(),
		poolOf(null),
		prisma.cardPack.findMany({ orderBy: PACK_ORDER })
	]);
	const banners: BannerChoice[] = [];
	for (const set of sets) {
		banners.push({ ...setView(set, totals), pool: (await poolOf(set.id)).length, packs: packsOf(set, packs) });
	}
	return { all: { pool: all.length, packs: packsOf(null, packs) }, banners };
}

/**
 * Crée un exemplaire avec le n° de série suivant. Renvoie null si le tirage limité est épuisé :
 * l'incrément n'a lieu que sous la limite, et la ligne reste verrouillée jusqu'à la fin de la
 * transaction, donc deux tirages simultanés ne peuvent pas recevoir le même numéro.
 */
export async function printCopy(tx: Tx, templateId: number, ownerId: number | null, origin: string): Promise<Card | null> {
	const template = await tx.cardTemplate.findUnique({ where: { id: templateId }, select: { maxPrints: true } });
	if (!template) return null;
	const claimed = await tx.cardTemplate.updateMany({
		where: { id: templateId, ...(template.maxPrints === null ? {} : { printed: { lt: template.maxPrints } }) },
		data: { printed: { increment: 1 } }
	});
	if (claimed.count !== 1) return null;
	const { printed } = await tx.cardTemplate.findUniqueOrThrow({ where: { id: templateId }, select: { printed: true } });
	return tx.card.create({ data: { templateId, ownerId, serial: printed, wear: drawWear(rand), origin } });
}

/** La réserve a changé entre sa lecture et son écriture (autre ouverture au même instant). */
class WalletConflict extends Error {}

/** Rejoue la transaction après un conflit : elle relit alors la réserve à jour. */
async function withRetry<T>(run: () => Promise<T>): Promise<T> {
	for (let attempt = 0; ; attempt++) {
		try {
			return await run();
		} catch (e) {
			// P2034 : interblocage avec l'ouverture d'un autre joueur (mêmes cartes tirées), MySQL en annule une.
			const deadlock = e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034';
			if (!(e instanceof WalletConflict) && !deadlock) throw e;
			if (attempt >= 4) throw new CardError('Trop d’ouvertures en même temps, réessaie.', 409);
		}
	}
}

export interface OpenedBooster {
	openingId: number;
	cards: OwnedCard[];
	/** Modèles que le joueur ne possédait pas avant ce booster. */
	fresh: number[];
	wallet: WalletView;
}

/** Ordre de révélation : de la moins rare à la plus rare, le meilleur pour la fin. */
async function revealed(ids: number[]): Promise<OwnedCard[]> {
	const [rows, totals] = await Promise.all([
		prisma.card.findMany({ where: { id: { in: ids } }, include: COPY_INCLUDE }),
		setTotals()
	]);
	return rows
		.sort((a, b) => a.template.rarity - b.template.rarity || ids.indexOf(a.id) - ids.indexOf(b.id))
		.map((row) => ownedView(row, totals));
}

/**
 * Ouvre un booster. `packId` n'est que l'apparence choisie par le joueur : il doit appartenir à la
 * série (ou au booster All), mais ne change rien au tirage.
 */
export async function openBooster(playerId: number, setId: number | null, packId: number | null = null): Promise<OpenedBooster> {
	const rules = await getRules();
	const now = new Date();

	if (setId !== null) {
		const set = await prisma.cardSet.findFirst({ where: { id: setId, ...bannerWhere(now) }, select: { id: true } });
		if (!set) throw new CardError('Cette bannière n’est plus ouverte.', 404);
	}
	if (packId !== null && !(await prisma.cardPack.findFirst({ where: { id: packId, setId }, select: { id: true } }))) {
		throw new CardError('Ce paquet n’existe plus : choisis-en un autre.', 404);
	}
	const pool = await poolOf(setId);
	if (pool.length === 0) throw new CardError('Aucune carte ne peut tomber de ce booster pour l’instant.');

	await ensureWallet(playerId, rules);
	const before = await prisma.card.findMany({
		where: { ownerId: playerId },
		select: { templateId: true },
		distinct: ['templateId']
	});
	const owned = new Set(before.map((c) => c.templateId));

	const { openingId, ids } = await withRetry(() =>
		prisma.$transaction(
			async (tx) => {
				const current = await tx.cardWallet.findUniqueOrThrow({ where: { playerId } });
				const state = accrue({ stock: current.stock, since: current.since.getTime() }, rules, now.getTime());
				if (state.stock < 1) throw new CardError('Plus de booster en réserve : patiente jusqu’au prochain.', 409);

				const next = consume(state, rules, now.getTime());
				const claimed = await tx.cardWallet.updateMany({
					where: { playerId, stock: current.stock, since: current.since },
					data: { stock: next.stock, since: new Date(next.since), opened: { increment: 1 } }
				});
				if (claimed.count !== 1) throw new WalletConflict();

				const left = pool.map((c) => ({ ...c }));
				const picked: number[] = [];
				const created: Card[] = [];
				const god = rollGodPack(rules.godPack, rand);
				for (let slot = 0; slot < rules.count; slot++) {
					const min = slotMinimum(slot, rules.count, rules.guaranteed, god);
					// Un tirage limité peut s'épuiser pendant l'ouverture : on retire la carte et on recommence.
					for (let attempt = 0; attempt < 6; attempt++) {
						const choice = drawSlot(left, min, picked, rules.rates, rand);
						if (!choice) break;
						const card = await printCopy(tx, choice.id, playerId, 'booster');
						if (!card) {
							choice.remaining = 0;
							continue;
						}
						picked.push(choice.id);
						if (choice.remaining !== null) choice.remaining--;
						created.push(card);
						break;
					}
				}
				if (created.length === 0) throw new CardError('Aucune carte ne peut tomber de ce booster pour l’instant.');

				await tx.cardEvent.createMany({ data: created.map((c) => ({ cardId: c.id, kind: 'tirage', toId: playerId })) });
				const opening = await tx.cardOpening.create({
					data: { playerId, setId, packId, cardIds: created.map((c) => c.id) }
				});
				return { openingId: opening.id, ids: created.map((c) => c.id) };
			},
			{ timeout: 15_000 }
		)
	);

	const cards = await revealed(ids);
	const fresh = [...new Set(cards.map((c) => c.template.id))].filter((id) => !owned.has(id));
	return { openingId, cards, fresh, wallet: await walletOf(playerId, rules) };
}

// ─── Boosters ouverts mais pas regardés ──────────────────────────────────
//
// Le tirage est fait et les cartes sont dans la collection dès que le serveur répond : quitter
// la page, perdre le réseau ou fermer l'ouverture en cours de route ne fait rien perdre. Le
// booster reste seulement « pas vu », et le joueur peut le rejouer en revenant.

const UNSEEN_DAYS = 14;

export interface UnseenBooster {
	openingId: number;
	setId: number | null;
	title: string;
	code: string;
	pack: PackView;
	cards: OwnedCard[];
	fresh: number[];
}

export async function unseenBoosters(playerId: number): Promise<UnseenBooster[]> {
	const openings = await prisma.cardOpening.findMany({
		where: { playerId, seenAt: null, createdAt: { gt: new Date(Date.now() - UNSEEN_DAYS * 86_400_000) } },
		orderBy: { id: 'desc' },
		take: 5,
		include: { set: true, pack: true }
	});
	const result: UnseenBooster[] = [];
	for (const opening of openings) {
		const ids = (Array.isArray(opening.cardIds) ? opening.cardIds : []).map(Number).filter(Number.isInteger);
		if (ids.length === 0) continue;
		const cards = await revealed(ids);
		// Nouvelle : aucun exemplaire plus ancien de cette carte n'est dans la collection.
		const older = await prisma.card.findMany({
			where: { ownerId: playerId, templateId: { in: cards.map((c) => c.template.id) }, id: { lt: Math.min(...ids) } },
			select: { templateId: true },
			distinct: ['templateId']
		});
		const known = new Set(older.map((c) => c.templateId));
		result.push({
			openingId: opening.id,
			setId: opening.setId,
			title: opening.set?.name ?? ALL_PACK.name,
			code: opening.set?.code ?? 'ALL',
			pack: opening.pack ? packView(opening.pack) : opening.set ? packsOf(opening.set, [])[0] : ALL_PACK,
			cards,
			fresh: [...new Set(cards.map((c) => c.template.id))].filter((id) => !known.has(id))
		});
	}
	return result;
}

/** Le joueur a vu tout le booster. */
export async function markSeen(openingId: number, playerId: number) {
	await prisma.cardOpening.updateMany({ where: { id: openingId, playerId, seenAt: null }, data: { seenAt: new Date() } });
}

/** Le MJ ajoute (ou retire, si `amount` est négatif) des boosters à des joueurs, au-delà du maximum s'il le faut. */
export async function giftBoosters(playerIds: number[], amount: number) {
	const rules = await getRules();
	for (const playerId of playerIds) {
		for (let attempt = 0; attempt < 4; attempt++) {
			const wallet = await ensureWallet(playerId, rules);
			const state = accrue({ stock: wallet.stock, since: wallet.since.getTime() }, rules, Date.now());
			const done = await prisma.cardWallet.updateMany({
				where: { playerId, stock: wallet.stock, since: wallet.since },
				data: { stock: Math.max(0, Math.min(99, state.stock + amount)), since: new Date(state.since) }
			});
			if (done.count === 1) break;
		}
	}
}
