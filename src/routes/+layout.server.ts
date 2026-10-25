import { cardsVisibleTo } from '$lib/server/cards/settings';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Le jeu de cartes reste invisible (menu compris) tant que le MJ ne l'a pas rendu public.
	return { user: locals.user, cardsVisible: await cardsVisibleTo(locals.user) };
};
