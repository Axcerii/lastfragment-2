import { unlink } from 'fs/promises';
import path from 'path';
import { STAT_KEYS, type StatBlock } from '$lib/game/stats';
import { prisma } from './prisma';
import { RateLimiter } from './ratelimit';
import { uploadDir } from './uploads';

export const DRAFT_KINDS = { personnage: 'Personnage', monstre: 'Monstre' } as const;
export type DraftKind = keyof typeof DRAFT_KINDS;

export const DRAFT_IMAGE_FOLDER = 'brouillons';

/** Lit la colonne JSON `stats` d'un brouillon en un bloc de stats propre. */
export function draftStats(json: unknown): StatBlock {
	const raw = (json ?? {}) as Record<string, unknown>;
	return Object.fromEntries(
		STAT_KEYS.map((k) => [k, Math.max(0, Math.round(Number(raw[k]) || 0))])
	) as StatBlock;
}

export async function listDrafts() {
	const drafts = await prisma.draft.findMany({
		orderBy: { createdAt: 'desc' },
		include: { player: { select: { login: true } } }
	});
	return drafts.map((d) => ({
		id: d.id,
		kind: d.kind as DraftKind,
		name: d.name,
		description: d.description,
		image: d.image,
		author: d.author || d.player?.login || null,
		createdAt: d.createdAt,
		stats: draftStats(d.stats)
	}));
}

/** Supprime un brouillon refusé, avec son image. */
export async function rejectDraft(id: number) {
	const draft = await prisma.draft.delete({ where: { id } });
	await removeDraftImage(draft.image);
}

/** Supprime le fichier d'une image de brouillon (et seulement d'un brouillon). */
async function removeDraftImage(image: string | null) {
	const prefix = `/uploads/${DRAFT_IMAGE_FOLDER}/`;
	if (!image?.startsWith(prefix)) return;
	const file = path.resolve(uploadDir(), DRAFT_IMAGE_FOLDER, path.basename(image));
	await unlink(file).catch(() => {
		// Fichier déjà absent : rien à faire.
	});
}

// Limite simple contre les envois en rafale, par adresse IP, gardée en mémoire.
const submissions = new RateLimiter(5, 10 * 60 * 1000);

/** Vrai si cette adresse peut encore envoyer un brouillon maintenant (et compte l'envoi). */
export function allowSubmission(address: string): boolean {
	return submissions.take(address);
}
