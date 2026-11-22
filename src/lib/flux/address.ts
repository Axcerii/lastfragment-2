// Comment le don de flux s'adresse au personnage : au masculin ou au féminin. Choisi à l'entrée
// (première visite, ou après « Recommencer »), gardé avec la progression dans le navigateur.
//
// Les textes qui en dépendent (questions, réponses, flux, portails…) sont écrits une seule fois,
// chaque variation entre accolades : « tu te réveilles, {allongé|allongée}, … ». La forme de gauche
// est celle du masculin, la forme de droite celle du féminin.

export type Address = 'il' | 'elle';

export const ADDRESSES: readonly Address[] = ['il', 'elle'];

export const isAddress = (value: unknown): value is Address => value === 'il' || value === 'elle';

const VARIANT = /\{([^{}|]*)\|([^{}|]*)\}/g;

/** Le texte tel qu'il s'adresse au personnage (masculin par défaut). */
export function gendered(text: string, address: Address = 'il'): string {
	return text.replace(VARIANT, (_, masculine: string, feminine: string) => (address === 'elle' ? feminine : masculine));
}
