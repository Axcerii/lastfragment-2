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

export type FluxResult = { first: string; second: string; chaos?: boolean };

const pick = <T>(list: T[], random: () => number) => list[Math.floor(random() * list.length)];

/** Dragons de bénédiction pour les réponses données (indice de la réponse choisie, question par question). */
export function scoreAnswers(answers: number[], random: () => number = Math.random): FluxResult {
	const counts: Record<string, number> = {};
	answers.forEach((choice, i) => {
		for (const letter of QUESTIONS[i]?.answers[choice]?.letters ?? '') counts[letter] = (counts[letter] ?? 0) + 1;
	});

	// Toujours la réponse la plus absurde : le Chaos répond.
	if (answers.length === QUESTIONS.length && counts.N === QUESTIONS.length)
		return { first: 'Chaos', second: 'Chaos', chaos: true };

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
	return { first: LETTER_DRAGON[first], second: LETTER_DRAGON[second] };
}

export type FluxReveal = { dragon: string; name: string; description: string; names: string[]; quote: string };

/** Flux, description et citation du dragon pour un résultat. */
export function revealFlux(result: FluxResult): FluxReveal {
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
	const { first, second, chaos } = value as Record<string, unknown>;
	if (chaos === true) return true;
	const dragons = Object.values(LETTER_DRAGON);
	return typeof first === 'string' && typeof second === 'string' && dragons.includes(first) && dragons.includes(second);
}
