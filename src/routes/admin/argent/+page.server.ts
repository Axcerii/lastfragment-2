import { fail } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		players: await prisma.player.findMany({
			select: { id: true, login: true, money: true, character: { select: { name: true } } },
			// Les comptes qui jouent un personnage d'abord.
			orderBy: [{ characterId: { sort: 'desc', nulls: 'last' } }, { login: 'asc' }]
		})
	};
};

export const actions: Actions = {
	/** Ajoute ou retire un montant à plusieurs joueurs en une fois (champs `amount-<id>`). */
	distribute: async ({ request }) => {
		const form = await request.formData();
		const sign = form.get('mode') === 'remove' ? -1 : 1;

		const changes = [...form.entries()]
			.filter(([name]) => name.startsWith('amount-'))
			.map(([name, value]) => ({
				id: Number(name.slice('amount-'.length)),
				amount: Math.round(Number(value))
			}))
			.filter((c) => Number.isFinite(c.amount) && c.amount !== 0);

		if (changes.length === 0) return fail(400, { error: 'Aucun montant saisi.' });
		if (changes.some((c) => c.amount < 0)) {
			return fail(400, { error: 'Saisis des montants positifs et choisis « Retirer » pour un retrait.' });
		}

		await prisma.$transaction(
			changes.map((c) =>
				prisma.player.update({
					where: { id: c.id },
					data: { money: { increment: sign * c.amount } }
				})
			)
		);

		const total = changes.reduce((sum, c) => sum + c.amount, 0);
		return {
			message: `${total.toLocaleString('fr-FR')} pièces d'or ${sign > 0 ? 'distribuées à' : 'retirées à'} ${changes.length} joueur${changes.length > 1 ? 's' : ''}.`
		};
	}
};
