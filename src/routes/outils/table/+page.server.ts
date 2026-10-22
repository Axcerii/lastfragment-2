import { fail, redirect } from '@sveltejs/kit';
import { randomBytes } from 'crypto';
import { requireAdmin } from '$lib/server/auth';
import { prisma } from '$lib/server/prisma';
import { broadcast, connectedPlayers, pushEvent } from '$lib/server/table/hub';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	// Le MJ voit toutes ses parties ; un joueur connecté, les parties ouvertes ; un visiteur, rien.
	const sessions = user
		? await prisma.tableSession.findMany({
				where: user.isAdmin ? {} : { open: true },
				orderBy: [{ open: 'desc' }, { createdAt: 'desc' }],
				select: { id: true, name: true, open: true, createdAt: true, _count: { select: { scenes: true } } }
			})
		: [];
	return {
		sessions: sessions.map((s) => ({
			id: s.id,
			name: s.name,
			open: s.open,
			scenes: s._count.scenes,
			createdAt: s.createdAt.toISOString(),
			players: connectedPlayers(s.id)
		})),
		canJoin: Boolean(user?.isAdmin || user?.characterId),
		loggedIn: Boolean(user)
	};
};

export const actions: Actions = {
	create: async ({ locals, request }) => {
		requireAdmin(locals);
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim().slice(0, 255) || 'Nouvelle partie';
		const session = await prisma.tableSession.create({
			data: {
				name,
				obsKey: randomBytes(16).toString('hex'),
				order: [],
				ambiences: [],
				scenes: { create: { name: 'Scène 1', fog: [] } }
			},
			include: { scenes: true }
		});
		await prisma.tableSession.update({
			where: { id: session.id },
			data: { sceneId: session.scenes[0].id }
		});
		redirect(303, `/outils/table/${session.id}`);
	},

	toggle: async ({ locals, request }) => {
		requireAdmin(locals);
		const form = await request.formData();
		const id = Number(form.get('id'));
		const session = await prisma.tableSession.findUnique({ where: { id } });
		if (!session) return fail(404, { error: 'Partie introuvable.' });
		await prisma.tableSession.update({ where: { id }, data: { open: !session.open } });
		broadcast(id);
	},

	delete: async ({ locals, request }) => {
		requireAdmin(locals);
		const form = await request.formData();
		const id = Number(form.get('id'));
		await prisma.tableSession.deleteMany({ where: { id } });
		pushEvent(id, 'closed', {});
	}
};
