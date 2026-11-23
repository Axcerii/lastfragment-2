// Boutique des cartes : ce qu'une offre demande (son prix) et ce qu'elle donne (sa récompense),
// sans base de données. Partagé entre l'éditeur du MJ, la page des joueurs et le serveur, testé
// dans shop.test.ts.
//
// La monnaie de la boutique s'appelle « fragments » (symbole : le logo du Tout) ; en base et dans
// le JSON des offres, le champ garde son nom technique `points`.
//
// Le prix se paie en fragments et/ou en cartes. Chaque ligne de cartes dit combien il en faut et ce
// qu'elles doivent être : une carte précise (son modèle), ou des critères (rareté, état d'usure,
// série), chacun facultatif. La récompense donne des fragments, des boosters de la réserve, des
// boosters d'une série gardés à part (boosters spéciaux) et des cartes neuves, précises ou tirées
// au hasard parmi celles qui conviennent.

import { RARITIES, WEAR_TIERS, wearTier } from './types';

export type WearKey = (typeof WEAR_TIERS)[number]['key'];
export const WEAR_KEYS = WEAR_TIERS.map((t) => t.key) as WearKey[];

export function isWearKey(value: unknown): value is WearKey {
	return typeof value === 'string' && (WEAR_KEYS as string[]).includes(value);
}

export const SHOP_LIMITS = {
	name: 80,
	description: 300,
	points: 1_000_000,
	/** Lignes de cartes demandées. */
	priceLines: 6,
	/** Cartes par ligne. */
	lineCount: 20,
	rewardLines: 6,
	rewardCount: 10,
	held: 4,
	heldCount: 20,
	boosters: 50,
	perPlayer: 1000,
	stock: 100_000
} as const;

/** Ce qu'une carte doit être pour convenir ; un critère vide accepte tout. */
export interface CardCriteria {
	/** Une carte précise (son modèle). Les autres critères s'y ajoutent (son état, par exemple). */
	templateId: number | null;
	/** Série (« arc ») de la carte. */
	setId: number | null;
	rarity: number | null;
	/** Cette rareté ou plus rare. */
	rarityUp: boolean;
	wear: WearKey | null;
	/** Cet état ou en meilleur état (moins usée). */
	wearUp: boolean;
}

export interface PriceLine extends CardCriteria {
	count: number;
}

export interface ShopPrice {
	points: number;
	cards: PriceLine[];
}

/** Cartes neuves reçues : un modèle précis, ou tirées au hasard parmi les cartes publiées qui conviennent. */
export interface RewardCard {
	count: number;
	templateId: number | null;
	/** Hasard : série des cartes possibles. */
	setId: number | null;
	/** Hasard : rareté des cartes possibles. */
	rarity: number | null;
	/** État imposé de l'exemplaire ; sinon, tiré comme dans un booster. */
	wear: WearKey | null;
}

export interface HeldReward {
	setId: number;
	count: number;
}

export interface ShopReward {
	points: number;
	/** Boosters ajoutés à la réserve habituelle (au-delà du maximum s'il le faut). */
	boosters: number;
	/** Boosters d'une série, gardés à part de la réserve (boosters spéciaux). */
	held: HeldReward[];
	cards: RewardCard[];
}

/** Ce qu'un échange conclu a déplacé, gardé avec lui (historique du MJ). */
export interface PurchaseDetail {
	given: number[];
	received: number[];
	pointsSpent: number;
	pointsEarned: number;
	boosters: number;
	held: HeldReward[];
}

export const emptyCriteria = (): CardCriteria => ({
	templateId: null,
	setId: null,
	rarity: null,
	rarityUp: false,
	wear: null,
	wearUp: false
});

export const emptyPrice = (): ShopPrice => ({ points: 0, cards: [] });
export const emptyReward = (): ShopReward => ({ points: 0, boosters: 0, held: [], cards: [] });

// ─── Lecture ─────────────────────────────────────────────────────────────

