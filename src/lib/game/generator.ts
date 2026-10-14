import { STAT_KEYS, STATS, statPower, totalPower, type StatBlock } from './stats';

// Générateur de stats du créateur de personnage/monstre (le « Mobs Randomizer » de la V1).

export interface GeneratorOptions {
	/** Puissance totale visée. */
	minPower: number;
	maxPower: number;
	/** Bornes de chaque stat, sur l'échelle 0–100 (QDF et HP ×30, END ×20 ensuite). */
	minStat: number;
	maxStat: number;
}

export const PRESETS = {
	Facile: { minPower: 150, maxPower: 300 },
	Normal: { minPower: 300, maxPower: 450 },
	Difficile: { minPower: 450, maxPower: 700 },
	Boss: { minPower: 700, maxPower: 1000 }
} as const;

/** Puissance la plus basse et la plus haute atteignables avec ces bornes de stats. */
export function powerRange(minStat: number, maxStat: number) {
	return {
		min: Math.floor(statPower(minStat) * STAT_KEYS.length),
		max: Math.floor(statPower(maxStat) * STAT_KEYS.length)
	};
}

/** Message d'erreur si les options ne permettent pas de générer, sinon `null`. */
export function checkOptions(o: GeneratorOptions): string | null {
	const values = [o.minPower, o.maxPower, o.minStat, o.maxStat];
	if (values.some((v) => !Number.isFinite(v))) return 'Toutes les valeurs doivent être des nombres.';
	if (o.minStat < 0 || o.minStat > o.maxStat) return 'Le minimum par stat doit être entre 0 et le maximum.';
	if (o.minPower > o.maxPower) return 'La puissance minimale dépasse la maximale.';

	const range = powerRange(o.minStat, o.maxStat);
	if (o.minPower > range.max || o.maxPower < range.min) {
		return `Avec ces bornes, la puissance ne peut aller que de ${range.min} à ${range.max}.`;
	}
	return null;
}

const MAX_TRIES = 50_000;

/**
 * Tire des stats au hasard jusqu'à tomber dans la fourchette de puissance.
 * Renvoie `null` si la fourchette est trop étroite pour être atteinte en un temps raisonnable.
 */
export function generateStats(o: GeneratorOptions, random = Math.random): StatBlock | null {
	if (checkOptions(o)) return null;

	for (let i = 0; i < MAX_TRIES; i++) {
		const stats = Object.fromEntries(
			STAT_KEYS.map((k) => {
				const scaled = o.minStat + Math.floor(random() * (o.maxStat - o.minStat + 1));
				return [k, scaled * STATS[k].scale];
			})
		) as StatBlock;

		const power = totalPower(stats);
		if (power >= o.minPower && power <= o.maxPower) return stats;
	}
	return null;
}

const SYLLABLES = [
	'va', 'yin', 'gi', 'ji', 'za', 'ma', 'shi', 'ri', 'se', 'pe', 'tia', 'ti', 'kro', 'no', 'so',
	'ro', 'a', 'ku', 'go', 'li', 'lia', 'du', 'ry', 'la', 'da', 'pu', 'ra', 're', 'na', 'to', 'wa',
	'sel', 'lu', 'ci', 'fer', 'po'
];
// Une syllabe rarement, deux le plus souvent, trois parfois.
const LENGTHS = [1, 2, 2, 2, 2, 2, 2, 3, 3, 3];

/** Nom inventé à partir de syllabes aux sonorités des dragons. */
export function randomName(random = Math.random): string {
	const pick = <T>(list: readonly T[]) => list[Math.floor(random() * list.length)];
	const name = Array.from({ length: pick(LENGTHS) }, () => pick(SYLLABLES)).join('');
	return name.charAt(0).toUpperCase() + name.slice(1);
}
