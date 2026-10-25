import { describe, expect, it } from 'vitest';
import { line, paragraph } from './text';

describe('textes des cartes', () => {
	it('garde les retours à la ligne en tête du texte (espace avec la citation)', () => {
		expect(paragraph('\n\nIl était une fois', 100)).toBe('\n\nIl était une fois');
		expect(paragraph('  \nTexte  \n\n  ', 100)).toBe('\nTexte');
	});

	it('borne toujours le nombre de retours à la ligne', () => {
		// Au-delà de six, les retours deviennent des espaces.
		expect(paragraph('\n'.repeat(10) + 'x', 100)).toBe('\n'.repeat(6) + ' x');
	});

	it('une ligne reste sur une ligne', () => {
		expect(line('  a\n\nb  ', 10)).toBe('a b');
	});
});
