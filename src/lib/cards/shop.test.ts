import { describe, expect, it } from 'vitest';
import {
	checkPicks,
	emptyCriteria,
	fragmentsLabel,
	matchesCriteria,
	parsePrice,
	parseReward,
	priceItems,
	priceLineLabel,
	rewardCardLabel,
	rewardItems,
	suggestCards,
	type CopyFacts,
	type PriceLine
} from './shop';

const copy = (id: number, templateId: number, rarity: number, wear: number, setId: number | null = 1, pinned = false): CopyFacts => ({
	id,
	templateId,
	setId,
	rarity,
	wear,
	pinned
});

const line = (count: number, criteria: Partial<PriceLine> = {}): PriceLine => ({ ...emptyCriteria(), count, ...criteria });

const names = {
	template: (id: number) => ({ 7: 'Lyra' } as Record<number, string>)[id],
	set: (id: number) => ({ 1: 'Arc 1' } as Record<number, string>)[id]
};

describe('boutique : lecture des offres', () => {
	it('lit un prix en points et en cartes', () => {
		const price = parsePrice({ points: 50, cards: [{ count: 2, rarity: 3, rarityUp: true, wear: 'quasi', setId: 1 }] });
		expect(price).toEqual({
			ok: true,
			value: {
				points: 50,
				cards: [{ count: 2, templateId: null, setId: 1, rarity: 3, rarityUp: true, wear: 'quasi', wearUp: false }]
			}
		});
	});

	it('ignore « ou plus » / « ou mieux » sans rareté ni état', () => {
		const price = parsePrice({ cards: [{ count: 1, rarityUp: true, wearUp: true }] });
		expect(price.ok && price.value.cards[0]).toMatchObject({ rarityUp: false, wearUp: false });
	});

	it('refuse les valeurs hors limites ou de mauvais type', () => {
		for (const bad of [
			null,
			[],
			'abc',
			{ points: -1 },
			{ points: 1.5 },
			{ points: '10' },
			{ cards: 'x' },
			{ cards: [{ count: 0 }] },
			{ cards: [{ count: 21 }] },
			{ cards: [{ count: 1, rarity: 6 }] },
			{ cards: [{ count: 1, wear: 'parfaite' }] },
			{ cards: [{ count: 1, wear: '__proto__' }] },
			{ cards: [{ count: 1, templateId: -4 }] },
			{ cards: Array.from({ length: 7 }, () => ({ count: 1 })) }
		]) {
			expect(parsePrice(bad).ok).toBe(false);
		}
	});

	it('lit une récompense et regroupe les boosters d’une même série', () => {
		const reward = parseReward({ points: 0, boosters: 2, held: [{ setId: 3, count: 1 }, { setId: 3, count: 2 }], cards: [] });
		expect(reward).toEqual({ ok: true, value: { points: 0, boosters: 2, held: [{ setId: 3, count: 3 }], cards: [] } });
	});

	it('une carte précise ne garde ni série ni rareté de tirage', () => {
		const reward = parseReward({ cards: [{ count: 1, templateId: 7, setId: 2, rarity: 4, wear: 'neuve' }] });
		expect(reward.ok && reward.value.cards[0]).toEqual({ count: 1, templateId: 7, setId: null, rarity: null, wear: 'neuve' });
	});

	it('refuse une récompense mal formée', () => {
		for (const bad of [
			{ boosters: 51 },
			{ held: [{ setId: 0, count: 1 }] },
			{ held: [{ setId: 2, count: 0 }] },
			{ cards: [{ count: 11 }] },
			{ cards: [{ count: 1, wear: 'x' }] }
		]) {
			expect(parseReward(bad).ok).toBe(false);
		}
	});
});

