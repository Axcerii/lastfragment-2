// Diffusion en temps réel (Server-Sent Events) : chaque navigateur connecté à une partie
// reçoit sa propre vue après chaque changement.
import type { TableLog } from '@prisma/client';
import { buildView, canSeeLog, loadRaw, logView, type Viewer } from './state';

export interface Client {
	viewer: Viewer;
	send(event: string, data: unknown): void;
}

// Gardé sur globalThis pour survivre aux rechargements du module en développement.
const store = globalThis as unknown as {
	__tableRooms?: Map<number, Set<Client>>;
	__tableTimers?: Map<number, ReturnType<typeof setTimeout>>;
};
const rooms = (store.__tableRooms ??= new Map());
const timers = (store.__tableTimers ??= new Map());

export function join(sessionId: number, client: Client): () => void {
	let room = rooms.get(sessionId);
	if (!room) rooms.set(sessionId, (room = new Set()));
	room.add(client);
	return () => {
		room.delete(client);
		if (room.size === 0) rooms.delete(sessionId);
	};
}

/** Joueurs actuellement connectés à une partie (hors MJ et vue OBS). */
export function connectedPlayers(sessionId: number): string[] {
	const names = new Set<string>();
	for (const client of rooms.get(sessionId) ?? []) {
		if (!client.viewer.isAdmin && !client.viewer.spectator) names.add(client.viewer.name);
	}
	return [...names];
}

/**
 * Renvoie l'état à tout le monde. Les changements rapprochés (plusieurs actions de suite)
 * sont regroupés en un seul envoi.
 */
export function broadcast(sessionId: number) {
	if (!rooms.has(sessionId) || timers.has(sessionId)) return;
	timers.set(
		sessionId,
		setTimeout(async () => {
			timers.delete(sessionId);
			const raw = await loadRaw(sessionId);
			for (const client of rooms.get(sessionId) ?? []) {
				if (!raw) client.send('closed', {});
				else if (!raw.open && !client.viewer.isAdmin) client.send('closed', {});
				else client.send('state', buildView(raw, client.viewer));
			}
		}, 25)
	);
}

/** Envoie de nouvelles lignes du journal (ou une ligne modifiée, même id). */
export function pushLogs(sessionId: number, logs: TableLog[]) {
	for (const client of rooms.get(sessionId) ?? []) {
		const visible = logs.filter((log) => canSeeLog(log, client.viewer));
		if (visible.length) client.send('log', visible.map((log) => logView(log, client.viewer)));
	}
}

/** Événement ponctuel envoyé à tout le monde (effet sonore…). */
export function pushEvent(sessionId: number, event: string, data: unknown) {
	for (const client of rooms.get(sessionId) ?? []) client.send(event, data);
}
