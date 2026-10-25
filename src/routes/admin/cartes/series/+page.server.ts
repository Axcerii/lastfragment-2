import { fail } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireAdmin } from '$lib/server/auth';
import { deletePack, deleteSet, readPackForm, readSetForm, savePack, saveSet } from '$lib/server/cards/manage';
import { CardError } from '$lib/server/cards/settings';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	requireAdmin(locals);
	const sets = await prisma.cardSet.findMany({
		orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
		include: { _count: { select: { templates: true } } }
	});
	const published = await prisma.cardTemplate.groupBy({
		by: ['setId'],
		where: { status: 'publiee' },
		_count: { _all: true }
	});
	const live = new Map(published.map((p) => [p.setId, p._count._all]));
	const packs = await prisma.cardPack.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] });
	const packsOf = (setId: number | null) =>
		packs
			.filter((p) => p.setId === setId)
			.map((p) => ({ id: p.id, name: p.name, color: p.color, image: p.image, showText: p.showText, sortOrder: p.sortOrder }));
	return {
		allPacks: packsOf(null),
		sets: sets.map((s) => ({
			id: s.id,
			name: s.name,
			code: s.code,
			description: s.description ?? '',
			logo: s.logo,
			banner: s.banner,
			color: s.color,
			active: s.active,
			startsAt: s.startsAt?.toISOString() ?? null,
			endsAt: s.endsAt?.toISOString() ?? null,
			sortOrder: s.sortOrder,
			cards: s._count.templates,
			published: live.get(s.id) ?? 0,
			packs: packsOf(s.id)
		}))
	};
};

const idOf = (form: FormData) => {
	const id = Number(form.get('id'));
	return Number.isInteger(id) && id > 0 ? id : null;
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		requireAdmin(locals);
		const form = await request.formData();
		try {
			await saveSet(idOf(form), await readSetForm(form));
		} catch (e) {
			if (e instanceof CardError) return fail(e.status, { error: e.message });
			throw e;
		}
		return { message: 'Série enregistrée.' };
	},

	pack: async ({ request, locals }) => {
		requireAdmin(locals);
		const form = await request.formData();
		const target = String(form.get('setId') ?? '');
		const setId = target === 'all' ? null : Number(target);
		if (setId !== null && !(Number.isInteger(setId) && setId > 0)) return fail(400, { error: 'Série inconnue.' });
		try {
			await savePack(idOf(form), setId, await readPackForm(form));
		} catch (e) {
			if (e instanceof CardError) return fail(e.status, { error: e.message });
			throw e;
		}
		return { message: 'Paquet enregistré.' };
	},

	deletePack: async ({ request, locals }) => {
		requireAdmin(locals);
		const id = idOf(await request.formData());
		if (!id) return fail(400, { error: 'Paquet inconnu.' });
		await deletePack(id);
		return { message: 'Paquet supprimé.' };
	},

	delete: async ({ request, locals }) => {
		requireAdmin(locals);
		const id = idOf(await request.formData());
		if (!id) return fail(400, { error: 'Série inconnue.' });
		try {
			await deleteSet(id);
		} catch (e) {
			if (e instanceof CardError) return fail(e.status, { error: e.message });
			throw e;
		}
		return { message: 'Série supprimée.' };
	}
};
