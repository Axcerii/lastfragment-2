import { error, fail, redirect } from '@sveltejs/kit';
import {
	deleteRecord,
	describeError,
	getRecord,
	getResource,
	relationOptions,
	saveRecord
} from '$lib/server/admin/crud';
import { startSession } from '$lib/server/auth';
import { prisma } from '$lib/server/prisma';
import type { Actions, PageServerLoad } from './$types';

const NEW = 'nouveau';

/** Identifiant de l'URL : `null` pour une création. */
function recordId(param: string): number | null {
	if (param === NEW) return null;
	const id = Number(param);
	if (!Number.isInteger(id)) error(404, 'Enregistrement introuvable.');
	return id;
}

export const load: PageServerLoad = async ({ params }) => {
	const resource = getResource(params.resource);
	const [record, options] = await Promise.all([
		getRecord(resource, recordId(params.id)),
		relationOptions(resource)
	]);

	return {
		resource: { slug: resource.slug, label: resource.label, singular: resource.singular },
		fields: resource.fields,
		options,
		record
	};
};

export const actions: Actions = {
	save: async ({ request, params, locals, cookies }) => {
		const resource = getResource(params.resource);
		const id = recordId(params.id);
		const form = await request.formData();

		let savedId: number;
		try {
			savedId = await saveRecord(resource, id, form);
		} catch (e) {
			const message = describeError(e);
			if (!message) throw e;
			return fail(400, { error: message });
		}

		// Changer un mot de passe ferme les sessions du compte : le MJ qui change le sien reste connecté.
		if (resource.model === 'player' && id === locals.user?.id && String(form.get('password') ?? '').trim()) {
			const self = await prisma.player.findUnique({ where: { id }, select: { id: true, password: true } });
			if (self) startSession(cookies, self);
		}

		// Après une création, on arrive sur la fiche d'édition du nouvel enregistrement.
		if (id === null) redirect(303, `/admin/${resource.slug}/${savedId}`);
		return { message: 'Enregistré.' };
	},

	delete: async ({ params, locals }) => {
		const resource = getResource(params.resource);
		const id = recordId(params.id);
		if (id === null) error(400, 'Rien à supprimer.');
		if (resource.model === 'player' && id === locals.user?.id) {
			return fail(400, { error: 'Impossible de supprimer son propre compte.' });
		}

		try {
			await deleteRecord(resource, id);
		} catch (e) {
			const message = describeError(e);
			if (!message) throw e;
			return fail(400, { error: message });
		}
		redirect(303, `/admin/${resource.slug}`);
	}
};
