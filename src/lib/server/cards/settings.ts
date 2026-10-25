import { DEFAULT_RATES, readRates } from '$lib/cards/booster';
import { prisma } from '../prisma';

export interface CardRules {
	/** Minutes entre deux boosters. */
	minutes: number;
	max: number;
	starter: number;
	count: number;
	guaranteed: number;
	/** Chance qu'un booster soit un God Pack, en pour cent (0 : jamais). */
	godPack: number;
	rates: Record<number, number>;
}

/** Erreur à montrer au joueur telle quelle (stock vide, carte déjà échangée…). */
export class CardError extends Error {
	constructor(
		message: string,
		public status = 400
	) {
		super(message);
	}
}

/** Réglages du jeu de cartes (ligne unique, créée avec les valeurs par défaut au premier appel). */
export async function getRules(): Promise<CardRules> {
	const row = await prisma.cardSettings.upsert({
		where: { id: 1 },
		create: { id: 1, rates: DEFAULT_RATES },
		update: {}
	});
	return {
		minutes: row.boosterMinutes,
		max: row.boosterMax,
		starter: row.starterBoosters,
		count: row.cardsPerBooster,
		guaranteed: row.guaranteed,
		godPack: row.godPack,
		rates: readRates(row.rates)
	};
}

export const RULE_BOUNDS = {
	minutes: [5, 60 * 24 * 14],
	max: [1, 50],
	starter: [0, 50],
	count: [1, 12],
	guaranteed: [1, 5]
} as const;

export async function saveRules(rules: CardRules) {
	await prisma.cardSettings.upsert({
		where: { id: 1 },
		create: { id: 1, rates: rules.rates },
		update: {}
	});
	await prisma.cardSettings.update({
		where: { id: 1 },
		data: {
			boosterMinutes: rules.minutes,
			boosterMax: rules.max,
			starterBoosters: rules.starter,
			cardsPerBooster: rules.count,
			guaranteed: rules.guaranteed,
			godPack: rules.godPack,
			rates: rules.rates
		}
	});
}

// ─── Jeu public ou caché ─────────────────────────────────────────────────
//
// Caché, le jeu n'existe que pour le MJ : liens retirés, pages /cartes en 404, vitrines masquées.
// Lu à chaque page (lien du menu) : gardé 10 s en mémoire, remis à jour dès que le MJ le change.

let publicCache: { at: number; value: boolean } | null = null;

export async function cardsPublic(): Promise<boolean> {
	if (publicCache && Date.now() - publicCache.at < 10_000) return publicCache.value;
	const row = await prisma.cardSettings.findUnique({ where: { id: 1 }, select: { public: true } });
	publicCache = { at: Date.now(), value: row?.public ?? false };
	return publicCache.value;
}

export async function setCardsPublic(value: boolean) {
	await prisma.cardSettings.upsert({
		where: { id: 1 },
		create: { id: 1, rates: DEFAULT_RATES, public: value },
		update: { public: value }
	});
	publicCache = { at: Date.now(), value };
}

/** Le visiteur peut-il voir le jeu de cartes ? Le MJ, toujours. */
export async function cardsVisibleTo(user: App.Locals['user']): Promise<boolean> {
	return !!user?.isAdmin || (await cardsPublic());
}
