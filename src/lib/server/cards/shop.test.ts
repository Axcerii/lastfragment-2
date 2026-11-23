// Boutique et boosters gardés, côté serveur. On vérifie qu'un joueur ne peut rien obtenir sans
// payer (cartes d'un autre, points manquants, limites, offre fermée ou pas prête), qu'un échange
// raté ne laisse rien à moitié fait, et que la boutique ne fait pas fuiter le verso des cartes.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultFace, WEAR_TIERS, type CardFace } from '$lib/cards/types';
import { db, resetDb } from './testing/fake-db';

vi.mock('$lib/server/prisma', async () => ({ prisma: (await import('./testing/fake-db')).fakePrisma }));

const { redeemOffer, shopFor, saveOffer, deleteOffer, setPoints } = await import('./shop');
const { openBooster, boosterChoices, giftHeldBoosters, heldBoosters } = await import('./boosters');
const { setTotals } = await import('./views');
const shopPage = await import('../../../routes/cartes/boutique/+page.server');
const rankingPage = await import('../../../routes/cartes/joueurs/+page.server');

const SERENA = { id: 1, isAdmin: false };
const LYRA = { id: 2, isAdmin: false };

const DAY = 86_400_000;

function face(tag: string): CardFace {
	return { ...defaultFace('personnage', 2), flavor: `VERSO-SECRET ${tag}`, text: `TEXTE-SECRET ${tag}` };
}

function template(id: number, setId: number | null, rarity: number, extra: Record<string, unknown> = {}) {
	return {
		id,
		setId,
		number: id,
		type: 'personnage',
		rarity,
		name: `Carte ${id}`,
		status: 'publiee',
		inAll: true,
		weight: 10,
		maxPrints: null,
		printed: 10,
		artist: null,
		face: face(String(id)),
		...extra
	};
}

function card(id: number, templateId: number, ownerId: number | null, wear: number, pinned = false) {
	return { id, templateId, ownerId, serial: id, wear, origin: 'booster', pinned, obtainedAt: new Date(0) };
}

function offer(id: number, price: unknown, reward: unknown, extra: Record<string, unknown> = {}) {
	return {
		id,
		name: `Offre ${id}`,
		description: null,
		price,
		reward,
		active: true,
		startsAt: null,
		endsAt: null,
		perPlayer: null,
		stock: null,
		sortOrder: id,
		...extra
	};
}

const owner = (id: number) => db.cards.find((c) => c.id === id)?.ownerId;
const wallet = (playerId: number) => db.wallets.find((w) => w.playerId === playerId);

beforeEach(() => {
	resetDb();
	db.players.push(
		{ id: 1, login: 'serena', character: { name: 'Serena', image: null } },
		{ id: 2, login: 'lyra', character: { name: 'Lyra', image: null } }
	);
	db.sets.push(
		{ id: 1, name: 'Arc I', code: 'ARC1', color: '#e5b8cc', logo: null, banner: null, description: null, active: true, special: false, startsAt: null, endsAt: null, sortOrder: 0 },
		{ id: 2, name: 'Spécial', code: 'SPE', color: '#803084', logo: null, banner: null, description: null, active: true, special: true, startsAt: null, endsAt: null, sortOrder: 1 }
	);
	db.templates.push(
		template(10, 1, 1),
		template(11, 1, 1),
		template(12, 1, 3),
		template(13, 1, 4, { maxPrints: 1, printed: 1 }),
		template(14, 1, 2, { status: 'brouillon' }),
		template(15, 1, 5),
		template(20, 2, 2, { inAll: false })
	);
	db.cards.push(
		card(1, 10, 1, 0.6),
		card(2, 10, 1, 0.05, true),
		card(3, 11, 1, 0.3),
		card(4, 12, 1, 0.1),
		card(5, 10, 2, 0.2)
	);
	db.wallets.push({ playerId: 1, stock: 0, since: new Date(), opened: 0, points: 50 });
	db.offers.push(
		offer(1, { points: 0, cards: [{ count: 3, rarity: 1 }] }, { cards: [{ count: 1, rarity: 3, setId: 1 }] }),
		offer(2, { points: 30 }, { held: [{ setId: 2, count: 1 }] }, { perPlayer: 1 }),
		offer(3, { points: 1 }, { points: 2 }, { active: false }),
		offer(4, { points: 1 }, { cards: [{ count: 1, templateId: 14 }] }),
		offer(5, { points: 0 }, { points: 5 }, { perPlayer: 3, stock: 1 }),
		offer(6, { points: 10 }, { cards: [{ count: 1, templateId: 12, wear: 'neuve' }] }),
		offer(7, { points: 1 }, { points: 2 }, { startsAt: new Date(Date.now() + DAY) }),
		offer(8, { points: 0, cards: [{ count: 1 }] }, { cards: [{ count: 1, templateId: 13 }] })
	);
});

