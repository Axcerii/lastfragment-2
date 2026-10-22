import { error } from '@sveltejs/kit';
import { toStatBlock } from '$lib/game/stats';
import { requireAdmin } from '$lib/server/auth';
import { censor } from '$lib/server/characters';
import { prisma } from '$lib/server/prisma';
import { readFlag, readStats, saveStats } from '$lib/server/stats';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const isAdmin = locals.user?.isAdmin ?? false;
	const character = await prisma.character.findUnique({
		where: { id: Number(params.id) || 0 },
		include: { statistics: isAdmin }
	});

	if (!character || (!character.visibility && !isAdmin)) error(404, 'Personnage introuvable.');

	const { statistics, ...fiche } = character;
	return {
		character: censor(fiche, isAdmin),
		// Les stats ne partent vers le navigateur que pour le MJ.
		stats: isAdmin ? toStatBlock(statistics) : null
	};
};

export const actions: Actions = {
	stats: async ({ request, params, locals }) => {
		requireAdmin(locals);
		await saveStats({ characterId: Number(params.id) }, readStats(await request.formData()));
		return { message: 'Stats enregistrées.' };
	},

	flags: async ({ request, params, locals }) => {
		requireAdmin(locals);
		const form = await request.formData();
		await prisma.character.update({
			where: { id: Number(params.id) },
			data: {
				visibility: readFlag(form, 'visibility') ? 1 : 0,
				current: readFlag(form, 'current') ? 1 : 0,
				dead: readFlag(form, 'dead'),
				censored: readFlag(form, 'censored'),
				quote: String(form.get('quote') ?? '').trim() || null
			}
		});
		return { message: 'Réglages enregistrés.' };
	}
};
