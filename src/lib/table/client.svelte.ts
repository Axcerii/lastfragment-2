// Connexion d'un navigateur à une partie : reçoit l'état en temps réel et envoie les actions.
import type { LogView, TableView } from './types';

const MAX_LOGS = 300;

export type Status = 'connecting' | 'online' | 'offline' | 'closed';

export class TableClient {
	view = $state<TableView | null>(null);
	logs = $state<LogView[]>([]);
	status = $state<Status>('connecting');
	notice = $state<string | null>(null);
	/** Écart entre l'horloge du serveur et celle du navigateur (ms), pour caler la musique. */
	clockOffset = $state(0);

	onSfx: ((url: string) => void) | null = null;

	#source: EventSource | null = null;
	#noticeTimer: ReturnType<typeof setTimeout> | undefined;

	constructor(
		readonly sessionId: number,
		readonly key: string | null = null
	) {}

	connect() {
		const query = this.key ? `?key=${encodeURIComponent(this.key)}` : '';
		const source = new EventSource(`/outils/table/${this.sessionId}/events${query}`);
		this.#source = source;

		source.addEventListener('open', () => (this.status = 'online'));
		// EventSource se reconnecte tout seul ; on le signale seulement.
		source.addEventListener('error', () => {
			if (this.status !== 'closed') this.status = 'offline';
		});
		source.addEventListener('state', (e) => {
			const view = JSON.parse((e as MessageEvent).data) as TableView;
			this.clockOffset = view.serverNow - Date.now();
			this.view = view;
			this.status = 'online';
		});
		source.addEventListener('history', (e) => {
			this.logs = JSON.parse((e as MessageEvent).data);
		});
		source.addEventListener('log', (e) => this.#mergeLogs(JSON.parse((e as MessageEvent).data)));
		source.addEventListener('sfx', (e) => this.onSfx?.(JSON.parse((e as MessageEvent).data).url));
		source.addEventListener('closed', () => {
			this.status = 'closed';
			source.close();
		});
	}

	disconnect() {
		this.#source?.close();
		this.#source = null;
	}

	#mergeLogs(incoming: LogView[]) {
		const logs = [...this.logs];
		for (const log of incoming) {
			const index = logs.findIndex((l) => l.id === log.id);
			if (index >= 0) logs[index] = log;
			else logs.push(log);
		}
		logs.sort((a, b) => a.id - b.id);
		this.logs = logs.slice(-MAX_LOGS);
	}

	flash(message: string) {
		this.notice = message;
		clearTimeout(this.#noticeTimer);
		this.#noticeTimer = setTimeout(() => (this.notice = null), 4000);
	}

	/** Envoie une action au serveur. Renvoie sa réponse, ou `null` en cas de refus (message affiché). */
	async act<T = Record<string, unknown>>(type: string, payload: Record<string, unknown> = {}): Promise<T | null> {
		// Déplacement : on bouge le jeton tout de suite, sans attendre l'aller-retour.
		if (type === 'token.move' && this.view) {
			const token = this.view.tokens.find((t) => t.id === payload.id);
			if (token) {
				token.x = Number(payload.x);
				token.y = Number(payload.y);
			}
		}
		try {
			const response = await fetch(`/outils/table/${this.sessionId}/action`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type, ...payload })
			});
			if (!response.ok) {
				const body = await response.json().catch(() => null);
				this.flash(body?.message ?? 'Action refusée.');
				return null;
			}
			return (await response.json()) as T;
		} catch {
			this.flash('Connexion perdue, réessaie dans un instant.');
			return null;
		}
	}
}
