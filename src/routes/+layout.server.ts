import { cardsVisibleTo } from '$lib/server/cards/settings';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// Lire l'adresse fait rejouer ce chargement à chaque navigation : le header suit la session
	// réelle, même si elle a changé depuis l'affichage de la page (connexion dans un autre onglet,
	// page restaurée par le navigateur…). Sans ça, il faut recharger la page pour le voir à jour.
	void url.pathname;

	// Le jeu de cartes reste invisible (menu compris) tant que le MJ ne l'a pas rendu public.
	return { user: locals.user, cardsVisible: await cardsVisibleTo(locals.user) };
};
