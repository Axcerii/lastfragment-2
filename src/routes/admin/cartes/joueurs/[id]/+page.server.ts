import { error, fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth';
import { moveCardsOf, playerCards, readIds, removeCardsOf, replayOpening, unpinCardsOf } from '$lib/server/cards/admin';
import { giftBoosters, setBoosterStock } from '$lib/server/cards/boosters';
import { giveCard } from '$lib/server/cards/copies';
import { CardError } from '$lib/server/cards/settings';
import type { Actions, PageServerLoad } from './$types';

// Tout /admin est déjà réservé au MJ par hooks.server.ts ; chaque action le revérifie quand même.

function playerId(param: string) {
	if (!/^\d{1,9}$/.test(param)) error(404, 'Joueur introuvable.');
	return Number(param);
}

/** Entier borné lu dans le formulaire, ou null. */
function intField(form: FormData, name: string, min: number, max: number): number | null {
	const text = String(form.get(name) ?? '').trim();
	if (!/^-?\d{1,6}$/.test(text)) return null;
	const n = Number(text);
	return n >= min && n <= max ? n : null;
}

const failWith = (e: unknown) => {
	if (e instanceof CardError) return fail(e.status, { error: e.message });
	throw e;
};

export const load: PageServerLoad = async ({ locals, params }) => {
	requireAdmin(locals);
	try {
		return await playerCards(playerId(params.id));
	} catch (e) {
		if (e instanceof CardError) error(e.status, e.message);
		throw e;
	}
};

export const actions: Actions = {
	/** Ajoute (ou retire) des boosters à la réserve. */
	gift: async ({ request, locals, params }) => {
		requireAdmin(locals);
		const id = playerId(params.id);
		const amount = intField(await request.formData(), 'amount', -50, 50);
		if (!amount) return fail(400, { error: 'Nombre de boosters entre -50 et 50 (hors 0).' });
		await giftBoosters([id], amount);
		return { message: `${amount > 0 ? '+' : ''}${amount} booster${Math.abs(amount) > 1 ? 's' : ''}.` };
	},

	/** Fixe la réserve à un nombre exact. */
	stock: async ({ request, locals, params }) => {
		requireAdmin(locals);
		const id = playerId(params.id);
		const stock = intField(await request.formData(), 'stock', 0, 99);
		if (stock === null) return fail(400, { error: 'Réserve entre 0 et 99 boosters.' });
		try {
			await setBoosterStock(id, stock);
		} catch (e) {
			return failWith(e);
		}
		return { message: `Réserve fixée à ${stock} booster${stock > 1 ? 's' : ''}.` };
	},

	/** Donne des exemplaires neufs d'une carte. */
	give: async ({ request, locals, params }) => {
		requireAdmin(locals);
		const id = playerId(params.id);
		const form = await request.formData();
		const templateId = intField(form, 'templateId', 1, 999_999);
		const count = intField(form, 'count', 1, 20) ?? 1;
		if (!templateId) return fail(400, { error: 'Choisis une carte.' });
		try {
			const given = await giveCard(templateId, id, count);
			return { message: `${given} exemplaire${given > 1 ? 's' : ''} donné${given > 1 ? 's' : ''}.` };
		} catch (e) {
			return failWith(e);
		}
	},

	/** Retire les exemplaires cochés (ils vont dans la réserve du MJ). */
	remove: async ({ request, locals, params }) => {
		requireAdmin(locals);
		const id = playerId(params.id);
		const ids = readIds((await request.formData()).getAll('cards'));
		if (ids.length === 0) return fail(400, { error: 'Coche au moins une carte.' });
		const done = await removeCardsOf(id, ids);
		return { message: `${done} exemplaire${done > 1 ? 's' : ''} retiré${done > 1 ? 's' : ''} (dans ta réserve).` };
	},

	/** Déplace les exemplaires cochés vers un autre joueur. */
	move: async ({ request, locals, params }) => {
		requireAdmin(locals);
		const id = playerId(params.id);
		const form = await request.formData();
		const ids = readIds(form.getAll('cards'));
		const toId = intField(form, 'toId', 1, 999_999_999);
		if (ids.length === 0) return fail(400, { error: 'Coche au moins une carte.' });
		if (!toId) return fail(400, { error: 'Choisis à qui donner les cartes.' });
		try {
			const done = await moveCardsOf(id, ids, toId);
			return { message: `${done} exemplaire${done > 1 ? 's' : ''} déplacé${done > 1 ? 's' : ''}.` };
		} catch (e) {
			return failWith(e);
		}
	},

	/** Retire les exemplaires cochés de la vitrine. */
	unpin: async ({ request, locals, params }) => {
		requireAdmin(locals);
		const id = playerId(params.id);
		const ids = readIds((await request.formData()).getAll('cards'));
		const done = await unpinCardsOf(id, ids);
		return { message: done ? `${done} carte${done > 1 ? 's' : ''} retirée${done > 1 ? 's' : ''} de la vitrine.` : 'Aucune carte cochée n’était en vitrine.' };
	},

	/** Repropose une ouverture de booster au joueur (sans rien retirer). */
	replay: async ({ request, locals, params }) => {
		requireAdmin(locals);
		const id = playerId(params.id);
		const openingId = intField(await request.formData(), 'openingId', 1, 999_999_999);
		if (!openingId) return fail(400, { error: 'Ouverture inconnue.' });
		try {
			await replayOpening(id, openingId);
		} catch (e) {
			return failWith(e);
		}
		return { message: 'Le joueur reverra cette ouverture à sa prochaine visite.' };
	}
};
