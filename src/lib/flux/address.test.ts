import { describe, expect, it } from 'vitest';
import { STAT_KEYS, STATS, type StatBlock } from '$lib/game/stats';
import { ADDRESSES, gendered } from './address';
import { characterDraft } from './character';
import { revealFlux, type FluxResult } from './quiz';
import { FLUXES, QUESTIONS, QUOTES } from './quiz-data';
import { RACES, lineageOf } from './races';

// Tous les textes qui s'adressent au personnage, tels qu'ils sont écrits (« {masculin|féminin} »).
const TEXTS = [
	...QUESTIONS.flatMap((q) => [q.text, ...q.answers.map((a) => a.text)]),
	...FLUXES.flatMap((f) => [f.name, f.description]),
	...Object.values(QUOTES),
	...RACES.flatMap((r) => [r.name, r.motto, r.reveal, r.resultNote ?? ''])
];

const stats = Object.fromEntries(STAT_KEYS.map((k) => [k, 40 * STATS[k].scale])) as StatBlock;

describe('accord au personnage', () => {
	it('garde la forme de gauche au masculin, celle de droite au féminin', () => {
		const text = 'tu te réveilles, {allongé|allongée}, {un voyageur|une voyageuse}';
		expect(gendered(text)).toBe('tu te réveilles, allongé, un voyageur');
		expect(gendered(text, 'elle')).toBe('tu te réveilles, allongée, une voyageuse');
	});

	it('aucune accolade ni barre ne survit, dans un accord comme dans l’autre', () => {
		for (const address of ADDRESSES)
			for (const text of TEXTS) expect(gendered(text, address), text).not.toMatch(/[{}|]/);
	});

	it('chaque flux se décline au féminin', () => {
		for (const flux of FLUXES) {
			expect(gendered(flux.name, 'elle'), flux.name).not.toBe(gendered(flux.name, 'il'));
			expect(gendered(flux.description, 'elle')).toMatch(/^Tu es une descendante /);
		}
	});

	it('le certificat et le personnage s’accordent aussi', () => {
		const fire: FluxResult = { first: 'Drii', second: 'Drii', stats };
		expect(revealFlux(fire, 'elle').name).toBe('Créatrice de Feu');
		expect(revealFlux({ ...fire, first: 'Pura', second: 'Pura' }, 'elle').quote).toMatch(/^Sois forte,/);
		expect(lineageOf(RACES.find((r) => r.id === 'geant')!, true, 'elle').name).toBe('Demi-géante');
		const draft = characterDraft(fire, RACES.find((r) => r.id === 'humain')!, () => 0, 'elle');
		expect(draft.description).toContain('Race : Humaine');
		expect(draft.description).toContain('Flux : Créatrice de Feu (bénédiction de Drii)');
		expect(draft.description).toContain('Tu es une descendante du Dieu des Flammes.');
	});
});
