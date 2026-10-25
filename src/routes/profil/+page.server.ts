import { requireUser } from '$lib/server/auth';
import { showcaseOf } from '$lib/server/cards/collection';
import { cardsVisibleTo } from '$lib/server/cards/settings';
import { loadSheet, sheetActions } from '$lib/server/sheet';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals);
	const showcase = (await cardsVisibleTo(user)) ? ((await showcaseOf([user.id])).get(user.id) ?? []) : null;
	return { sheet: await loadSheet(user.id), showcase };
};

export const actions: Actions = sheetActions(({ locals }) => requireUser(locals).id);
