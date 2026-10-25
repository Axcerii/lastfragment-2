import { describe, expect, it } from 'vitest';
import {
	accrue,
	consume,
	drawBooster,
	drawSlot,
	drawWear,
	isGodPack,
	readRates,
	rollGodPack,
	weightedPick,
	type PoolCard
} from './booster';
import { WEAR_TIERS, wearTier } from './types';

const H = 60 * 60_000;
const rules = { minutes: 8 * 60, max: 3 };

/** Hasard déterministe pour les tests. */
function seeded(seed = 42) {
	let s = seed >>> 0;
	return (max: number) => {
		s = (s * 1664525 + 1013904223) >>> 0;
		return s % max;
	};
}

describe('réserve de boosters', () => {
	it('ajoute un booster toutes les 8 h en gardant le temps entamé', () => {
		const state = accrue({ stock: 0, since: 0 }, rules, 17 * H);
		expect(state.stock).toBe(2);
		expect(state.since).toBe(16 * H);
		expect(state.nextAt).toBe(24 * H);
	});

	it('plafonne à 3 et arrête le compteur', () => {
		const state = accrue({ stock: 1, since: 0 }, rules, 100 * H);
		expect(state).toEqual({ stock: 3, since: 100 * H, nextAt: null });
	});

	it('repart du moment de l’ouverture quand la réserve était pleine', () => {
		const full = accrue({ stock: 3, since: 0 }, rules, 50 * H);
		const after = consume(full, rules, 50 * H);
		expect(after).toEqual({ stock: 2, since: 50 * H, nextAt: 58 * H });
	});

	it('garde la progression quand la réserve n’était pas pleine', () => {
		const state = accrue({ stock: 1, since: 0 }, rules, 3 * H);
		const after = consume(state, rules, 3 * H);
		expect(after).toEqual({ stock: 0, since: 0, nextAt: 8 * H });
	});

	it('n’ajoute rien au-dessus du maximum (don du MJ)', () => {
		const state = accrue({ stock: 5, since: 0 }, rules, 30 * H);
		expect(state.stock).toBe(5);
		expect(state.nextAt).toBeNull();
	});

	it('suit un intervalle modifié', () => {
		const state = accrue({ stock: 0, since: 0 }, { minutes: 60, max: 10 }, 5.5 * H);
		expect(state.stock).toBe(5);
	});
});

describe('tirage', () => {
	const pool: PoolCard[] = [
		{ id: 1, rarity: 1, weight: 10, remaining: null },
		{ id: 2, rarity: 1, weight: 10, remaining: null },
		{ id: 3, rarity: 2, weight: 10, remaining: null },
		{ id: 4, rarity: 3, weight: 10, remaining: null },
		{ id: 5, rarity: 5, weight: 10, remaining: 1 }
	];
	const draw = { count: 5, guaranteed: 3, rates: readRates({}) };

	it('donne le bon nombre de cartes et garantit la rareté de la dernière', () => {
		const random = seeded(7);
		for (let i = 0; i < 200; i++) {
			const ids = drawBooster(pool, draw, random);
			expect(ids).toHaveLength(5);
			const last = pool.find((c) => c.id === ids[4])!;
			expect(last.rarity).toBeGreaterThanOrEqual(3);
		}
	});

	it('ne dépasse jamais un tirage limité', () => {
		const random = seeded(3);
		const onlyRare: PoolCard[] = [{ id: 9, rarity: 5, weight: 10, remaining: 2 }];
		expect(drawBooster(onlyRare, { ...draw, count: 5 }, random)).toEqual([9, 9]);
	});

	it('se rabat sur la plus rare disponible si la garantie est impossible', () => {
		const commons: PoolCard[] = [
			{ id: 1, rarity: 1, weight: 1, remaining: null },
			{ id: 2, rarity: 2, weight: 1, remaining: null }
		];
		const card = drawSlot(commons, 4, [], draw.rates, seeded(1));
		expect(card?.id).toBe(2);
	});

	it('évite les doublons dans un booster quand c’est possible', () => {
		const random = seeded(11);
		const two: PoolCard[] = [
			{ id: 1, rarity: 1, weight: 1, remaining: null },
			{ id: 2, rarity: 1, weight: 1, remaining: null }
		];
		for (let i = 0; i < 50; i++) {
			const ids = drawBooster(two, { count: 2, guaranteed: 1, rates: draw.rates }, random);
			expect(new Set(ids).size).toBe(2);
		}
	});

	it('la garantie remonte à la rareté minimale sans gonfler les plus rares', () => {
		const random = seeded(21);
		const flat: PoolCard[] = [1, 2, 3, 4, 5].map((r) => ({ id: r, rarity: r, weight: 1, remaining: null }));
		const counts: Record<number, number> = {};
		for (let i = 0; i < 20_000; i++) {
			const card = drawSlot(flat, 3, [], draw.rates, random)!;
			counts[card.rarity] = (counts[card.rarity] ?? 0) + 1;
		}
		expect(counts[1] ?? 0).toBe(0);
		expect(counts[2] ?? 0).toBe(0);
		expect(counts[4] / 20_000).toBeCloseTo(0.035, 1);
		expect(counts[3] / 20_000).toBeGreaterThan(0.9);
	});

	it('respecte à peu près les taux', () => {
		const random = seeded(99);
		const counts: Record<number, number> = {};
		const flat: PoolCard[] = [1, 2, 3, 4, 5].map((r) => ({ id: r, rarity: r, weight: 1, remaining: null }));
		for (let i = 0; i < 20_000; i++) {
			const card = drawSlot(flat, 1, [], draw.rates, random)!;
			counts[card.rarity] = (counts[card.rarity] ?? 0) + 1;
		}
		expect(counts[1] / 20_000).toBeCloseTo(0.62, 1);
		expect(counts[2] / 20_000).toBeCloseTo(0.25, 1);
		expect(counts[5] ?? 0).toBeLessThan(400);
	});

	it('pondère les cartes de même rareté', () => {
		const random = seeded(5);
		const items = ['a', 'b'];
		let a = 0;
		for (let i = 0; i < 10_000; i++) if (weightedPick(items, (x) => (x === 'a' ? 9 : 1), random) === 'a') a++;
		expect(a / 10_000).toBeCloseTo(0.9, 1);
	});
});

