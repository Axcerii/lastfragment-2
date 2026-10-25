import { error, json } from '@sveltejs/kit';
import {
	compareAll,
	dailyAnswer,
	dlePool,
	infiniteToken,
	readInfiniteToken,
	recordGuess,
	today
} from '$lib/server/dle';
import { RateLimiter } from '$lib/server/ratelimit';
import { giftBoosters } from '$lib/server/cards/boosters';
import { cardsVisibleTo } from '$lib/server/cards/settings';
import type { RequestHandler } from './$types';

const MAX_BODY = 4096;
// Un essai par personnage au plus : la liste complète d'une partie tient sous cette borne.
const MAX_GUESSES = 200;
const requests = new RateLimiter(60, 60 * 1000);

/**
 * Compare des essais au personnage à trouver. La réponse ne quitte jamais le serveur : seules
 * les comparaisons partent.
 *
 * - `{ mode: 'daily', date, guesses }` : énigme du jour. Connecté, chaque essai est enregistré
 *   sur le compte ; sinon, la page renvoie toute sa partie à chaque chargement.
 *   L'énigme du jour trouvée rapporte un booster, si le jeu de cartes est visible du joueur
 *   (caché, il n'existe pas encore pour lui).
 * - `{ mode: 'infinite' }` : nouveau personnage au hasard, renvoyé sous forme de jeton chiffré.
 * - `{ mode: 'infinite', token, guesses }` : essais contre ce personnage, sans rien enregistrer.
 */
export const POST: RequestHandler = async ({ request, locals, getClientAddress }) => {
	if (!requests.take(getClientAddress())) error(429, 'Doucement : réessaie dans une minute.');

	const raw = await request.text();
	if (raw.length > MAX_BODY) error(413, 'Requête trop longue.');

	let body: { mode?: unknown; date?: unknown; token?: unknown; guesses?: unknown };
	try {
		body = JSON.parse(raw);
	} catch {
		error(400, 'Requête invalide.');
	}

	const guesses = body.guesses ?? [];
	if (!Array.isArray(guesses) || guesses.length > MAX_GUESSES) error(400, 'Essais invalides.');
	const ids = [...new Set(guesses.filter((id): id is number => Number.isInteger(id)))];
	const pool = await dlePool();

	if (body.mode === 'infinite') {
		if (body.token === undefined) return json({ token: infiniteToken(pool) });
		const answerId = typeof body.token === 'string' ? readInfiniteToken(body.token) : null;
		const answer = pool.find((c) => c.id === answerId);
		// Jeton altéré, ou personnage caché depuis : on repart sur un autre.
		if (!answer) return json({ token: infiniteToken(pool), rows: [] });
		return json({ rows: compareAll(ids, pool, answer) });
	}

	const date = today();
	// Minuit est passé depuis l'ouverture de la page : la partie d'hier ne se compare plus.
	if (body.date !== date) return json({ expired: true });

	const answer = await dailyAnswer(date, pool);
	if (!answer) error(404, 'Aucun personnage à deviner pour le moment.');

	const user = locals.user;
	if (!user) return json({ rows: compareAll(ids, pool, answer) });

	// Connecté : un seul essai à la fois, enregistré, et la partie complète en retour.
	if (ids.length !== 1 || !pool.some((c) => c.id === ids[0])) error(400, 'Un essai à la fois.');
	const { ids: all, solved } = await recordGuess(user.id, date, ids[0], ids[0] === answer.id);
	const rows = compareAll(all, pool, answer);
	if (solved && (await cardsVisibleTo(user))) {
		await giftBoosters([user.id], 1);
		return json({ rows, booster: true });
	}
	return json({ rows });
};
