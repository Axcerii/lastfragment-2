import { requireUser } from '$lib/server/auth';
import { loadSheet, sheetActions } from '$lib/server/sheet';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals);
	return { sheet: await loadSheet(user.id) };
};

export const actions: Actions = {
	transfer: sheetActions(({ locals }) => requireUser(locals).id).transfer
};
