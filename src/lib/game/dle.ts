// Lastdle : un personnage à deviner chaque jour, à la manière de LoLdle.
// Chaque essai est comparé au personnage du jour, attribut par attribut.

import { COUNTRY_LABELS, countryIcon, isUnknownDescent, parseDragons, RACE_LABELS, type Dragon } from './labels';

/** Identique (Guizamark), en partie (Lada, descendance seulement), rien en commun (Chronos). */
export type DleStatus = 'right' | 'partial' | 'wrong';

export interface DleCharacter {
	flux: string | null;
	race: string;
	country: string;
	dragon: string;
	job: string | null;
	/** Absent : compté comme vivant. */
	dead?: boolean;
}

export interface DleCell {
	label: string;
	status: DleStatus;
	/** Symbole affiché avec le libellé (dragon du type de flux, emblème du pays). */
	icon?: string;
}

export interface DleRow {
	id: number;
	name: string;
	image: string | null;
	correct: boolean;
	kind: DleCell;
	race: DleCell;
	country: DleCell;
	alive: DleCell;
	dragon: DleCell & { dragons: Dragon[] };
	job: DleCell;
	flux: DleCell;
}

/** Le flux exact vient en dernier : rarement partagé, il départage les personnages trop semblables. */
/** `short` : titre des cases sur mobile, où la place manque. */
export const DLE_COLUMNS = [
	{ key: 'kind', label: 'Type de flux', short: 'Type' },
	{ key: 'race', label: 'Race', short: 'Race' },
	{ key: 'country', label: 'Pays', short: 'Pays' },
	{ key: 'alive', label: 'Statut', short: 'Statut' },
	{ key: 'dragon', label: 'Descendance', short: 'Dragons' },
	{ key: 'job', label: 'Métier', short: 'Métier' },
	{ key: 'flux', label: 'Flux', short: 'Flux' }
] as const;

const fold = (text: string | null | undefined) =>
	(text ?? '')
		.trim()
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '');

export type FluxKind = 'Invocateur' | 'Créateur' | 'Aucun';

/**
 * Un flux qui mentionne « Invocation » fait un invocateur ; sans flux connu (« Aucun », « Inconnu »,
 * vide), « Aucun » ; tous les autres, un créateur.
 */
export function fluxKind(flux: string | null | undefined): FluxKind {
	const text = fold(flux);
	if (!text || text === 'aucun' || text === 'inconnu') return 'Aucun';
	return text.includes('invocation') ? 'Invocateur' : 'Créateur';
}

/** Les créateurs portent le symbole d'Artrish, les invocateurs celui de Yinva. */
const KIND_DRAGONS: Partial<Record<FluxKind, Dragon>> = { Créateur: 'Artrish', Invocateur: 'Yinva' };

// Copies des symboles recadrées sur leur dessin (static/icones) : les originaux gardent une large
// marge, sur laquelle le reste du site est réglé.
export const dragonIcon = (dragon: string) => `/icones/dragons/${dragon}.svg`;
const countryGlyph = (country: string) => countryIcon(country).replace('/pays/', '/icones/pays/');

/** Métier affiché ; sans métier renseigné, « Inconnu ». */
export function jobLabel(job: string | null | undefined): string {
	return job?.trim() || 'Inconnu';
}

/** Flux exact affiché ; sans flux renseigné, « Inconnu ». */
export function fluxLabel(flux: string | null | undefined): string {
	return flux?.trim() || 'Inconnu';
}

const same = (a: string, b: string): DleStatus => (fold(a) === fold(b) ? 'right' : 'wrong');

/** Vert : les mêmes dragons. Orange : au moins un dragon commun. Rouge : aucun. */
export function compareDescent(guess: string, answer: string): DleStatus {
	const [mine, theirs] = [parseDragons(guess), parseDragons(answer)];
	if (!mine.length || !theirs.length) {
		// Sans dragon des deux côtés, « Aucun » et « Inconnu » restent deux réponses différentes.
		return !mine.length && !theirs.length && isUnknownDescent(guess) === isUnknownDescent(answer)
			? 'right'
			: 'wrong';
	}
	const shared = mine.filter((d) => theirs.includes(d)).length;
	if (shared === mine.length && shared === theirs.length) return 'right';
	return shared > 0 ? 'partial' : 'wrong';
}

function descentLabel(descent: string, dragons: Dragon[]): string {
	if (dragons.length) return dragons.join(' · ');
	return isUnknownDescent(descent) ? 'Inconnu' : 'Aucun';
}

/** Compare un essai au personnage du jour. */
export function compareGuess(
	guess: DleCharacter & { id: number; name: string; image: string | null },
	answer: DleCharacter & { id: number }
): DleRow {
	const dragons = parseDragons(guess.dragon);
	const kind = fluxKind(guess.flux);
	const job = jobLabel(guess.job);
	const flux = fluxLabel(guess.flux);
	return {
		id: guess.id,
		name: guess.name,
		image: guess.image,
		correct: guess.id === answer.id,
		kind: {
			label: kind,
			status: same(kind, fluxKind(answer.flux)),
			icon: KIND_DRAGONS[kind] && dragonIcon(KIND_DRAGONS[kind])
		},
		race: { label: RACE_LABELS[guess.race] ?? guess.race, status: same(guess.race, answer.race) },
		country: {
			label: COUNTRY_LABELS[guess.country] ?? guess.country,
			status: same(guess.country, answer.country),
			icon: countryGlyph(guess.country)
		},
		alive: {
			label: guess.dead ? 'Mort' : 'Vivant',
			status: Boolean(guess.dead) === Boolean(answer.dead) ? 'right' : 'wrong',
			// La mort porte le symbole de Shizari, la vie celui de Guizamark.
			icon: dragonIcon(guess.dead ? 'Shizari' : 'Guizamark')
		},
		dragon: {
			label: descentLabel(guess.dragon, dragons),
			dragons,
			status: compareDescent(guess.dragon, answer.dragon)
		},
		job: { label: job, status: same(job, jobLabel(answer.job)) },
		flux: { label: flux, status: same(flux, fluxLabel(answer.flux)) }
	};
}

/** Jour précédent d'une date AAAA-MM-JJ. */
export function previousDay(date: string): string {
	return new Date(Date.parse(`${date}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
}

export interface DleStats {
	wins: number;
	/** Jours gagnés d'affilée, jusqu'à aujourd'hui ou hier (la série tient tant que la journée n'est pas finie). */
	streak: number;
	best: number;
}

/** Statistiques d'un joueur à partir des dates de ses victoires. */
export function computeStats(winDates: string[], today: string): DleStats {
	const dates = [...new Set(winDates)].sort();
	let best = 0;
	let run = 0;
	for (let i = 0; i < dates.length; i++) {
		run = i > 0 && previousDay(dates[i]) === dates[i - 1] ? run + 1 : 1;
		best = Math.max(best, run);
	}
	const last = dates.at(-1);
	const alive = last === today || last === previousDay(today);
	return { wins: dates.length, streak: alive ? run : 0, best };
}
