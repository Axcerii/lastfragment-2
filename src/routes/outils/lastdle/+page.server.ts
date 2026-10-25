import {
	compareAll,
	dailyAnswer,
	dayNumber,
	dlePool,
	playerGuesses,
	playerStats,
	ranking,
	today,
	yesterdayAnswer
} from '$lib/server/dle';
import { cardsVisibleTo } from '$lib/server/cards/settings';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const pool = await dlePool();
	const date = today();
	const user = locals.user;

	// Un joueur connecté retrouve sa partie depuis la base ; un visiteur, depuis son navigateur.
	let account = null;
	if (user) {
		const answer = await dailyAnswer(date, pool);
		const [guesses, stats, board] = await Promise.all([
			playerGuesses(user.id, date),
			playerStats(user.id, date),
			ranking(date, user.id)
		]);
		account = {
			rows: answer ? compareAll(guesses, pool, answer) : [],
			stats,
			ranking: board,
			ranked: !user.isAdmin
		};
	}

	return {
		date,
		day: dayNumber(date),
		// Seulement de quoi proposer les noms : les attributs ne partent qu'avec les essais.
		candidates: pool.map(({ id, name, title, image }) => ({ id, name, title, image })),
		yesterday: await yesterdayAnswer(date),
		// L'énigme du jour rapporte un booster : n'en parler que si le jeu de cartes est visible.
		cards: await cardsVisibleTo(user),
		account
	};
};