export type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Entier de `min` à `max` ; vide ou absent : `empty`. Toute autre valeur est refusée (undefined). */
function int(v: unknown, min: number, max: number, empty: number | null): number | null | undefined {
	if (v === null || v === undefined || v === '') return empty;
	return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : undefined;
}

const ID_MAX = 999_999_999;

function readCriteria(raw: Record<string, unknown>): CardCriteria | string {
	const templateId = int(raw.templateId, 1, ID_MAX, null);
	const setId = int(raw.setId, 1, ID_MAX, null);
	const rarity = int(raw.rarity, 1, RARITIES.length, null);
	if (templateId === undefined || setId === undefined) return 'Carte ou série inconnue.';
	if (rarity === undefined) return 'Rareté inconnue.';
	const wear = raw.wear === null || raw.wear === undefined || raw.wear === '' ? null : raw.wear;
	if (wear !== null && !isWearKey(wear)) return 'État d’usure inconnu.';
	return {
		templateId,
		setId,
		rarity,
		rarityUp: rarity !== null && raw.rarityUp === true,
		wear,
		wearUp: wear !== null && raw.wearUp === true
	};
}

export function parsePrice(raw: unknown): Parsed<ShopPrice> {
	if (!isRecord(raw)) return { ok: false, error: 'Prix illisible.' };
	const points = int(raw.points, 0, SHOP_LIMITS.points, 0);
	if (points === undefined || points === null) return { ok: false, error: `Fragments de 0 à ${SHOP_LIMITS.points}.` };
	const list = raw.cards ?? [];
	if (!Array.isArray(list)) return { ok: false, error: 'Prix illisible.' };
	if (list.length > SHOP_LIMITS.priceLines) return { ok: false, error: `${SHOP_LIMITS.priceLines} lignes de cartes au plus.` };
	const cards: PriceLine[] = [];
	for (const line of list) {
		if (!isRecord(line)) return { ok: false, error: 'Prix illisible.' };
		const count = int(line.count, 1, SHOP_LIMITS.lineCount, null);
		if (!count) return { ok: false, error: `De 1 à ${SHOP_LIMITS.lineCount} cartes par ligne.` };
		const criteria = readCriteria(line);
		if (typeof criteria === 'string') return { ok: false, error: criteria };
		cards.push({ count, ...criteria });
	}
	return { ok: true, value: { points, cards } };
}

export function parseReward(raw: unknown): Parsed<ShopReward> {
	if (!isRecord(raw)) return { ok: false, error: 'Récompense illisible.' };
	const points = int(raw.points, 0, SHOP_LIMITS.points, 0);
	const boosters = int(raw.boosters, 0, SHOP_LIMITS.boosters, 0);
	if (points === undefined || points === null) return { ok: false, error: `Fragments de 0 à ${SHOP_LIMITS.points}.` };
	if (boosters === undefined || boosters === null) return { ok: false, error: `De 0 à ${SHOP_LIMITS.boosters} boosters.` };

	const heldList = raw.held ?? [];
	if (!Array.isArray(heldList) || heldList.length > SHOP_LIMITS.held) {
		return { ok: false, error: `${SHOP_LIMITS.held} sortes de boosters de série au plus.` };
	}
	const held: HeldReward[] = [];
	for (const item of heldList) {
		if (!isRecord(item)) return { ok: false, error: 'Récompense illisible.' };
		const setId = int(item.setId, 1, ID_MAX, null);
		const count = int(item.count, 1, SHOP_LIMITS.heldCount, null);
		if (!setId) return { ok: false, error: 'Choisis la série de chaque booster.' };
		if (!count) return { ok: false, error: `De 1 à ${SHOP_LIMITS.heldCount} boosters par série.` };
		const same = held.find((h) => h.setId === setId);
		if (same) same.count = Math.min(SHOP_LIMITS.heldCount, same.count + count);
		else held.push({ setId, count });
	}

	const cardList = raw.cards ?? [];
	if (!Array.isArray(cardList) || cardList.length > SHOP_LIMITS.rewardLines) {
		return { ok: false, error: `${SHOP_LIMITS.rewardLines} lignes de cartes au plus.` };
	}
	const cards: RewardCard[] = [];
	for (const item of cardList) {
		if (!isRecord(item)) return { ok: false, error: 'Récompense illisible.' };
		const count = int(item.count, 1, SHOP_LIMITS.rewardCount, null);
		if (!count) return { ok: false, error: `De 1 à ${SHOP_LIMITS.rewardCount} cartes par ligne.` };
		const templateId = int(item.templateId, 1, ID_MAX, null);
		const setId = int(item.setId, 1, ID_MAX, null);
		const rarity = int(item.rarity, 1, RARITIES.length, null);
		if (templateId === undefined || setId === undefined) return { ok: false, error: 'Carte ou série inconnue.' };
		if (rarity === undefined) return { ok: false, error: 'Rareté inconnue.' };
		const wear = item.wear === null || item.wear === undefined || item.wear === '' ? null : item.wear;
		if (wear !== null && !isWearKey(wear)) return { ok: false, error: 'État d’usure inconnu.' };
		// Une carte précise ne se tire pas au hasard : série et rareté ne servent qu'au hasard.
		cards.push(templateId ? { count, templateId, setId: null, rarity: null, wear } : { count, templateId: null, setId, rarity, wear });
	}
	return { ok: true, value: { points, boosters, held, cards } };
}

