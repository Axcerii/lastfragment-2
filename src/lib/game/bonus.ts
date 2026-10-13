import { STAT_KEYS, STATS, emptyStats, parseStatKey, type StatBlock, type StatKey } from './stats';

// Un effet sur une stat : valeur fixe (+10) ou multiplicateur (×1.1).
export interface Effect {
	stat: StatKey;
	kind: 'flat' | 'mult';
	value: number;
}

/**
 * Lit les deux colonnes parallèles « stats » / « valeurs » (ex. `DEF,VIT` et `10,-5`).
 *
 * Format d'une valeur :
 * - `x1.1` ou `*1.1` : multiplicateur
 * - `+5` ou `-5` : valeur fixe
 * - nombre nu : dépend de `bareAs` (fixe pour une armure, multiplicateur pour un passif)
 */
export function parseEffects(
	stats: string | null | undefined,
	values: string | null | undefined,
	bareAs: Effect['kind']
): Effect[] {
	const names = (stats ?? '').split(',').map((s) => s.trim());
	const raws = (values ?? '').split(',').map((s) => s.trim());
	const effects: Effect[] = [];

	names.forEach((name, i) => {
		const stat = parseStatKey(name);
		const raw = raws[i];
		if (!stat || !raw) return;

		let kind = bareAs;
		let text = raw.replace(',', '.');
		if (/^[x*×]/i.test(text)) {
			kind = 'mult';
			text = text.slice(1);
		} else if (/^[+-]/.test(text)) {
			kind = 'flat';
		}
		const value = Number(text);
		if (Number.isFinite(value)) effects.push({ stat, kind, value });
	});
	return effects;
}

/** Opération inverse de `parseEffects`, pour enregistrer depuis un formulaire. */
export function serializeEffects(effects: Effect[]): { stats: string; values: string } {
	return {
		stats: effects.map((e) => STATS[e.stat].abbr).join(','),
		values: effects
			.map((e) => (e.kind === 'mult' ? `x${e.value}` : `${e.value >= 0 ? '+' : ''}${e.value}`))
			.join(',')
	};
}

function applyEffects(target: StatBlock, effects: Effect[], base: StatBlock) {
	for (const e of effects) {
		// Arrondi à l'entier supérieur, comme dans la V1.
		target[e.stat] += e.kind === 'flat' ? e.value : Math.ceil((e.value - 1) * base[e.stat]);
	}
}

export interface ArmorPiece {
	statistics: string | null;
	values: string | null;
}

/** Somme des bonus des pièces d'armure équipées. */
export function armorBonus(pieces: ArmorPiece[], base: StatBlock): StatBlock {
	const bonus = emptyStats();
	for (const piece of pieces) {
		applyEffects(bonus, parseEffects(piece.statistics, piece.values, 'flat'), base);
	}
	// Un personnage assez fort ou assez précis ignore la gêne de son armure.
	if (base.strength >= 60 && bonus.vitesse < 0) bonus.vitesse = 0;
	if (base.accuracy >= 50 && bonus.accuracy < 0) bonus.accuracy = 0;
	return bonus;
}

export interface PassiveEffect {
	active: boolean;
	statistics: string | null;
	maths: string | null;
	inactiveMaths?: string | null;
}

/** Somme des effets des passifs : `maths` s'ils sont actifs, `inactiveMaths` sinon. */
export function passiveBonus(passives: PassiveEffect[], base: StatBlock): StatBlock {
	const bonus = emptyStats();
	for (const p of passives) {
		const values = p.active ? p.maths : p.inactiveMaths;
		applyEffects(bonus, parseEffects(p.statistics, values, 'mult'), base);
	}
	return bonus;
}

export interface StatLine {
	base: number;
	armor: number;
	passive: number;
	total: number;
}

export type Sheet = Record<StatKey, StatLine>;

/** Stats finales d'un personnage : base + armure équipée + passifs. */
export function computeSheet(
	base: StatBlock,
	pieces: ArmorPiece[] = [],
	passives: PassiveEffect[] = []
): Sheet {
	const armor = armorBonus(pieces, base);
	const passive = passiveBonus(passives, base);
	return Object.fromEntries(
		STAT_KEYS.map((k) => [
			k,
			{ base: base[k], armor: armor[k], passive: passive[k], total: base[k] + armor[k] + passive[k] }
		])
	) as Sheet;
}

/** Bonus de puissance apporté par les passifs, tel qu'affiché à côté de la puissance totale. */
export function passivePower(sheet: Sheet): number {
	return Math.floor(STAT_KEYS.reduce((sum, k) => sum + sheet[k].passive / STATS[k].scale, 0));
}
