import { describe, expect, it } from 'vitest';
import { cardDamage, damageMask } from './patterns';

describe('dégâts d’usure', () => {
	it('une carte peu usée n’a ni pli, ni coin', () => {
		const d = cardDamage(12, 0.2);
		expect(d.folds).toHaveLength(0);
		expect(d.corners).toHaveLength(0);
		expect(d.flap).toBeNull();
		expect(damageMask(d)).toBeNull();
	});

	it('les dégâts s’accumulent avec l’usure', () => {
		expect(cardDamage(3, 0.5).folds).toHaveLength(1);
		expect(cardDamage(3, 0.7).folds).toHaveLength(2);
		const ruined = cardDamage(3, 0.95);
		expect(ruined.folds).toHaveLength(3);
		expect(ruined.flap).not.toBeNull();
		expect(ruined.cuts).toHaveLength(1);
		expect(damageMask(ruined)).toContain('evenodd');
	});

	it('un exemplaire garde toujours les mêmes dégâts', () => {
		expect(cardDamage(42, 0.9)).toEqual(cardDamage(42, 0.9));
		expect(cardDamage(42, 0.9)).not.toEqual(cardDamage(43, 0.9));
	});

	it('le verso montre les mêmes dégâts en miroir, sans le rabat du coin', () => {
		const front = cardDamage(7, 0.95);
		const back = cardDamage(7, 0.95, true);
		expect(back.flap).toBeNull();
		expect(back.folds).toHaveLength(front.folds.length);
		const firstX = (d: string) => Number(d.match(/^M(-?[\d.]+)/)![1]);
		expect(firstX(back.corners[0].line)).toBeCloseTo(63 - firstX(front.corners[0].line), 1);
	});
});
