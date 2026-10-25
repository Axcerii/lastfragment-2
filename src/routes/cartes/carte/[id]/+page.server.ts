import { error, fail } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireAdmin, requireUser } from '$lib/server/auth';
import { togglePin } from '$lib/server/cards/collection';
import { moveCard, removeCard } from '$lib/server/cards/copies';
import { CardError } from '$lib/server/cards/settings';
import { COLLECTOR_SELECT, collectorName, COPY_INCLUDE, ownedView, setTotals } from '$lib/server/cards/views';
import type { Actions, PageServerLoad } from './$types';

function cardId(param: string) {
	if (!/^\d{1,9}$/.test(param)) error(404, 'Carte introuvable.');
	return Number(param);
}

export const load: PageServerLoad = async ({ locals, params }) => {
	const user = requireUser(locals);
	const id = cardId(params.id);
	const card = await prisma.card.findUnique({ where: { id }, include: COPY_INCLUDE });
	// Un brouillon n'a pas d'exemplaire ; on vérifie quand même qu'il ne fuite pas.
	if (!card || (card.template.status === 'brouillon' && !user.isAdmin)) error(404, 'Carte introuvable.');

	const [events, totals, circulating, players] = await Promise.all([
		prisma.cardEvent.findMany({
			where: { cardId: id },
			orderBy: { id: 'asc' },
			include: { from: { select: COLLECTOR_SELECT }, to: { select: COLLECTOR_SELECT } }
		}),
		setTotals(),
		prisma.card.count({ where: { templateId: card.templateId, ownerId: { not: null } } }),
		user.isAdmin ? prisma.player.findMany({ select: { id: true, login: true }, orderBy: { login: 'asc' } }) : []
	]);

	return {
		card: ownedView(card, totals),
		mine: card.ownerId === user.id,
		isAdmin: user.isAdmin,
		circulating,
		players,
		events: events.map((e) => ({
			id: e.id,
			kind: e.kind,
			from: e.from ? collectorName(e.from) : null,
			to: e.to ? collectorName(e.to) : null,
			at: e.createdAt.toISOString()
		}))
	};
};

const failWith = (e: unknown) => {
	if (e instanceof CardError) return fail(e.status, { error: e.message });
	throw e;
};

export const actions: Actions = {
	pin: async ({ locals, params }) => {
		const user = requireUser(locals);
		try {
			await togglePin(cardId(params.id), user.id);
		} catch (e) {
			return failWith(e);
		}
		return { done: true };
	},

	remove: async ({ locals, params }) => {
		requireAdmin(locals);
		try {
			await removeCard(cardId(params.id));
		} catch (e) {
			return failWith(e);
		}
		return { done: true };
	},

	move: async ({ locals, params, request }) => {
		requireAdmin(locals);
		const toId = Number((await request.formData()).get('toId'));
		if (!Number.isInteger(toId) || toId < 1) return fail(400, { error: 'Choisis un joueur.' });
		try {
			await moveCard(cardId(params.id), toId);
		} catch (e) {
			return failWith(e);
		}
		return { done: true };
	}
};
