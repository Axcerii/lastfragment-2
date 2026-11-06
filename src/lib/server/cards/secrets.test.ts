// Le verso d'une carte garde les secrets de celui qui l'a obtenue : ces tests vérifient qu'il ne
// part jamais vers le navigateur d'un autre joueur, quelle que soit la page (collection, vitrine,
// échanges, lien direct vers un exemplaire). On contrôle les données envoyées, pas l'affichage :
// un verso simplement caché à l'écran resterait lisible dans le code de la page.

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultFace, type CardFace, type TemplateView } from '$lib/cards/types';
import { db, resetDb } from './testing/fake-db';

vi.mock('$lib/server/prisma', async () => ({ prisma: (await import('./testing/fake-db')).fakePrisma }));

const { collectionOf, showcaseOf } = await import('./collection');
const { tradesOf } = await import('./trades');
const { backReader, forReader, readerOf, sealFace, READ_ALL } = await import('./secrets');
const cardPage = await import('../../../routes/cartes/carte/[id]/+page.server');

const SERENA = { id: 1, isAdmin: false };
const LYRA = { id: 2, isAdmin: false };
const MJ = { id: 3, isAdmin: true };

/** Tout ce qui doit rester secret : aucun de ces textes ne doit sortir vers un joueur qui n'a pas eu la carte. */
const SECRETS = ['CITATION-SECRETE', 'TEXTE-SECRET', 'FICHE-SECRETE', 'BARRE-SECRETE'];

function face(tag: string): CardFace {
	return {
		...defaultFace('personnage', 2),
		subtitle: `Sous-titre ${tag}`,
		flavor: `CITATION-SECRETE ${tag}`,
		text: `TEXTE-SECRET ${tag}`,
		facts: [{ label: 'Âge', value: `FICHE-SECRETE ${tag}` }],
		bars: [{ label: 'BARRE-SECRETE', value: 80, dragon: '' }]
	};
}

function template(id: number, name: string, rarity = 2, status = 'publiee') {
	return { id, setId: 1, number: id, type: 'personnage', rarity, name, status, maxPrints: null, printed: 1, face: face(name) };
}

function card(id: number, templateId: number, ownerId: number | null, pinned = false) {
	return { id, templateId, ownerId, serial: id, wear: 0.1, origin: 'booster', pinned, obtainedAt: new Date(0) };
}

/** Le texte JSON tel qu'il partirait vers le navigateur. */
const sent = (value: unknown) => JSON.stringify(value);
const leaks = (value: unknown, tag: string) => SECRETS.filter((s) => sent(value).includes(`${s} ${tag}`));

beforeEach(() => {
	resetDb();
	db.players.push(
		{ id: 1, login: 'serena_login', character: { name: 'Serena', image: null } },
		{ id: 2, login: 'lyra_login', character: { name: 'Lyra', image: null } },
		{ id: 3, login: 'mj_login', character: null }
	);
	db.sets.push({ id: 1, name: 'Arc I', code: 'ARC1', color: '#e5b8cc', logo: null, sortOrder: 0 });
	db.templates.push(
		template(10, 'Adam'), // jamais eue par Lyra
		template(11, 'Kanna'), // eue par Lyra puis échangée : elle l'a déjà lue
		template(12, 'Apolyon', 5), // une Unique que Lyra possède
		template(13, 'Brouillon', 2, 'brouillon')
	);
	db.cards.push(card(100, 10, 1, true), card(101, 11, 1, true), card(102, 12, 1), card(200, 12, 2), card(300, 13, 1));
	db.events.push({ cardId: 101, kind: 'tirage', toId: 2 }, { cardId: 101, kind: 'echange', fromId: 2, toId: 1 });
});

