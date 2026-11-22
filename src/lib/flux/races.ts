// Les trois portails de /flux : le visiteur choisit sa race avant le test de flux.
// Humains et Géants se rejoignent (un demi-géant peut exister) ; les Éternelles restent à part.
// Ce qui s'adresse au personnage s'accorde : « {masculin|féminin} », voir $lib/flux/address.

import { gendered, type Address } from './address';

export type RaceId = 'humain' | 'geant' | 'eternelle';

export type Race = {
	id: RaceId;
	/** Nom du peuple, au singulier, accordé au personnage : « {Humain|Humaine} » */
	name: string;
	/** Couleur du néon du portail et du fil pendant le test */
	color: string;
	/** Symboles posés sur le portail */
	symbols: string[];
	/** Phrase inscrite sur le portail */
	motto: string;
	/** Phrase dévoilée une fois le portail choisi */
	reveal: string;
	/** Mot ajouté au résultat (les géants n'ont pas de flux) */
	resultNote?: string;
	/** Dragons plus probables au test pour ce peuple (poids × FAVORED_BONUS, dans quiz.ts) */
	favored?: string[];
};

// À CONFIRMER : phrases provisoires.
export const RACES: Race[] = [
	{
		id: 'humain',
		name: '{Humain|Humaine}',
		color: '#5b8cff',
		symbols: ['/layout/Logo.svg'],
		motto: "Le peuple le plus nombreux d'Arthera, ceux qui innovent.",
		reveal: 'Tu es {né humain|née humaine}. Ton flux s’éveillera tôt, et ne te quittera plus.'
	},
	{
		id: 'geant',
		name: '{Géant|Géante}',
		color: '#f2f2f2',
		symbols: ['/icones/pays/Saxifra.svg', '/icones/pays/Irisia.svg'],
		motto: 'Le peuple dont rien ne traverse la peau, pas même le flux, ceux qui façonnent.',
		reveal: 'Tu es {né géant|née géante}. Le flux ne coule pas en toi… mais il sait qui tu aurais pu être.',
		favored: ['Pura', 'Drii', 'Aqua', 'Lada', 'Goliath'],
		resultNote: "Les géants ne canalisent pas le flux, mais le monde d'Arthera est plein de surprises : voici le flux que tu aurais pu avoir."
	},
	{
		id: 'eternelle',
		name: 'Éternelle',
		color: '#5fe0a0',
		symbols: ['/icones/pays/Edenia.svg', '/icones/pays/Mudan.svg'],
		motto: 'Ceux que Chronos oublie, et qui ne vieillissent qu’à peine, ceux qui transmettent.',
		reveal: 'Tu es {né|née} éternelle. Tu auras tout le temps d’apprendre à maîtriser ton flux.',
		favored: ['Guizamark', 'Shizari', 'Chronos', 'Pestia']
	}
];

/** Lueur où se rejoignent Humains et Géants : la possibilité d'un demi-géant. */
export const HALF_GIANT_COLOR = '#a9d8ff';

/** Un géant sur dix est en fait un demi-géant : le sang humain lui ouvre le flux. */
export const HALF_GIANT_CHANCE = 0.1;

export const raceById = (id: unknown) => RACES.find((r) => r.id === id) ?? null;

/** Ce que le résultat affiche du peuple : demi-géant compris. */
export type Lineage = {
	name: string;
	color: string;
	/** Faux pour le géant : « Flux : Aucun, flux caché : … » */
	hasFlux: boolean;
	/** Phrase sur le peuple, reprise dans la description du personnage */
	summary: string;
	/** Mot sous le flux, sur le certificat */
	note?: string;
};

// À CONFIRMER : phrases provisoires du demi-géant.
const HALF_GIANT: Lineage = {
	name: '{Demi-géant|Demi-géante}',
	color: HALF_GIANT_COLOR,
	hasFlux: true,
	summary: '{Né|Née} du sang des géants et des humains : sa peau est dure, et pourtant le flux la traverse.',
	note: 'Le sang des humains coule aussi en toi : tu es {demi-géant|demi-géante}, et le flux t’a {choisi|choisie}.'
};

/** Le peuple tel que le certificat le montre, accordé au personnage. */
export function lineageOf(race: Race, halfGiant = false, address: Address = 'il'): Lineage {
	const lineage: Lineage =
		race.id === 'geant' && halfGiant
			? HALF_GIANT
			: { name: race.name, color: race.color, hasFlux: race.id !== 'geant', summary: race.motto, note: race.resultNote };
	return {
		...lineage,
		name: gendered(lineage.name, address),
		summary: gendered(lineage.summary, address),
		note: lineage.note && gendered(lineage.note, address)
	};
}
