import { fail } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireUser } from '$lib/server/auth';
import { boosterChoices, markSeen, openBooster, unseenBoosters, walletOf } from '$lib/server/cards/boosters';
import { RateLimiter } from '$lib/server/ratelimit';
import { CardError, getRules } from '$lib/server/cards/settings';
import { UNIQUE_RARITY } from '$lib/cards/types';
import { solvedOn, today } from '$lib/server/dle';
import type { Actions, PageServerLoad } from './$types';

// Ouvertures rapprochées : au-delà, c'est un script, pas un joueur.
const openings = new RateLimiter(6, 30_000);

const idOrNull = (value: FormDataEntryValue | null) => {
	const text = String(value ?? '');
	return /^\d{1,9}$/.test(text) ? Number(text) : null;
};

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) return { guest: true as const };
	const rules = await getRules();
	const [wallet, choices, owned, unseen, base, dleSolved] = await Promise.all([
		walletOf(locals.user.id, rules),
		boosterChoices(),
		prisma.card.findMany({
			where: { ownerId: locals.user.id, template: { setId: { not: null }, rarity: { lt: UNIQUE_RARITY } } },
			select: { template: { select: { setId: true } } },
			distinct: ['templateId']
		}),
		unseenBoosters(locals.user.id),
		prisma.cardTemplate.groupBy({
			by: ['setId'],
			where: { status: { not: 'brouillon' }, setId: { not: null }, rarity: { lt: UNIQUE_RARITY } },
			_count: { _all: true }
		}),
		solvedOn(locals.user.id, today())
	]);

	// Avancement de l'album de chaque série, hors Unique (comme dans la collection).
	const mine = new Map<number, number>();
	for (const card of owned) mine.set(card.template.setId!, (mine.get(card.template.setId!) ?? 0) + 1);
	const progress = Object.fromEntries(
		base.map((row) => [row.setId!, { owned: mine.get(row.setId!) ?? 0, total: row._count._all }])
	);

	// Un paquet au hasard par booster pour la vitrine : le choix reste ouvert à l'ouverture.
	const pick = (n: number) => Math.floor(Math.random() * Math.max(1, n));
	return {
		guest: false as const,
		wallet,
		choices,
		count: rules.count,
		unseen,
		progress,
		dleSolved,
		featured: { all: pick(choices.all.packs.length), banners: Object.fromEntries(choices.banners.map((b) => [b.id, pick(b.packs.length)])) }
	};
};

export const actions: Actions = {
	open: async ({ request, locals }) => {
		const user = requireUser(locals);
		const form = await request.formData();
		if (!openings.take(`open:${user.id}`)) {
			return fail(429, { error: 'Doucement : attends quelques secondes avant le prochain booster.' });
		}
		try {
			return { opened: await openBooster(user.id, idOrNull(form.get('setId')), idOrNull(form.get('packId'))) };
		} catch (e) {
			if (e instanceof CardError) return fail(e.status, { error: e.message });
			throw e;
		}
	},

	/** Le joueur a vu tout le booster : il ne lui sera plus reproposé. */
	seen: async ({ request, locals }) => {
		const user = requireUser(locals);
		const openingId = idOrNull((await request.formData()).get('openingId'));
		if (openingId) await markSeen(openingId, user.id);
		return { seen: true };
	}
};
