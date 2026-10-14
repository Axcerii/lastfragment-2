import { describe, expect, it } from 'vitest';
import { emptyStats, parseStatKey, statPower, totalPower } from './stats';
import { armorBonus, computeSheet, parseEffects, passiveBonus, serializeEffects } from './bonus';
import { carryCapacity, formatMoney, isBackpack, toContainer, totalWeight } from './inventory';

describe('puissance', () => {
	it('suit le coût par tranche', () => {
		expect(statPower(0)).toBe(0);
		expect(statPower(25)).toBe(12.5);
		expect(statPower(50)).toBe(37.5);
		expect(statPower(70)).toBe(77.5);
		expect(statPower(80)).toBe(117.5);
		expect(statPower(100)).toBe(277.5);
	});

	it('vaut 3607 quand toutes les stats sont au maximum', () => {
		const max = { ...emptyStats(100), qdf: 3000, pv: 3000, endurance: 2000 };
		expect(totalPower(max)).toBe(3607);
	});
});

describe('lecture des stats', () => {
	it('accepte abréviations, clés et libellés', () => {
		expect(parseStatKey('FOR')).toBe('strength');
		expect(parseStatKey('Précision')).toBe('accuracy');
		expect(parseStatKey('hp')).toBe('pv');
		expect(parseStatKey('n’importe quoi')).toBeNull();
	});
});

describe('effets', () => {
	it('lit les valeurs fixes et les multiplicateurs', () => {
		expect(parseEffects('DEF,VIT', '10,-5', 'flat')).toEqual([
			{ stat: 'defense', kind: 'flat', value: 10 },
			{ stat: 'vitesse', kind: 'flat', value: -5 }
		]);
		expect(parseEffects('FOR,DEF', '1.1,+5', 'mult')).toEqual([
			{ stat: 'strength', kind: 'mult', value: 1.1 },
			{ stat: 'defense', kind: 'flat', value: 5 }
		]);
	});

	it('se réécrit sans perte', () => {
		const effects = parseEffects('FOR,DEF,VIT', 'x1.1,+5,-3', 'mult');
		const { stats, values } = serializeEffects(effects);
		expect(parseEffects(stats, values, 'flat')).toEqual(effects);
	});

	it('ignore les lignes incomplètes', () => {
		expect(parseEffects('FOR,??,DEF', '5', 'flat')).toHaveLength(1);
	});
});

describe('armure', () => {
	const piece = { statistics: 'DEF,VIT,ACC', values: '10,-5,-4' };

	it('additionne les pièces', () => {
		const bonus = armorBonus([piece, piece], emptyStats(10));
		expect(bonus.defense).toBe(20);
		expect(bonus.vitesse).toBe(-10);
	});

	it('ignore le malus de vitesse à 60 de force et de précision à 50', () => {
		const bonus = armorBonus([piece], { ...emptyStats(10), strength: 60, accuracy: 50 });
		expect(bonus.vitesse).toBe(0);
		expect(bonus.accuracy).toBe(0);
		expect(bonus.defense).toBe(10);
	});
});

describe('passifs', () => {
	const base = { ...emptyStats(50), strength: 41 };

	it('applique le multiplicateur arrondi au supérieur quand il est actif', () => {
		const p = { active: true, statistics: 'FOR', maths: '1.1' };
		expect(passiveBonus([p], base).strength).toBe(5);
		expect(passiveBonus([{ ...p, active: false }], base).strength).toBe(0);
	});

	it('applique l’effet inactif s’il existe', () => {
		const alcoolique = { active: false, statistics: 'FOR', maths: '1.05', inactiveMaths: '0.9' };
		expect(passiveBonus([alcoolique], base).strength).toBe(-4);
	});

	it('se cumule avec l’armure dans la fiche', () => {
		const sheet = computeSheet(
			base,
			[{ statistics: 'FOR', values: '3' }],
			[{ active: true, statistics: 'FOR', maths: '1.1' }]
		);
		expect(sheet.strength).toEqual({ base: 41, armor: 3, passive: 5, total: 49 });
	});
});

describe('inventaire', () => {
	it('calcule la capacité de port', () => {
		expect(carryCapacity(0)).toBe(3);
		expect(carryCapacity(59)).toBe(5);
		expect(carryCapacity(60)).toBe(6);
		expect(carryCapacity(60, true)).toBe(12);
	});

	it('reconnaît un sac à dos', () => {
		expect(isBackpack('Sac à Dos')).toBe(true);
		expect(isBackpack('Sac de nourriture')).toBe(false);
	});

	it('ne compte pas l’armure équipée', () => {
		const stack = (weight: number, quantity: number, equipped = false) => ({
			quantity,
			equipped,
			item: { weight }
		});
		expect(totalWeight([stack(2, 3), stack(4, 1, true)])).toBe(6);
	});

	it('range les anciennes localisations dans le coffre', () => {
		expect(toContainer('Inventory')).toBe('coffre');
		expect(toContainer('main')).toBe('main');
	});

	it('arrondit l’argent pour les joueurs', () => {
		expect(formatMoney(950)).toBe('950');
		expect(formatMoney(12600)).toBe('13k');
		expect(formatMoney(12600, true)).toMatch(/^12.600$/);
	});
});

import { checkOptions, generateStats, powerRange, randomName } from './generator';

describe('générateur', () => {
	it('reste dans la fourchette de puissance et les bornes de stats', () => {
		const options = { minPower: 300, maxPower: 450, minStat: 5, maxStat: 100 };
		for (let i = 0; i < 20; i++) {
			const stats = generateStats(options)!;
			const power = totalPower(stats);
			expect(power).toBeGreaterThanOrEqual(300);
			expect(power).toBeLessThanOrEqual(450);
			expect(stats.qdf % 30).toBe(0);
			expect(stats.endurance % 20).toBe(0);
			expect(stats.strength).toBeGreaterThanOrEqual(5);
			expect(stats.strength).toBeLessThanOrEqual(100);
		}
	});

	it('refuse une fourchette impossible', () => {
		const options = { minPower: 3000, maxPower: 3500, minStat: 5, maxStat: 50 };
		expect(checkOptions(options)).toMatch(/de \d+ à \d+/);
		expect(generateStats(options)).toBeNull();
		expect(powerRange(5, 50)).toEqual({ min: 32, max: 487 });
	});

	it('invente des noms capitalisés', () => {
		expect(randomName()).toMatch(/^[A-Z][a-z]+$/);
	});
});
