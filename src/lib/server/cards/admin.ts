// Espace MJ, page d'un joueur : sa réserve de boosters, ses ouvertures et ses exemplaires.
// Les actions en lot vérifient que chaque exemplaire appartient bien au joueur de la page :
// une liste d'identifiants trafiquée ne peut pas toucher la collection d'un autre.

import { accrue } from '$lib/cards/booster';
import { isCardType, readFace, UNIQUE_RARITY } from '$lib/cards/types';
import { prisma } from '../prisma';
import { moveCard, removeCard } from './copies';
import { CardError, getRules } from './settings';
import { collectorName } from './views';

/** Au plus tant d'exemplaires par action en lot. */
export const MAX_BATCH = 200;

/** Identifiants positifs d'un champ répété, sans doublon, bornés en nombre. */
export function readIds(values: FormDataEntryValue[], max = MAX_BATCH): number[] {
	const ids = new Set<number>();
	for (const value of values) {
		if (ids.size >= max) break;
		const text = String(value).trim();
		if (!/^\d{1,9}$/.test(text)) continue;
		const n = Number(text);
		if (n > 0) ids.add(n);
	}
	return [...ids];
}

/** Ne garde que les exemplaires qui appartiennent encore à `ownerId`. */
async function ownedBy(ownerId: number, ids: number[]): Promise<number[]> {
	if (ids.length === 0) return [];
	const rows = await prisma.card.findMany({ where: { id: { in: ids }, ownerId }, select: { id: true } });
	return rows.map((r) => r.id);
}

/** Retire des exemplaires au joueur (ils vont dans la réserve du MJ) ; renvoie le nombre retiré. */
export async function removeCardsOf(ownerId: number, ids: number[]): Promise<number> {
	const mine = await ownedBy(ownerId, ids);
	for (const id of mine) await removeCard(id);
	return mine.length;
}

/** Déplace des exemplaires du joueur vers un autre ; renvoie le nombre déplacé. */
export async function moveCardsOf(ownerId: number, ids: number[], toId: number): Promise<number> {
	if (toId === ownerId) throw new CardError('Choisis un autre joueur.');
	if (!(await prisma.player.findUnique({ where: { id: toId }, select: { id: true } }))) {
		throw new CardError('Joueur introuvable.', 404);
	}
	const mine = await ownedBy(ownerId, ids);
	for (const id of mine) await moveCard(id, toId);
	return mine.length;
}

/** Retire des exemplaires de la vitrine du joueur. */
export async function unpinCardsOf(ownerId: number, ids: number[]): Promise<number> {
	if (ids.length === 0) return 0;
	const done = await prisma.card.updateMany({ where: { id: { in: ids }, ownerId, pinned: true }, data: { pinned: false } });
	return done.count;
}

/** Remet un booster ouvert dans la liste « pas vus » : le joueur pourra rejouer son ouverture. */
export async function replayOpening(ownerId: number, openingId: number) {
	const done = await prisma.cardOpening.updateMany({ where: { id: openingId, playerId: ownerId }, data: { seenAt: null } });
	if (done.count !== 1) throw new CardError('Ouverture introuvable.', 404);
}

// ─── Lecture ─────────────────────────────────────────────────────────────

export interface AdminCopy {
	id: number;
	serial: number;
	wear: number;
	origin: string;
	pinned: boolean;
	obtainedAt: string;
	template: {
		id: number;
		name: string;
		rarity: number;
		number: number | null;
		maxPrints: number | null;
		status: string;
		set: string | null;
		thumb: string | null;
	};
}

