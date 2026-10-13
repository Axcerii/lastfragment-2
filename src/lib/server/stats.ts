import { STAT_KEYS, type StatBlock } from '$lib/game/stats';
import { prisma } from './prisma';

/** Lit les 13 stats d'un formulaire (champs nommés par leur clé). Les valeurs vides valent 0. */
export function readStats(form: FormData): StatBlock {
	return Object.fromEntries(
		STAT_KEYS.map((k) => {
			const value = Math.round(Number(form.get(k) ?? 0));
			return [k, Number.isFinite(value) ? Math.max(0, value) : 0];
		})
	) as StatBlock;
}

/** Crée ou met à jour les stats d'un personnage ou d'un monstre. */
export async function saveStats(owner: { characterId: number } | { monsterId: number }, stats: StatBlock) {
	await prisma.statistic.upsert({
		where: owner,
		create: { ...owner, ...stats },
		update: stats
	});
}

export function readFlag(form: FormData, name: string): boolean {
	return form.get(name) === 'on';
}
