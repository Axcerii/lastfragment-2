import { redirect } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth';
import { loadSheet, sheetActions } from '$lib/server/sheet';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals);
	const sheet = await loadSheet(user.id);
	if (!sheet.character) redirect(303, '/profil');
	return { sheet };
};

export const actions: Actions = {
	passive: sheetActions(({ locals }) => requireUser(locals).id).passive
};
