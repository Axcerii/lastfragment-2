// Verso des cartes : il garde les secrets que le joueur découvre en obtenant la carte (fiche,
// barres, citation, texte). Celui qui ne l'a jamais eue en main n'en reçoit rien : le verso est
// vidé ici, côté serveur, avant d'être envoyé. Le cacher dans le navigateur ne suffirait pas,
// les données resteraient lisibles dans la page.
//
// Une carte est « connue » d'un joueur s'il en possède un exemplaire, ou s'il en a déjà reçu un
// (tirage, don, échange) : ce qu'il a lu une fois ne lui est pas repris. Le MJ voit tout.

import type { CardFace, OwnedCard, TemplateView } from '$lib/cards/types';
import { prisma } from '../prisma';

/** Celui qui regarde : null pour un visiteur sans compte. */
export interface Viewer {
	id: number;
	isAdmin: boolean;
}

/** Dit si le verso d'un modèle peut être lu par celui qui regarde. */
export type BackReader = (templateId: number) => boolean;

/** Tout est lisible (le MJ, ou un joueur devant ses propres cartes). */
export const READ_ALL: BackReader = () => true;

/** Verso scellé : seuls restent ce que montre aussi le recto et ce qui identifie la carte. */
export function sealFace(face: CardFace): CardFace {
	return { ...face, flavor: '', text: '', facts: [], bars: [] };
}

export function sealTemplate(template: TemplateView): TemplateView {
	return { ...template, face: sealFace(template.face), sealed: true };
}

/** Modèle tel que celui qui regarde a le droit de le voir. */
export function forReader(template: TemplateView, canRead: BackReader): TemplateView {
	return canRead(template.id) ? template : sealTemplate(template);
}

export function ownedForReader(card: OwnedCard, canRead: BackReader): OwnedCard {
	return canRead(card.template.id) ? card : { ...card, template: sealTemplate(card.template) };
}

/** Lecteur fondé sur une liste de modèles connus (sans base : utilisé par les tests). */
export function readerOf(known: Iterable<number>): BackReader {
	const set = new Set(known);
	return (templateId) => set.has(templateId);
}

/** Modèles dont `playerId` possède ou a déjà reçu un exemplaire. */
export async function knownTemplates(playerId: number): Promise<Set<number>> {
	const rows = await prisma.card.findMany({
		where: { OR: [{ ownerId: playerId }, { events: { some: { toId: playerId } } }] },
		select: { templateId: true },
		distinct: ['templateId']
	});
	return new Set(rows.map((r) => r.templateId));
}

/** Ce que `viewer` peut lire. Un visiteur sans compte ne lit aucun verso. */
export async function backReader(viewer: Viewer | null | undefined): Promise<BackReader> {
	if (!viewer) return () => false;
	if (viewer.isAdmin) return READ_ALL;
	return readerOf(await knownTemplates(viewer.id));
}
