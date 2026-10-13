import { prisma } from '$lib/server/prisma';
import { RESOURCES } from '$lib/server/admin/resources';
import { getGameState, openContainers } from '$lib/server/sheet';
import { readFlag } from '$lib/server/stats';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [counts, players, state] = await Promise.all([
		// Compte générique : un modèle Prisma par ressource du back-office.
		Promise.all(RESOURCES.map((r) => (prisma as any)[r.model].count() as Promise<number>)),
		prisma.player.findMany({
			where: { characterId: { not: null } },
			select: { id: true, login: true, money: true, character: { select: { name: true, image: true } } },
			orderBy: { login: 'asc' }
		}),
		getGameState()
	]);

	return {
		resources: RESOURCES.map((r, i) => ({
			slug: r.slug,
			label: r.label,
			description: r.description,
			count: counts[i]
		})),
		players,
		access: openContainers(state)
	};
};

export const actions: Actions = {
	/** Ouvre ou ferme les conteneurs d'inventaire pour les joueurs. */
	access: async ({ request }) => {
		const form = await request.formData();
		const data = {
			mainOpen: readFlag(form, 'main'),
			bagOpen: readFlag(form, 'sac'),
			chestOpen: readFlag(form, 'coffre'),
			horseOpen: readFlag(form, 'cheval'),
			commonOpen: readFlag(form, 'commun')
		};
		await prisma.gameState.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
		return { message: 'Accès aux conteneurs mis à jour.' };
	}
};