export const isEmptyPrice = (p: ShopPrice) => p.points === 0 && p.cards.length === 0;
export const isEmptyReward = (r: ShopReward) => r.points === 0 && r.boosters === 0 && r.held.length === 0 && r.cards.length === 0;

/** Modèles et séries cités par une offre, pour vérifier qu'ils existent. */
export function offerRefs(price: ShopPrice, reward: ShopReward): { templates: number[]; sets: number[] } {
	const templates = new Set<number>();
	const sets = new Set<number>();
	for (const line of [...price.cards, ...reward.cards]) {
		if (line.templateId) templates.add(line.templateId);
		if (line.setId) sets.add(line.setId);
	}
	for (const h of reward.held) sets.add(h.setId);
	return { templates: [...templates], sets: [...sets] };
}

// ─── Cartes qui conviennent ──────────────────────────────────────────────

/** Ce qu'il faut savoir d'un exemplaire pour le comparer aux critères. */
export interface CopyFacts {
	id: number;
	templateId: number;
	setId: number | null;
	rarity: number;
	wear: number;
	pinned?: boolean;
}

const tierIndex = (wear: number) => WEAR_TIERS.indexOf(wearTier(wear));

export function matchesCriteria(c: CardCriteria, copy: CopyFacts): boolean {
	if (c.templateId !== null && copy.templateId !== c.templateId) return false;
	if (c.setId !== null && copy.setId !== c.setId) return false;
	if (c.rarity !== null && (c.rarityUp ? copy.rarity < c.rarity : copy.rarity !== c.rarity)) return false;
	if (c.wear !== null) {
		const target = WEAR_KEYS.indexOf(c.wear);
		const tier = tierIndex(copy.wear);
		if (c.wearUp ? tier > target : tier !== target) return false;
	}
	return true;
}

/** Ordre de service des lignes : les plus exigeantes d'abord, pour qu'une ligne large ne prenne pas leur carte. */
function strictness(c: CardCriteria): number {
	return (c.templateId ? 8 : 0) + (c.setId ? 2 : 0) + (c.rarity ? (c.rarityUp ? 1 : 2) : 0) + (c.wear ? (c.wearUp ? 1 : 2) : 0);
}

/**
 * Cartes proposées d'office pour payer chaque ligne (le joueur peut changer). On cède d'abord les
 * doubles en gardant le meilleur exemplaire de chaque carte, puis les plus usées ; une carte en
 * vitrine passe en dernier. Une ligne qui ne peut pas être payée reçoit ce qu'il y a.
 */
