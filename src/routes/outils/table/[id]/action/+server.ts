import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { tableViewer } from '$lib/server/table/access';
import { runAction } from '$lib/server/table/actions';

export const POST: RequestHandler = async ({ params, locals, request }) => {
	const viewer = await tableViewer(Number(params.id), locals.user);
	const body = await request.json().catch(() => null);
	if (!body || typeof body !== 'object') error(400, 'Requête invalide.');
	return json(await runAction(Number(params.id), viewer, body));
};
