import { describe, expect, it, vi } from 'vitest';

vi.mock('../prisma', () => ({ prisma: {} }));

const { checkConstellation, checkCountry } = await import('./discovery');

describe('constellation', () => {
	it('accepte le début de la Genèse et dévoile un indice de plus', () => {
		const result = checkConstellation(['Artrish', 'Yinva']);
		expect(result).toMatchObject({ valid: true, complete: false });
		expect(result.hints).toHaveLength(3);
	});

	it("refuse un dragon hors d'ordre sans donner l'indice suivant", () => {
		const result = checkConstellation(['Artrish', 'Pura']);
		expect(result.valid).toBe(false);
		expect(result.hints).toHaveLength(2);
	});

	it('termine sur les onze dragons', () => {
		const order = ['Artrish', 'Yinva', 'Guizamark', 'Shizari', 'Pestia', 'Chronos', 'Aqua', 'Goliath', 'Drii', 'Lada', 'Pura'] as const;
		expect(checkConstellation([...order])).toMatchObject({ valid: true, complete: true });
	});
});

describe('pays', () => {
	it('ignore majuscules, accents, espaces et tirets', () => {
		expect(checkCountry('edenia', '  Éden ')).not.toBeNull();
		expect(checkCountry('edenia', 'Oiseau-de-paradis')).not.toBeNull();
		expect(checkCountry('irisia', 'IRYS')).not.toBeNull();
		expect(checkCountry('mudan', 'mǔdān')).not.toBeNull();
		expect(checkCountry('mudan', '牡丹')).not.toBeNull();
	});

	it('refuse un mauvais nom et les terres données dès le départ', () => {
		expect(checkCountry('edenia', 'Mudan')).toBeNull();
		expect(checkCountry('augeaime', 'Augeaime')).toBeNull();
	});
});
