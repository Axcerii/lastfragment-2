import { fail } from '@sveltejs/kit';
import { CONTAINER_KEYS, type ContainerKey } from '$lib/game/inventory';
import { prisma } from '$lib/server/prisma';
import { loadSheet, sheetActions } from '$lib/server/sheet';
import { showcaseOf } from '$lib/server/cards/collection';
import type { Actions, PageServerLoad } from './$types';

// Tout /admin est déjà réservé au MJ par hooks.server.ts.

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id) || 0;
	const [sheet, items, showcase] = await Promise.all([
		loadSheet(id),
		prisma.item.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
		showcaseOf([id])
	]);
	return { sheet, items, showcase: showcase.get(id) ?? [] };
};

export const actions: Actions = {
	...sheetActions(({ params }) => Number(params.id)),

	/** Ajoute un objet du catalogue à l'inventaire du joueur. */
	giveItem: async ({ request, params }) => {
		const form = await request.formData();
		const itemId = Number(form.get('itemId'));
		const quantity = Math.max(1, Math.round(Number(form.get('quantity')) || 1));
		const container = String(form.get('container')) as ContainerKey;

		if (!itemId || !CONTAINER_KEYS.includes(container)) {
			return fail(400, { error: 'Choisis un objet et un conteneur.' });
		}

		await prisma.itemInPlayer.create({
			data: {
				itemId,
				quantity,
				localisation: container,
				playerId: container === 'commun' ? null : Number(params.id)
			}
		});
		return { message: 'Objet ajouté.' };
	},

	/** Retire un objet de l'inventaire du joueur, ou du coffre commun. */
	removeItem: async ({ request, params }) => {
		const form = await request.formData();
		await prisma.itemInPlayer.deleteMany({
			where: { id: Number(form.get('id')), OR: [{ playerId: Number(params.id) }, { playerId: null }] }
		});
	},

	/** Ajoute (ou retire, avec un montant négatif) de l'argent au joueur. */
	money: async ({ request, params }) => {
		const form = await request.formData();
		const amount = Math.round(Number(form.get('amount')));
		if (!Number.isFinite(amount) || amount === 0) return fail(400, { error: 'Montant invalide.' });

		await prisma.player.update({
			where: { id: Number(params.id) },
			data: { money: { increment: amount } }
		});
		return { message: 'Argent mis à jour.' };
	}
};
