import { error } from '@sveltejs/kit';
import { cardsVisibleTo } from '$lib/server/cards/settings';
import { pendingTradesFor } from '$lib/server/cards/trades';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!(await cardsVisibleTo(locals.user))) error(404, 'Page introuvable.');
	return { pendingTrades: locals.user ? await pendingTradesFor(locals.user.id) : 0 };
};
