// Armes équipables : mains occupées et bonus propres à chaque arme.
// Les bonus de stats d'une arme passent par `armors`, comme pour une armure ; ici, seulement
// ce qu'une arme fait de plus quand on frappe avec.

/** L'objet est une arme (catégorie `Arme` de l'enum Prisma `ItemCategory`). */
export function isWeapon(category: string): boolean {
	return category === 'Arme';
}

// ─── Mains ───────────────────────────────────────────────────────────────────

/** Valeurs de `items_in_player.hand`. */
export const HANDS = ['gauche', 'droite', 'deux'] as const;
export type Hand = (typeof HANDS)[number];

export const HAND_LABELS: Record<Hand, string> = {
	gauche: 'Main gauche',
	droite: 'Main droite',
	deux: 'Deux mains'
};

export function toHand(value: unknown): Hand | null {
	return HANDS.includes(value as Hand) ? (value as Hand) : null;
}

/** Une arme à deux mains occupe les deux emplacements. */
export function handsTaken(hand: Hand): Hand[] {
	return hand === 'deux' ? ['gauche', 'droite', 'deux'] : [hand, 'deux'];
}

// ─── Bonus propres ───────────────────────────────────────────────────────────

/** Ce qui change dans une attaque portée avec l'arme. */
export interface AttackModifiers {
	/** Points de DEF de la cible ignorés. */
	ignoreDefense: number;
}

export const noModifiers = (): AttackModifiers => ({ ignoreDefense: 0 });

interface BonusKind {
	/** Libellé du champ où le MJ saisit la valeur X, dans le back-office. */
	field: string;
	/** Texte complet, montré sur la fiche de l'objet. */
	label: (value: number) => string;
	/** Texte court, pour le détail d'une attaque au journal. */
	short: (value: number) => string;
	apply: (modifiers: AttackModifiers, value: number) => void;
}

/**
 * Bonus connus, par code. Un nouveau bonus se déclare ici (et, s'il touche à une règle
 * pas encore couverte par `AttackModifiers`, s'applique là où l'attaque est calculée).
 */
export const BONUS_KINDS: Record<string, BonusKind> = {
	'ignore-defense': {
		field: 'Points de défense de la cible ignorés',
		label: (v) => `Ignore ${v} point${v > 1 ? 's' : ''} de défense de la cible`,
		short: (v) => `ignore ${v} DEF`,
		apply: (m, v) => {
			m.ignoreDefense += v;
		}
	}
};

/** Bonus proposés au MJ dans le back-office, chacun avec sa valeur X. */
export const WEAPON_BONUS_KINDS = Object.keys(BONUS_KINDS);

export interface WeaponBonus {
	code: string;
	kind: string;
	value: number;
}

/**
 * Lit `items.weapon_bonus` (« ignore-defense:X,… », X choisi par le MJ).
 * Les codes inconnus et les valeurs nulles ou invalides sont ignorés.
 */
export function parseWeaponBonuses(text: string | null | undefined): WeaponBonus[] {
	return (text ?? '')
		.split(',')
		.map((code) => code.trim())
		.flatMap((code) => {
			const [kind, raw] = code.split(':');
			const value = Number(raw);
			return BONUS_KINDS[kind] && Number.isFinite(value) && value > 0 ? [{ code, kind, value }] : [];
		});
}

/** Opération inverse : valeur X de chaque bonus → `items.weapon_bonus`. Une valeur nulle retire le bonus. */
export function serializeWeaponBonuses(values: Record<string, number>): string | null {
	const codes = WEAPON_BONUS_KINDS.filter((kind) => values[kind] > 0).map((kind) => `${kind}:${values[kind]}`);
	return codes.join(',') || null;
}

/** Valeur X d'un bonus dans `items.weapon_bonus`, 0 s'il n'y est pas. */
export function weaponBonusValue(text: string | null | undefined, kind: string): number {
	return parseWeaponBonuses(text).find((b) => b.kind === kind)?.value ?? 0;
}

export function describeWeaponBonus(bonus: WeaponBonus, short = false): string {
	const kind = BONUS_KINDS[bonus.kind];
	return short ? kind.short(bonus.value) : kind.label(bonus.value);
}

/** Effet cumulé des bonus d'une arme sur une attaque. */
export function attackModifiers(bonuses: WeaponBonus[]): AttackModifiers {
	const modifiers = noModifiers();
	for (const bonus of bonuses) BONUS_KINDS[bonus.kind].apply(modifiers, bonus.value);
	return modifiers;
}
