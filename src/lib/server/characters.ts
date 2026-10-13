import type { Character } from '@prisma/client';

const CENSORED = 'Censuré';

/**
 * Fiche « teaser » : le personnage apparaît (nom, portrait) mais son contenu reste masqué
 * pour les joueurs. La censure est faite ici pour que rien ne parte vers le navigateur.
 */
export function censor<T extends Character>(character: T, isAdmin: boolean): T {
	if (!character.censored || isAdmin) return character;
	return {
		...character,
		title: null,
		flux: CENSORED,
		theme: null,
		category: '',
		description: ''
	};
}

/** Les fiches cachées (visibility = 0) ne sont listées que pour le MJ. */
export function visibleTo(isAdmin: boolean) {
	return isAdmin ? {} : { visibility: 1 };
}