describe('boutique : échange', () => {
	it('cède les cartes choisies au MJ et donne la récompense', async () => {
		const result = await redeemOffer(1, 1, [[1, 2, 3]]);
		expect([owner(1), owner(2), owner(3)]).toEqual([null, null, null]);
		expect(db.cards.find((c) => c.id === 2)!.pinned).toBe(false);
		expect(db.events.filter((e) => e.kind === 'boutique' && e.fromId === 1).map((e) => e.cardId)).toEqual([1, 2, 3]);

		// La seule Rare de l'Arc I : un exemplaire neuf, à Serena, marqué « boutique ».
		expect(result.cards).toHaveLength(1);
		const received = db.cards.find((c) => c.id === result.cards[0].copy.id)!;
		expect(received).toMatchObject({ templateId: 12, ownerId: 1, origin: 'boutique' });
		expect(db.events.some((e) => e.kind === 'boutique' && e.toId === 1 && e.cardId === received.id)).toBe(true);
		expect(db.purchases).toHaveLength(1);
		expect(db.purchases[0].detail).toMatchObject({ given: [1, 2, 3], received: [received.id] });
	});

	it('refuse la carte d’un autre joueur, sans rien changer', async () => {
		await expect(redeemOffer(1, 1, [[1, 3, 5]])).rejects.toMatchObject({ status: 400 });
		expect([owner(1), owner(3), owner(5)]).toEqual([1, 1, 2]);
		expect(db.purchases).toHaveLength(0);
	});

	it('refuse une carte qui ne correspond pas à la ligne (une Rare pour des Communes)', async () => {
		await expect(redeemOffer(1, 1, [[1, 3, 4]])).rejects.toThrow(/ne convient pas/);
		expect(owner(4)).toBe(1);
	});

	it('refuse un mauvais nombre de cartes ou une carte en double', async () => {
		await expect(redeemOffer(1, 1, [[1, 3]])).rejects.toThrow();
		await expect(redeemOffer(1, 1, [[1, 1, 3]])).rejects.toThrow();
		await expect(redeemOffer(1, 1, 'tout')).rejects.toThrow();
		expect(db.purchases).toHaveLength(0);
	});

	it('paie en points, garde le booster spécial, et respecte la limite par joueur', async () => {
		await redeemOffer(1, 2, []);
		expect(wallet(1)!.points).toBe(20);
		expect(db.held).toEqual([expect.objectContaining({ playerId: 1, setId: 2, count: 1 })]);
		await expect(redeemOffer(1, 2, [])).rejects.toThrow(/déjà obtenu/);
		expect(wallet(1)!.points).toBe(20);
	});

	it('refuse sans assez de points, sans rien donner', async () => {
		await expect(redeemOffer(2, 2, [])).rejects.toThrow(/pas assez de points/);
		expect(db.held).toHaveLength(0);
		expect(db.purchases).toHaveLength(0);
	});

	it('annule tout si la récompense ne peut plus être donnée après le paiement', async () => {
		// La carte cédée part avant que la récompense (tirage limité épuisé) échoue : elle doit revenir.
		await expect(redeemOffer(1, 8, [[3]])).rejects.toThrow(/plus disponible/);
		expect(owner(3)).toBe(1);
		expect(db.events).toHaveLength(0);
		expect(db.purchases).toHaveLength(0);
	});

	it('refuse une offre fermée, à venir, inconnue ou pas prête', async () => {
		await expect(redeemOffer(1, 3, [])).rejects.toMatchObject({ status: 404 });
		await expect(redeemOffer(1, 7, [])).rejects.toMatchObject({ status: 404 });
		await expect(redeemOffer(1, 999, [])).rejects.toMatchObject({ status: 404 });
		// Elle cite une carte en brouillon.
		await expect(redeemOffer(1, 4, [])).rejects.toMatchObject({ status: 409 });
		expect(db.cards.some((c) => c.templateId === 14)).toBe(false);
	});

	it('respecte le stock total de l’offre', async () => {
		await redeemOffer(1, 5, []);
		await expect(redeemOffer(2, 5, [])).rejects.toThrow(/épuisée/);
		expect(db.purchases).toHaveLength(1);
	});

	it('imprime la carte dans l’état imposé', async () => {
		const result = await redeemOffer(1, 6, []);
		const neuve = WEAR_TIERS[0];
		expect(result.cards[0].copy.wear).toBeGreaterThanOrEqual(neuve.min);
		expect(result.cards[0].copy.wear).toBeLessThan(neuve.max);
		expect(wallet(1)!.points).toBe(40);
	});

	it('rend caduques les propositions d’échange qui portaient sur une carte cédée', async () => {
		db.trades.push({ id: 1, fromId: 1, toId: 2, status: 'attente' });
		db.tradeItems.push({ id: 1, tradeId: 1, cardId: 1, offered: true });
		await redeemOffer(1, 1, [[1, 2, 3]]);
		expect(db.trades[0].status).toBe('caduque');
	});
});

