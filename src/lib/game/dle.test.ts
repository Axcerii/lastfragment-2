import { describe, expect, it } from 'vitest';
import { compareDescent, compareGuess, computeStats, fluxKind } from './dle';

describe('Lastdle', () => {
	it('classe le flux en invocation, création ou aucun', () => {
		expect(fluxKind('Invocation Armée')).toBe('Invocateur');
		expect(fluxKind('invocation sanguine')).toBe('Invocateur');
		expect(fluxKind('Création Acier')).toBe('Créateur');
		expect(fluxKind('Limaille de Fer')).toBe('Créateur');
		expect(fluxKind('Aucun')).toBe('Aucun');
		expect(fluxKind(' inconnu ')).toBe('Aucun');
		expect(fluxKind(null)).toBe('Aucun');
	});

	it('compare les descendances', () => {
		expect(compareDescent('Goliath-Pura', 'Pura-Goliath')).toBe('right');
		expect(compareDescent('Goliath-Pura', 'Goliath')).toBe('partial');
		expect(compareDescent('Aqua-Lada', 'Lada-Drii')).toBe('partial');
		expect(compareDescent('Aqua', 'Drii')).toBe('wrong');
		expect(compareDescent('Aucun', 'Aucun')).toBe('right');
		expect(compareDescent('Inconnu', 'Inconnu')).toBe('right');
		expect(compareDescent('Aucun', 'Inconnu')).toBe('wrong');
		expect(compareDescent('Aucun', 'Drii')).toBe('wrong');
	});

	it('compare chaque attribut et reconnaît la bonne réponse', () => {
		const answer = { id: 2, flux: 'Invocation Armée', race: 'Humain', country: 'Augeaime', dragon: 'Yinva', job: 'Soldat' };
		const row = compareGuess(
			{ id: 1, name: 'Gora', image: null, flux: 'Création Acier', race: 'Humain', country: 'Mudan', dragon: 'Goliath-Yinva', job: ' soldat ' },
			answer
		);
		expect(row.correct).toBe(false);
		expect(row.kind).toEqual({ label: 'Créateur', status: 'wrong', icon: '/icones/dragons/Artrish.svg' });
		expect(row.country.icon).toBe('/icones/pays/Mudan.svg');
		expect(row.flux).toEqual({ label: 'Création Acier', status: 'wrong' });
		expect(row.race.status).toBe('right');
		expect(row.country.status).toBe('wrong');
		expect(row.dragon.status).toBe('partial');
		expect(row.job.status).toBe('right');
		expect(compareGuess({ ...answer, name: 'Bael', image: null }, answer).correct).toBe(true);
	});

	it('compare vivant et mort', () => {
		const answer = { id: 2, flux: null, race: 'Humain', country: 'Augeaime', dragon: 'Aucun', job: null, dead: true };
		const alive = compareGuess({ ...answer, id: 3, name: 'X', image: null, dead: false }, answer);
		expect(alive.alive).toEqual({ label: 'Vivant', status: 'wrong', icon: '/icones/dragons/Guizamark.svg' });
		const dead = compareGuess({ ...answer, id: 4, name: 'Y', image: null }, answer);
		expect(dead.alive).toEqual({ label: 'Mort', status: 'right', icon: '/icones/dragons/Shizari.svg' });
	});

	it('traite un métier vide comme « Inconnu »', () => {
		const answer = { id: 2, flux: null, race: 'Humain', country: 'Augeaime', dragon: 'Aucun', job: null };
		const row = compareGuess({ ...answer, id: 3, name: 'X', image: null, job: '' }, answer);
		expect(row.job).toEqual({ label: 'Inconnu', status: 'right' });
	});

	it('départage par le flux exact', () => {
		const answer = { id: 2, flux: "Création d'Eau", race: 'Humain', country: 'Augeaime', dragon: 'Aqua', job: null };
		const twin = compareGuess({ ...answer, id: 3, name: 'Adam', image: null, flux: 'Création des flots' }, answer);
		expect(twin.kind.status).toBe('right');
		expect(twin.flux).toEqual({ label: 'Création des flots', status: 'wrong' });
		const same = compareGuess({ ...answer, id: 4, name: 'X', image: null, flux: " création d'eau " }, answer);
		expect(same.flux.status).toBe('right');
	});
});

describe('statistiques du Lastdle', () => {
	it('compte la série en cours et le record', () => {
		const wins = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-10', '2026-10-11'];
		expect(computeStats(wins, '2026-10-11')).toEqual({ wins: 5, streak: 2, best: 3 });
		// Pas encore joué aujourd'hui : la série d'hier tient toujours.
		expect(computeStats(wins, '2026-10-12')).toEqual({ wins: 5, streak: 2, best: 3 });
		expect(computeStats(wins, '2026-10-13').streak).toBe(0);
		expect(computeStats([], '2026-10-13')).toEqual({ wins: 0, streak: 0, best: 0 });
	});

	it('passe les fins de mois', () => {
		expect(computeStats(['2026-10-31', '2026-11-01'], '2026-11-01').streak).toBe(2);
	});
});
