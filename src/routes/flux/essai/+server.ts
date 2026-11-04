import { error, json } from '@sveltejs/kit';
import { COUNTRIES, DRAGONS } from '$lib/flux/discovery';
import { checkConstellation, checkCountry, isDragon } from '$lib/server/flux/discovery';
import { checkSecret, unlockSecret } from '$lib/server/flux/secret';
import { RateLimiter } from '$lib/server/ratelimit';
import type { RequestHandler } from './$types';

const MAX_BODY = 1024;
const MAX_GUESS = 64;
const requests = new RateLimiter(90, 60 * 1000);

/**
 * Vérifie un essai des énigmes de /flux. Les réponses ne quittent jamais le serveur.
 *
 * - `{ type: 'constellation', sequence }` : dragons cliqués jusqu'ici, dans l'ordre.
 * - `{ type: 'country', id, guess }` : nom proposé pour un pays de la carte.
 * - `{ type: 'secret', race, answers }` : chemin secret suivi jusqu'au bout ? Si oui, un cookie
 *   signé ouvre la page secrète (voir $lib/server/flux/secret).
 *
 * Rien n'est enregistré ici : la page garde la progression dans le navigateur.
 */
export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	if (!requests.take(getClientAddress())) error(429, 'Doucement : réessaie dans une minute.');

	const raw = await request.text();
	if (raw.length > MAX_BODY) error(413, 'Requête trop longue.');

	let body: { type?: unknown; sequence?: unknown; id?: unknown; guess?: unknown; race?: unknown; answers?: unknown };
	try {
		body = JSON.parse(raw);
	} catch {
		error(400, 'Requête invalide.');
	}

	if (body.type === 'constellation') {
		const sequence = body.sequence;
		if (!Array.isArray(sequence) || sequence.length > DRAGONS.length || !sequence.every(isDragon))
			error(400, 'Séquence invalide.');
		return json(checkConstellation(sequence));
	}

	if (body.type === 'country') {
		const { id, guess } = body;
		if (typeof id !== 'string' || !COUNTRIES.some((c) => c.id === id)) error(400, 'Pays inconnu.');
		if (typeof guess !== 'string' || guess.length > MAX_GUESS) error(400, 'Nom invalide.');
		const description = checkCountry(id, guess);
		return json(description ? { found: true, description } : { found: false });
	}

	if (body.type === 'secret') {
		const opened = checkSecret(body.race, body.answers);
		if (opened) unlockSecret(cookies);
		return json({ opened });
	}

	error(400, 'Requête invalide.');
};