describe('boutique : page des joueurs', () => {
	it('ne montre que les offres ouvertes et prêtes, avec leurs blocages', async () => {
		const { offers, refs } = await shopFor(SERENA);
		expect(offers.map((o) => o.id)).toEqual([1, 2, 5, 6, 8]);
		expect(offers.find((o) => o.id === 8)!.blocked).toBe('Épuisée');
		// La carte en brouillon de l'offre cachée ne part pas avec la page.
		expect(refs.templates[14]).toBeUndefined();
	});

	it('scelle le verso des cartes que le joueur n’a jamais eues', async () => {
		const forLyra = JSON.stringify((await shopFor(LYRA)).refs);
		expect(forLyra).not.toContain('VERSO-SECRET');
		expect(forLyra).not.toContain('TEXTE-SECRET');
		// Serena possède la carte 12 : elle en lit le verso.
		expect((await shopFor(SERENA)).refs.templates[12].face.flavor).toContain('VERSO-SECRET');
	});

	it('montre « Déjà obtenue » une fois la limite atteinte', async () => {
		await redeemOffer(1, 2, []);
		expect((await shopFor(SERENA)).offers.find((o) => o.id === 2)!.blocked).toBe('Déjà obtenue');
		expect((await shopFor(LYRA)).offers.find((o) => o.id === 2)!.blocked).toBeNull();
	});

	it('l’action refuse un choix illisible ou trop long, et un visiteur sans compte', async () => {
		const call = (fields: Record<string, string>, user: unknown = { ...SERENA, login: 's', role: 0, characterId: null }) => {
			const body = new FormData();
			for (const [k, v] of Object.entries(fields)) body.set(k, v);
			const request = new Request('http://localhost/cartes/boutique?/redeem', { method: 'POST', body });
			return shopPage.actions.redeem({ request, locals: { user } } as never);
		};
		expect(await call({ offerId: '1', picks: '{' })).toMatchObject({ status: 400 });
		expect(await call({ offerId: '1', picks: '['.padEnd(5000, '1') })).toMatchObject({ status: 400 });
		expect(await call({ offerId: 'abc', picks: '[]' })).toMatchObject({ status: 400 });
		await expect(call({ offerId: '1', picks: '[]' }, null)).rejects.toMatchObject({ status: 303 });
	});
});

describe('boutique : espace MJ', () => {
	const input = (price: unknown, reward: unknown, extra: Record<string, unknown> = {}) => ({
		name: 'Test',
		description: null,
		price,
		reward,
		active: true,
		startsAt: null,
		endsAt: null,
		perPlayer: null,
		stock: null,
		sortOrder: 0,
		...extra
	});

	it('refuse une offre gratuite sans limite, une offre qui ne donne rien, une carte inconnue', async () => {
		await expect(saveOffer(null, input({}, { points: 5 }))).rejects.toThrow(/gratuite/);
		await expect(saveOffer(null, input({ points: 5 }, {}))).rejects.toThrow(/ne donne rien/);
		await expect(saveOffer(null, input({ points: 5 }, { cards: [{ count: 1, templateId: 999 }] }))).rejects.toThrow(/n’existe plus/);
		await expect(saveOffer(null, input({ points: 5 }, { held: [{ setId: 999, count: 1 }] }))).rejects.toThrow(/n’existe plus/);
		await expect(
			saveOffer(null, input({ points: 5 }, { points: 1 }, { startsAt: new Date(2026, 1, 2), endsAt: new Date(2026, 1, 1) }))
		).rejects.toThrow(/après le début/);
	});

	it('enregistre le prix et la récompense nettoyés', async () => {
		const id = await saveOffer(null, input({ points: 5, junk: 'x', cards: [{ count: 2, rarity: 1, rarityUp: true }] }, { points: 1 }));
		const saved = db.offers.find((o) => o.id === id)!;
		expect(saved.price).toEqual({ points: 5, cards: [{ count: 2, templateId: null, setId: null, rarity: 1, rarityUp: true, wear: null, wearUp: false }] });
	});

	it('ne supprime pas une offre déjà prise', async () => {
		await redeemOffer(1, 5, []);
		await expect(deleteOffer(5)).rejects.toThrow(/désactive-la/);
		await deleteOffer(3);
		expect(db.offers.some((o) => o.id === 3)).toBe(false);
	});

	it('borne les points fixés par le MJ', async () => {
		await expect(setPoints(1, -1)).rejects.toThrow();
		await expect(setPoints(1, 1.5)).rejects.toThrow();
		await expect(setPoints(1, 1_000_001)).rejects.toThrow();
		await expect(setPoints(999, 10)).rejects.toMatchObject({ status: 404 });
		await setPoints(2, 12);
		expect(wallet(2)!.points).toBe(12);
	});
});

