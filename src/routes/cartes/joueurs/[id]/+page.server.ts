import { error, redirect } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth';
import { albumCookie, collectionOf } from '$lib/server/cards/collection';
import { CardError } from '$lib/server/cards/settings';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, cookies }) => {
	const user = requireUser(locals);
	if (!/^\d{1,9}$/.test(params.id)) error(404, 'Joueur introuvable.');
	const id = Number(params.id);
	if (id === user.id) redirect(303, '/cartes/collection');
	try {
		return { collection: await collectionOf(id), album: albumCookie(cookies), isAdmin: user.isAdmin };
	} catch (e) {
		if (e instanceof CardError) error(e.status, e.message);
		throw e;
	}
};