describe('verso scellé : briques de base', () => {
	it('vide la fiche, les barres, la citation et le texte, et garde le recto', () => {
		const original = face('X');
		const sealed = sealFace(original);
		expect(sealed).toMatchObject({ flavor: '', text: '', facts: [], bars: [] });
		expect(sealed.subtitle).toBe(original.subtitle);
		expect(sealed.finish).toBe(original.finish);
		expect(sealed.accent).toBe(original.accent);
		expect(leaks(sealed, 'X')).toEqual([]);
		// L'original n'est pas modifié (il peut servir ailleurs dans la même requête).
		expect(original.flavor).toContain('CITATION-SECRETE');
	});

	it('marque le modèle scellé seulement si le lecteur ne le connaît pas', () => {
		const view = { id: 10, face: face('Y') } as TemplateView;
		expect(forReader(view, readerOf([10]))).toBe(view);
		expect(forReader(view, readerOf([11])).sealed).toBe(true);
		expect(forReader(view, READ_ALL).sealed).toBeUndefined();
	});

	it('un visiteur sans compte ne lit aucun verso, le MJ les lit tous', async () => {
		expect((await backReader(null))(10)).toBe(false);
		expect((await backReader(undefined))(12)).toBe(false);
		expect((await backReader(MJ))(10)).toBe(true);
	});

	it('un joueur connaît ce qu’il possède et ce qu’il a déjà reçu', async () => {
		const canRead = await backReader(LYRA);
		expect(canRead(12)).toBe(true); // possédée
		expect(canRead(11)).toBe(true); // reçue puis échangée
		expect(canRead(10)).toBe(false); // jamais eue
	});
});

describe('collection d’un autre joueur', () => {
	it('scelle les cartes que le visiteur n’a jamais eues, sans rien laisser fuiter', async () => {
		const collection = await collectionOf(1, LYRA);
		expect(collection.templates[10].sealed).toBe(true);
		expect(collection.templates[10].face).toMatchObject({ flavor: '', text: '', facts: [], bars: [] });
		expect(leaks(collection, 'Adam')).toEqual([]);
		// Le recto reste complet : nom, sous-titre, rareté.
		expect(collection.templates[10].name).toBe('Adam');
		expect(collection.templates[10].face.subtitle).toBe('Sous-titre Adam');
	});

	it('laisse lisibles les cartes que le visiteur possède ou a déjà eues', async () => {
		const collection = await collectionOf(1, LYRA);
		expect(collection.templates[11].sealed).toBeUndefined();
		expect(collection.templates[11].face.flavor).toContain('CITATION-SECRETE');
		expect(collection.templates[12].face.facts).toHaveLength(1);
	});

	it('un visiteur sans compte ne reçoit aucun verso', async () => {
		const collection = await collectionOf(1, null);
		for (const tag of ['Adam', 'Kanna', 'Apolyon']) expect(leaks(collection, tag)).toEqual([]);
	});

	it('sa propre collection se lit entièrement, comme le MJ', async () => {
		for (const viewer of [SERENA, MJ]) {
			const collection = await collectionOf(1, viewer);
			expect(Object.values(collection.templates).every((t) => !t.sealed)).toBe(true);
			expect(collection.templates[10].face.flavor).toContain('CITATION-SECRETE');
		}
	});

	it('n’envoie jamais le pseudo de connexion', async () => {
		expect(sent(await collectionOf(1, LYRA))).not.toContain('serena_login');
	});
});

describe('vitrines (profil, fiche de personnage)', () => {
	it('scelle les cartes épinglées inconnues du visiteur', async () => {
		const pinned = (await showcaseOf([1], LYRA)).get(1)!;
		const adam = pinned.find((c) => c.template.id === 10)!;
		const kanna = pinned.find((c) => c.template.id === 11)!;
		expect(adam.template.sealed).toBe(true);
		expect(leaks(pinned, 'Adam')).toEqual([]);
		expect(kanna.template.face.flavor).toContain('CITATION-SECRETE');
	});

	it('fiche de personnage vue sans compte : tout est scellé', async () => {
		const pinned = (await showcaseOf([1], null)).get(1)!;
		expect(pinned.every((c) => c.template.sealed)).toBe(true);
	});
});

