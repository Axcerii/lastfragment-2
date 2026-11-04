import { describe, expect, it } from 'vitest';
import { QUESTIONS } from './quiz-data';
import { SECRET_PATH, onSecretPath, secretComplete, secretTitle } from './secret';

// Les bonnes réponses du chemin, en indices, question par question.
const goodAnswers = () =>
	SECRET_PATH.map((step) => QUESTIONS[step.question - 1].answers.findIndex((a) => a.text === step.answer));

describe('chemin secret', () => {
	it('chaque étape désigne une réponse qui existe, dans l’ordre des questions', () => {
		let previous = 0;
		for (const step of SECRET_PATH) {
			expect(step.question, `question ${step.question}`).toBeGreaterThan(previous);
			expect(step.question).toBeLessThanOrEqual(QUESTIONS.length);
			const texts = QUESTIONS[step.question - 1].answers.map((a) => a.text);
			expect(texts, `question ${step.question}`).toContain(step.answer);
			expect(step.title).toBeTruthy();
			previous = step.question;
		}
	});

	it('la bulle n’apparaît que sur la bonne réponse, chemin suivi jusque-là', () => {
		// Chemin d'exemple sur des questions consécutives depuis la première.
		const good = goodAnswers();
		const first = SECRET_PATH[0];
		expect(secretTitle([], first.question - 1, good[0])).toBe(first.title);
		expect(secretTitle([], first.question - 1, (good[0] + 1) % QUESTIONS[first.question - 1].answers.length)).toBeUndefined();
		if (SECRET_PATH.length > 1 && SECRET_PATH[1].question === 2) {
			const wrong = (good[0] + 1) % QUESTIONS[0].answers.length;
			expect(secretTitle([good[0]], 1, good[1])).toBe(SECRET_PATH[1].title);
			expect(secretTitle([wrong], 1, good[1])).toBeUndefined();
			expect(onSecretPath([wrong])).toBe(false);
		}
	});

	it('la dernière bonne réponse achève le chemin', () => {
		const answers: number[] = [];
		for (const [i, step] of SECRET_PATH.entries()) {
			while (answers.length < step.question - 1) answers.push(0);
			answers.push(goodAnswers()[i]);
			expect(secretComplete(answers)).toBe(i === SECRET_PATH.length - 1);
		}
	});
});
