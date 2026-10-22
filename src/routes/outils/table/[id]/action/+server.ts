import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RateLimiter } from '$lib/server/ratelimit';
import { tableViewer } from '$lib/server/table/access';
import { runAction } from '$lib/server/table/actions';

// Une action pèse quelques Ko (un trait de 1 500 points en fait ~30) : au-delà, c'est un abus.
const MAX_BODY_BYTES = 64 * 1024;
// Un joueur qui joue normalement reste loin de 40 actions en 10 secondes ; le MJ n'est pas limité.
const playerActions = new RateLimiter(40, 10_000);

/** Lit le corps JSON sans jamais en garder plus que `max` octets en mémoire. */
async function readJson(request: Request, max: number): Promise<unknown> {
	if (Number(request.headers.get('content-length')) > max) error(413, 'Action trop volumineuse.');
	const reader = request.body?.getReader();
	if (!reader) return null;
	const chunks: Uint8Array[] = [];
	let size = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		size += value.byteLength;
		if (size > max) {
			await reader.cancel();
			error(413, 'Action trop volumineuse.');
		}
		chunks.push(value);
	}
	try {
		return JSON.parse(Buffer.concat(chunks).toString('utf8'));
	} catch {
		return null;
	}
}

export const POST: RequestHandler = async ({ params, locals, request }) => {
	const viewer = await tableViewer(Number(params.id), locals.user);
	if (!viewer.isAdmin && viewer.playerId !== null && !playerActions.take(String(viewer.playerId))) {
		error(429, 'Doucement ! Trop d’actions d’un coup, réessaie dans quelques secondes.');
	}
	const body = await readJson(request, MAX_BODY_BYTES);
	if (!body || typeof body !== 'object' || Array.isArray(body)) error(400, 'Requête invalide.');
	return json(await runAction(Number(params.id), viewer, body as Record<string, unknown>));
};
