import { STAT_KEYS, STATS, statPower, toScale, type StatBlock, type StatKey } from '$lib/game/stats';
import { FLUXES, QUESTIONS, QUOTES } from './quiz-data';

// Calcul du don de flux, repris de la V1 (flux-resultat.php).
// Chaque réponse rapporte des lettres : A–K désignent un dragon, L–Q des entités sans flux.

const LETTER_DRAGON: Record<string, string> = {
	A: 'Aqua',
	C: 'Chronos',
	D: 'Drii',
	E: 'Goliath',
	F: 'Guizamark',
	G: 'Lada',
	H: 'Pestia',
	I: 'Pura',
	J: 'Shizari'
};

// Élémentaires ×2, Pestia ×1,8, rares ×1,6. Artrish, Yinva et les entités ne donnent pas de flux.
const WEIGHTS: Record<string, number> = { A: 2, D: 2, E: 2, G: 2, I: 2, H: 1.8, C: 1.6, F: 1.6, J: 1.6 };

// Le second dragon ne compte que s'il est à 5 points ou moins du premier.
const SECOND_GAP = 5;

export type FluxResult = { first: string; second: string; chaos?: boolean; stats: StatBlock };

const pick = <T>(list: T[], random: () => number) => list[Math.floor(random() * list.length)];

/** Dragons de bénédiction pour les réponses données (indice de la réponse choisie, question par question). */
export function scoreAnswers(answers: number[], random: () => number = Math.random): FluxResult {
	const counts = countLetters(answers);

	// Toujours la réponse la plus absurde : le Chaos répond.
	if (answers.length === QUESTIONS.length && counts.N === QUESTIONS.length)
		return { first: 'Chaos', second: 'Chaos', chaos: true, stats: { ...CHAOS_STATS } };

	const scores = Object.keys(WEIGHTS)
		.map((letter) => ({ letter, score: Math.ceil((counts[letter] ?? 0) * WEIGHTS[letter]) }))
		.sort((a, b) => b.score - a.score);

	const top = scores[0].score;
	const firsts = scores.filter((s) => s.score === top).map((s) => s.letter);

	let first: string;
	let second: string;
	if (firsts.length >= 2) {
		// Ex æquo en tête : deux d'entre eux, au hasard.
		first = pick(firsts, random);
		second = pick(firsts.filter((l) => l !== first), random);
	} else {
		first = firsts[0];
		const rest = scores.filter((s) => s.letter !== first);
		const runnerUp = rest[0].score;
		second =
			top - runnerUp <= SECOND_GAP
				? pick(rest.filter((s) => s.score === runnerUp).map((s) => s.letter), random)
				: first;
	}
	return { first: LETTER_DRAGON[first], second: LETTER_DRAGON[second], stats: drawStats(counts, random) };
}

/** Occurrences de chaque lettre sur l'ensemble des réponses, avant pondération. */
export function countLetters(answers: number[]): Record<string, number> {
	const counts: Record<string, number> = {};
	answers.forEach((choice, i) => {
		for (const letter of QUESTIONS[i]?.answers[choice]?.letters ?? '') counts[letter] = (counts[letter] ?? 0) + 1;
	});
	return counts;
}

// Lettre qui nourrit chaque stat (V1). Vitesse et Intelligence partagent G, Furtivité et Santé J.
const STAT_LETTER: Record<StatKey, string> = {
	maitrise: 'C',
	strength: 'I',
	defense: 'A',
	vitesse: 'G',
	accuracy: 'D',
	perception: 'H',
	furtivite: 'J',
	charisme: 'B',
	eloquence: 'K',
	intelligence: 'G',
	qdf: 'F',
	pv: 'J',
	endurance: 'E'
};

const STAT_MIN = 20;
const STAT_MAX = 60;
// Puissance globale visée, sur l'échelle 0–100 de chaque stat.
const POWER_MIN = 345;
const POWER_MAX = 355;

// Le Chaos ne se plie à aucune borne : valeurs fixes de la V1, déjà à l'échelle du site.
const CHAOS_STATS: StatBlock = {
	maitrise: 78,
	strength: 194,
	defense: 176,
	vitesse: 52,
	accuracy: 97,
	perception: 114,
	furtivite: 114,
	charisme: 105,
	eloquence: 118,
	intelligence: 101,
	qdf: 226,
	pv: 128,
	endurance: 166
};

