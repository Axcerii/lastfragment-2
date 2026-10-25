import { error, fail, redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireUser } from '$lib/server/auth';
import { RateLimiter } from '$lib/server/ratelimit';
import { collectionOf } from '$lib/server/cards/collection';
import { line } from '$lib/server/cards/text';
import { CardError } from '$lib/server/cards/settings';
import { MAX_TRADE_SIDE, proposeTrade } from '$lib/server/cards/trades';
import { COLLECTOR_SELECT, collectorView } from '$lib/server/cards/views';
import type { Actions, PageServerLoad } from './$types';

const proposals = new RateLimiter(10, 10 * 60_000);

const idParam = (value: string | null) => (value && /^\d{1,9}$/.test(value) ? Number(value) : null);

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = requireUser(locals);
	const partnerId = idParam(url.searchParams.get('avec'));
	const give = idParam(url.searchParams.get('donne'));
	const want = idParam(url.searchParams.get('carte'));

	if (partnerId === user.id) redirect(303, '/cartes/echanges/nouveau');

	if (!partnerId) {
		const players = await prisma.player.findMany({
			where: { id: { not: user.id } },
			select: COLLECTOR_SELECT
		});
		const list = players.map(collectorView).sort((a, b) => a.name.localeCompare(b.name));
		return { step: 'partenaire' as const, players: list, give };
	}

	let partner;
	try {
		partner = await collectionOf(partnerId);
	} catch (e) {
		if (e instanceof CardError) error(e.status, e.message);
		throw e;
	}
	const mine = await collectionOf(user.id);
	return {
		step: 'cartes' as const,
		mine: { templates: mine.templates, copies: mine.copies },
		partner: { owner: partner.owner, templates: partner.templates, copies: partner.copies },
		give: give && mine.copies.some((c) => c.id === give) ? give : null,
		want: want && partner.copies.some((c) => c.id === want) ? want : null,
		max: MAX_TRADE_SIDE
	};
};

export const actions: Actions = {
	propose: async ({ request, locals }) => {
		const user = requireUser(locals);
		const form = await request.formData();
		const toId = Number(form.get('toId'));
		const ids = (name: string) => form.getAll(name).map(Number).filter((n) => Number.isInteger(n) && n > 0);
		const message = line(form.get('message'), 200);
		if (!Number.isInteger(toId) || toId < 1) return fail(400, { error: 'Choisis avec qui échanger.' });
		if (!proposals.take(`propose:${user.id}`)) {
			return fail(429, { error: 'Beaucoup de propositions d’un coup : réessaie dans quelques minutes.' });
		}
		try {
			await proposeTrade(user.id, toId, ids('offered'), ids('requested'), message);
		} catch (e) {
			if (e instanceof CardError) return fail(e.status, { error: e.message });
			throw e;
		}
		redirect(303, '/cartes/echanges?envoye');
	}
};
