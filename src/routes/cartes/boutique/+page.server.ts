import { fail } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth';
import { walletOf } from '$lib/server/cards/boosters';
import { collectionOf } from '$lib/server/cards/collection';
import { CardError } from '$lib/server/cards/settings';
import { redeemOffer, shopFor } from '$lib/server/cards/shop';
import { RateLimiter } from '$lib/server/ratelimit';
import type { Actions, PageServerLoad } from './$types';

// Échanges rapprochés : au-delà, c'est un script, pas un joueur.
const redeems = new RateLimiter(10, 30_000);

export const load: PageServerLoad = async ({ locals }) => {
	const user = requireUser(locals);
	const [shop, wallet, collection] = await Promise.all([shopFor(user), walletOf(user.id), collectionOf(user.id, user)]);
	return {
		offers: shop.offers,
		refs: shop.refs,
		points: wallet.points,
		mine: { templates: collection.templates, copies: collection.copies }
	};
};

export const actions: Actions = {
	redeem: async ({ request, locals }) => {
		const user = requireUser(locals);
		const form = await request.formData();
		const offerId = Number(form.get('offerId'));
		if (!Number.isInteger(offerId) || offerId < 1) return fail(400, { error: 'Offre inconnue.' });
		const text = String(form.get('picks') ?? '[]');
		if (text.length > 4000) return fail(400, { error: 'Trop de cartes choisies.' });
		let picks: unknown;
		try {
			picks = JSON.parse(text);
		} catch {
			return fail(400, { error: 'Choix des cartes illisible.' });
		}
		if (!redeems.take(`shop:${user.id}`)) {
			return fail(429, { error: 'Doucement : attends quelques secondes avant le prochain échange.' });
		}
		try {
			return { redeemed: await redeemOffer(user.id, offerId, picks) };
		} catch (e) {
			if (e instanceof CardError) return fail(e.status, { error: e.message });
			throw e;
		}
	}
};
