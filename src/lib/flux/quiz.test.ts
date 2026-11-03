import { describe, expect, it } from 'vitest';
import { revealFlux, scoreAnswers } from './quiz';
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
