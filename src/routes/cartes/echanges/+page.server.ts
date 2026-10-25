import { fail } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth';
import { RateLimiter } from '$lib/server/ratelimit';
import { CardError } from '$lib/server/cards/settings';
import { acceptTrade, cancelTrade, refuseTrade, tradesOf } from '$lib/server/cards/trades';
import type { Actions, PageServerLoad } from './$types';

const responses = new RateLimiter(30, 60_000);

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals);
	return { trades: await tradesOf(user.id), me: user.id };
};

function respond(run: (tradeId: number, userId: number) => Promise<void>, done: string): Actions[string] {
	return async ({ request, locals }) => {
		const user = requireUser(locals);
		const tradeId = Number((await request.formData()).get('tradeId'));
		if (!Number.isInteger(tradeId) || tradeId < 1) return fail(400, { error: 'Échange inconnu.' });
		if (!responses.take(`trade:${user.id}`)) return fail(429, { error: 'Trop de réponses d’un coup, patiente un instant.' });
		try {
			await run(tradeId, user.id);
		} catch (e) {
			if (e instanceof CardError) return fail(e.status, { error: e.message });
			throw e;
		}
		return { message: done };
	};
}

export const actions: Actions = {
	accept: respond(acceptTrade, 'Échange accepté : les cartes ont changé de mains.'),
	refuse: respond(refuseTrade, 'Proposition refusée.'),
	cancel: respond(cancelTrade, 'Proposition annulée.')
};
