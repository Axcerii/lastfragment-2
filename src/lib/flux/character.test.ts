import { describe, expect, it } from 'vitest';
import { STAT_KEYS, STATS, type StatBlock } from '$lib/game/stats';
import { characterDraft, readCharacterDraft } from './character';
import { leadingDragon, revealFlux, type FluxResult } from './quiz';
import { QUESTIONS } from './quiz-data';
import { HALF_GIANT_COLOR, lineageOf, raceById } from './races';

const stats = Object.fromEntries(STAT_KEYS.map((k) => [k, 40 * STATS[k].scale])) as StatBlock;
const fire: FluxResult = { first: 'Drii', second: 'Drii', stats };

describe('créer mon personnage', () => {
	it('humain : le flux, le peuple et un prénom du flux', () => {
		const draft = characterDraft(fire, raceById('humain'), () => 0.99);
		expect(revealFlux(fire).names).toContain(draft.name);
		expect(draft.description).toContain('Race : Humain');
		expect(draft.description).toContain('Flux : Créateur de Feu (bénédiction de Drii)');
		expect(draft.stats).toEqual(stats);
	});

	it('géant : aucun flux, le flux trouvé reste caché', () => {
		const draft = characterDraft({ ...fire, first: 'Drii', second: 'Aqua' }, raceById('geant'));
		expect(draft.description).toContain('Race : Géant');
		expect(draft.description).toContain('Flux : Aucun, flux caché : Créateur de Vapeur (bénédiction de Drii et Aqua)');
	});

	it('demi-géant : il canalise le flux', () => {
		const lineage = lineageOf(raceById('geant')!, true);
		expect(lineage).toMatchObject({ name: 'Demi-géant', color: HALF_GIANT_COLOR, hasFlux: true });
		const draft = characterDraft({ ...fire, halfGiant: true }, raceById('geant'));
		expect(draft.description).toContain('Race : Demi-géant');
		expect(draft.description).toContain('Flux : Créateur de Feu');
		expect(draft.description).not.toContain('Aucun');
	});

	it('seul un géant peut être demi-géant', () => {
		expect(lineageOf(raceById('humain')!, true).name).toBe('Humain');
	});

	it('le créateur relit le brouillon, et refuse un brouillon abîmé', () => {
		const draft = characterDraft(fire, raceById('eternelle'));
		expect(readCharacterDraft(JSON.parse(JSON.stringify(draft)))).toEqual(draft);
		expect(readCharacterDraft(null)).toBeNull();
		expect(readCharacterDraft({ ...draft, stats: { ...stats, pv: 'beaucoup' } })).toBeNull();
	});
});

describe('couleur de l’ange', () => {
	it('blanc au départ (aucune réponse)', () => {
		expect(leadingDragon([])).toBeNull();
	});

	it('le dragon seul en tête', () => {
		// Toujours la réponse qui donne Pura (I).
		const answers = QUESTIONS.map((q) => q.answers.findIndex((a) => a.letters.includes('I')));
		expect(leadingDragon(answers)).toBe('Pura');
	});

	it('blanc à égalité', () => {
		// Première question : « Riz » donne D, G et J ; Drii et Lada (×2) sont à égalité.
		const k = QUESTIONS[0].answers.findIndex((a) => a.letters === 'DGJ');
		expect(leadingDragon([k])).toBeNull();
	});
});
