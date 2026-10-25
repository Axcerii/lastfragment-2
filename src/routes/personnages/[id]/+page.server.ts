import { error } from '@sveltejs/kit';
import type { OwnedCard } from '$lib/cards/types';
import { toStatBlock } from '$lib/game/stats';
import { requireAdmin } from '$lib/server/auth';
import { censor } from '$lib/server/characters';
import { prisma } from '$lib/server/prisma';
import { showcaseOf } from '$lib/server/cards/collection';
import { cardsVisibleTo } from '$lib/server/cards/settings';
import { readFlag, readStats, saveStats } from '$lib/server/stats';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const isAdmin = locals.user?.isAdmin ?? false;
	const character = await prisma.character.findUnique({
		where: { id: Number(params.id) || 0 },
		include: { statistics: isAdmin }
	});

	if (!character || (!character.visibility && !isAdmin)) error(404, 'Personnage introuvable.');

	// Vitrine des joueurs qui incarnent ce personnage (pas sur une fiche censurée).
	const showcases: { id: number; cards: OwnedCard[] }[] = [];
	if ((!character.censored || isAdmin) && (await cardsVisibleTo(locals.user))) {
		const players = await prisma.player.findMany({ where: { characterId: character.id }, select: { id: true } });
		const pinned = await showcaseOf(players.map((p) => p.id));
		for (const p of players) {
			const cards = pinned.get(p.id);
			if (cards?.length) showcases.push({ id: p.id, cards });
		}
	}

	const { statistics, ...fiche } = character;
	return {
		showcases,
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