describe('boutique : cartes qui conviennent', () => {
	it('compare la carte, la série, la rareté et l’état', () => {
		const lyra = copy(1, 7, 3, 0.1); // Rare, Quasi neuve, série 1
		expect(matchesCriteria(emptyCriteria(), lyra)).toBe(true);
		expect(matchesCriteria({ ...emptyCriteria(), templateId: 7 }, lyra)).toBe(true);
		expect(matchesCriteria({ ...emptyCriteria(), templateId: 8 }, lyra)).toBe(false);
		expect(matchesCriteria({ ...emptyCriteria(), setId: 2 }, lyra)).toBe(false);
		expect(matchesCriteria({ ...emptyCriteria(), rarity: 3 }, lyra)).toBe(true);
		expect(matchesCriteria({ ...emptyCriteria(), rarity: 2 }, lyra)).toBe(false);
		expect(matchesCriteria({ ...emptyCriteria(), rarity: 2, rarityUp: true }, lyra)).toBe(true);
		expect(matchesCriteria({ ...emptyCriteria(), rarity: 4, rarityUp: true }, lyra)).toBe(false);
		expect(matchesCriteria({ ...emptyCriteria(), wear: 'quasi' }, lyra)).toBe(true);
		expect(matchesCriteria({ ...emptyCriteria(), wear: 'neuve' }, lyra)).toBe(false);
		expect(matchesCriteria({ ...emptyCriteria(), wear: 'eprouvee', wearUp: true }, lyra)).toBe(true);
		expect(matchesCriteria({ ...emptyCriteria(), wear: 'neuve', wearUp: true }, lyra)).toBe(false);
	});

	it('propose les doubles et les plus usées, garde le meilleur exemplaire et la vitrine', () => {
		const copies = [
			copy(1, 7, 1, 0.05), // meilleur exemplaire de 7 : gardé
			copy(2, 7, 1, 0.6), // double usé : cédé en premier
			copy(3, 8, 1, 0.3, 1, true), // en vitrine
			copy(4, 9, 1, 0.2), // seul exemplaire de 9
			copy(5, 7, 1, 0.2) // autre double
		];
		expect(suggestCards([line(2)], copies)).toEqual([[2, 5]]);
		expect(suggestCards([line(4)], copies)).toEqual([[2, 5, 4, 1]]);
	});

	it('sert la ligne la plus exigeante d’abord', () => {
		const copies = [copy(1, 7, 3, 0.6), copy(2, 8, 1, 0.1)];
		// La ligne large ne doit pas prendre la seule Rare dont la seconde ligne a besoin.
		expect(suggestCards([line(1), line(1, { rarity: 3 })], copies)).toEqual([[2], [1]]);
	});

	it('vérifie les cartes choisies', () => {
		const mine = new Map([copy(1, 7, 3, 0.1), copy(2, 8, 1, 0.5), copy(3, 9, 1, 0.5)].map((c) => [c.id, c]));
		const lines = [line(1, { rarity: 3 }), line(2)];
		expect(checkPicks(lines, [[1], [2, 3]], mine)).toEqual({ ok: true, value: [[1], [2, 3]] });
		expect(checkPicks(lines, [[2], [1, 3]], mine).ok).toBe(false); // une Commune pour la ligne des Rares
		expect(checkPicks(lines, [[1], [2]], mine).ok).toBe(false); // il en manque une
		expect(checkPicks(lines, [[1], [1, 2]], mine).ok).toBe(false); // la même deux fois
		expect(checkPicks(lines, [[1], [2, 99]], mine).ok).toBe(false); // pas à lui
		expect(checkPicks(lines, [[1], ['2', 3]], mine).ok).toBe(false);
		expect(checkPicks(lines, [[1]], mine).ok).toBe(false);
		expect(checkPicks(lines, 'x', mine).ok).toBe(false);
		expect(checkPicks([], undefined, mine)).toEqual({ ok: true, value: [] });
	});
});

describe('boutique : textes', () => {
	it('décrit une ligne de prix', () => {
		expect(priceLineLabel(line(2, { rarity: 3, rarityUp: true, setId: 1, wear: 'quasi', wearUp: true }), names)).toBe(
			'2 cartes Rares ou plus · Arc 1 · Quasi neuve ou mieux'
		);
		expect(priceLineLabel(line(1, { templateId: 7 }), names)).toBe('1 × Lyra');
		expect(priceLineLabel(line(3), names)).toBe('3 cartes au choix');
		expect(priceLineLabel(line(1, { rarity: 5, rarityUp: true, wear: 'neuve', wearUp: true }), names)).toBe('1 carte Unique · Neuve');
	});

	it('compte en fragments, la monnaie de la boutique', () => {
		expect(fragmentsLabel(0)).toBe('0 fragment');
		expect(fragmentsLabel(1)).toBe('1 fragment');
		expect(fragmentsLabel(30)).toBe('30 fragments');
		// Séparateur des milliers à la française (espace insécable).
		expect(fragmentsLabel(1200).replace(/\s/g, ' ')).toBe('1 200 fragments');
	});

	it('décrit une carte reçue', () => {
		expect(rewardCardLabel({ count: 1, templateId: 7, setId: null, rarity: null, wear: 'neuve' }, names)).toBe('1 × Lyra · Neuve');
		expect(rewardCardLabel({ count: 2, templateId: null, setId: 1, rarity: 4, wear: null }, names)).toBe(
			'2 cartes au hasard · Légendaires · Arc 1'
		);
	});
});

describe('boutique : objets montrés', () => {
	it('range la récompense : cartes précises, au hasard, boosters de série, réserve, fragments', () => {
		const items = rewardItems(
			{
				points: 40,
				boosters: 2,
				held: [{ setId: 1, count: 1 }],
				cards: [
					{ count: 3, templateId: null, setId: 1, rarity: 3, wear: null },
					{ count: 1, templateId: 7, setId: null, rarity: null, wear: null }
				]
			},
			names
		);
		expect(items.map((i) => [i.kind, i.count])).toEqual([
			['card', 1],
			['random', 3],
			['pack', 1],
			['booster', 2],
			['fragments', 40]
		]);
		expect(items.map((i) => i.label)).toEqual([
			'1 × Lyra',
			'3 cartes au hasard · Rares · Arc 1',
			'1 booster « Arc 1 »',
			'2 boosters dans ta réserve',
			'40 fragments'
		]);
		expect(rewardItems({ points: 0, boosters: 0, held: [], cards: [] }, names)).toEqual([]);
	});

	it('détaille le prix : fragments puis chaque ligne, avec son rang', () => {
		const items = priceItems({ points: 120, cards: [line(5, { rarity: 3, rarityUp: true }), line(2, { templateId: 7 })] }, names);
		expect(items).toEqual([
			{ kind: 'fragments', count: 120, label: '120 fragments' },
			{ kind: 'criteria', count: 5, label: '5 cartes Rares ou plus', rarity: 3, rarityUp: true, line: 0 },
			{ kind: 'card', count: 2, label: '2 × Lyra', templateId: 7, line: 1 }
		]);
		expect(priceItems({ points: 0, cards: [] }, names)).toEqual([]);
	});
});
