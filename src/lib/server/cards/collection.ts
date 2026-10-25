// Collection d'un joueur : ses exemplaires, et l'album de chaque série (cases manquantes comprises).
// Les modèles ne sont envoyés qu'une fois chacun, même avec dix exemplaires du même.

import { UNIQUE_RARITY, type CopyView, type OwnedCard, type TemplateView } from '$lib/cards/types';
import { prisma } from '../prisma';
import { CardError } from './settings';
import {
	COLLECTOR_SELECT,
	collectorView,
	copyView,
	COPY_INCLUDE,
	ownedView,
	setTotals,
	templateView,
	type CollectorView
} from './views';

export const MAX_PINNED = 6;

/** Dernier album ouvert, retenu par le navigateur (voir CollectionView) : rouvert d'emblée. */
export function albumCookie(cookies: { get(name: string): string | undefined }): number | null {
	const value = cookies.get('cartes_album');
	return value && /^\d{1,9}$/.test(value) ? Number(value) : null;
}

export interface AlbumSlot {
	number: number;
	rarity: number;
	templateId: number;
	/** Exemplaires possédés de cette carte. */
	owned: number;
}

export interface AlbumSet {
	id: number;
	name: string;
	code: string;
	color: string;
	logo: string | null;
	slots: AlbumSlot[];
}

export interface Collection {
	owner: CollectorView;
	templates: Record<number, TemplateView>;
	copies: (CopyView & { templateId: number })[];
	album: AlbumSet[];
}

export async function collectionOf(playerId: number): Promise<Collection> {
	const owner = await prisma.player.findUnique({ where: { id: playerId }, select: COLLECTOR_SELECT });
	if (!owner) throw new CardError('Ce joueur n’existe pas.', 404);

	const [cards, totals, sets] = await Promise.all([
		prisma.card.findMany({
			where: { ownerId: playerId },
			orderBy: { id: 'desc' },
			include: COPY_INCLUDE
		}),
		setTotals(),
		prisma.cardSet.findMany({
			orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
			include: {
				templates: {
					where: { status: { not: 'brouillon' }, number: { not: null } },
					select: { id: true, number: true, rarity: true },
					orderBy: { number: 'asc' }
				}
			}
		})
	]);

	const templates: Record<number, TemplateView> = {};
	const counts = new Map<number, number>();
	for (const card of cards) {
		templates[card.templateId] ??= templateView(card.template, totals);
		counts.set(card.templateId, (counts.get(card.templateId) ?? 0) + 1);
	}

	return {
		owner: collectorView(owner),
		templates,
		copies: cards.map((c) => ({ ...copyView(c), templateId: c.templateId })),
		album: sets
			.filter((s) => s.templates.some((t) => t.rarity < UNIQUE_RARITY || counts.has(t.id)))
			.map((s) => ({
				id: s.id,
				name: s.name,
				code: s.code,
				color: s.color,
				logo: s.logo,
				// Une Unique pas encore obtenue reste secrète : ni sa case, ni son numéro.
				slots: s.templates
					.filter((t) => t.rarity < UNIQUE_RARITY || counts.has(t.id))
					.map((t) => ({
						number: t.number as number,
						rarity: t.rarity,
						templateId: t.id,
						owned: counts.get(t.id) ?? 0
					}))
			}))
	};
}

/** Met en vitrine (ou retire) un exemplaire ; six au plus. */
export async function togglePin(cardId: number, playerId: number) {
	const card = await prisma.card.findUnique({ where: { id: cardId }, select: { ownerId: true, pinned: true } });
	if (!card || card.ownerId !== playerId) throw new CardError('Cette carte ne t’appartient pas.', 403);
	if (!card.pinned) {
		const pinned = await prisma.card.count({ where: { ownerId: playerId, pinned: true } });
		if (pinned >= MAX_PINNED) throw new CardError(`${MAX_PINNED} cartes au plus en vitrine.`);
	}
	await prisma.card.updateMany({ where: { id: cardId, ownerId: playerId }, data: { pinned: !card.pinned } });
}

/**
 * Vitrines de joueurs : leurs cartes épinglées (six au plus chacun), pour leur profil et la fiche
 * publique de leur personnage. Aux pages appelantes de vérifier que le jeu est visible du visiteur.
 */
export async function showcaseOf(playerIds: number[]): Promise<Map<number, OwnedCard[]>> {
	const result = new Map<number, OwnedCard[]>();
	if (playerIds.length === 0) return result;
	const [cards, totals] = await Promise.all([
		prisma.card.findMany({
			where: { ownerId: { in: playerIds }, pinned: true },
			orderBy: { id: 'asc' },
			include: COPY_INCLUDE
		}),
		setTotals()
	]);
	for (const card of cards) {
		const list = result.get(card.ownerId!) ?? [];
		if (list.length < MAX_PINNED) list.push(ownedView(card, totals));
		result.set(card.ownerId!, list);
	}
	return result;
}