export async function playerCards(playerId: number) {
	const player = await prisma.player.findUnique({
		where: { id: playerId },
		select: { id: true, login: true, characterId: true, character: { select: { name: true, image: true } }, cardWallet: true }
	});
	if (!player) throw new CardError('Joueur introuvable.', 404);

	const [rules, cards, openings, templates, players, pendingTrades] = await Promise.all([
		getRules(),
		prisma.card.findMany({
			where: { ownerId: playerId },
			orderBy: [{ templateId: 'asc' }, { serial: 'asc' }],
			include: { template: { include: { set: { select: { code: true } } } } }
		}),
		prisma.cardOpening.findMany({
			where: { playerId },
			orderBy: { id: 'desc' },
			take: 30,
			include: { set: { select: { name: true, code: true } }, pack: { select: { name: true } } }
		}),
		prisma.cardTemplate.findMany({
			where: { status: { not: 'brouillon' } },
			orderBy: [{ setId: 'asc' }, { number: 'asc' }, { id: 'asc' }],
			select: { id: true, name: true, rarity: true, number: true, maxPrints: true, printed: true, set: { select: { code: true } } }
		}),
		prisma.player.findMany({
			where: { id: { not: playerId } },
			orderBy: { login: 'asc' },
			select: { id: true, login: true, character: { select: { name: true } } }
		}),
		prisma.cardTrade.count({ where: { status: 'attente', OR: [{ fromId: playerId }, { toId: playerId }] } })
	]);

	// Réserve lue sans être créée : ouvrir cette page ne doit pas offrir les boosters de départ.
	const wallet = player.cardWallet;
	const state = wallet ? accrue({ stock: wallet.stock, since: wallet.since.getTime() }, rules, Date.now()) : null;

	const copies: AdminCopy[] = cards.map((c) => {
		const type = isCardType(c.template.type) ? c.template.type : 'objet';
		const face = readFace(c.template.face, type, c.template.rarity);
		return {
			id: c.id,
			serial: c.serial,
			wear: c.wear,
			origin: c.origin,
			pinned: c.pinned,
			obtainedAt: c.obtainedAt.toISOString(),
			template: {
				id: c.template.id,
				name: c.template.name,
				rarity: c.template.rarity,
				number: c.template.number,
				maxPrints: c.template.maxPrints,
				status: c.template.status,
				set: c.template.set?.code ?? null,
				thumb: face.art?.small ?? face.background?.small ?? null
			}
		};
	});

	return {
		player: {
			id: player.id,
			login: player.login,
			name: collectorName(player),
			portrait: player.character?.image ?? null,
			characterId: player.characterId
		},
		wallet:
			wallet && state
				? {
						stock: state.stock,
						nextAt: state.nextAt === null ? null : new Date(state.nextAt).toISOString(),
						opened: wallet.opened
					}
				: null,
		rules: { max: rules.max, minutes: rules.minutes, starter: rules.starter },
		copies,
		stats: {
			copies: copies.length,
			distinct: new Set(copies.map((c) => c.template.id)).size,
			uniques: copies.filter((c) => c.template.rarity >= UNIQUE_RARITY).length,
			pinned: copies.filter((c) => c.pinned).length,
			pendingTrades
		},
		openings: openings.map((o) => ({
			id: o.id,
			title: o.set?.name ?? 'Booster All',
			code: o.set?.code ?? 'ALL',
			pack: o.pack?.name ?? null,
			cards: Array.isArray(o.cardIds) ? o.cardIds.length : 0,
			at: o.createdAt.toISOString(),
			seen: o.seenAt !== null
		})),
		templates: templates.map((t) => ({
			id: t.id,
			name: t.name,
			rarity: t.rarity,
			number: t.number,
			set: t.set?.code ?? null,
			remaining: t.maxPrints === null ? null : Math.max(0, t.maxPrints - t.printed)
		})),
		players: players.map((p) => ({ id: p.id, label: p.character?.name ? `${p.character.name} (${p.login})` : p.login }))
	};
}

/** Tous les comptes, pour la liste « cartes par joueur » de l'espace MJ. */
export async function collectorsOverview() {
	const [rules, players, distinct, unseen] = await Promise.all([
		getRules(),
		prisma.player.findMany({
			orderBy: { login: 'asc' },
			select: {
				id: true,
				login: true,
				character: { select: { name: true, image: true } },
				cardWallet: true,
				_count: { select: { cards: true } }
			}
		}),
		prisma.card.findMany({
			where: { ownerId: { not: null } },
			select: { ownerId: true, templateId: true },
			distinct: ['ownerId', 'templateId']
		}),
		prisma.cardOpening.groupBy({ by: ['playerId'], where: { seenAt: null }, _count: { _all: true } })
	]);
	const distinctOf = new Map<number, number>();
	for (const row of distinct) distinctOf.set(row.ownerId!, (distinctOf.get(row.ownerId!) ?? 0) + 1);
	const unseenOf = new Map(unseen.map((u) => [u.playerId, u._count._all]));
	const now = Date.now();
	return {
		max: rules.max,
		players: players.map((p) => ({
			id: p.id,
			login: p.login,
			name: p.character?.name ?? null,
			portrait: p.character?.image ?? null,
			cards: p._count.cards,
			distinct: distinctOf.get(p.id) ?? 0,
			opened: p.cardWallet?.opened ?? 0,
			unseen: unseenOf.get(p.id) ?? 0,
			stock: p.cardWallet
				? accrue({ stock: p.cardWallet.stock, since: p.cardWallet.since.getTime() }, rules, now).stock
				: null
		}))
	};
}
