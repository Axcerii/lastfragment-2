// Règles des boosters, sans base de données ni hasard imposé : testables (booster.test.ts).
// Le serveur leur passe `crypto.randomInt` ; le navigateur ne tire jamais rien.

import { WEAR_TIERS } from './types';

/** Entier dans [0, max[. */
export type RandomInt = (max: number) => number;

// ─── Réserve de boosters ─────────────────────────────────────────────────

export interface Wallet {
	stock: number;
	/** Début de l'intervalle en cours, en ms. */
	since: number;
}

export interface WalletRules {
	/** Minutes entre deux boosters. */
	minutes: number;
	/** Boosters cumulables au maximum. */
	max: number;
}

export interface WalletState extends Wallet {
	/** Arrivée du prochain booster (ms), ou null si la réserve est pleine. */
	nextAt: number | null;
}

/**
 * Réserve à l'instant `now` : un booster de plus par intervalle écoulé, jusqu'au maximum.
 * Réserve pleine, le compteur s'arrête : il repart du moment où un booster est ouvert.
 * Un don du MJ peut dépasser le maximum ; rien ne s'ajoute alors avant d'être repassé dessous.
 */
export function accrue(wallet: Wallet, rules: WalletRules, now: number): WalletState {
	const interval = Math.max(1, rules.minutes) * 60_000;
	if (wallet.stock >= rules.max) return { stock: wallet.stock, since: now, nextAt: null };

	const gained = Math.max(0, Math.floor((now - wallet.since) / interval));
	if (wallet.stock + gained >= rules.max) return { stock: rules.max, since: now, nextAt: null };

	const since = wallet.since + gained * interval;
	return { stock: wallet.stock + gained, since, nextAt: since + interval };
}

/** Réserve après l'ouverture d'un booster (à appeler sur un état déjà mis à jour par `accrue`). */
export function consume(state: WalletState, rules: WalletRules, now: number): WalletState {
	const stock = state.stock - 1;
	// Le compteur était arrêté (réserve pleine) : il démarre maintenant.
	const since = state.nextAt === null ? now : state.since;
	const interval = Math.max(1, rules.minutes) * 60_000;
	return { stock, since, nextAt: stock >= rules.max ? null : since + interval };
}

// ─── Tirage ──────────────────────────────────────────────────────────────

export interface PoolCard {
	id: number;
	rarity: number;
	weight: number;
	/** Exemplaires encore disponibles, ou null si le tirage est illimité. */
	remaining: number | null;
}

export interface DrawRules {
	count: number;
	/** Rareté minimale de la dernière carte. */
	guaranteed: number;
	/** Chance qu'un booster soit un God Pack, en pour cent. */
	godPack?: number;
	/** Poids par rareté (pour cent). */
	rates: Record<number, number>;
}

/** Choisit un élément selon son poids ; tous à zéro, le choix est uniforme. */
export function weightedPick<T>(items: T[], weightOf: (item: T) => number, randomInt: RandomInt): T {
	// Poids décimaux (0,5 %) ramenés à des entiers pour un tirage exact.
	const weights = items.map((item) => Math.max(0, Math.round(weightOf(item) * 1000)));
	const total = weights.reduce((a, b) => a + b, 0);
	if (total === 0) return items[randomInt(items.length)];
	let roll = randomInt(total);
	for (let i = 0; i < items.length; i++) {
		roll -= weights[i];
		if (roll < 0) return items[i];
	}
	return items[items.length - 1];
}

/**
 * Une carte pour un emplacement : d'abord la rareté, tirée selon les taux parmi celles présentes
 * dans le pool, puis la carte selon son poids. Sous `minRarity` (emplacement garanti), la rareté
 * est remontée à la plus proche qui l'atteint : la garantie ne gonfle pas les raretés au-dessus.
 * On évite de sortir deux fois la même carte dans un booster tant qu'il en reste d'autres.
 */
export function drawSlot(
	pool: PoolCard[],
	minRarity: number,
	picked: number[],
	rates: Record<number, number>,
	randomInt: RandomInt
): PoolCard | null {
	const available = pool.filter((c) => c.remaining === null || c.remaining > 0);
	if (available.length === 0) return null;

	const rarities = [...new Set(available.map((c) => c.rarity))].sort((a, b) => a - b);
	let rarity = weightedPick(rarities, (r) => rates[r] ?? 0, randomInt);
	if (rarity < minRarity) {
		// Aucune carte assez rare : la garantie tombe sur la plus rare disponible.
		rarity = rarities.find((r) => r >= minRarity) ?? rarities[rarities.length - 1];
	}

	let candidates = available.filter((c) => c.rarity === rarity);
	const fresh = candidates.filter((c) => !picked.includes(c.id));
	if (fresh.length) candidates = fresh;
	return weightedPick(candidates, (c) => c.weight, randomInt);
}

/** Tire au sort si ce booster est un God Pack (chance en %, au centième près). */
export function rollGodPack(chance: number | undefined, randomInt: RandomInt): boolean {
	return !!chance && chance > 0 && randomInt(10_000) < Math.round(chance * 100);
}

/**
 * Rareté minimale de chaque emplacement. God Pack : Légendaire partout, et Unique pour la
 * dernière (les autres peuvent aussi tomber sur une Unique, selon les taux).
 */
export function slotMinimum(slot: number, count: number, guaranteed: number, god: boolean): number {
	const last = slot === count - 1;
	if (god) return last ? 5 : 4;
	return last ? guaranteed : 1;
}

/** Une carte de God Pack : toutes au moins Légendaire, une Unique au moins. */
export function isGodPack(rarities: number[]): boolean {
	return rarities.length > 0 && rarities.every((r) => r >= 4) && rarities.some((r) => r >= 5);
}

/** Contenu d'un booster (ids de modèles), sans toucher à la base. Le pool n'est pas modifié. */
export function drawBooster(pool: PoolCard[], rules: DrawRules, randomInt: RandomInt, god = false): number[] {
	const left = pool.map((c) => ({ ...c }));
	const picked: number[] = [];
	for (let slot = 0; slot < rules.count; slot++) {
		const min = slotMinimum(slot, rules.count, rules.guaranteed, god);
		const card = drawSlot(left, min, picked, rules.rates, randomInt);
		if (!card) break;
		picked.push(card.id);
		if (card.remaining !== null) card.remaining--;
	}
	return picked;
}

/** Usure d'un nouvel exemplaire, entre 0 et 1 (exclu), à six décimales. */
export function drawWear(randomInt: RandomInt): number {
	const tier = weightedPick([...WEAR_TIERS], (t) => t.weight, randomInt);
	const steps = Math.round((tier.max - tier.min) * 1_000_000);
	const value = tier.min + randomInt(steps) / 1_000_000;
	return Math.round(value * 1_000_000) / 1_000_000;
}

/** Taux par défaut d'un booster, en pour cent par rareté. */
export const DEFAULT_RATES: Record<number, number> = { 1: 62, 2: 25, 3: 9, 4: 3.5, 5: 0.5 };

/** Lit les taux enregistrés (JSON) en gardant les valeurs par défaut pour ce qui manque. */
export function readRates(json: unknown): Record<number, number> {
	const raw = (json && typeof json === 'object' ? json : {}) as Record<string, unknown>;
	const rates: Record<number, number> = {};
	for (const r of [1, 2, 3, 4, 5]) {
		const value = Number(raw[r]);
		rates[r] = Number.isFinite(value) && value >= 0 ? Math.min(100, value) : DEFAULT_RATES[r];
	}
	return rates;
}