describe('échanges', () => {
	it('une carte proposée par un autre joueur garde son verso scellé jusqu’à l’échange', async () => {
		db.trades.push({ id: 1, fromId: 1, toId: 2, status: 'attente', message: null, createdAt: new Date(0), resolvedAt: null });
		db.tradeItems.push({ tradeId: 1, cardId: 100, offered: true }, { tradeId: 1, cardId: 200, offered: false });
		const [trade] = await tradesOf(LYRA);
		expect(trade.offered[0].template.sealed).toBe(true);
		expect(leaks(trade, 'Adam')).toEqual([]);
		// Sa propre carte (demandée en retour) reste lisible.
		expect(trade.requested[0].template.face.flavor).toContain('CITATION-SECRETE');
	});
});

describe('page d’un exemplaire (/cartes/carte/[id])', () => {
	const open = async (id: number, user: { id: number; isAdmin: boolean }) =>
		(await cardPage.load({ locals: { user: { ...user, login: 'x', role: 0, characterId: null } }, params: { id: String(id) } } as never)) as {
			card: { template: TemplateView };
		};

	it('le lien direct vers l’exemplaire d’un autre ne suffit pas à lire le verso', async () => {
		const page = await open(100, LYRA);
		expect(page.card.template.sealed).toBe(true);
		expect(leaks(page, 'Adam')).toEqual([]);
	});

	it('le propriétaire et le MJ lisent le verso', async () => {
		expect((await open(100, SERENA)).card.template.face.flavor).toContain('CITATION-SECRETE');
		expect((await open(100, MJ)).card.template.face.flavor).toContain('CITATION-SECRETE');
	});

	it('un brouillon reste introuvable pour un joueur', async () => {
		await expect(open(300, LYRA)).rejects.toMatchObject({ status: 404 });
	});

	it('refuse un identifiant qui n’est pas un nombre', async () => {
		await expect(open('1 OR 1=1' as never, LYRA)).rejects.toMatchObject({ status: 404 });
	});
});

// ─── Garde-fou pour la suite ─────────────────────────────────────────────
// Une nouvelle page qui enverrait des cartes sans passer par secrets.ts ferait fuiter les versos.
// Toute vue de modèle (`ownedView`, `templateView`) hors de l'espace MJ doit être scellée sur place,
// ou venir d'un module serveur relu et autorisé ci-dessous.

const ROOT = join(__dirname, '../../..');

function sources(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const path = join(dir, name);
		if (statSync(path).isDirectory()) return sources(path);
		return /\.(ts|svelte)$/.test(name) && !/\.test\.ts$/.test(name) ? [path] : [];
	});
}

/** Modules qui envoient des modèles sans les sceller, avec la raison. */
const ALLOWED: Record<string, string> = {
	'lib/server/cards/views.ts': 'définit les vues',
	'lib/server/cards/boosters.ts': 'cartes que le joueur vient de tirer lui-même',
	'routes/admin': 'espace MJ (réservé par hooks.server.ts)'
};

describe('garde-fou : aucune vue de carte hors de secrets.ts', () => {
	it('chaque appel à ownedView / templateView est scellé ou autorisé', () => {
		const offenders: string[] = [];
		for (const file of sources(ROOT)) {
			const rel = relative(ROOT, file).replaceAll('\\', '/');
			if (Object.keys(ALLOWED).some((allowed) => rel.startsWith(allowed))) continue;
			readFileSync(file, 'utf8')
				.split('\n')
				.forEach((line, i) => {
					if (/\b(ownedView|templateView)\(/.test(line) && !/(forReader|ownedForReader)\(/.test(line) && !/^\s*(\/\/|\*|import)/.test(line)) {
						offenders.push(`${rel}:${i + 1}`);
					}
				});
		}
		expect(offenders).toEqual([]);
	});
});
