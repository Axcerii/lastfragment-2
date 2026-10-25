import { prisma } from '$lib/server/prisma';
import { requireUser } from '$lib/server/auth';
import { COLLECTOR_SELECT, collectorView } from '$lib/server/cards/views';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals);
	const [players, counts, distinct] = await Promise.all([
		prisma.player.findMany({ select: COLLECTOR_SELECT }),
		prisma.card.groupBy({ by: ['ownerId'], where: { ownerId: { not: null } }, _count: { _all: true } }),
		prisma.card.findMany({ where: { ownerId: { not: null } }, select: { ownerId: true, templateId: true }, distinct: ['ownerId', 'templateId'] })
	]);
	const total = new Map(counts.map((c) => [c.ownerId, c._count._all]));
	const different = new Map<number, number>();
	for (const row of distinct) different.set(row.ownerId!, (different.get(row.ownerId!) ?? 0) + 1);

	// Classement au nombre de cartes possédées ; à égalité, même rang (1, 2, 2, 4).
	const sorted = players
		.map((p) => ({ ...collectorView(p), cards: total.get(p.id) ?? 0, distinct: different.get(p.id) ?? 0 }))
		.sort((a, b) => b.cards - a.cards || b.distinct - a.distinct || a.name.localeCompare(b.name));
	let rank = 0;
	return {
		me: user.id,
		players: sorted.map((p, i) => {
			if (i === 0 || p.cards !== sorted[i - 1].cards) rank = i + 1;
			return { ...p, rank };
		})
	};
};
