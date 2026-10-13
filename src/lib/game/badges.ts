import { DRAGONS, type Dragon } from './labels';

/** Clé d'une paire de badges, indépendante de l'ordre (« Aqua:Drii »). */
export function pairKey(a: string, b: string): string {
	return [a, b].sort().join(':');
}

/** Lit la colonne `badges.badges`, où la paire est écrite « Aqua:Drii » (ou avec un autre séparateur). */
export function parsePair(text: string): [Dragon, Dragon] | null {
	const found = text.split(/[^A-Za-z]+/).filter((name): name is Dragon =>
		(DRAGONS as readonly string[]).includes(name)
	);
	return found.length === 2 ? [found[0], found[1]] : null;
}
