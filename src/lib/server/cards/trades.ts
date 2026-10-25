// Échanges entre joueurs (le MJ compris). Une proposition liste des cartes données et des cartes
// demandées ; à l'acceptation, chaque carte ne change de mains que si elle appartient encore à
// celui qui la cède. Une seule carte déplacée entre-temps et tout est annulé : une carte ne peut
// ni être dupliquée, ni disparaître.

import type { TradeStatus } from '$lib/cards/types';
import type { OwnedCard } from '$lib/cards/types';
import { prisma } from '../prisma';
import { CardError } from './settings';
import { COLLECTOR_SELECT, collectorView, COPY_INCLUDE, ownedView, setTotals, type CollectorView } from './views';

export const MAX_TRADE_SIDE = 12;
const MAX_PENDING = 15;

class StaleTrade extends Error {}

const uniqueIds = (ids: number[]) => [...new Set(ids.filter((id) => Number.isInteger(id) && id > 0))];

export async function proposeTrade(
	fromId: number,
	toId: number,
	offeredIds: number[],
	requestedIds: number[],
	message: string
): Promise<number> {
	if (fromId === toId) throw new CardError('Tu ne peux pas échanger avec toi-même.');
	const offered = uniqueIds(offeredIds);
	const requested = uniqueIds(requestedIds);
	if (offered.length === 0 && requested.length === 0) throw new CardError('Choisis au moins une carte.');
	if (offered.length > MAX_TRADE_SIDE || requested.length > MAX_TRADE_SIDE) {
		throw new CardError(`${MAX_TRADE_SIDE} cartes au plus de chaque côté.`);
	}

	const partner = await prisma.player.findUnique({ where: { id: toId }, select: { id: true } });
	if (!partner) throw new CardError('Ce joueur n’existe pas.', 404);

	const pending = await prisma.cardTrade.count({ where: { fromId, status: 'attente' } });
	if (pending >= MAX_PENDING) {
		throw new CardError(`Tu as déjà ${MAX_PENDING} propositions en attente : annule-en une avant d’en faire d’autres.`, 429);
	}

	const cards = await prisma.card.findMany({
		where: { id: { in: [...offered, ...requested] } },
		select: { id: true, ownerId: true }
	});
	const ownerOf = new Map(cards.map((c) => [c.id, c.ownerId]));
	if (offered.some((id) => ownerOf.get(id) !== fromId)) throw new CardError('Une des cartes proposées ne t’appartient plus.', 409);
	if (requested.some((id) => ownerOf.get(id) !== toId)) throw new CardError('Une des cartes demandées a changé de mains.', 409);

	const trade = await prisma.cardTrade.create({
		data: {
			fromId,
			toId,
			message: message || null,
			items: {
				create: [
					...offered.map((cardId) => ({ cardId, offered: true })),
					...requested.map((cardId) => ({ cardId, offered: false }))
				]
			}
		}
	});
	return trade.id;
}

/** Les propositions en attente qui portent sur ces cartes ne peuvent plus aboutir. */
export async function expireTradesFor(cardIds: number[], exceptTradeId?: number) {
	if (cardIds.length === 0) return;
	await prisma.cardTrade.updateMany({
		where: {
			status: 'attente',
			...(exceptTradeId ? { id: { not: exceptTradeId } } : {}),
			items: { some: { cardId: { in: cardIds } } }
		},
		data: { status: 'caduque', resolvedAt: new Date() }
	});
}

