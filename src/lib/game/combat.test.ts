import { describe, expect, it } from 'vitest';
import {
	attackCost,
	attackDamage,
	gaugeAlerts,
	manualDice,
	opposedOutcome,
	opposedThreshold,
	parseDice,
	parseDieValues,
	powerRollBonus,
	rollDice,
	soloOutcome,
	successChance
} from './combat';

describe('attaque', () => {
	it('ajoute le bonus de puissance au jet', () => {
		expect(powerRollBonus(1)).toBe(0);
		expect(powerRollBonus(2)).toBe(5);
		expect(powerRollBonus(3)).toBe(10);
		expect(powerRollBonus(5)).toBe(30);
	});

	it('coûte de la QDF en Maîtrise et de l’END en Force', () => {
		expect(attackCost('maitrise', 1)).toBe(100);
		expect(attackCost('maitrise', 3)).toBe(300);
		expect(attackCost('force', 1)).toBe(50);
		expect(attackCost('force', 3)).toBe(250);
	});

	it('suit la formule de la V1', () => {
		// ((50 + (15 − 10)) × 10 − 40 × 5) × 1 = 350
		expect(attackDamage({ kind: 'force', power: 1, attack: 50, defense: 40, roll: 15 })).toBe(350);
		// Puissance 2 : jet 15 + 5 → ((50 + 10) × 10 − 200) = 400, × 1,5 = 600
		expect(
			attackDamage({ kind: 'force', power: 2, attack: 50, defense: 40, roll: 15, multiplier: 1.5 })
		).toBe(600);
	});

	it('inflige au moins 10 dégâts', () => {
		expect(attackDamage({ kind: 'force', power: 1, attack: 5, defense: 90, roll: 1 })).toBe(10);
	});
});

describe('jet opposé', () => {
	it('calcule le seuil à partir de l’écart des stats', () => {
		expect(opposedThreshold(60, 40)).toBe(30);
		expect(opposedThreshold(40, 60)).toBe(70);
	});

	it('distingue justesse, peu, critiques', () => {
		expect(opposedOutcome(55, 50)).toBe('near-success');
		expect(opposedOutcome(45, 50)).toBe('near-failure');
		expect(opposedOutcome(80, 50)).toBe('success');
		expect(opposedOutcome(20, 50)).toBe('failure');
		expect(opposedOutcome(1, 50)).toBe('critical-failure');
		expect(opposedOutcome(100, 50)).toBe('critical-success');
		// Comme en V1, « de justesse » passe avant le critique.
		expect(opposedOutcome(99, 95)).toBe('near-success');
	});

	it('réussit sans cible si le jet atteint 100 − stat', () => {
		expect(soloOutcome(40, 60)).toBe('success');
		expect(soloOutcome(39, 60)).toBe('failure');
	});

	it('estime la chance de réussite', () => {
		expect(successChance(50)).toBe(51);
		expect(successChance(-20)).toBe(98);
		expect(successChance(150)).toBe(2);
	});
});

describe('alertes de jauges', () => {
	it('se déclenchent au franchissement d’un seuil', () => {
		expect(gaugeAlerts('endurance', 1000, 900, 1000, 'Kael')).toEqual([]);
		expect(gaugeAlerts('endurance', 600, 400, 1000, 'Kael')).toEqual(['Kael commence à fatiguer !']);
		expect(gaugeAlerts('endurance', 400, 100, 1000, 'Kael')).toEqual(['Kael va s\'effondrer !']);
		expect(gaugeAlerts('qdf', 100, 0, 1000, 'Kael')).toEqual(['Kael s\'est évanoui !']);
		expect(gaugeAlerts('pv', 50, -10, 1000, 'Kael')).toEqual(['Kael est K.O.']);
		expect(gaugeAlerts('pv', 0, 200, 1000, 'Kael')).toEqual(['Kael revient à lui !']);
	});
});

describe('dés libres', () => {
	it('lit les formules courantes', () => {
		expect(parseDice('2d6+3')).toEqual({ dice: [{ count: 2, faces: 6, sign: 1 }], modifier: 3 });
		expect(parseDice('d20')).toEqual({ dice: [{ count: 1, faces: 20, sign: 1 }], modifier: 0 });
		expect(parseDice(' 1d100 - 5 ')?.modifier).toBe(-5);
		expect(parseDice('d8+d4')?.dice).toHaveLength(2);
	});

	it('refuse les formules invalides ou démesurées', () => {
		expect(parseDice('')).toBeNull();
		expect(parseDice('12')).toBeNull();
		expect(parseDice('2x6')).toBeNull();
		expect(parseDice('100d6')).toBeNull();
		expect(parseDice('d1')).toBeNull();
	});

	it('additionne les dés et le modificateur', () => {
		const result = rollDice(parseDice('2d6+3')!, () => 0.99);
		expect(result.total).toBe(15);
		expect(result.formula).toBe('2d6+3');
	});
});

describe('arme qui ignore la défense', () => {
	it('retire les points ignorés de la DEF de la cible', () => {
		const base = { kind: 'force', power: 1, attack: 50, defense: 40, roll: 15 } as const;
		expect(attackDamage(base)).toBe(350);
		// 5 DEF ignorés = 25 dégâts de plus.
		expect(attackDamage({ ...base, ignoreDefense: 5 })).toBe(375);
	});

	it('ne fait pas descendre la DEF sous 0', () => {
		const base = { kind: 'force', power: 1, attack: 50, defense: 3, roll: 15 } as const;
		expect(attackDamage({ ...base, ignoreDefense: 5 })).toBe(attackDamage({ ...base, defense: 0 }));
	});
});

describe('jets saisis à la main', () => {
	it('prend une valeur par dé, dans l’ordre', () => {
		const result = manualDice(parseDice('2d6+d4-1')!, [4, 6, 3]);
		expect(result?.total).toBe(12);
		expect(result?.rolls.map((r) => r.faces)).toEqual([6, 6, 4]);
	});

	it('refuse un nombre de valeurs différent ou une valeur impossible', () => {
		expect(manualDice(parseDice('2d6')!, [4])).toBeNull();
		expect(manualDice(parseDice('d20')!, [21])).toBeNull();
		expect(manualDice(parseDice('d20')!, [0])).toBeNull();
	});

	it('lit les valeurs tapées', () => {
		expect(parseDieValues('4 6')).toEqual([4, 6]);
		expect(parseDieValues('4, 6+1')).toEqual([4, 6, 1]);
	});
});
