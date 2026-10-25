// Lignes de la base → données envoyées au navigateur. Seul ce qui est utile à l'affichage sort :
// pas de poids de tirage ni de fiche d'origine pour les joueurs.

import type { Card, CardSet, CardTemplate } from '@prisma/client';
import {
	isCardType,
	isTemplateStatus,
	readFace,
	type CopyView,
	type OwnedCard,
	type SetView,
	type TemplateView
} from '$lib/cards/types';
import { prisma } from '../prisma';

export const COPY_INCLUDE = {
	template: { include: { set: true } },
	owner: { select: { id: true, character: { select: { name: true } } } }
} as const;

type TemplateRow = CardTemplate & { set: CardSet | null };
type OwnerRow = { id: number; character: { name: string } | null };
type CopyRow = Card & { template: TemplateRow; owner: OwnerRow | null };

/** Nombre de cartes visibles (publiées ou retirées) par série : le « 120 » de « 012/120 ». */
export async function setTotals(): Promise<Map<number, number>> {
	const rows = await prisma.cardTemplate.groupBy({
		by: ['setId'],
		where: { status: { not: 'brouillon' }, setId: { not: null } },
		_count: { _all: true }
	});
	return new Map(rows.map((r) => [r.setId as number, r._count._all]));
}

export function templateView(t: TemplateRow, totals: Map<number, number>): TemplateView {
	const type = isCardType(t.type) ? t.type : 'objet';
	return {
		id: t.id,
		type,
		rarity: t.rarity,
		name: t.name,
		status: isTemplateStatus(t.status) ? t.status : 'brouillon',
		maxPrints: t.maxPrints,
		printed: t.printed,
		number: t.number,
		set: t.set
			? {
					id: t.set.id,
					name: t.set.name,
					code: t.set.code,
					color: t.set.color,
					logo: t.set.logo,
					total: totals.get(t.set.id) ?? 0
				}
			: null,
		face: readFace(t.face, type, t.rarity)
	};
}

export function copyView(c: Card & { owner: OwnerRow | null }): CopyView {
	return {
		id: c.id,
		serial: c.serial,
		wear: c.wear,
		origin: c.origin,
		pinned: c.pinned,
		obtainedAt: c.obtainedAt.toISOString(),
		owner: c.owner ? { id: c.owner.id, name: collectorName(c.owner) } : null
	};
}

export function ownedView(c: CopyRow, totals: Map<number, number>): OwnedCard {
	return { copy: copyView(c), template: templateView(c.template, totals) };
}

export function setView(s: CardSet, totals: Map<number, number>): SetView {
	return {
		id: s.id,
		name: s.name,
		code: s.code,
		description: s.description,
		logo: s.logo,
		banner: s.banner,
		color: s.color,
		endsAt: s.endsAt?.toISOString() ?? null,
		total: totals.get(s.id) ?? 0
	};
}

/**
 * Collectionneur : nom et portrait du personnage associé s'il y en a un. Le pseudo de connexion ne
 * sort jamais vers les joueurs, c'est la moitié d'un identifiant.
 */
export const COLLECTOR_SELECT = {
	id: true,
	character: { select: { name: true, image: true } }
} as const;

export interface CollectorView {
	id: number;
	/** Nom du personnage, ou « Joueur n°12 » sans personnage. */
	name: string;
	character: string | null;
	portrait: string | null;
}

export function collectorName(p: { id: number; character: { name: string } | null }): string {
	return p.character?.name || `Joueur n°${p.id}`;
}

export function collectorView(p: { id: number; character: { name: string; image: string | null } | null }): CollectorView {
	return { id: p.id, name: collectorName(p), character: p.character?.name ?? null, portrait: p.character?.image ?? null };
}
