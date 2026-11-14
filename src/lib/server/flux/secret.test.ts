import { describe, expect, it } from 'vitest';
import { QUESTIONS } from '$lib/flux/quiz-data';
import { RACES } from '$lib/flux/races';
import { SECRET_DOOR, SECRET_PATH } from '$lib/flux/secret';
import { checkSecret } from './secret';

// Les bonnes réponses du chemin (les questions hors chemin prennent la première réponse).
const path = () => {
	const answers: number[] = [];
	for (const step of SECRET_PATH) {
		while (answers.length < step.question - 1) answers.push(0);
		answers.push(QUESTIONS[step.question - 1].answers.findIndex((a) => a.text === step.answer));
	}
	return answers;
};

describe('page secrète, vérifiée par le serveur', () => {
	it('s’ouvre au bout du chemin, derrière la bonne porte', () => {
		expect(checkSecret(SECRET_DOOR, path())).toBe(true);
	});

	it('reste fermée sinon', () => {
		const other = RACES.find((r) => r.id !== SECRET_DOOR)!.id;
		expect(checkSecret(other, path())).toBe(false);
		expect(checkSecret(SECRET_DOOR, path().slice(0, -1))).toBe(false);
		const wrong = path();
		wrong[0] = (wrong[0] + 1) % QUESTIONS[0].answers.length;
		expect(checkSecret(SECRET_DOOR, wrong)).toBe(false);
		expect(checkSecret(SECRET_DOOR, 'n’importe quoi')).toBe(false);
		expect(checkSecret(SECRET_DOOR, [...path().slice(0, -1), 99])).toBe(false);
	});
});
