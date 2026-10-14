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

export const ASSET_KINDS = ['fond', 'jeton', 'image', 'musique', 'ambiance', 'effet'] as const;
export type AssetKind = (typeof ASSET_KINDS)[number];

export const ASSET_LABELS: Record<AssetKind, string> = {
	fond: 'Fonds',
	jeton: 'Jetons',
	image: 'Images',
	musique: 'Musiques',
	ambiance: 'Ambiances',
	effet: 'Effets sonores'
};

export const AUDIO_KINDS: AssetKind[] = ['musique', 'ambiance', 'effet'];

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
	revealed: boolean;
	/** Le jeton appartient au spectateur (son personnage). */
	mine: boolean;
	pv: GaugeView | null;
	qdf: GaugeView | null;
	endurance: GaugeView | null;
	/** Stats finales, envoyées seulement si le spectateur a le droit de les voir. */
	stats: StatBlock | null;
	armor: StatBlock | null;
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

export interface LogView {
	id: number;
	kind: string;
	author: string;
	hidden: boolean;
	text: string;
	/** Détail chiffré du jet, adapté au spectateur. */
	detail: string | null;
	undone: boolean;
	/** Le MJ peut annuler l'effet (dégâts et coût d'une attaque). */
	undoable: boolean;
	createdAt: string;
}
