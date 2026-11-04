// Espace MJ : gestion des cartes d'un joueur et numéros d'une série. On vérifie qu'un joueur ne
// peut pas s'en servir, et qu'une requête trafiquée ne touche que ce qu'elle doit toucher.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultFace } from '$lib/cards/types';
import { db, resetDb } from './testing/fake-db';

vi.mock('$lib/server/prisma', async () => ({ prisma: (await import('./testing/fake-db')).fakePrisma }));

const { readIds, removeCardsOf, moveCardsOf, unpinCardsOf, MAX_BATCH } = await import('./admin');
const { renumberSet } = await import('./manage');
const playerPage = await import('../../../routes/admin/cartes/joueurs/[id]/+page.server');
const numbersPage = await import('../../../routes/admin/cartes/series/[id]/numeros/+page.server');

function card(id: number, ownerId: number | null, pinned = false) {
	return { id, templateId: 10, ownerId, serial: id, wear: 0.2, origin: 'booster', pinned, obtainedAt: new Date(0) };
}

beforeEach(() => {
	resetDb();
	db.players.push({ id: 1, login: 'a', character: null }, { id: 2, login: 'b', character: null }, { id: 3, login: 'c', character: null });
	db.sets.push({ id: 1, name: 'Arc I', code: 'ARC1', color: '#e5b8cc', logo: null }, { id: 2, name: 'Arc II', code: 'ARC2', color: '#e5b8cc', logo: null });
	db.templates.push(
		{ id: 10, setId: 1, number: 1, type: 'personnage', rarity: 1, name: 'A', status: 'publiee', face: defaultFace() },
		{ id: 11, setId: 1, number: 2, type: 'personnage', rarity: 1, name: 'B', status: 'publiee', face: defaultFace() },
		{ id: 20, setId: 2, number: 1, type: 'personnage', rarity: 1, name: 'C', status: 'publiee', face: defaultFace() }
	);
	db.cards.push(card(1, 1, true), card(2, 1), card(3, 2, true));
});

describe('identifiants envoyés par formulaire', () => {
	it('ne garde que des entiers positifs, sans doublon', () => {
		expect(readIds(['3', '3', ' 4 ', '-1', '0', '1e3', '2.5', 'abc', '5;DROP TABLE', '9999999999', '7'])).toEqual([3, 4, 7]);
	});

	it('borne le nombre d’exemplaires par action', () => {
		const many = Array.from({ length: MAX_BATCH + 50 }, (_, i) => String(i + 1));
		expect(readIds(many)).toHaveLength(MAX_BATCH);
	});
});

describe('actions en lot sur les cartes d’un joueur', () => {
	it('retirer ne touche que les cartes du joueur de la page', async () => {
		// La carte 3 appartient au joueur 2 : glissée dans la liste, elle doit être ignorée.
		expect(await removeCardsOf(1, [1, 3])).toBe(1);
		expect(db.cards.find((c) => c.id === 1)!.ownerId).toBeNull();
		expect(db.cards.find((c) => c.id === 3)!.ownerId).toBe(2);
	});

	it('déplacer ne touche que les cartes du joueur, vers un joueur qui existe', async () => {
		expect(await moveCardsOf(1, [2, 3], 3)).toBe(1);
		expect(db.cards.find((c) => c.id === 2)!.ownerId).toBe(3);
		expect(db.cards.find((c) => c.id === 3)!.ownerId).toBe(2);
		await expect(moveCardsOf(1, [1], 999)).rejects.toMatchObject({ status: 404 });
		await expect(moveCardsOf(1, [1], 1)).rejects.toThrow();
	});

	it('retirer de la vitrine ne touche pas les cartes des autres', async () => {
		expect(await unpinCardsOf(1, [1, 3])).toBe(1);
		expect(db.cards.find((c) => c.id === 3)!.pinned).toBe(true);
	});
});

describe('renumérotation d’une série', () => {
	it('échange deux numéros sans buter sur l’unicité', async () => {
		expect(await renumberSet(1, [{ id: 10, number: 2 }, { id: 11, number: 1 }])).toBe(2);
		expect(db.templates.find((t) => t.id === 10)!.number).toBe(2);
		expect(db.templates.find((t) => t.id === 11)!.number).toBe(1);
	});

	it('ne peut pas toucher une carte d’une autre série', async () => {
		await expect(renumberSet(1, [{ id: 10, number: 1 }, { id: 20, number: 5 }])).rejects.toThrow();
		expect(db.templates.find((t) => t.id === 20)!.number).toBe(1);
	});
});

describe('réservé au MJ', () => {
	const player = { id: 2, login: 'b', role: 0, characterId: null, isAdmin: false };
	const form = (fields: Record<string, string | string[]>) => {
		const data = new FormData();
		for (const [k, v] of Object.entries(fields)) for (const value of [v].flat()) data.append(k, value);
		return new Request('http://localhost/', { method: 'POST', body: data });
	};

	it('un joueur ne peut lancer aucune action de la page d’un joueur', async () => {
		const attempts: [string, Record<string, string | string[]>][] = [
			['gift', { amount: '50' }],
			['stock', { stock: '99' }],
			['give', { templateId: '10', count: '20' }],
			['remove', { cards: ['3'] }],
			['move', { cards: ['3'], toId: '2' }],
			['unpin', { cards: ['3'] }],
			['replay', { openingId: '1' }]
		];
		for (const [name, fields] of attempts) {
			const action = (playerPage.actions as Record<string, (e: never) => Promise<unknown>>)[name];
			await expect(action({ request: form(fields), locals: { user: player }, params: { id: '1' } } as never)).rejects.toMatchObject({ status: 403 });
		}
		// Rien n'a bougé.
		expect(db.cards.map((c) => c.ownerId)).toEqual([1, 1, 2]);
	});

	it('sans compte, la page renvoie vers la connexion', async () => {
		await expect(playerPage.load({ locals: { user: null }, params: { id: '1' } } as never)).rejects.toMatchObject({ status: 303 });
	});

	it('un joueur ne peut pas renuméroter une série', async () => {
		await expect(
			numbersPage.actions.save({ request: form({ numbers: '[]' }), locals: { user: player }, params: { id: '1' } } as never)
		).rejects.toMatchObject({ status: 403 });
	});
});