/**
 * Stats tirées (V1) : lettre × 5, bornées entre 20 et 60, puis ±1 au hasard jusqu'à une puissance
 * globale de 345 à 355. Rendues à l'échelle du site (QdF et Santé ×30, Endurance ×20).
 */
export function drawStats(counts: Record<string, number>, random: () => number = Math.random): StatBlock {
	const raw = Object.fromEntries(
		STAT_KEYS.map((k) => [k, Math.min(STAT_MAX, Math.max(STAT_MIN, (counts[STAT_LETTER[k]] ?? 0) * 5))])
	) as StatBlock;
	let power = STAT_KEYS.reduce((sum, k) => sum + statPower(raw[k]), 0);
	// Toutes à 20 : 130 ; toutes à 60 : 747. La cible est toujours atteignable.
	for (let guard = 0; (power < POWER_MIN || power > POWER_MAX) && guard < 10_000; guard++) {
		const k = STAT_KEYS[Math.floor(random() * STAT_KEYS.length)];
		const next = raw[k] + (power < POWER_MIN ? 1 : -1);
		if (next < STAT_MIN || next > STAT_MAX) continue;
		power += statPower(next) - statPower(raw[k]);
		raw[k] = next;
	}
	return Object.fromEntries(STAT_KEYS.map((k) => [k, raw[k] * STATS[k].scale])) as StatBlock;
}

export const POTENTIAL_AXES = ['Leader', 'Brute', 'Tank', 'Assassin', 'Mage'] as const;
export type PotentialAxis = (typeof POTENTIAL_AXES)[number];

/** Pentagone de potentiel (V1) : chaque axe sur 0–100, où 60 dans les stats concernées vaut 100. */
export function potential(stats: StatBlock): Record<PotentialAxis, number> {
	const s = (k: StatKey) => toScale(k, stats[k]);
	const axis = (...keys: StatKey[]) => Math.floor((100 / 60) * (keys.reduce((sum, k) => sum + s(k), 0) / keys.length));
	return {
		Leader: axis('perception', 'charisme', 'eloquence', 'intelligence'),
		Brute: axis('strength', 'endurance'),
		Tank: axis('pv', 'defense'),
		Assassin: axis('accuracy', 'vitesse', 'furtivite'),
		Mage: axis('maitrise', 'qdf')
	};
}

export type FluxReveal = { dragon: string; name: string; description: string; names: string[]; quote: string };

/** Flux, description et citation du dragon pour un résultat. */
export function revealFlux(result: Pick<FluxResult, 'first' | 'second' | 'chaos'>): FluxReveal {
	if (result.chaos)
		return {
			dragon: 'Chaos',
			name: 'Chaos',
			description: "QUI ES-TU ? POURQUOI ES-TU RENTRÉ DANS MON ANTRE ? SAIS-TU CE QUI T'ATTEND SI TU ME LIBÈRES ?",
			names: ['Mad', 'Ness'],
			quote: QUOTES.Chaos
		};
	const entry = FLUXES.find(
		(f) =>
			(f.dragons[0] === result.first && f.dragons[1] === result.second) ||
			(f.dragons[0] === result.second && f.dragons[1] === result.first)
	)!;
	return {
		dragon: result.first,
		name: entry.name,
		description: entry.description,
		names: entry.names,
		quote: QUOTES[result.first]
	};
}

/** Vrai si le résultat lu (navigateur) désigne bien un flux connu. */
export function isFluxResult(value: unknown): value is FluxResult {
	if (!value || typeof value !== 'object') return false;
	const { first, second, chaos, stats } = value as Record<string, unknown>;
	if (!stats || typeof stats !== 'object') return false;
	if (!STAT_KEYS.every((k) => typeof (stats as Record<string, unknown>)[k] === 'number')) return false;
	if (chaos === true) return true;
	const dragons = Object.values(LETTER_DRAGON);
	return typeof first === 'string' && typeof second === 'string' && dragons.includes(first) && dragons.includes(second);
}