describe('usure', () => {
	it('reste entre 0 et 1 avec six décimales', () => {
		const random = seeded(2);
		for (let i = 0; i < 2000; i++) {
			const wear = drawWear(random);
			expect(wear).toBeGreaterThanOrEqual(0);
			expect(wear).toBeLessThan(1);
			expect(Math.round(wear * 1e6) / 1e6).toBe(wear);
		}
	});

	it('nomme les tranches', () => {
		expect(wearTier(0.01).label).toBe('Neuve');
		expect(wearTier(0.07).label).toBe('Quasi neuve');
		expect(wearTier(0.999).key).toBe(WEAR_TIERS[4].key);
	});
});

describe('God Pack', () => {
	const pool: PoolCard[] = [
		{ id: 1, rarity: 1, weight: 10, remaining: null },
		{ id: 2, rarity: 2, weight: 10, remaining: null },
		{ id: 3, rarity: 3, weight: 10, remaining: null },
		{ id: 4, rarity: 4, weight: 10, remaining: null },
		{ id: 5, rarity: 4, weight: 10, remaining: null },
		{ id: 6, rarity: 5, weight: 10, remaining: null }
	];
	const draw = { count: 5, guaranteed: 3, rates: readRates({}) };
	const rarity = (id: number) => pool.find((c) => c.id === id)!.rarity;

	it('ne donne que des Légendaires, avec au moins une Unique', () => {
		const random = seeded(11);
		for (let i = 0; i < 200; i++) {
			const rarities = drawBooster(pool, draw, random, true).map(rarity);
			expect(rarities).toHaveLength(5);
			expect(isGodPack(rarities)).toBe(true);
			expect(rarities[4]).toBe(5);
		}
	});

	it('tombe à la chance réglée, jamais à 0 %, toujours à 100 %', () => {
		const random = seeded(5);
		expect(Array.from({ length: 500 }, () => rollGodPack(0, random)).some(Boolean)).toBe(false);
		expect(Array.from({ length: 500 }, () => rollGodPack(100, random)).every(Boolean)).toBe(true);
		const hits = Array.from({ length: 20_000 }, () => rollGodPack(5, random)).filter(Boolean).length;
		expect(hits / 20_000).toBeGreaterThan(0.04);
		expect(hits / 20_000).toBeLessThan(0.06);
	});

	it('reconnaît un God Pack à ses raretés', () => {
		expect(isGodPack([4, 4, 4, 4, 5])).toBe(true);
		expect(isGodPack([4, 4, 4, 4, 4])).toBe(false);
		expect(isGodPack([3, 4, 4, 4, 5])).toBe(false);
		expect(isGodPack([])).toBe(false);
	});
});
