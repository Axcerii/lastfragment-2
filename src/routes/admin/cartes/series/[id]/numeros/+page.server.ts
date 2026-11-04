import { error, fail } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireAdmin } from '$lib/server/auth';
import { isCardType, readFace } from '$lib/cards/types';
import { renumberSet } from '$lib/server/cards/manage';
import { CardError } from '$lib/server/cards/settings';
import type { Actions, PageServerLoad } from './$types';

const MAX_JSON = 200_000;

function setId(param: string) {
	if (!/^\d{1,9}$/.test(param)) error(404, 'Série introuvable.');
	return Number(param);
}

export const load: PageServerLoad = async ({ locals, params }) => {
	requireAdmin(locals);
	const id = setId(params.id);
	const set = await prisma.cardSet.findUnique({
		where: { id },
		select: {
			id: true,
			name: true,
			code: true,
			color: true,
			templates: {
				orderBy: [{ number: 'asc' }, { id: 'asc' }],
				select: { id: true, name: true, type: true, rarity: true, status: true, number: true, face: true, _count: { select: { copies: true } } }
			}
		}
	});
	if (!set) error(404, 'Série introuvable.');
	return {
		set: { id: set.id, name: set.name, code: set.code, color: set.color },
		templates: set.templates.map((t) => {
			const face = readFace(t.face, isCardType(t.type) ? t.type : 'objet', t.rarity);
			return {
				id: t.id,
				name: t.name,
				rarity: t.rarity,
				status: t.status,
				number: t.number,
				copies: t._count.copies,
				thumb: face.art?.small ?? face.background?.small ?? null
			};
		})
	};
};

export const actions: Actions = {
	save: async ({ request, locals, params }) => {
		requireAdmin(locals);
		const id = setId(params.id);
		const text = String((await request.formData()).get('numbers') ?? '');
		if (text.length > MAX_JSON) return fail(400, { error: 'Trop de cartes d’un coup.' });
		let proposed: unknown;
		try {
			proposed = JSON.parse(text);
		} catch {
			return fail(400, { error: 'Numérotation illisible.' });
		}
		try {
			const changed = await renumberSet(id, proposed);
			return { message: changed ? `${changed} numéro${changed > 1 ? 's' : ''} mis à jour.` : 'Aucun numéro n’a changé.' };
		} catch (e) {
			if (e instanceof CardError) return fail(e.status, { error: e.message });
			throw e;
		}
	}
};
