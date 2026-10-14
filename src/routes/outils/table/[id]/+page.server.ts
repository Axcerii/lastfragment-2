import { error, redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { tableViewer } from '$lib/server/table/access';
import { broadcast, pushLogs } from '$lib/server/table/hub';
import { ensurePlayerToken } from '$lib/server/table/tokens';
import type { Asset, AssetKind } from '$lib/table/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	if (!locals.user) redirect(303, '/auth/login');
	const sessionId = Number(params.id);
	if (!Number.isInteger(sessionId)) error(404, 'Partie introuvable.');
	const viewer = await tableViewer(sessionId, locals.user);

	// Un joueur qui arrive pour la première fois reçoit son jeton sur la scène montrée.
	if (!viewer.isAdmin && viewer.playerId) {
		const { created } = await ensurePlayerToken(sessionId, viewer.playerId);
		if (created) {
			const log = await prisma.tableLog.create({
				data: { sessionId, kind: 'system', author: 'Table', text: `${viewer.name} rejoint la partie.` }
			});
			pushLogs(sessionId, [log]);
			broadcast(sessionId);
		}
		return { sessionId, admin: null };
	}

	// Le MJ a besoin de quoi ajouter des jetons, et de sa médiathèque.
	const [players, characters, monsters, assets, session] = await Promise.all([
		prisma.player.findMany({
			where: { characterId: { not: null } },
			select: { id: true, login: true, character: { select: { name: true } } },
			orderBy: { login: 'asc' }
		}),
		prisma.character.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
		prisma.monster.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
		prisma.tableAsset.findMany({ orderBy: [{ kind: 'asc' }, { name: 'asc' }] }),
		prisma.tableSession.findUnique({ where: { id: sessionId }, select: { obsKey: true } })
	]);
	return {
		sessionId,
		admin: {
			obsUrl: `${url.origin}/outils/table/${sessionId}/obs?key=${session?.obsKey}`,
			sources: {
				players: players.map((p) => ({ id: p.id, name: `${p.character?.name} (${p.login})` })),
				characters,
				monsters
			},
			assets: assets.map(
				(a): Asset => ({ id: a.id, kind: a.kind as AssetKind, name: a.name, url: a.url })
			)
		}
	};
};
