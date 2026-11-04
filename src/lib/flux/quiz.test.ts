import { describe, expect, it } from 'vitest';
import { STAT_KEYS, STATS, statPower, toScale, type StatBlock } from '$lib/game/stats';
import { potential, revealFlux, scoreAnswers } from './quiz';
import { FLUXES, QUESTIONS } from './quiz-data';

// Indice de la réponse qui contient une lettre donnée, question par question.
const answersWith = (letter: string) =>
	QUESTIONS.map((q) => Math.max(0, q.answers.findIndex((a) => a.letters.includes(letter))));

describe('test de flux', () => {
	it('chaque paire de dragons a son flux', () => {
		expect(FLUXES).toHaveLength(45);
		const dragons = ['Aqua', 'Chronos', 'Drii', 'Goliath', 'Guizamark', 'Lada', 'Pestia', 'Pura', 'Shizari'];
		for (const a of dragons) for (const b of dragons) expect(revealFlux({ first: a, second: b }).name).toBeTruthy();
	});

	it('toujours Pura : Créateur de Force Pure', () => {
		const result = scoreAnswers(answersWith('I'), () => 0);
		expect(result.first).toBe('Pura');
		expect(revealFlux(result).quote).toBeTruthy();
	});

	it('ne désigne jamais Artrish, Yinva ni une entité', () => {
		for (const letter of ['B', 'K', 'L', 'O']) {
			const { first, second } = scoreAnswers(answersWith(letter), Math.random);
			for (const d of [first, second]) expect(['Artrish', 'Yinva', undefined]).not.toContain(d);
		}
	});
});

describe('certificat de flux', () => {
	it('stats bornées à 20–60 et puissance globale entre 345 et 355', () => {
		for (const letter of ['A', 'C', 'G', 'J', 'B']) {
			const { stats } = scoreAnswers(answersWith(letter));
			for (const k of STAT_KEYS) {
				const raw = toScale(k, stats[k]);
				expect(raw).toBeGreaterThanOrEqual(20);
				expect(raw).toBeLessThanOrEqual(60);
			}
			const power = STAT_KEYS.reduce((sum, k) => sum + statPower(toScale(k, stats[k])), 0);
			expect(power).toBeGreaterThanOrEqual(345);
			expect(power).toBeLessThanOrEqual(355);
		}
	});

	it('le Chaos garde ses stats fixes', () => {
		const chaos = QUESTIONS.map((q) => q.answers.findIndex((a) => a.letters.includes('N')));
		const result = scoreAnswers(chaos);
		expect(result.chaos).toBe(true);
		expect(result.stats.strength).toBe(194);
		expect(result.stats.qdf).toBe(226);
	});

	it('pentagone : 60 partout vaut 100 sur chaque axe', () => {
		const stats = Object.fromEntries(STAT_KEYS.map((k) => [k, 60 * STATS[k].scale])) as StatBlock;
		expect(Object.values(potential(stats))).toEqual([100, 100, 100, 100, 100]);
	});
});
