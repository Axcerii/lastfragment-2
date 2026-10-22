// Lecture d'une partie et vue filtrée selon qui regarde (MJ, joueur, vue OBS).
import type { Prisma, TableLog } from '@prisma/client';
import { toStatBlock, type StatBlock } from '$lib/game/stats';
import {
	HIDDEN_NAME,
	NO_EFFECTS,
	type SceneEffects,
	type Ambience,
	type GaugeView,
	type LogView,
	type MusicState,
	type PassiveView,
	type RolledDie,
	type SceneView,
	type Side,
	type TableView,
	type TokenKind,
	type TokenView
} from '$lib/table/types';
import { prisma } from '../prisma';

export interface Viewer {
	playerId: number | null;
	isAdmin: boolean;
	/** Vue OBS : lecture seule, voit ce que voient les joueurs. */
	spectator: boolean;
	name: string;
}

const include = {
	scenes: {
		orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
		include: { drawings: { orderBy: { id: 'asc' } } }
	},
	tokens: { orderBy: { id: 'asc' } }
} satisfies Prisma.TableSessionInclude;

export type RawSession = Prisma.TableSessionGetPayload<{ include: typeof include }> & {
	/** Personnage de chaque jeton qui en a un, et ses passifs. */
	characters: Map<number, { id: number; passives: PassiveView[] }>;
	/** Armure choisie par le MJ, par id de jeton (personnages et monstres). */
	armors: Map<number, number[]>;
};
export type RawToken = RawSession['tokens'][number];
export type RawScene = RawSession['scenes'][number];

const passiveSelect = {
	id: true,
	name: true,
	description: true,
	active: true,
	statistics: true,
	maths: true,
	inactiveMaths: true
} satisfies Prisma.PassiveSelect;

/** Personnage derrière un jeton : celui du joueur, ou le personnage d'origine. */
export async function characterIdOf(token: Pick<RawToken, 'kind' | 'playerId' | 'refId'>) {
	if (token.kind === 'character') return token.refId;
	if (token.kind !== 'player' || !token.playerId) return null;
	const player = await prisma.player.findUnique({ where: { id: token.playerId }, select: { characterId: true } });
	return player?.characterId ?? null;
}

export async function loadRaw(sessionId: number): Promise<RawSession | null> {
	const raw = await prisma.tableSession.findUnique({ where: { id: sessionId }, include });
	if (!raw) return null;

	const playerIds = raw.tokens.filter((t) => t.kind === 'player' && t.playerId).map((t) => t.playerId!);
	const players = await prisma.player.findMany({
		where: { id: { in: playerIds } },
		select: { id: true, characterId: true }
	});
	const characterOfPlayer = new Map(players.map((p) => [p.id, p.characterId]));
	const characterOf = (t: RawToken) =>
		t.kind === 'character' ? t.refId : t.kind === 'player' && t.playerId ? characterOfPlayer.get(t.playerId) : null;

	const ids = [...new Set(raw.tokens.map(characterOf).filter((id): id is number => typeof id === 'number'))];
	const passives = await prisma.passive.findMany({
		where: { characterId: { in: ids } },
		select: { ...passiveSelect, characterId: true },
		orderBy: [{ name: 'asc' }, { id: 'asc' }]
	});
	const characters = new Map<number, { id: number; passives: PassiveView[] }>();
	for (const token of raw.tokens) {
		const id = characterOf(token);
		if (typeof id !== 'number') continue;
		characters.set(token.id, {
			id,
			passives: passives.filter((p) => p.characterId === id).map(({ characterId: _, ...p }) => p)
		});
	}

	const refs = (kind: string) => [
		...new Set(raw.tokens.filter((t) => t.kind === kind && t.refId).map((t) => t.refId!))
	];
	const [characterArmors, monsterArmors] = await Promise.all([
		prisma.character.findMany({ where: { id: { in: refs('character') } }, select: { id: true, armorIds: true } }),
		prisma.monster.findMany({ where: { id: { in: refs('monster') } }, select: { id: true, armorIds: true } })
	]);
	const armors = new Map<number, number[]>();
	for (const token of raw.tokens) {
		const list = token.kind === 'character' ? characterArmors : token.kind === 'monster' ? monsterArmors : null;
		const sheet = list?.find((s) => s.id === token.refId);
		if (sheet) armors.set(token.id, numbers(sheet.armorIds));
	}
	return { ...raw, characters, armors };
}

