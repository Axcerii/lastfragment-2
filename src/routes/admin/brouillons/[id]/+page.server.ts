import { error, fail, redirect } from '@sveltejs/kit';
import { describeError, getResource, relationOptions, saveRecord } from '$lib/server/admin/crud';
import { draftStats, type DraftKind } from '$lib/server/drafts';
import { prisma } from '$lib/server/prisma';
import type { Actions, PageServerLoad } from './$types';

// Un brouillon devient un personnage ou un monstre via le formulaire de la ressource correspondante.
const TARGET: Record<DraftKind, string> = { personnage: 'personnages', monstre: 'monstres' };

async function findDraft(id: string) {
	const draft = await prisma.draft.findUnique({
		where: { id: Number(id) || 0 },
		include: { player: { select: { login: true } } }
	});
	if (!draft) error(404, 'Ce brouillon n’existe plus.');
	return draft;
}

/** Le MJ peut changer d'avis : un monstre proposé peut devenir un personnage, et inversement. */
function chosenKind(url: URL, fallback: string): DraftKind {
	const kind = url.searchParams.get('type') ?? fallback;
	return kind === 'personnage' ? 'personnage' : 'monstre';
}

export const load: PageServerLoad = async ({ params, url }) => {
	const draft = await findDraft(params.id);
	const kind = chosenKind(url, draft.kind);
	const resource = getResource(TARGET[kind]);

	return {
		draft: {
			id: draft.id,
			kind: draft.kind,
			name: draft.name,
			author: draft.author || draft.player?.login || null
		},
		kind,
		fields: resource.fields,
		options: await relationOptions(resource),
		// Valeurs reprises du brouillon ; le reste est à compléter par le MJ.
		values: {
			name: draft.name,
			description: draft.description,
			image: draft.image,
			stats: draftStats(draft.stats),
			visibility: 0,
			current: 0
		}
	};
};

export const actions: Actions = {
	validate: async ({ params, url, request }) => {
		const draft = await findDraft(params.id);
		const resource = getResource(TARGET[chosenKind(url, draft.kind)]);

		let id: number;
		try {
			id = await saveRecord(resource, null, await request.formData());
		} catch (e) {
			const message = describeError(e);
			if (!message) throw e;
			return fail(400, { error: message });
		}

		// L'image du brouillon est reprise telle quelle par la nouvelle fiche : seul le brouillon disparaît.
		await prisma.draft.delete({ where: { id: draft.id } });
		redirect(303, `/admin/${resource.slug}/${id}`);
	}
};
