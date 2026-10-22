import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectionsOf, join } from '$lib/server/table/hub';
import { tableViewer } from '$lib/server/table/access';
import { buildView, loadRaw, recentLogs } from '$lib/server/table/state';

// Flux temps réel d'une partie (Server-Sent Events) : état complet à chaque changement,
// lignes du journal au fil de l'eau.

const MAX_STREAMS_PER_ACCOUNT = 12;
export const GET: RequestHandler = async ({ params, locals, url, request }) => {
	const sessionId = Number(params.id);
	const viewer = await tableViewer(sessionId, locals.user, url.searchParams.get('key'));
	// Chaque flux garde une connexion et de la mémoire : un compte ne peut pas en ouvrir à l'infini.
	if (viewer.playerId !== null && connectionsOf(viewer.playerId) >= MAX_STREAMS_PER_ACCOUNT) {
		error(429, 'Trop d’onglets ouverts sur la table de jeu.');
	}
	const encoder = new TextEncoder();
	let cleanup = () => {};

	const stream = new ReadableStream({
		async start(controller) {
			let closed = false;
			const write = (chunk: string) => {
				if (closed) return;
				try {
					controller.enqueue(encoder.encode(chunk));
				} catch {
					cleanup();
				}
			};
			const send = (event: string, data: unknown) =>
				write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

			const leave = join(sessionId, { viewer, send });
			// Commentaire régulier pour que les proxys ne coupent pas une connexion silencieuse.
			const ping = setInterval(() => write(': ping\n\n'), 25000);
			cleanup = () => {
				if (closed) return;
				closed = true;
				clearInterval(ping);
				leave();
				try {
					controller.close();
				} catch {
					/* déjà fermé */
				}
			};
			request.signal.addEventListener('abort', cleanup);

			const raw = await loadRaw(sessionId);
			if (!raw) return send('closed', {});
			send('state', buildView(raw, viewer));
			send('history', await recentLogs(sessionId, viewer));
		},
		cancel() {
			cleanup();
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive',
			// Désactive la mise en tampon de nginx, sinon les événements arrivent par paquets.
			'X-Accel-Buffering': 'no'
		}
	});
};
