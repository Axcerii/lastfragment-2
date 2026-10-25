import { fail } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireAdmin } from '$lib/server/auth';
import { accrue } from '$lib/cards/booster';
import { giftBoosters } from '$lib/server/cards/boosters';
import { CardError, getRules, RULE_BOUNDS, saveRules } from '$lib/server/cards/settings';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	requireAdmin(locals);
	const [rules, players] = await Promise.all([
		getRules(),
		prisma.player.findMany({
			orderBy: { login: 'asc' },
			select: { id: true, login: true, cardWallet: true, _count: { select: { cards: true } } }
		})
	]);
	const now = Date.now();
	return {
		rules,
		bounds: RULE_BOUNDS,
		players: players.map((p) => ({
			id: p.id,
			login: p.login,
			cards: p._count.cards,
			opened: p.cardWallet?.opened ?? 0,
			stock: p.cardWallet
				? accrue({ stock: p.cardWallet.stock, since: p.cardWallet.since.getTime() }, rules, now).stock
				: null
		}))
	};
};

function bounded(form: FormData, name: keyof typeof RULE_BOUNDS, value?: number) {
	const n = value ?? Number(form.get(name));
	const [min, max] = RULE_BOUNDS[name];
	if (!Number.isFinite(n) || n < min || n > max) throw new CardError(`Valeur hors limites (${min} à ${max}).`);
	return Math.round(n);
}

export const actions: Actions = {
	rules: async ({ request, locals }) => {
		requireAdmin(locals);
		const form = await request.formData();
		try {
			const hours = Number(String(form.get('hours') ?? '').replace(',', '.'));
			const rates: Record<number, number> = {};
			for (const r of [1, 2, 3, 4, 5]) {
				const value = Number(String(form.get(`rate${r}`) ?? '').replace(',', '.'));
				if (!Number.isFinite(value) || value < 0 || value > 100) throw new CardError('Chaque taux va de 0 à 100.');
				rates[r] = Math.round(value * 100) / 100;
			}
			if (Object.values(rates).every((v) => v === 0)) throw new CardError('Au moins un taux doit dépasser 0.');
			const godPack = Number(String(form.get('godPack') ?? '0').replace(',', '.'));
			if (!Number.isFinite(godPack) || godPack < 0 || godPack > 100) throw new CardError('La chance de God Pack va de 0 à 100 %.');
			await saveRules({
				minutes: bounded(form, 'minutes', hours * 60),
				max: bounded(form, 'max'),
				starter: bounded(form, 'starter'),
				count: bounded(form, 'count'),
				guaranteed: bounded(form, 'guaranteed'),
				godPack: Math.round(godPack * 100) / 100,
				rates
			});
		} catch (e) {
			if (e instanceof CardError) return fail(400, { error: e.message });
			throw e;
		}
		return { message: 'Réglages enregistrés.' };
	},

	gift: async ({ request, locals }) => {
		requireAdmin(locals);
		const form = await request.formData();
		const amount = Math.round(Number(form.get('amount')));
		if (!Number.isInteger(amount) || amount === 0 || Math.abs(amount) > 50) {
			return fail(400, { error: 'Nombre de boosters entre -50 et 50 (hors 0).' });
		}
		const target = String(form.get('playerId') ?? '');
		const ids =
			target === 'tous'
				? (await prisma.player.findMany({ select: { id: true } })).map((p) => p.id)
				: /^\d+$/.test(target)
					? [Number(target)]
					: [];
		if (ids.length === 0) return fail(400, { error: 'Choisis un joueur, ou « Tous les joueurs ».' });
		await giftBoosters(ids, amount);
		return {
			message: `${amount > 0 ? '+' : ''}${amount} booster${Math.abs(amount) > 1 ? 's' : ''} pour ${ids.length > 1 ? `${ids.length} joueurs` : '1 joueur'}.`
		};
	}
};
