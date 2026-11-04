// Numéros des cartes dans une série (le « 012 » de « 012/120 »), sans base de données :
// partagé entre l'écran de numérotation du MJ et le serveur, testé dans numbering.test.ts.

export const MAX_NUMBER = 9999;

export interface NumberEntry {
	id: number;
	/** null : la carte n'a pas de numéro (pas de case dans l'album). */
	number: number | null;
}

/** 1, 2, 3… dans l'ordre donné. */
export function sequential(ids: number[], start = 1): NumberEntry[] {
	return ids.map((id, i) => ({ id, number: start + i }));
}

/** Numéros présents plusieurs fois. */
export function duplicates(entries: NumberEntry[]): Set<number> {
	const seen = new Set<number>();
	const twice = new Set<number>();
	for (const { number } of entries) {
		if (number === null) continue;
		if (seen.has(number)) twice.add(number);
		seen.add(number);
	}
	return twice;
}

/** Numéros manquants entre 1 et le plus grand utilisé. */
export function gaps(entries: NumberEntry[]): number[] {
	const used = new Set(entries.map((e) => e.number).filter((n): n is number => n !== null));
	const max = Math.max(0, ...used);
	const missing: number[] = [];
	for (let n = 1; n <= max; n++) if (!used.has(n)) missing.push(n);
	return missing;
}

export type NumberingCheck = { ok: true; changes: NumberEntry[] } | { ok: false; error: string };

/**
 * Vérifie une numérotation proposée pour toute une série. `current` : les modèles de la série
 * avec leur numéro enregistré. La proposition doit les contenir tous, une fois chacun et rien
 * d'autre, avec des numéros entiers de 1 à 9999 sans doublon (ou vides). Renvoie les seuls
 * modèles dont le numéro change.
 */
export function checkNumbering(current: NumberEntry[], proposed: unknown): NumberingCheck {
	if (!Array.isArray(proposed)) return { ok: false, error: 'Numérotation illisible.' };
	if (proposed.length !== current.length) {
		return { ok: false, error: 'La série a changé entre-temps : recharge la page.' };
	}
	const before = new Map(current.map((e) => [e.id, e.number]));
	const seen = new Set<number>();
	const entries: NumberEntry[] = [];
	for (const raw of proposed) {
		if (!raw || typeof raw !== 'object') return { ok: false, error: 'Numérotation illisible.' };
		const { id, number } = raw as Record<string, unknown>;
		if (typeof id !== 'number' || !before.has(id) || seen.has(id)) {
			return { ok: false, error: 'La série a changé entre-temps : recharge la page.' };
		}
		seen.add(id);
		if (number !== null && !(Number.isInteger(number) && (number as number) >= 1 && (number as number) <= MAX_NUMBER)) {
			return { ok: false, error: `Les numéros vont de 1 à ${MAX_NUMBER}.` };
		}
		entries.push({ id, number: number as number | null });
	}
	const twice = duplicates(entries);
	if (twice.size) {
		const list = [...twice].sort((a, b) => a - b).join(', ');
		return { ok: false, error: `N° en double : ${list}.` };
	}
	return { ok: true, changes: entries.filter((e) => before.get(e.id) !== e.number) };
}