export const numbers = (value: Prisma.JsonValue | null | undefined): number[] =>
	Array.isArray(value) ? value.map(Number).filter(Number.isFinite) : [];

export const statsOf = (token: { stats: Prisma.JsonValue }): StatBlock =>
	toStatBlock(token.stats as Partial<StatBlock>);

/** Cases couvertes par un jeton. */
function cellsOf(token: RawToken, cols: number): number[] {
	const cells: number[] = [];
	for (let dy = 0; dy < token.size; dy++) {
		for (let dx = 0; dx < token.size; dx++) cells.push((token.y + dy) * cols + token.x + dx);
	}
	return cells;
}

const isMine = (token: RawToken, viewer: Viewer) =>
	viewer.playerId !== null && token.kind === 'player' && token.playerId === viewer.playerId;

/** Ce que les joueurs voient d'un jeton : caché, sous le brouillard, ou visible. */
export function visibleToPlayers(
	token: RawToken,
	scene: Pick<RawScene, 'id' | 'fogEnabled' | 'fog' | 'cols'> | undefined,
	viewer?: Viewer
): boolean {
	if (viewer && isMine(token, viewer)) return true;
	if (token.hidden || !scene || token.sceneId !== scene.id) return false;
	// Les jetons des joueurs ne disparaissent jamais sous le brouillard.
	if (!scene.fogEnabled || token.kind === 'player') return true;
	const revealed = new Set(numbers(scene.fog));
	return cellsOf(token, scene.cols).some((cell) => revealed.has(cell));
}

/** Le spectateur voit-il les chiffres de ce jeton ? */
export function seesNumbers(token: RawToken, viewer: Viewer): boolean {
	return viewer.isAdmin || token.revealed || isMine(token, viewer);
}

function gauge(current: number, max: number, exact: boolean): GaugeView {
	if (exact) return { current, max };
	return { ratio: max > 0 ? Math.max(0, Math.min(1, current / max)) : 0 };
}

function tokenView(token: RawToken, viewer: Viewer, raw: RawSession): TokenView {
	const stats = statsOf(token);
	const exact = seesNumbers(token, viewer);
	// Les passifs ne sont montrés qu'au MJ et au joueur à qui appartient le jeton.
	const character = raw.characters.get(token.id);
	return {
		id: token.id,
		sceneId: token.sceneId,
		kind: token.kind as TokenKind,
		playerId: token.playerId,
		// Nom masqué : les joueurs ne reçoivent jamais le vrai nom.
		name: token.nameHidden && !viewer.isAdmin && !isMine(token, viewer) ? HIDDEN_NAME : token.name,
		image: token.image,
		side: token.side as Side,
		x: token.x,
		y: token.y,
		size: token.size,
		hidden: token.hidden,
		nameHidden: token.nameHidden,
		revealed: token.revealed,
		mine: isMine(token, viewer),
		pv: gauge(token.pv, stats.pv, exact),
		qdf: exact ? gauge(token.qdf, stats.qdf, true) : null,
		endurance: exact ? gauge(token.endurance, stats.endurance, true) : null,
		stats: exact ? stats : null,
		armor: exact ? toStatBlock(token.armor as Partial<StatBlock>) : null,
		passives: character && (viewer.isAdmin || isMine(token, viewer)) ? character.passives : null,
		armorIds: viewer.isAdmin ? (raw.armors.get(token.id) ?? null) : null
	};
}

