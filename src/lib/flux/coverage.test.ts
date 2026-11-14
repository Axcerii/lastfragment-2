import { describe, expect, it } from 'vitest';
import { countLetters, dragonScores, revealFlux, scoreAnswers } from './quiz';
import { FLUXES, QUESTIONS } from './quiz-data';
import { RACES } from './races';

// Chaque flux doit pouvoir sortir, pour chaque race : on cherche, flux par flux, une suite de
// réponses qui le donne à coup sûr, puis on la passe au vrai calcul (scoreAnswers). Trop de
// combinaisons pour tout essayer (4^18 × 6) : recherche locale, avec un hasard reproductible.

type Answers = number[];

/**
 * Distance au flux visé, 0 quand il sort à coup sûr :
 * - deux dragons X et Y : les autres sous Y, X devant ou à égalité avec Y, et à 5 points au plus ;
 * - flux pur de X : tous les autres à 6 points ou plus derrière X.
 */
function distance(answers: Answers, [x, y]: [string, string], favored: readonly string[]) {
	const scores = dragonScores(countLetters(answers), favored);
	const s = (dragon: string) => scores.find((d) => d.dragon === dragon)!.score;
	const others = scores.filter((d) => d.dragon !== x && d.dragon !== y);
	if (x === y) return others.reduce((sum, d) => sum + Math.max(0, d.score - s(x) + 6), 0);
	return (
		others.reduce((sum, d) => sum + Math.max(0, d.score - s(y) + 1), 0) +
		Math.max(0, s(y) - s(x)) +
		Math.max(0, s(x) - s(y) - 5)
	);
}

function find(target: [string, string], favored: readonly string[], random: () => number): Answers | null {
	for (let restart = 0; restart < 80; restart++) {
		const answers = QUESTIONS.map((q) => Math.floor(random() * q.answers.length));
		let current = distance(answers, target, favored);
		let improved = true;
		while (current > 0 && improved) {
			improved = false;
			for (let qi = 0; qi < QUESTIONS.length; qi++) {
				for (let a = 0; a < QUESTIONS[qi].answers.length; a++) {
					const previous = answers[qi];
					if (a === previous) continue;
					answers[qi] = a;
					const d = distance(answers, target, favored);
					if (d < current) {
						current = d;
						improved = true;
					} else answers[qi] = previous;
				}
			}
		}
		if (current === 0) return answers;
	}
	return null;
}

describe('tous les flux sont atteignables', () => {
	for (const race of RACES) {
		it(race.id, () => {
			let seed = 7;
			const random = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
			const missing: string[] = [];
			for (const flux of FLUXES) {
				const [a, b] = flux.dragons;
				const answers = find([a, b], race.favored ?? [], random) ?? find([b, a], race.favored ?? [], random);
				if (!answers) {
					missing.push(flux.name);
					continue;
				}
				// Le vrai calcul, avec un hasard quelconque : le flux ne dépend pas du tirage.
				const result = scoreAnswers(answers, random, race.favored ?? []);
				expect(revealFlux(result).name, flux.name).toBe(flux.name);
			}
			expect(missing, `flux impossibles pour ${race.id}`).toEqual([]);
		});
	}
});
