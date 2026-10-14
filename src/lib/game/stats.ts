// Les 13 statistiques du jeu, dans l'ordre d'affichage.
// Les clés correspondent aux colonnes de la table `statistics`.
export const STAT_KEYS = [
	'qdf',
	'pv',
	'endurance',
	'maitrise',
	'strength',
	'defense',
	'vitesse',
	'accuracy',
	'perception',
	'furtivite',
	'charisme',
	'eloquence',
	'intelligence'
] as const;

export type StatKey = (typeof STAT_KEYS)[number];
export type StatBlock = Record<StatKey, number>;
export type StatGroup = 'conso' | 'combat' | 'social';

interface StatInfo {
	abbr: string;
	label: string;
	group: StatGroup;
	/** Nombre de points bruts pour 1 point sur l'échelle 0–100. */
	scale: number;
	/** Valeur de l'enum Prisma `SkillStatistic` correspondante. */
	skill: string;
	/** Dragon associé : couleur et logo de la barre de la stat. */
	dragon: string;
	/** Nom court affiché devant la barre, quand il diffère du libellé complet. */
	barLabel?: string;
	/** Logo de la barre, quand ce n'est pas celui du dragon. */
	icon?: string;
}

export const STATS: Record<StatKey, StatInfo> = {
	qdf: { abbr: 'QDF', label: 'Quantité de flux', group: 'conso', scale: 30, skill: 'QDF', dragon: 'Guizamark', barLabel: 'QdF', icon: '/layout/Logo.svg' },
	pv: { abbr: 'HP', label: 'Santé', group: 'conso', scale: 30, skill: 'PV', dragon: 'Guizamark', barLabel: 'PV', icon: '/layout/Logo.svg' },
	endurance: { abbr: 'END', label: 'Endurance', group: 'conso', scale: 20, skill: 'Endurance', dragon: 'Goliath' },
	maitrise: { abbr: 'MDF', label: 'Maîtrise', group: 'combat', scale: 1, skill: 'Maitrise', dragon: 'Drii' },
	strength: { abbr: 'FOR', label: 'Force', group: 'combat', scale: 1, skill: 'Force', dragon: 'Pura' },
	defense: { abbr: 'DEF', label: 'Défense', group: 'combat', scale: 1, skill: 'Defense', dragon: 'Aqua' },
	vitesse: { abbr: 'VIT', label: 'Vitesse', group: 'combat', scale: 1, skill: 'Vitesse', dragon: 'Lada' },
	accuracy: { abbr: 'ACC', label: 'Précision', group: 'combat', scale: 1, skill: 'Precision', dragon: 'Chronos' },
	perception: { abbr: 'PER', label: 'Perception', group: 'social', scale: 1, skill: 'Perception', dragon: 'Pestia' },
	furtivite: { abbr: 'FUR', label: 'Furtivité', group: 'social', scale: 1, skill: 'Furtivite', dragon: 'Shizari' },
	charisme: { abbr: 'CHA', label: 'Charisme', group: 'social', scale: 1, skill: 'Charisme', dragon: 'Artrish' },
	eloquence: { abbr: 'ELO', label: 'Éloquence', group: 'social', scale: 1, skill: 'Eloquence', dragon: 'Yinva' },
	intelligence: {
		abbr: 'INT',
		label: 'Intelligence',
		group: 'social',
		scale: 1,
		skill: 'Intelligence', dragon: 'Guizamark'
	}
};

export const CONSO_STATS = STAT_KEYS.filter((k) => STATS[k].group === 'conso');
export const COMBAT_STATS = STAT_KEYS.filter((k) => STATS[k].group === 'combat');
export const SOCIAL_STATS = STAT_KEYS.filter((k) => STATS[k].group === 'social');

export function emptyStats(value = 0): StatBlock {
	return Object.fromEntries(STAT_KEYS.map((k) => [k, value])) as StatBlock;
}

/** Extrait un bloc de stats propre d'une ligne `statistics` (ou de rien). */
export function toStatBlock(row: Partial<Record<StatKey, number>> | null | undefined): StatBlock {
	const block = emptyStats();
	if (row) for (const k of STAT_KEYS) block[k] = Number(row[k] ?? 0);
	return block;
}

const normalize = (s: string) =>
	s
		.trim()
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '');

const STAT_ALIASES: Record<string, StatKey> = {
	sante: 'pv',
	hp: 'pv',
	force: 'strength',
	precision: 'accuracy',
	sexability: 'intelligence'
};
for (const k of STAT_KEYS) {
	STAT_ALIASES[k] = k;
	STAT_ALIASES[normalize(STATS[k].abbr)] = k;
	STAT_ALIASES[normalize(STATS[k].label)] = k;
	STAT_ALIASES[normalize(STATS[k].skill)] = k;
}

/** Reconnaît une stat écrite en abréviation (FOR), en clé (strength) ou en toutes lettres (Force). */
export function parseStatKey(text: string): StatKey | null {
	return STAT_ALIASES[normalize(text)] ?? null;
}

/** Valeur ramenée sur l'échelle 0–100 (QDF et HP ÷30, END ÷20). */
export function toScale(key: StatKey, value: number): number {
	return value / STATS[key].scale;
}

/** Remplissage d'une barre, en pourcentage borné à 0–100. */
export function barPercent(key: StatKey, value: number): number {
	return Math.max(0, Math.min(100, toScale(key, value)));
}

// Coût en points de puissance de chaque point de stat, par tranche.
const POWER_TIERS: [upTo: number, cost: number][] = [
	[25, 0.5],
	[50, 1],
	[70, 2],
	[80, 4],
	[Infinity, 8]
];

/** Puissance d'une stat exprimée sur l'échelle 0–100. */
export function statPower(scaled: number): number {
	let power = 0;
	let from = 0;
	for (const [upTo, cost] of POWER_TIERS) {
		if (scaled <= from) break;
		power += (Math.min(scaled, upTo) - from) * cost;
		from = upTo;
	}
	return power;
}

/** Puissance totale d'un bloc de stats, arrondie à l'entier inférieur. */
export function totalPower(stats: StatBlock): number {
	return Math.floor(STAT_KEYS.reduce((sum, k) => sum + statPower(toScale(k, stats[k])), 0));
}