describe('boosters spéciaux gardés', () => {
	it('un booster spécial n’est jamais dans la vitrine, même ouvert', async () => {
		const choices = await boosterChoices();
		expect(choices.banners.map((b) => b.id)).toEqual([1]);
	});

	it('ne s’ouvre pas depuis la réserve habituelle', async () => {
		wallet(1)!.stock = 3;
		await expect(openBooster(1, 2, null, false)).rejects.toMatchObject({ status: 404 });
		expect(wallet(1)!.stock).toBe(3);
	});

	it('s’ouvre depuis les boosters gardés, sans toucher à la réserve', async () => {
		await expect(openBooster(1, 2, null, true)).rejects.toThrow(/plus ce booster/);
		await giftHeldBoosters(1, 2, 2);
		const opened = await openBooster(1, 2, null, true);
		expect(opened.held).toBe(1);
		expect(opened.cards.every((c) => c.template.id === 20)).toBe(true);
		expect(wallet(1)).toMatchObject({ stock: 0, opened: 1 });
		expect((await heldBoosters(1)).map((h) => [h.id, h.count, h.special])).toEqual([[2, 1, true]]);
		await openBooster(1, 2, null, true);
		await expect(openBooster(1, 2, null, true)).rejects.toThrow(/plus ce booster/);
	});

	it('le MJ ne descend jamais sous zéro ni au-delà de 99', async () => {
		await giftHeldBoosters(1, 2, 1);
		await giftHeldBoosters(1, 2, -5);
		expect(db.held[0].count).toBe(0);
		await giftHeldBoosters(1, 2, 50);
		await giftHeldBoosters(1, 2, 50);
		expect(db.held[0].count).toBe(99);
		await expect(giftHeldBoosters(1, 999, 1)).rejects.toMatchObject({ status: 404 });
	});
});

describe('numérotation et classement', () => {
	it('le total imprimé sur les cartes ne compte ni les Unique ni les brouillons', async () => {
		// Arc I : 10, 11, 12, 13 (la 14 est en brouillon, la 15 est Unique).
		expect((await setTotals()).get(1)).toBe(4);
	});

	it('classe par cartes différentes, puis par nombre de cartes', async () => {
		db.players.push({ id: 3, login: 'ina', character: { name: 'Ina', image: null } });
		// Serena : 4 cartes, 3 différentes. Lyra : 5 cartes, 2 différentes. Ina : 3 cartes, 3 différentes.
		db.cards.push(card(6, 10, 2, 0.2), card(7, 11, 2, 0.2), card(8, 10, 2, 0.2), card(9, 10, 2, 0.2), card(10, 10, 3, 0.2), card(11, 11, 3, 0.2), card(12, 12, 3, 0.2));
		const data = (await rankingPage.load({ locals: { user: { ...SERENA, login: 's', role: 0, characterId: null } } } as never)) as {
			players: { id: number; rank: number; distinct: number; cards: number }[];
		};
		expect(data.players.map((p) => [p.id, p.rank, p.distinct, p.cards])).toEqual([
			[1, 1, 3, 4],
			[3, 2, 3, 3],
			[2, 3, 2, 5]
		]);
	});

	it('même rang seulement à égalité sur les deux nombres', async () => {
		db.players.push({ id: 3, login: 'ina', character: { name: 'Ina', image: null } });
		db.cards.length = 0;
		db.cards.push(card(1, 10, 1, 0.1), card(2, 11, 1, 0.1), card(3, 10, 3, 0.1), card(4, 11, 3, 0.1));
		const data = (await rankingPage.load({ locals: { user: { ...SERENA, login: 's', role: 0, characterId: null } } } as never)) as {
			players: { id: number; rank: number }[];
		};
		expect(data.players.filter((p) => p.id !== 2).map((p) => p.rank)).toEqual([1, 1]);
	});
});