function sceneView(scene: RawScene, viewer: Viewer): SceneView {
	return {
		id: scene.id,
		name: scene.name,
		background: scene.background,
		cols: scene.cols,
		rows: scene.rows,
		gridVisible: scene.gridVisible,
		fogEnabled: scene.fogEnabled,
		fog: numbers(scene.fog),
		musicUrl: viewer.isAdmin ? scene.musicUrl : null,
		musicName: viewer.isAdmin ? scene.musicName : null,
		effects: { ...NO_EFFECTS, ...((scene.effects as Partial<SceneEffects> | null) ?? {}) },
		drawings: scene.drawings.map((d) => ({
			id: d.id,
			playerId: d.playerId,
			author: d.author,
			color: d.color,
			width: d.width,
			points: numbers(d.points),
			erasable: viewer.isAdmin || (viewer.playerId !== null && d.playerId === viewer.playerId)
		}))
	};
}

export function buildView(raw: RawSession, viewer: Viewer): TableView {
	const active = raw.scenes.find((s) => s.id === raw.sceneId);
	const tokens = viewer.isAdmin
		? raw.tokens
		: raw.tokens.filter((t) => t.sceneId === active?.id && visibleToPlayers(t, active, viewer));
	const visibleIds = new Set(tokens.map((t) => t.id));
	const order = numbers(raw.order);
	const showOrder = viewer.isAdmin || raw.orderVisible;

	return {
		session: {
			id: raw.id,
			name: raw.name,
			open: raw.open,
			sceneId: raw.sceneId,
			combat: raw.combat,
			order: showOrder ? order.filter((id) => visibleIds.has(id)) : [],
			orderVisible: raw.orderVisible,
			turn: showOrder && raw.turn !== null && visibleIds.has(raw.turn) ? raw.turn : null,
			showcase: raw.showcase,
			music: (raw.music as MusicState | null) ?? null,
			ambiences: (raw.ambiences as unknown as Ambience[]) ?? []
		},
		scenes: (viewer.isAdmin ? raw.scenes : active ? [active] : []).map((s) => sceneView(s, viewer)),
		tokens: tokens.map((t) => tokenView(t, viewer, raw)),
		viewer: { playerId: viewer.playerId, isAdmin: viewer.isAdmin, spectator: viewer.spectator },
		serverNow: Date.now()
	};
}

// ─── Journal ─────────────────────────────────────────────────────────────────

export interface LogData {
	/** Détail chiffré pour le MJ. */
	detail?: string;
	/** Détail montré aux joueurs, s'il y en a un. */
	publicDetail?: string;
	/** Dés tirés, dessinés dans le journal. */
	dice?: RolledDie[];
	/** Modificateur ajouté aux dés libres. */
	modifier?: number;
	/** Variations de jauges appliquées, pour pouvoir les annuler. */
	effects?: { tokenId: number; gauge: 'pv' | 'qdf' | 'endurance'; delta: number }[];
}

export function canSeeLog(log: TableLog, viewer: Viewer): boolean {
	return viewer.isAdmin || !log.hidden;
}

export function logView(log: TableLog, viewer: Viewer): LogView {
	const data = (log.data ?? {}) as LogData;
	return {
		id: log.id,
		kind: log.kind,
		author: log.author,
		hidden: log.hidden,
		text: log.text,
		detail: (viewer.isAdmin ? data.detail : data.publicDetail) ?? null,
		dice: data.dice?.length ? data.dice : null,
		undone: log.undone,
		undoable: viewer.isAdmin && !log.undone && (data.effects?.length ?? 0) > 0,
		createdAt: log.createdAt.toISOString()
	};
}

export const LOG_HISTORY = 150;

export async function recentLogs(sessionId: number, viewer: Viewer): Promise<LogView[]> {
	const logs = await prisma.tableLog.findMany({
		where: { sessionId, ...(viewer.isAdmin ? {} : { hidden: false }) },
		orderBy: { id: 'desc' },
		take: LOG_HISTORY
	});
	return logs.reverse().map((log) => logView(log, viewer));
}
