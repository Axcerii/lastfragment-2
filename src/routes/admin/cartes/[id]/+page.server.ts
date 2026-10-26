import { error, fail, redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { requireAdmin } from '$lib/server/auth';
import { giveCard } from '$lib/server/cards/copies';
import { deleteTemplate, duplicateTemplate, readTemplateForm, saveTemplate } from '$lib/server/cards/manage';
import { CardError } from '$lib/server/cards/settings';
import { COLLECTOR_SELECT, collectorView, setTotals } from '$lib/server/cards/views';
import { isCardType, readFace } from '$lib/cards/types';
import { toStatBlock } from '$lib/game/stats';
import type { Actions, PageServerLoad } from './$types';

function templateId(param: string): number | null {
	if (param === 'nouvelle') return null;
	if (!/^\d{1,9}$/.test(param)) error(404, 'Carte introuvable.');
	return Number(param);
}

export const load: PageServerLoad = async ({ params, locals }) => {
	requireAdmin(locals);
	const id = templateId(params.id);
	const [template, sets, totals, characters, monsters, items, players, copies] = await Promise.all([
		id ? prisma.cardTemplate.findUnique({ where: { id }, include: { boosters: { select: { setId: true } } } }) : null,
		prisma.cardSet.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }),
		setTotals(),
		prisma.character.findMany({
			orderBy: { name: 'asc' },
			select: {
				id: true,
				name: true,
				title: true,
				image: true,
				dragon: true,
				race: true,
				country: true,
				flux: true,
				job: true,
				quote: true,
				description: true,
				statistics: true
			}
		}),
		prisma.monster.findMany({
			orderBy: { name: 'asc' },
			select: {
				id: true,
				name: true,
				image: true,
				dragon: true,
				size: true,
				weight: true,
				dangerosity: true,
				effect: true,
				description: true,
				statistics: true
			}
		}),
		prisma.item.findMany({
			orderBy: { name: 'asc' },
			select: { id: true, name: true, category: true, rarity: true, weight: true, icon: true, description: true }
		}),
		prisma.player.findMany({ orderBy: { login: 'asc' }, select: { ...COLLECTOR_SELECT, login: true } }),
		id
			? prisma.card.findMany({
					where: { templateId: id },
					orderBy: { serial: 'desc' },
					take: 200,
					include: { owner: { select: { id: true, login: true } } }
				})
			: []
	]);
	if (id && !template) error(404, 'Carte introuvable.');

	const type = template && isCardType(template.type) ? template.type : 'personnage';
	return {
		template: template
			? {
					id: template.id,
					name: template.name,
					type,
					rarity: template.rarity,
					setId: template.setId,
					boosters: template.boosters.map((b) => b.setId),
					number: template.number,
					status: template.status,
					inAll: template.inAll,
					weight: template.weight,
					maxPrints: template.maxPrints,
					printed: template.printed,
					sourceKind: template.sourceKind,
					sourceId: template.sourceId,
					face: readFace(template.face, type, template.rarity)
				}
			: null,
		sets: sets.map((s) => ({
			id: s.id,
			name: s.name,
			code: s.code,
			color: s.color,
			logo: s.logo,
			total: totals.get(s.id) ?? 0
		})),
		sources: {
			characters: characters.map(({ statistics, ...c }) => ({ ...c, stats: toStatBlock(statistics) })),
			monsters: monsters.map(({ statistics, ...m }) => ({ ...m, stats: toStatBlock(statistics) })),
			items
		},
		players: players.map((p) => ({ ...collectorView(p), login: p.login })),
		copies: copies.map((c) => ({
			id: c.id,
			serial: c.serial,
			wear: c.wear,
			owner: c.owner?.login ?? null,
			obtainedAt: c.obtainedAt.toISOString()
		}))
	};
};

const failWith = (e: unknown) => {
	if (e instanceof CardError) return fail(e.status, { error: e.message });
	throw e;
};

export const actions: Actions = {
	save: async ({ request, params, locals }) => {
		requireAdmin(locals);
		const id = templateId(params.id);
		let saved: number;
		try {
			saved = await saveTemplate(id, readTemplateForm(await request.formData()));
		} catch (e) {
			return failWith(e);
		}
		if (!id) redirect(303, `/admin/cartes/${saved}?creee`);
		return { saved: true };
	},

	duplicate: async ({ params, locals }) => {
		requireAdmin(locals);
		const id = templateId(params.id);
		if (!id) return fail(400, { error: 'Enregistre la carte avant de la dupliquer.' });
		let copy: number;
		try {
			copy = await duplicateTemplate(id);
		} catch (e) {
			return failWith(e);
		}
		redirect(303, `/admin/cartes/${copy}`);
	},

	delete: async ({ params, locals }) => {
		requireAdmin(locals);
		const id = templateId(params.id);
		if (!id) redirect(303, '/admin/cartes');
		try {
			await deleteTemplate(id);
		} catch (e) {
			return failWith(e);
		}
		redirect(303, '/admin/cartes');
	},

	give: async ({ request, params, locals }) => {
		requireAdmin(locals);
		const id = templateId(params.id);
		if (!id) return fail(400, { error: 'Enregistre la carte avant de la donner.' });
		const form = await request.formData();
		const playerId = Number(form.get('playerId'));
		const count = Math.min(20, Math.max(1, Number(form.get('count')) || 1));
		if (!Number.isInteger(playerId) || playerId < 1) return fail(400, { error: 'Choisis un joueur.' });
		try {
			const given = await giveCard(id, playerId, count);
			return { given };
		} catch (e) {
			return failWith(e);
		}
	}
};
