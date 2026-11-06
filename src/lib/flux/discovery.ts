import type { FluxResult } from './quiz';
import type { RaceId } from './races';

// Données publiques des énigmes de /flux. L'ordre de la constellation, les indices et les noms
// des pays à deviner restent côté serveur ($lib/server/flux/discovery).

export const DRAGONS = [
	'Aqua',
	'Artrish',
	'Chronos',
	'Drii',
	'Goliath',
	'Guizamark',
	'Lada',
	'Pestia',
	'Pura',
	'Shizari',
	'Yinva'
] as const;

export type DragonName = (typeof DRAGONS)[number];

/**
 * Constellation « Le Tout », dans le repère de son dessin d'origine (925,2 × 820,2).
 * Chaque dragon est posé sur un point du tracé, liste par ordre alphabétique pour ne rien
 * dévoiler de l'ordre attendu.
 */
export const CONSTELLATION = {
	width: 925.2,
	height: 820.2,
	nodes: {
		Aqua: { x: 297.1, y: 108.2 },
		Artrish: { x: 462.6, y: 10.3 },
		Chronos: { x: 299.4, y: 482.1 },
		Drii: { x: 68.3, y: 388.4 },
		Goliath: { x: 628.5, y: 667 },
		Guizamark: { x: 299.4, y: 293.3 },
		Lada: { x: 856.9, y: 388.4 },
		Pestia: { x: 626.5, y: 293.3 },
		Pura: { x: 856.9, y: 757.5 },
		Shizari: { x: 626.5, y: 482.1 },
		Yinva: { x: 462.6, y: 765.2 }
	} satisfies Record<DragonName, { x: number; y: number }>
};

/** Symboles des dragons imprimés sur la carte du monde, en % de sa largeur et de sa hauteur. */
export const MAP_DRAGONS: Record<DragonName, { x: number; y: number }> = {
	Artrish: { x: 33.1, y: 11.6 },
	Yinva: { x: 38.6, y: 11.6 },
	Guizamark: { x: 23.1, y: 46.2 },
	Shizari: { x: 14.3, y: 55.6 },
	Pura: { x: 16.4, y: 64.1 },
	Aqua: { x: 33.1, y: 61.9 },
	Goliath: { x: 51.9, y: 42.7 },
	Drii: { x: 58.3, y: 51.9 },
	Chronos: { x: 43, y: 65.5 },
	Pestia: { x: 92.6, y: 52.6 },
	Lada: { x: 89.8, y: 61.9 }
};

/** Diamètre d'un symbole de dragon sur la carte, en % de sa largeur. */
export const MAP_SYMBOL_SIZE = 4.3;

export type Country = {
	id: string;
	name: string;
	/** Position du point sur la carte, en % */
	x: number;
	y: number;
	/** Icône dans /icones/pays ; null pour un territoire sans nation */
	icon: string | null;
	/** Terre connue dès le départ : sa description est publique. */
	description?: string;
	/** Terre à deviner : l'énigme qui décrit la fleur dont elle tient son nom. */
	riddle?: string;
};

// Les terres à deviner portent chacune le nom d'une fleur. Celles qui sont données servent de
// repère et expliquent la règle.
export const COUNTRIES: Country[] = [
	{
		id: 'augeaime',
		name: 'Augeaime',
		x: 51,
		y: 62,
		icon: 'Augeaime',
		description:
			"Augeaime, au centre du monde. Autour d'elle, chaque terre porte le nom d'une fleur : trouve la fleur, et la terre te dira son nom."
	},
	{
		id: 'vulcain',
		name: 'Vulcain',
		x: 72,
		y: 54,
		icon: null,
		description:
			"Vulcain n'appartient à aucune nation. Territoire neutre, il repose au cœur des quatre terres qui l'entourent."
	},
	{
		id: 'saxifra',
		name: 'Saxifra',
		x: 77,
		y: 35,
		icon: 'Saxifra',
		riddle: 'Ici, une petite fleur pousse dans les fissures des rochers. Son nom veut dire « qui brise la pierre ».'
	},
	{
		id: 'irisia',
		name: 'Irisia',
		x: 74,
		y: 71,
		icon: 'Irisia',
		riddle: 'Ici pousse une fleur qui porte le nom de la messagère des dieux, et que tu retrouves au cœur de tes yeux.'
	},
	{
		id: 'mudan',
		name: 'Mudan',
		x: 94,
		y: 42,
		icon: 'Mudan',
		riddle: 'Ici règne la reine des fleurs, symbole de richesse en Chine, où on la nomme en deux syllabes.'
	},
	{
		id: 'edenia',
		name: 'Edenia',
		x: 11,
		y: 44,
		icon: 'Edenia',
		riddle: "Ici pousse une fleur qui ressemble à la tête d'un oiseau coloré. On la nomme d'après le jardin perdu des origines."
	},
	{
		id: 'amari',
		name: 'Amari',
		x: 21,
		y: 74,
		icon: 'Amari',
		riddle: "Ici éclot, en plein hiver, une grande fleur rouge en trompette, qui porte le nom d'une bergère des poèmes antiques."
	}
];

/** Territoire neutre de Vulcain, rempli du motif des pages personnages (masque tiré de la carte). */
export const NEUTRAL_MASK = '/flux/vulcain-masque.webp';

/**
 * Progression d'un visiteur, gardée dans son navigateur : constellation réussie, descriptions
 * des pays trouvés, puis race choisie et résultat du test de flux.
 */
export type DiscoveryProgress = {
	constellation: boolean;
	found: Record<string, string>;
	race?: RaceId;
	result?: FluxResult;
};

export const STORAGE_KEY = 'flux_decouverte';
