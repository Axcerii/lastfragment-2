import { describe, expect, it } from 'vitest';
import { baseName, instanceName } from './naming';

describe('numérotation des jetons', () => {
	it('retire le numéro', () => {
		expect(baseName('Loup [3]')).toBe('Loup');
		expect(baseName('Loup')).toBe('Loup');
	});

	it('laisse le premier jeton sans numéro', () => {
		expect(instanceName('Serena', ['Aria'])).toEqual({ name: 'Serena', renameFirst: false });
	});

	it('numérote le premier et le deuxième', () => {
		expect(instanceName('Serena', ['Serena'])).toEqual({ name: 'Serena [2]', renameFirst: true });
	});

	it('prend le numéro suivant', () => {
		expect(instanceName('Serena', ['Serena [1]', 'Serena [2]'])).toEqual({
			name: 'Serena [3]',
			renameFirst: false
		});
		// Duplication d'un jeton déjà numéroté, avec un trou laissé par une suppression.
		expect(instanceName('Serena [1]', ['Serena [1]', 'Serena [4]'])).toEqual({
			name: 'Serena [5]',
			renameFirst: false
		});
	});

	it('ignore les noms qui commencent pareil', () => {
		expect(instanceName('Loup', ['Loup garou', 'Loup garou [2]'])).toEqual({
			name: 'Loup',
			renameFirst: false
		});
	});
});
