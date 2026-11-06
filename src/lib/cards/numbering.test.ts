import { describe, expect, it } from 'vitest';
import { checkNumbering, duplicates, gaps, MAX_NUMBER, sequential } from './numbering';

const current = [
	{ id: 1, number: 1 },
	{ id: 2, number: 2 },
	{ id: 3, number: 5 },
	{ id: 4, number: null }
];

describe('numéros des cartes d’une série', () => {
	it('numérote dans l’ordre donné', () => {
		expect(sequential([7, 3, 9])).toEqual([
			{ id: 7, number: 1 },
			{ id: 3, number: 2 },
			{ id: 9, number: 3 }
		]);
	});

	it('repère les doublons et les trous', () => {
		expect([...duplicates([{ id: 1, number: 2 }, { id: 2, number: 2 }, { id: 3, number: null }, { id: 4, number: null }])]).toEqual([2]);
		expect(gaps(current)).toEqual([3, 4]);
		expect(gaps([])).toEqual([]);
	});

	it('ne renvoie que les cartes dont le numéro change', () => {
		const check = checkNumbering(current, [
			{ id: 1, number: 1 },
			{ id: 2, number: 3 },
			{ id: 3, number: 2 },
			{ id: 4, number: null }
		]);
		expect(check).toEqual({ ok: true, changes: [{ id: 2, number: 3 }, { id: 3, number: 2 }] });
	});

	it('accepte d’échanger deux numéros', () => {
		const check = checkNumbering(current, [
			{ id: 1, number: 2 },
			{ id: 2, number: 1 },
			{ id: 3, number: 5 },
			{ id: 4, number: null }
		]);
		expect(check.ok).toBe(true);
	});

	it('refuse les doublons', () => {
		const check = checkNumbering(current, sequential([1, 2, 3, 4]).map((e) => (e.id === 4 ? { id: 4, number: 1 } : e)));
		expect(check).toEqual({ ok: false, error: 'N° en double : 1.' });
	});

	it('refuse les numéros hors limites ou qui ne sont pas des entiers', () => {
		for (const bad of [0, -3, 1.5, MAX_NUMBER + 1, '7', NaN, Infinity, {}]) {
			const proposed = sequential([1, 2, 3, 4]).map((e) => (e.id === 3 ? { id: 3, number: bad } : e));
			expect(checkNumbering(current, proposed).ok).toBe(false);
		}
	});

	it('refuse une carte d’une autre série, une carte oubliée ou en double', () => {
		// Carte étrangère à la série (on ne doit pas pouvoir renuméroter n'importe quel modèle).
		expect(checkNumbering(current, sequential([1, 2, 3, 99])).ok).toBe(false);
		// Une carte de la série manque.
		expect(checkNumbering(current, sequential([1, 2, 3])).ok).toBe(false);
		// Une carte apparaît deux fois.
		expect(checkNumbering(current, sequential([1, 2, 3, 3])).ok).toBe(false);
		// Identifiant sous une autre forme.
		expect(checkNumbering(current, [{ id: '1', number: 1 }, ...sequential([2, 3, 4], 2)]).ok).toBe(false);
	});

	it('refuse ce qui n’est pas une liste', () => {
		for (const bad of [null, undefined, 'abc', 12, { length: 4 }, [null, null, null, null], [1, 2, 3, 4]]) {
			expect(checkNumbering(current, bad).ok).toBe(false);
		}
	});
});
