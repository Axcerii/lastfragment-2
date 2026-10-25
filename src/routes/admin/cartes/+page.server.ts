import { fail } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireAdmin } from '$lib/server/auth';
import { saveTemplate } from '$lib/server/cards/manage';
import { CardError, getRules } from '$lib/server/cards/settings';
import { setTotals, templateView } from '$lib/server/cards/views';
import { fromCharacter, fromItem, fromMonster, type Prefill } from '$lib/cards/prefill';
import { toStatBlock } from '$lib/game/stats';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	requireAdmin(locals);
	const [templates, totals, sets, copies, owned, opened, rules, characters, monsters, items] = await Promise.all([
		prisma.cardTemplate.findMany({
			include: { set: true, _count: { select: { copies: true } } },
			orderBy: [{ setId: 'asc' }, { number: 'asc' }, { id: 'asc' }]
		}),
		setTotals(),
		prisma.cardSet.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }),
		prisma.card.count(),
		prisma.card.count({ where: { ownerId: null } }),
		prisma.cardOpening.count(),
		getRules(),
		prisma.character.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, image: true } }),
		prisma.monster.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, image: true } }),
		prisma.item.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, icon: true } })
	]);

	const carded = new Set(templates.filter((t) => t.sourceKind).map((t) => `${t.sourceKind}:${t.sourceId}`));
	return {
		templates: templates.map((t) => ({ ...templateView(t, totals), copies: t._count.copies, inAll: t.inAll })),
		sets: sets.map((s) => ({ id: s.id, name: s.name, code: s.code })),
		stats: { copies, reserve: owned, opened },
		rules,
		sources: {
			personnage: characters.map((c) => ({ id: c.id, name: c.name, image: c.image, carded: carded.has(`personnage:${c.id}`) })),
			monstre: monsters.map((m) => ({ id: m.id, name: m.name, image: m.image, carded: carded.has(`monstre:${m.id}`) })),
			objet: items.map((i) => ({ id: i.id, name: i.name, image: i.icon, carded: carded.has(`objet:${i.id}`) }))
		}
	};
};

const MAX_BULK = 120;

export const actions: Actions = {
	/** Crée d'un coup un brouillon de carte par fiche choisie (personnages, monstres ou objets). */
	bulk: async ({ request, locals }) => {
		requireAdmin(locals);
		const form = await request.formData();
		const kind = String(form.get('kind'));
		const ids = [...new Set(form.getAll('ids').map(Number))].filter((n) => Number.isInteger(n) && n > 0).slice(0, MAX_BULK);
		const setIdText = String(form.get('setId') ?? '');
		const setId = /^\d+$/.test(setIdText) ? Number(setIdText) : null;
		const rarity = Math.min(5, Math.max(1, Number(form.get('rarity')) || 1));
		if (ids.length === 0) return fail(400, { error: 'Coche au moins une fiche.' });

		let prefills: Prefill[] = [];
		if (kind === 'personnage') {
			const rows = await prisma.character.findMany({ where: { id: { in: ids } }, include: { statistics: true }, orderBy: { name: 'asc' } });
			prefills = rows.map(({ statistics, ...c }) => fromCharacter({ ...c, stats: toStatBlock(statistics) }));
		} else if (kind === 'monstre') {
			const rows = await prisma.monster.findMany({ where: { id: { in: ids } }, include: { statistics: true }, orderBy: { name: 'asc' } });
			prefills = rows.map(({ statistics, ...m }) => fromMonster({ ...m, stats: toStatBlock(statistics) }));
		} else if (kind === 'objet') {
			const rows = await prisma.item.findMany({ where: { id: { in: ids } }, orderBy: { name: 'asc' } });
			prefills = rows.map(fromItem);
		} else {
			return fail(400, { error: 'Type de fiche inconnu.' });
		}

		let created = 0;
		const failed: string[] = [];
		for (const prefill of prefills) {
			const save = (face: unknown) =>
				saveTemplate(null, {
					name: prefill.name,
					type: prefill.type,
					rarity: prefill.rarity ?? rarity,
					setId,
					number: null,
					status: 'brouillon',
					inAll: true,
					weight: 10,
					maxPrints: null,
					sourceKind: prefill.sourceKind,
					sourceId: prefill.sourceId,
					face
				});
			try {
				await save(prefill.face);
				created++;
			} catch (e) {
				if (!(e instanceof CardError)) throw e;
				// Portrait absent du disque (ancien import) : la carte est créée sans image.
				try {
					await save({ ...prefill.face, art: null });
					created++;
					failed.push(`${prefill.name} : créée sans image (${e.message})`);
				} catch (again) {
					if (!(again instanceof CardError)) throw again;
					failed.push(`${prefill.name} : ${again.message}`);
				}
			}
		}
		return { created, failed };
	}
};
