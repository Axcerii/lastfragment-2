import { fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth';
import { CardError } from '$lib/server/cards/settings';
import { adminShop, deleteOffer, readOfferForm, saveOffer } from '$lib/server/cards/shop';
import type { Actions, PageServerLoad } from './$types';

// Tout /admin est déjà réservé au MJ par hooks.server.ts ; chaque action le revérifie quand même.

export const load: PageServerLoad = async ({ locals }) => {
	requireAdmin(locals);
	return adminShop();
};

const idOf = (form: FormData) => {
	const id = Number(form.get('id'));
	return Number.isInteger(id) && id > 0 ? id : null;
};

const failWith = (e: unknown) => {
	if (e instanceof CardError) return fail(e.status, { error: e.message });
	throw e;
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		requireAdmin(locals);
		const form = await request.formData();
		try {
			const id = await saveOffer(idOf(form), readOfferForm(form));
			return { message: 'Offre enregistrée.', saved: id };
		} catch (e) {
			return failWith(e);
		}
	},

	delete: async ({ request, locals }) => {
		requireAdmin(locals);
		const id = idOf(await request.formData());
		if (!id) return fail(400, { error: 'Offre inconnue.' });
		try {
			await deleteOffer(id);
		} catch (e) {
			return failWith(e);
		}
		return { message: 'Offre supprimée.' };
	}
};