export function suggestCards(lines: PriceLine[], copies: CopyFacts[]): number[][] {
	const best = new Map<number, CopyFacts>();
	for (const copy of copies) {
		const kept = best.get(copy.templateId);
		if (!kept || copy.wear < kept.wear || (copy.wear === kept.wear && copy.id < kept.id)) best.set(copy.templateId, copy);
	}
	const score = (c: CopyFacts) => [c.pinned ? 1 : 0, best.get(c.templateId)?.id === c.id ? 1 : 0, -c.wear, -c.id];
	const sorted = [...copies].sort((a, b) => {
		const [x, y] = [score(a), score(b)];
		for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i];
		return 0;
	});

	const taken = new Set<number>();
	const picks: number[][] = lines.map(() => []);
	const order = lines.map((_, i) => i).sort((a, b) => strictness(lines[b]) - strictness(lines[a]) || a - b);
	for (const i of order) {
		for (const copy of sorted) {
			if (picks[i].length >= lines[i].count) break;
			if (!taken.has(copy.id) && matchesCriteria(lines[i], copy)) {
				taken.add(copy.id);
				picks[i].push(copy.id);
			}
		}
	}
	return picks;
}

/**
 * Vérifie les cartes choisies par le joueur pour payer : une liste par ligne du prix, le bon
 * nombre, chaque carte à lui, une seule fois, et qui convient à sa ligne.
 */
export function checkPicks(lines: PriceLine[], raw: unknown, mine: Map<number, CopyFacts>): Parsed<number[][]> {
	if (lines.length === 0) return { ok: true, value: [] };
	if (!Array.isArray(raw) || raw.length !== lines.length) return { ok: false, error: 'Choisis les cartes à céder.' };
	const seen = new Set<number>();
	const picks: number[][] = [];
	for (let i = 0; i < lines.length; i++) {
		const list = raw[i];
		if (!Array.isArray(list)) return { ok: false, error: 'Choisis les cartes à céder.' };
		if (list.length !== lines[i].count) {
			return { ok: false, error: `Il faut exactement ${lines[i].count} carte${lines[i].count > 1 ? 's' : ''} pour la ligne ${i + 1}.` };
		}
		const ids: number[] = [];
		for (const id of list) {
			if (typeof id !== 'number' || !Number.isInteger(id) || seen.has(id)) return { ok: false, error: 'Une carte est choisie deux fois.' };
			const copy = mine.get(id);
			if (!copy) return { ok: false, error: 'Une des cartes choisies ne t’appartient plus : recharge la page.' };
			if (!matchesCriteria(lines[i], copy)) return { ok: false, error: `Une carte ne convient pas à la ligne ${i + 1}.` };
			seen.add(id);
			ids.push(id);
		}
		picks.push(ids);
	}
	return { ok: true, value: picks };
}

// ─── Textes ──────────────────────────────────────────────────────────────

export interface ShopNames {
	template: (id: number) => string | undefined;
	set: (id: number) => string | undefined;
}

const RARITY_PLURAL = ['Communes', 'Singulières', 'Rares', 'Légendaires', 'Uniques'];
const WEAR_LABEL = (key: WearKey) => WEAR_TIERS.find((t) => t.key === key)?.label ?? key;

/** « Rare ou plus », « Arc 1 », « Quasi neuve ou mieux » : un morceau par critère. */
export function criteriaParts(c: CardCriteria, names: ShopNames, plural = false): string[] {
	const parts: string[] = [];
	if (c.templateId) parts.push(names.template(c.templateId) ?? `Carte n°${c.templateId}`);
	if (c.rarity) {
		const label = plural ? RARITY_PLURAL[c.rarity - 1] : RARITIES[c.rarity - 1];
		parts.push(c.rarityUp && c.rarity < RARITIES.length ? `${label} ou plus` : label);
	}
	if (c.setId) parts.push(names.set(c.setId) ?? 'Série supprimée');
	if (c.wear) parts.push(c.wearUp && c.wear !== 'neuve' ? `${WEAR_LABEL(c.wear)} ou mieux` : WEAR_LABEL(c.wear));
	return parts;
}

/** « 2 cartes · Rares ou plus · Arc 1 » */
export function priceLineLabel(line: PriceLine, names: ShopNames): string {
	const parts = criteriaParts(line, names, line.count > 1);
	const head = line.templateId ? `${line.count} ×` : `${line.count} carte${line.count > 1 ? 's' : ''}`;
	return parts.length ? `${head} ${parts.join(' · ')}` : `${head} au choix`;
}

