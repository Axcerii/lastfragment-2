// « Partir d'une fiche » : remplit une carte à partir d'un personnage, d'un monstre ou d'un objet.
// Les données sont recopiées dans la carte (elle ne change pas si la fiche change ensuite).

import { CATEGORY_LABELS } from '$lib/game/inventory';
import { COUNTRY_LABELS, RACE_LABELS } from '$lib/game/labels';
import { COMBAT_STATS, SOCIAL_STATS, STATS, type StatBlock } from '$lib/game/stats';
import { FACE_LIMITS, type CardBar, type CardFace, type CardFact, type CardType } from './types';

export interface CharacterSource {
	id: number;
	name: string;
	title: string | null;
	image: string | null;
	dragon: string;
	race: string;
	country: string;
	flux: string | null;
	job: string | null;
	quote: string | null;
	description: string;
	stats: StatBlock;
}

export interface MonsterSource {
	id: number;
	name: string;
	image: string;
	dragon: string;
	size: string;
	weight: string;
	dangerosity: number;
	effect: string;
	description: string;
	stats: StatBlock;
}

export interface ItemSource {
	id: number;
	name: string;
	category: string;
	rarity: number;
	weight: number;
	icon: string | null;
	description: string;
}

export interface Prefill {
	name: string;
	type: CardType;
	rarity?: number;
	sourceKind: 'personnage' | 'monstre' | 'objet';
	sourceId: number;
	face: Partial<CardFace>;
}

const cut = (text: string | null | undefined, max: number) => {
	const clean = (text ?? '').replace(/\s+/g, ' ').trim();
	return clean.length > max ? clean.slice(0, max - 1).trimEnd() + '…' : clean;
};

const facts = (...pairs: [string, string | null | undefined][]): CardFact[] =>
	pairs
		.filter(([, value]) => value && value.trim())
		.map(([label, value]) => ({ label, value: cut(value, FACE_LIMITS.factValue) }))
		.slice(0, FACE_LIMITS.facts);

/** Les 10 stats de combat et hors combat, en barres aux couleurs de leur dragon. */
export function statBars(stats: StatBlock): CardBar[] {
	return [...COMBAT_STATS, ...SOCIAL_STATS].map((k) => ({
		label: STATS[k].abbr,
		value: Math.max(0, Math.min(100, Math.round(stats[k]))),
		dragon: STATS[k].dragon
	}));
}

const portraitArt = (src: string | null) =>
	src ? { src, large: src, small: src, x: 0, y: 0, zoom: 1, fit: 'contain' as const } : null;

const accentOf = (dragon: string) => {
	const first = dragon.split(/[^A-Za-z]+/).find(Boolean);
	return first ? DRAGON_HEX[first] : undefined;
};

/** Couleurs des dragons (les mêmes que les variables CSS du site). */
export const DRAGON_HEX: Record<string, string> = {
	Artrish: '#ffffff',
	Yinva: '#e5b8cc',
	Guizamark: '#cfdfc4',
	Shizari: '#1b1b1b',
	Pestia: '#615dd3',
	Chronos: '#ca4444',
	Aqua: '#a6a6a6',
	Goliath: '#84583c',
	Drii: '#803084',
	Lada: '#f3f09e',
	Pura: '#d2b674'
};

export function fromCharacter(c: CharacterSource): Prefill {
	return {
		name: cut(c.name, FACE_LIMITS.name),
		type: 'personnage',
		sourceKind: 'personnage',
		sourceId: c.id,
		face: {
			subtitle: cut(c.title, FACE_LIMITS.subtitle),
			dragons: c.dragon,
			...(accentOf(c.dragon) ? { accent: accentOf(c.dragon) } : {}),
			art: portraitArt(c.image),
			popout: !!c.image?.toLowerCase().endsWith('.png'),
			facts: facts(
				['Pays', COUNTRY_LABELS[c.country] ?? c.country],
				['Race', RACE_LABELS[c.race] ?? c.race],
				['Flux', c.flux],
				['Métier', c.job]
			),
			bars: statBars(c.stats),
			flavor: cut(c.quote, FACE_LIMITS.flavor),
			text: cut(c.description, FACE_LIMITS.text)
		}
	};
}

export function fromMonster(m: MonsterSource): Prefill {
	return {
		name: cut(m.name, FACE_LIMITS.name),
		type: 'monstre',
		sourceKind: 'monstre',
		sourceId: m.id,
		face: {
			subtitle: `Danger ${m.dangerosity}`,
			dragons: m.dragon,
			...(accentOf(m.dragon) ? { accent: accentOf(m.dragon) } : {}),
			art: portraitArt(m.image),
			facts: facts(['Taille', m.size], ['Poids', m.weight], ['Danger', String(m.dangerosity)]),
			bars: statBars(m.stats),
			flavor: cut(m.effect, FACE_LIMITS.flavor),
			text: cut(m.description, FACE_LIMITS.text)
		}
	};
}

export function fromItem(i: ItemSource): Prefill {
	return {
		name: cut(i.name, FACE_LIMITS.name),
		type: i.category === 'Arme' ? 'arme' : 'objet',
		rarity: Math.min(5, Math.max(1, i.rarity)),
		sourceKind: 'objet',
		sourceId: i.id,
		face: {
			art: i.icon ? { src: i.icon, large: i.icon, small: i.icon, x: 0, y: 0, zoom: 0.7, fit: 'contain' } : null,
			facts: facts(['Catégorie', CATEGORY_LABELS[i.category] ?? i.category], ['Poids', String(i.weight)]),
			bars: [],
			text: cut(i.description, FACE_LIMITS.text)
		}
	};
}
