import { error } from '@sveltejs/kit';
import { toStatBlock } from '$lib/game/stats';
import { requireAdmin } from '$lib/server/auth';
import { prisma } from '$lib/server/prisma';
import { readFlag, readStats, saveStats } from '$lib/server/stats';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const isAdmin = locals.user?.isAdmin ?? false;
	const found = await prisma.monster.findUnique({
		where: { id: Number(params.id) || 0 },
		include: { statistics: isAdmin }
	});

	if (!found || (!found.visibility && !isAdmin)) error(404, 'Monstre introuvable.');

	const { statistics, ...monster } = found;
	return {
		monster,
		// Les stats ne partent vers le navigateur que pour le MJ.
		stats: isAdmin ? toStatBlock(statistics) : null
	};
};

export const actions: Actions = {
	stats: async ({ request, params, locals }) => {
		requireAdmin(locals);
		await saveStats({ monsterId: Number(params.id) }, readStats(await request.formData()));
		return { message: 'Stats enregistrées.' };
	},

	flags: async ({ request, params, locals }) => {
		requireAdmin(locals);
		const form = await request.formData();
		await prisma.monster.update({
			where: { id: Number(params.id) },
			data: {
				visibility: readFlag(form, 'visibility') ? 1 : 0,
				current: readFlag(form, 'current') ? 1 : 0
			}
		});
		return { message: 'Réglages enregistrés.' };
	}
};