/** « 1 carte au hasard · Rare · Arc 1 » ou « 2 × Lyra » */
export function rewardCardLabel(card: RewardCard, names: ShopNames): string {
	const wear = card.wear ? ` · ${WEAR_LABEL(card.wear)}` : '';
	if (card.templateId) return `${card.count} × ${names.template(card.templateId) ?? `Carte n°${card.templateId}`}${wear}`;
	const parts = criteriaParts({ ...emptyCriteria(), setId: card.setId, rarity: card.rarity }, names, card.count > 1);
	return `${card.count} carte${card.count > 1 ? 's' : ''} au hasard${parts.length ? ` · ${parts.join(' · ')}` : ''}${wear}`;
}

/** « 12 fragments » : la monnaie de la boutique (champ `points`). */
export const fragmentsLabel = (n: number) => `${n.toLocaleString('fr-FR')} fragment${n > 1 ? 's' : ''}`;

// ─── Objets montrés ──────────────────────────────────────────────────────

/**
 * Un objet d'une offre tel que la boutique le dessine : une vignette et un nombre (« ×5 »).
 * `card` : une carte précise ; `criteria` : des cartes à céder qui répondent à des critères ;
 * `random` : des cartes reçues au hasard ; `pack` : des boosters d'une série ; `booster` : des
 * boosters de la réserve ; `fragments` : la monnaie (`count` est alors le montant).
 */
export type ShopItem =
	| { kind: 'card'; count: number; label: string; templateId: number; line?: number }
	| { kind: 'criteria'; count: number; label: string; rarity: number | null; rarityUp: boolean; line: number }
	| { kind: 'random'; count: number; label: string; rarity: number | null }
	| { kind: 'pack'; count: number; label: string; setId: number }
	| { kind: 'booster'; count: number; label: string }
	| { kind: 'fragments'; count: number; label: string };

const boostersLabel = (n: number) => `${n} booster${n > 1 ? 's' : ''}`;

/** Ce que le joueur reçoit, le plus marquant d'abord (le premier fait la vignette de l'offre). */
export function rewardItems(reward: ShopReward, names: ShopNames): ShopItem[] {
	const items: ShopItem[] = [];
	const cards = [...reward.cards].sort((a, b) => Number(!!b.templateId) - Number(!!a.templateId));
	for (const card of cards) {
		const label = rewardCardLabel(card, names);
		items.push(
			card.templateId
				? { kind: 'card', count: card.count, label, templateId: card.templateId }
				: { kind: 'random', count: card.count, label, rarity: card.rarity }
		);
	}
	for (const h of reward.held) {
		items.push({ kind: 'pack', count: h.count, label: `${boostersLabel(h.count)} « ${names.set(h.setId) ?? 'Série supprimée'} »`, setId: h.setId });
	}
	if (reward.boosters) items.push({ kind: 'booster', count: reward.boosters, label: `${boostersLabel(reward.boosters)} dans ta réserve` });
	if (reward.points) items.push({ kind: 'fragments', count: reward.points, label: fragmentsLabel(reward.points) });
	return items;
}

/** Ce que le joueur cède : les fragments, puis chaque ligne de cartes (`line` : son rang dans le prix). */
export function priceItems(price: ShopPrice, names: ShopNames): ShopItem[] {
	const items: ShopItem[] = [];
	if (price.points) items.push({ kind: 'fragments', count: price.points, label: fragmentsLabel(price.points) });
	price.cards.forEach((line, i) => {
		const label = priceLineLabel(line, names);
		items.push(
			line.templateId
				? { kind: 'card', count: line.count, label, templateId: line.templateId, line: i }
				: { kind: 'criteria', count: line.count, label, rarity: line.rarity, rarityUp: line.rarityUp, line: i }
		);
	});
	return items;
}

/** Symbole des fragments : le logo du Tout, celui du site. */
export const FRAGMENT_ICON = '/layout/Logo.svg';
