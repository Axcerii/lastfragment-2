import { fail } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth';
import { albumCookie, collectionOf, togglePin } from '$lib/server/cards/collection';
import { CardError } from '$lib/server/cards/settings';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	const user = requireUser(locals);
	return { collection: await collectionOf(user.id), album: albumCookie(cookies) };
};

export const actions: Actions = {
	pin: async ({ request, locals }) => {
		const user = requireUser(locals);
		const cardId = Number((await request.formData()).get('cardId'));
		if (!Number.isInteger(cardId) || cardId < 1) return fail(400, { error: 'Carte inconnue.' });
		try {
			await togglePin(cardId, user.id);
		} catch (e) {
			if (e instanceof CardError) return fail(e.status, { error: e.message });
			throw e;
		}
		return { pinned: true };
	}
};
