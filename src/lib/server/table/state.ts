// Lecture d'une partie et vue filtrée selon qui regarde (MJ, joueur, vue OBS).
import type { Prisma, TableLog } from '@prisma/client';
import { toStatBlock, type StatBlock } from '$lib/game/stats';
import type {
	Ambience,
	GaugeView,
	LogView,
	MusicState,
	SceneView,
	Side,
	TableView,
	TokenKind,
	TokenView
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
	scenes: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
	tokens: { orderBy: { id: 'asc' } }
} satisfies Prisma.TableSessionInclude;

export type RawSession = Prisma.TableSessionGetPayload<{ include: typeof include }>;
export type RawToken = RawSession['tokens'][number];
export type RawScene = RawSession['scenes'][number];

export function loadRaw(sessionId: number): Promise<RawSession | null> {
	return prisma.tableSession.findUnique({ where: { id: sessionId }, include });
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
export function visibleToPlayers(token: RawToken, scene: RawScene | undefined, viewer?: Viewer): boolean {
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

function tokenView(token: RawToken, viewer: Viewer): TokenView {
	const stats = statsOf(token);
	const exact = seesNumbers(token, viewer);
	return {
		id: token.id,
		sceneId: token.sceneId,
		kind: token.kind as TokenKind,
		playerId: token.playerId,
		name: token.name,
		image: token.image,
		side: token.side as Side,
		x: token.x,
		y: token.y,
		size: token.size,
		hidden: token.hidden,
		revealed: token.revealed,
		mine: isMine(token, viewer),
		pv: gauge(token.pv, stats.pv, exact),
		qdf: exact ? gauge(token.qdf, stats.qdf, true) : null,
		endurance: exact ? gauge(token.endurance, stats.endurance, true) : null,
		stats: exact ? stats : null,
		armor: exact ? toStatBlock(token.armor as Partial<StatBlock>) : null
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
		musicName: viewer.isAdmin ? scene.musicName : null
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
		tokens: tokens.map((t) => tokenView(t, viewer)),
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
