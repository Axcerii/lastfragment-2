// Règles de combat de la V1 (simulateur de combat) : attaque au d20, jet opposé au d100,
// seuils d'alerte des jauges, et dés libres pour la table de jeu.
import { STATS, type StatKey } from './stats';

export type Rng = () => number;

/** Lance un dé à `faces` faces (1 à faces). */
export function rollDie(faces: number, rng: Rng = Math.random): number {
	return Math.floor(rng() * faces) + 1;
}

// ─── Attaque ─────────────────────────────────────────────────────────────────

export type AttackKind = 'force' | 'maitrise';

export const ATTACK_STAT: Record<AttackKind, StatKey> = { force: 'strength', maitrise: 'maitrise' };
/** Jauge dépensée par l'attaquant : END pour la Force, QDF pour la Maîtrise. */
export const ATTACK_COST_STAT: Record<AttackKind, 'endurance' | 'qdf'> = { force: 'endurance', maitrise: 'qdf' };

export const MAX_ATTACK_POWER = 30;

/** Bonus ajouté au d20 selon la puissance de l'attaque : 1 → 0, 2 → +5, n → +10 × (n − 2). */
export function powerRollBonus(power: number): number {
	if (power <= 1) return 0;
	if (power === 2) return 5;
	return 10 * (power - 2);
}

/** Coût de l'attaque en points bruts : Maîtrise → puissance × 100 QDF, Force → (puissance − 1) × 100 + 50 END. */
export function attackCost(kind: AttackKind, power: number): number {
	return kind === 'maitrise' ? power * 100 : (power - 1) * 100 + 50;
}

export interface AttackInput {
	kind: AttackKind;
	power: number;
	/** FOR ou MDF de l'attaquant, armure et passifs compris. */
	attack: number;
	/** DEF de la cible, armure et passifs compris. */
	defense: number;
	roll: number;
	multiplier?: number;
	attackBonus?: number;
	defenseBonus?: number;
	/** Points de DEF de la cible ignorés (bonus d'arme). La DEF ne descend pas sous 0. */
	ignoreDefense?: number;
}

export const MIN_DAMAGE = 10;

/** DEF de la cible qui compte vraiment dans l'attaque : bonus du MJ ajouté, points ignorés retirés. */
export function effectiveDefense(input: Pick<AttackInput, 'defense' | 'defenseBonus' | 'ignoreDefense'>): number {
	const defense = input.defense + (input.defenseBonus ?? 0);
	if (!input.ignoreDefense) return defense;
	return Math.max(0, defense - input.ignoreDefense);
}

/** Dégâts = ((attaque + (jet − 10)) × 10 − défense × 5) × multiplicateur, 10 au minimum. */
export function attackDamage(input: AttackInput): number {
	const attack = input.attack + (input.attackBonus ?? 0);
	const defense = effectiveDefense(input);
	const roll = input.roll + powerRollBonus(input.power);
	const damage = ((attack + (roll - 10)) * 10 - defense * 5) * (input.multiplier ?? 1);
	return Math.max(MIN_DAMAGE, Math.round(damage));
}

// ─── Jet opposé (d100) ───────────────────────────────────────────────────────

/** Stat opposée proposée par défaut, comme dans le simulateur V1. */
export const OPPOSED_STAT: Record<StatKey, StatKey> = {
	qdf: 'qdf',
	pv: 'pv',
	endurance: 'endurance',
	maitrise: 'strength',
	strength: 'strength',
	defense: 'strength',
	accuracy: 'vitesse',
	vitesse: 'accuracy',
	perception: 'furtivite',
	furtivite: 'perception',
	charisme: 'perception',
	eloquence: 'eloquence',
	intelligence: 'intelligence'
};

export type Outcome =
	| 'critical-failure'
	| 'failure'
	| 'near-failure'
	| 'near-success'
	| 'success'
	| 'critical-success';

export const OUTCOME_LABELS: Record<Outcome, string> = {
	'critical-failure': 'Échec critique',
	failure: 'Raté',
	'near-failure': 'Raté de peu',
	'near-success': 'Réussi de justesse',
	success: 'Réussi',
	'critical-success': 'Réussite critique'
};

export function isSuccess(outcome: Outcome): boolean {
	return outcome === 'near-success' || outcome === 'success' || outcome === 'critical-success';
}

/** Seuil à atteindre au d100 : 50 − (stat de l'exécutant − stat de la cible). */
export function opposedThreshold(own: number, target: number): number {
	return 50 - (own - target);
}

/**
 * Résultat d'un jet opposé. Mêmes priorités que la V1 : « de justesse » passe avant
 * les critiques, puis réussite ou échec franc.
 */
export function opposedOutcome(roll: number, threshold: number): Outcome {
	if (roll >= threshold && roll <= threshold + 10) return 'near-success';
	if (roll <= 2) return 'critical-failure';
	if (roll >= 99) return 'critical-success';
	if (roll < threshold && roll >= threshold - 10) return 'near-failure';
	return roll >= threshold ? 'success' : 'failure';
}

/** Jet sans cible : réussi si le d100 atteint 100 − stat. Les critiques restent possibles. */
export function soloOutcome(roll: number, stat: number): Outcome {
	if (roll <= 2) return 'critical-failure';
	if (roll >= 99) return 'critical-success';
	return roll >= 100 - stat ? 'success' : 'failure';
}

/** Chance de réussite d'un jet au d100 contre un seuil, en pourcentage (critiques compris). */
export function successChance(threshold: number): number {
	const needed = Math.min(99, Math.max(3, Math.ceil(threshold)));
	return 101 - needed;
}

