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

/** Effet lisible : « FOR +5 » pour une valeur fixe, « FOR +10 % » pour un multiplicateur. */
export function describeEffect(effect: Effect): string {
	const stat = STATS[effect.stat].abbr;
	if (effect.kind === 'flat') return `${stat} ${effect.value > 0 ? '+' : ''}${effect.value}`;
	const percent = Math.round((effect.value - 1) * 100);
	return `${stat} ${percent > 0 ? '+' : ''}${percent} %`;
}

/** Effets en cours d'un passif : les siens s'il est actif, ses effets « désactivé » sinon. */
export function passiveEffects(p: {
	active: boolean;
	statistics: string | null;
	maths: string | null;
	inactiveMaths?: string | null;
}): Effect[] {
	return parseEffects(p.statistics, p.active ? p.maths : p.inactiveMaths, 'mult');
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

/** Une étape du calcul d'une stat, affichée au survol : d'où vient la valeur ajoutée. */
export interface Step {
	source: string;
	/** Effet tel qu'écrit : « +5 », « ×1.1 ». */
	effect: string;
	amount: number;
}

export type Steps = Record<StatKey, Step[]>;

const emptySteps = () => Object.fromEntries(STAT_KEYS.map((k) => [k, []])) as unknown as Steps;

function applyEffects(
	target: StatBlock,
	effects: Effect[],
	base: StatBlock,
	source = '',
	steps?: Steps
) {
	for (const e of effects) {
		// Arrondi à l'entier supérieur, comme dans la V1. Le produit est d'abord arrondi à 6 décimales :
		// sans ça, (0.9 − 1) × 40 vaut −3,999… et donnerait −3 au lieu de −4 (et 1.1 × 50, +6 au lieu de +5).
		const amount =
			e.kind === 'flat' ? e.value : Math.ceil(Math.round((e.value - 1) * base[e.stat] * 1e6) / 1e6);
		target[e.stat] += amount;
		const effect = e.kind === 'flat' ? `${e.value >= 0 ? '+' : ''}${e.value}` : `×${e.value}`;
		steps?.[e.stat].push({ source, effect, amount });
	}
}

export interface ArmorPiece {
	name?: string;
	statistics: string | null;
	values: string | null;
}

/** Somme des bonus des pièces d'armure équipées. */
export function armorBonus(pieces: ArmorPiece[], base: StatBlock, steps?: Steps): StatBlock {
	const bonus = emptyStats();
	for (const piece of pieces) {
		const effects = parseEffects(piece.statistics, piece.values, 'flat');
		applyEffects(bonus, effects, base, piece.name ?? 'Armure', steps);
	}
	// Un personnage assez fort ou assez précis ignore la gêne de son armure.
	const ignore = (stat: StatKey, source: string) => {
		if (bonus[stat] >= 0) return;
		steps?.[stat].push({ source, effect: 'gêne ignorée', amount: -bonus[stat] });
		bonus[stat] = 0;
	};
	if (base.strength >= 60) ignore('vitesse', 'Force ≥ 60');
	if (base.accuracy >= 50) ignore('accuracy', 'Précision ≥ 50');
	return bonus;
}

export interface PassiveEffect {
	name?: string;
	active: boolean;
	statistics: string | null;
	maths: string | null;
	inactiveMaths?: string | null;
}

/** Somme des effets des passifs : `maths` s'ils sont actifs, `inactiveMaths` sinon. */
export function passiveBonus(passives: PassiveEffect[], base: StatBlock, steps?: Steps): StatBlock {
	const bonus = emptyStats();
	for (const p of passives) {
		const values = p.active ? p.maths : p.inactiveMaths;
		const source = `${p.name ?? 'Passif'}${p.active ? '' : ' (inactif)'}`;
		applyEffects(bonus, parseEffects(p.statistics, values, 'mult'), base, source, steps);
	}
	return bonus;
}

export interface StatLine {
	base: number;
	armor: number;
	passive: number;
	total: number;
	/** Détail de l'armure puis des passifs, dans l'ordre du calcul. */
	armorSteps: Step[];
	passiveSteps: Step[];
}

export type Sheet = Record<StatKey, StatLine>;

/** Stats finales d'un personnage : base + armure équipée + passifs. */
export function computeSheet(
	base: StatBlock,
	pieces: ArmorPiece[] = [],
	passives: PassiveEffect[] = []
): Sheet {
	const armorSteps = emptySteps();
	const passiveSteps = emptySteps();
	const armor = armorBonus(pieces, base, armorSteps);
	const passive = passiveBonus(passives, base, passiveSteps);
	return Object.fromEntries(
		STAT_KEYS.map((k) => [
			k,
			{
				base: base[k],
				armor: armor[k],
				passive: passive[k],
				total: base[k] + armor[k] + passive[k],
				armorSteps: armorSteps[k],
				passiveSteps: passiveSteps[k]
			}
		])
	) as Sheet;
}

/** Bonus de puissance apporté par les passifs, tel qu'affiché à côté de la puissance totale. */
export function passivePower(sheet: Sheet): number {
	return Math.floor(STAT_KEYS.reduce((sum, k) => sum + sheet[k].passive / STATS[k].scale, 0));
}
