import { redirect } from '@sveltejs/kit';
import { loadSheet, sheetActions } from '$lib/server/sheet';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const sheet = await loadSheet(Number(params.id) || 0);
	if (!sheet.character) redirect(303, `/admin/fiches/${params.id}`);
	return { sheet };
};

export const actions: Actions = {
	passive: sheetActions(({ params }) => Number(params.id)).passive
};
