import { fail } from '@sveltejs/kit';
import {
	BULK_FIELDS,
	findBulkField,
	MAX_BULK_CHANGES,
	parseEditable,
	toEditable,
	type BulkChange,
	type BulkValue
} from '$lib/admin/bulk';
import { requireAdmin } from '$lib/server/auth';
import { prisma } from '$lib/server/prisma';
import type { Actions, PageServerLoad } from './$types';

const select = Object.fromEntries([
	['id', true],
	['image', true],
	...BULK_FIELDS.map((f) => [f.name, true])
]) as Record<string, true>;

export const load: PageServerLoad = async () => {
	const characters = await prisma.character.findMany({ select, orderBy: { name: 'asc' } });
	return {
		rows: characters.map((c: Record<string, any>) => ({
			id: c.id as number,
			image: c.image as string | null,
			values: Object.fromEntries(BULK_FIELDS.map((f) => [f.name, toEditable(f, c[f.name])])) as Record<
				string,
				BulkValue
			>
		}))
	};
};

class Conflict extends Error {}

export const actions: Actions = {
	/**
	 * Enregistre un lot de modifications, tout ou rien. Chaque changement porte la valeur que le MJ
	 * avait sous les yeux : si la fiche a bougé entre-temps (autre onglet, back-office), rien n'est écrit.
	 */
	save: async ({ request, locals }) => {
		requireAdmin(locals);
		const form = await request.formData();

		let changes: BulkChange[];
		try {
			changes = JSON.parse(String(form.get('changes') ?? '[]'));
		} catch {
			return fail(400, { error: 'Modifications illisibles.' });
		}
		if (!Array.isArray(changes) || changes.length === 0) return fail(400, { error: 'Aucune modification à enregistrer.' });
		if (changes.length > MAX_BULK_CHANGES) {
			return fail(400, { error: `Trop de modifications d'un coup (${MAX_BULK_CHANGES} au plus).` });
		}

		// Validation complète avant d'écrire quoi que ce soit.
		const updates = new Map<number, Record<string, unknown>>();
		const seen = new Set<string>();
		for (const change of changes) {
			const field = findBulkField(change?.field);
			if (!field || !Number.isInteger(change.id)) return fail(400, { error: 'Modification invalide.' });
			const key = `${change.id}:${field.name}`;
			if (seen.has(key)) return fail(400, { error: 'La même case est modifiée deux fois.' });
			seen.add(key);

			const parsed = parseEditable(field, change.after);
			if (!parsed.ok) return fail(400, { error: parsed.error });
			updates.set(change.id, { ...updates.get(change.id), [field.name]: parsed.value });
		}

		try {
			const saved = await prisma.$transaction(async (tx) => {
				const ids = [...updates.keys()];
				const current: Record<string, any>[] = await tx.character.findMany({ where: { id: { in: ids } }, select });
				const byId = new Map(current.map((c) => [c.id as number, c]));

				const stale = new Set<string>();
				for (const change of changes) {
					const record = byId.get(change.id);
					if (!record) throw new Conflict('Un personnage de la liste a été supprimé entre-temps.');
					const field = findBulkField(change.field)!;
					if (toEditable(field, record[field.name]) !== change.before) stale.add(record.name);
				}
				if (stale.size) {
					throw new Conflict(
						`Modifié ailleurs entre-temps : ${[...stale].slice(0, 5).join(', ')}${stale.size > 5 ? '…' : ''}. Recharge la page.`
					);
				}

				for (const [id, data] of updates) await tx.character.update({ where: { id }, data });
				return updates.size;
			});

			// De quoi annuler : les mêmes cases, dans l'autre sens, telles qu'enregistrées.
			const after = await prisma.character.findMany({ where: { id: { in: [...updates.keys()] } }, select });
			const byId = new Map(after.map((c: Record<string, any>) => [c.id as number, c]));
			const undo: BulkChange[] = changes.map((c) => {
				const field = findBulkField(c.field)!;
				return { id: c.id, field: field.name, before: toEditable(field, byId.get(c.id)?.[field.name]), after: c.before };
			});

			return {
				message: `${changes.length} case${changes.length > 1 ? 's' : ''} enregistrée${changes.length > 1 ? 's' : ''} sur ${saved} personnage${saved > 1 ? 's' : ''}.`,
				undo
			};
		} catch (e) {
			if (e instanceof Conflict) return fail(409, { error: e.message });
			throw e;
		}
	}
};
