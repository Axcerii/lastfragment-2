import { describe, expect, it } from 'vitest';
import { gaugeRatio } from './gauges';

describe('gaugeRatio', () => {
	it('proportion de la jauge', () => {
		expect(gaugeRatio({ current: 50, max: 200 })).toBe(0.25);
		expect(gaugeRatio({ current: 0, max: 200 })).toBe(0);
		expect(gaugeRatio({ ratio: 0.4 })).toBe(0.4);
	});

	it('pas de jauge sans maximum : une fiche sans PV n’est pas K.O.', () => {
		expect(gaugeRatio({ current: 0, max: 0 })).toBeNull();
		expect(gaugeRatio(null)).toBeNull();
	});
});