export async function acceptTrade(tradeId: number, userId: number) {
	const trade = await prisma.cardTrade.findUnique({ where: { id: tradeId }, include: { items: true } });
	if (!trade || trade.toId !== userId) throw new CardError('Échange introuvable.', 404);
	if (trade.status !== 'attente') throw new CardError('Cet échange a déjà été traité.', 409);

	try {
		await prisma.$transaction(async (tx) => {
			const claimed = await tx.cardTrade.updateMany({
				where: { id: tradeId, toId: userId, status: 'attente' },
				data: { status: 'acceptee', resolvedAt: new Date() }
			});
			if (claimed.count !== 1) throw new CardError('Cet échange a déjà été traité.', 409);

			for (const item of trade.items) {
				const [giver, receiver] = item.offered ? [trade.fromId, trade.toId] : [trade.toId, trade.fromId];
				const moved = await tx.card.updateMany({
					where: { id: item.cardId, ownerId: giver },
					data: { ownerId: receiver, pinned: false }
				});
				if (moved.count !== 1) throw new StaleTrade();
			}
			await tx.cardEvent.createMany({
				data: trade.items.map((item) => ({
					cardId: item.cardId,
					kind: 'echange',
					fromId: item.offered ? trade.fromId : trade.toId,
					toId: item.offered ? trade.toId : trade.fromId,
					tradeId
				}))
			});
		});
	} catch (e) {
		if (e instanceof StaleTrade) {
			await prisma.cardTrade.updateMany({
				where: { id: tradeId, status: 'attente' },
				data: { status: 'caduque', resolvedAt: new Date() }
			});
			throw new CardError('Une des cartes a changé de mains entre-temps : l’échange est caduc.', 409);
		}
		throw e;
	}
	await expireTradesFor(
		trade.items.map((i) => i.cardId),
		tradeId
	);
}

export async function refuseTrade(tradeId: number, userId: number) {
	const done = await prisma.cardTrade.updateMany({
		where: { id: tradeId, toId: userId, status: 'attente' },
		data: { status: 'refusee', resolvedAt: new Date() }
	});
	if (done.count !== 1) throw new CardError('Cet échange n’est plus en attente.', 409);
}

export async function cancelTrade(tradeId: number, userId: number) {
	const done = await prisma.cardTrade.updateMany({
		where: { id: tradeId, fromId: userId, status: 'attente' },
		data: { status: 'annulee', resolvedAt: new Date() }
	});
	if (done.count !== 1) throw new CardError('Cet échange n’est plus en attente.', 409);
}

export interface TradeView {
	id: number;
	status: TradeStatus;
	message: string | null;
	createdAt: string;
	resolvedAt: string | null;
	from: CollectorView;
	to: CollectorView;
	/** Reçue par le joueur qui regarde. */
	incoming: boolean;
	offered: OwnedCard[];
	requested: OwnedCard[];
	/** En attente, mais une des cartes a déjà changé de mains. */
	stale: boolean;
}

export async function tradesOf(userId: number): Promise<TradeView[]> {
	const [trades, totals] = await Promise.all([
		prisma.cardTrade.findMany({
			where: { OR: [{ fromId: userId }, { toId: userId }] },
			orderBy: { id: 'desc' },
			take: 60,
			include: {
				from: { select: COLLECTOR_SELECT },
				to: { select: COLLECTOR_SELECT },
				items: { include: { card: { include: COPY_INCLUDE } } }
			}
		}),
		setTotals()
	]);
	return trades.map((t) => {
		const offered = t.items.filter((i) => i.offered);
		const requested = t.items.filter((i) => !i.offered);
		const stale =
			t.status === 'attente' &&
			(offered.some((i) => i.card.ownerId !== t.fromId) || requested.some((i) => i.card.ownerId !== t.toId));
		return {
			id: t.id,
			status: t.status as TradeStatus,
			message: t.message,
			createdAt: t.createdAt.toISOString(),
			resolvedAt: t.resolvedAt?.toISOString() ?? null,
			from: collectorView(t.from),
			to: collectorView(t.to),
			incoming: t.toId === userId,
			offered: offered.map((i) => ownedView(i.card, totals)),
			requested: requested.map((i) => ownedView(i.card, totals)),
			stale
		};
	});
}

export function pendingTradesFor(userId: number) {
	return prisma.cardTrade.count({ where: { toId: userId, status: 'attente' } });
}