// ─── Jauges ──────────────────────────────────────────────────────────────────

export const GAUGES = ['pv', 'qdf', 'endurance'] as const;
export type Gauge = (typeof GAUGES)[number];

/**
 * Messages déclenchés quand une jauge franchit un seuil (50 %, 20 %, 0 ; K.O. pour les PV).
 * On compare l'ancienne et la nouvelle valeur, donc chaque seuil ne se déclenche qu'au passage.
 */
export function gaugeAlerts(gauge: Gauge, before: number, after: number, max: number, name: string): string[] {
	const alerts: string[] = [];
	const crossed = (limit: number) => before >= limit && after < limit;
	const crossedZero = before > 0 && after <= 0;

	if (gauge === 'pv') {
		if (crossedZero) alerts.push(`${name} est K.O.`);
		else if (before <= 0 && after > 0) alerts.push(`${name} revient à lui !`);
		return alerts;
	}
	if (max <= 0) return alerts;

	const texts =
		gauge === 'endurance'
			? [`${name} commence à fatiguer !`, `${name} va s'effondrer !`, `${name} s'est effondré de fatigue…`]
			: [
					`Le flux de ${name} commence à s'estomper !`,
					`La quantité de flux de ${name} est critique !`,
					`${name} s'est évanoui !`
				];
	if (crossedZero) alerts.push(texts[2]);
	else if (crossed(max / 5)) alerts.push(texts[1]);
	else if (crossed(max / 2)) alerts.push(texts[0]);
	return alerts;
}

// ─── Dés libres ──────────────────────────────────────────────────────────────

export interface DiceTerm {
	count: number;
	faces: number;
	sign: 1 | -1;
}

export interface DiceFormula {
	dice: DiceTerm[];
	modifier: number;
}

const MAX_DICE = 50;
const MAX_FACES = 1000;

/** Lit une formule du type `2d6+3`, `d20`, `1d100 - 5`, `d8+d4`. Renvoie `null` si elle est invalide. */
export function parseDice(text: string): DiceFormula | null {
	const clean = text.toLowerCase().replace(/\s+/g, '');
	if (!clean || !/^[+-]?(\d*d\d+|\d+)([+-](\d*d\d+|\d+))*$/.test(clean)) return null;

	const formula: DiceFormula = { dice: [], modifier: 0 };
	let total = 0;
	for (const [, signText, body] of clean.matchAll(/([+-]?)(\d*d\d+|\d+)/g)) {
		const sign = signText === '-' ? -1 : 1;
		if (body.includes('d')) {
			const [countText, facesText] = body.split('d');
			const count = countText ? Number(countText) : 1;
			const faces = Number(facesText);
			if (count < 1 || faces < 2 || faces > MAX_FACES) return null;
			total += count;
			formula.dice.push({ count, faces, sign });
		} else {
			formula.modifier += sign * Number(body);
		}
	}
	if (formula.dice.length === 0 || total > MAX_DICE) return null;
	return formula;
}

export interface DiceResult {
	formula: string;
	rolls: { faces: number; value: number; sign: 1 | -1 }[];
	modifier: number;
	total: number;
}

export function rollDice(formula: DiceFormula, rng: Rng = Math.random): DiceResult {
	const rolls: DiceResult['rolls'] = [];
	for (const term of formula.dice) {
		for (let i = 0; i < term.count; i++) {
			rolls.push({ faces: term.faces, value: rollDie(term.faces, rng), sign: term.sign });
		}
	}
	const total = rolls.reduce((sum, r) => sum + r.sign * r.value, formula.modifier);
	return { formula: formatDice(formula), rolls, modifier: formula.modifier, total };
}

/** Nombre de dés d'une formule. */
export function diceCount(formula: DiceFormula): number {
	return formula.dice.reduce((sum, term) => sum + term.count, 0);
}

/**
 * Jet saisi à la main (vrais dés) : une valeur par dé, dans l'ordre de la formule.
 * Renvoie `null` s'il manque des valeurs ou si l'une sort des faces du dé.
 */
export function manualDice(formula: DiceFormula, values: number[]): DiceResult | null {
	if (values.length !== diceCount(formula)) return null;
	const queue = [...values];
	const rolls: DiceResult['rolls'] = [];
	for (const term of formula.dice) {
		for (let i = 0; i < term.count; i++) {
			const value = queue.shift()!;
			if (!isDieValue(value, term.faces)) return null;
			rolls.push({ faces: term.faces, value, sign: term.sign });
		}
	}
	const total = rolls.reduce((sum, r) => sum + r.sign * r.value, formula.modifier);
	return { formula: formatDice(formula), rolls, modifier: formula.modifier, total };
}

/** Valeur possible sur un dé à `faces` faces. */
export function isDieValue(value: number, faces: number): boolean {
	return Number.isInteger(value) && value >= 1 && value <= faces;
}

/** Lit des valeurs de dés saisies à la main : « 4 6 », « 4, 6 », « 4+6 ». */
export function parseDieValues(text: string): number[] {
	return (text.match(/\d+/g) ?? []).map(Number);
}

export function formatDice(formula: DiceFormula): string {
	const parts = formula.dice.map(
		(t, i) => `${t.sign < 0 ? '-' : i > 0 ? '+' : ''}${t.count > 1 ? t.count : ''}d${t.faces}`
	);
	if (formula.modifier) parts.push(`${formula.modifier > 0 ? '+' : ''}${formula.modifier}`);
	return parts.join('');
}

/** Valeur d'une stat sur l'échelle 0–100, comme elle sert aux jets. */
export function statForRoll(key: StatKey, raw: number): number {
	return Math.round(raw / STATS[key].scale);
}
