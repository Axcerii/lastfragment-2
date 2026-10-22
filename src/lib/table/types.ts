// Types partagés entre le serveur et le navigateur pour la table de jeu.
import type { StatBlock } from '$lib/game/stats';

export const TOKEN_KINDS = ['player', 'character', 'monster', 'custom'] as const;
export type TokenKind = (typeof TOKEN_KINDS)[number];

export const SIDES = ['ally', 'enemy', 'neutral'] as const;
export type Side = (typeof SIDES)[number];

export const SIDE_LABELS: Record<Side, string> = {
	ally: 'Allié',
	enemy: 'Ennemi',
	neutral: 'Neutre'
};

export const ASSET_KINDS = ['fond', 'jeton', 'image', 'calque', 'musique', 'ambiance', 'effet'] as const;
export type AssetKind = (typeof ASSET_KINDS)[number];

export const ASSET_LABELS: Record<AssetKind, string> = {
	fond: 'Fonds',
	jeton: 'Jetons',
	image: 'Images',
	calque: 'Calques',
	musique: 'Musiques',
	ambiance: 'Ambiances',
	effet: 'Effets sonores'
};

export const AUDIO_KINDS: AssetKind[] = ['musique', 'ambiance', 'effet'];

/** Fichiers vidéo acceptés comme calque (webm transparent, mp4). */
export const isVideo = (url: string) => /\.(webm|mp4)$/i.test(url);

// ─── Effets de scène ───

export const WEATHERS = ['aucune', 'pluie', 'orage', 'neige', 'vent', 'brume', 'braises'] as const;
export type Weather = (typeof WEATHERS)[number];

export const WEATHER_LABELS: Record<Weather, string> = {
	aucune: 'Aucune',
	pluie: 'Pluie',
	orage: 'Orage',
	neige: 'Neige',
	vent: 'Vent',
	brume: 'Brume',
	braises: 'Braises'
};

export const BLENDS = ['normal', 'multiply', 'screen', 'overlay', 'soft-light'] as const;
export type Blend = (typeof BLENDS)[number];

export const BLEND_LABELS: Record<Blend, string> = {
	normal: 'Normal',
	multiply: 'Produit (assombrit)',
	screen: 'Écran (fond noir transparent)',
	overlay: 'Incrustation',
	'soft-light': 'Lumière douce'
};

export interface SceneEffects {
	/** Voile coloré posé sur le fond, sous les jetons. */
	tint: { color: string; opacity: number; blend: Blend } | null;
	/** Météo animée, au-dessus des jetons. */
	weather: Weather;
	/** 0,2 à 1 */
	intensity: number;
	/** Gif, image ou vidéo (webm transparent) posé sur toute la scène, au-dessus des jetons. */
	overlay: { url: string; opacity: number; blend: Blend } | null;
}

export const NO_EFFECTS: SceneEffects = { tint: null, weather: 'aucune', intensity: 0.6, overlay: null };

export interface Asset {
	id: number;
	kind: AssetKind;
	name: string;
	url: string;
}

export interface MusicState {
	url: string;
	name: string;
	loop: boolean;
	playing: boolean;
	/** Horodatage serveur (ms) correspondant à la position 0 de la piste, quand elle joue. */
	startedAt: number;
	/** Position (s) où la piste a été mise en pause. */
	offset: number;
}

export interface Ambience {
	id: string;
	url: string;
	name: string;
	/** 0 à 1 */
	volume: number;
}

/** Jauge vue par quelqu'un : chiffres exacts, ou seulement une proportion. */
export type GaugeView = { current: number; max: number } | { ratio: number };

/** Passif du personnage d'un jeton, au format des colonnes de la table `passives`. */
export interface PassiveView {
	id: number;
	name: string;
	description: string | null;
	active: boolean;
	statistics: string;
	maths: string;
	inactiveMaths: string | null;
}

export interface TokenView {
	id: number;
	sceneId: number | null;
	kind: TokenKind;
	playerId: number | null;
	name: string;
	image: string | null;
	side: Side;
	x: number;
	y: number;
	size: number;
	hidden: boolean;
	/** Nom masqué aux joueurs (ils voient « ??? »). */
	nameHidden: boolean;
	revealed: boolean;
	/** Le jeton appartient au spectateur (son personnage). */
	mine: boolean;
	pv: GaugeView | null;
	qdf: GaugeView | null;
	endurance: GaugeView | null;
	/** Stats finales, envoyées seulement si le spectateur a le droit de les voir. */
	stats: StatBlock | null;
	armor: StatBlock | null;
	/** Passifs du personnage, envoyés au MJ et au propriétaire du jeton seulement. */
	passives: PassiveView[] | null;
	/** Armure d'un personnage ou d'un monstre (ids de `armors`), envoyée au MJ seulement. */
	armorIds: number[] | null;
}

/** Pièce d'armure du catalogue, proposée au MJ. */
export interface ArmorOption {
	id: number;
	name: string;
	slot: string;
	/** Bonus lisible, par exemple « DEF +10, VIT -5 ». */
	bonus: string;
}

export interface SceneView {
	id: number;
	name: string;
	background: string | null;
	cols: number;
	rows: number;
	gridVisible: boolean;
	fogEnabled: boolean;
	fog: number[];
	musicUrl: string | null;
	musicName: string | null;
	effects: SceneEffects;
	drawings: DrawingView[];
}

/** Nom affiché aux joueurs à la place d'un nom masqué. */
export const HIDDEN_NAME = '???';

export const DRAW_COLORS = ['#e5b8cc', '#cfdfc4', '#d2b674', '#7fa8e0', '#ca4444', '#ffffff', '#1b1b1b'] as const;
export const DRAW_WIDTHS = [3, 6, 12] as const;

export interface DrawingView {
	id: number;
	playerId: number | null;
	author: string;
	color: string;
	width: number;
	/** Coordonnées du plateau à plat : [x1, y1, x2, y2, …] */
	points: number[];
	/** Le spectateur peut l'effacer (son propre trait, ou n'importe lequel pour le MJ). */
	erasable: boolean;
}

export interface TableView {
	session: {
		id: number;
		name: string;
		open: boolean;
		sceneId: number | null;
		combat: boolean;
		order: number[];
		orderVisible: boolean;
		turn: number | null;
		showcase: string | null;
		music: MusicState | null;
		ambiences: Ambience[];
	};
	/** MJ : toutes les scènes. Joueurs : la scène montrée seulement. */
	scenes: SceneView[];
	tokens: TokenView[];
	viewer: { playerId: number | null; isAdmin: boolean; spectator: boolean };
	serverNow: number;
}

export interface RolledDie {
	faces: number;
	value: number;
	/** -1 pour un dé soustrait (d20-d4). */
	sign?: 1 | -1;
}

export interface LogView {
	id: number;
	kind: string;
	author: string;
	hidden: boolean;
	text: string;
	/** Détail chiffré du jet, adapté au spectateur. */
	detail: string | null;
	undone: boolean;
	/** Dés tirés, pour les dessiner (faces et valeur obtenue). */
	dice: RolledDie[] | null;
	/** Le MJ peut annuler l'effet (dégâts et coût d'une attaque). */
	undoable: boolean;
	createdAt: string;
}
