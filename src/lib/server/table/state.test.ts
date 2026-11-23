// Vue de la table filtrée selon qui regarde : un joueur ne doit recevoir ni les chiffres des autres
// jetons (sauf révélés), ni le vrai nom d'un jeton masqué, ni les passifs ou armes des autres. Un
// jeton sans PV max (fiche sans PV) n'apparaît jamais K.O.

import { describe, expect, it, vi } from 'vitest';
import type { Viewer } from './state';

vi.mock('$lib/server/prisma', () => ({ prisma: {} }));

const { buildView, logView, seesNumbers } = await import('./state');
const { gaugeRatio } = await import('$lib/components/table/gauges');

const STATS = { pv: 2000, qdf: 1500, endurance: 900, strength: 60, defense: 40 };

function token(id: number, extra: Record<string, unknown> = {}) {
	return {
		id,
		sessionId: 1,
		sceneId: 1,
		kind: 'player',
		playerId: id,
		refId: null,
		name: `Jeton ${id}`,
		image: null,
		side: 'ally',
		x: id,
		y: 0,
		size: 1,
		hidden: false,
		nameHidden: false,
		revealed: false,
		stats: STATS,
		armor: {},
		pv: 1200,
		qdf: 800,
		endurance: 400,
		...extra
	};
}

function session(tokens: ReturnType<typeof token>[]) {
	return {
		id: 1,
		name: 'Test',
		open: true,
		sceneId: 1,
		obsKey: 'k',
		combat: false,
		order: [],
		orderVisible: false,
		turn: null,
		showcase: null,
		music: null,
		ambiences: [],
		createdAt: new Date(0),
		scenes: [
			{
				id: 1,
				sessionId: 1,
				name: 'Scène',
				background: null,
				cols: 24,
				rows: 16,
				gridVisible: true,
				fogEnabled: false,
				fog: [],
				effects: null,
				musicUrl: '/secret.mp3',
				musicName: 'Secret',
				sortOrder: 0,
				drawings: []
			}
		],
		tokens,
		characters: new Map([[1, { id: 50, passives: [{ id: 1, name: 'Colosse', description: '', active: true, statistics: '', maths: '', inactiveMaths: null }] }]]),
		armors: new Map(),
		weapons: new Map([[1, [{ id: 9, name: 'Lame', hand: 'droite' as const, bonuses: [] }]]])
	} as never;
}

const MJ: Viewer = { playerId: null, isAdmin: true, spectator: false, name: 'MJ' };
const SERENA: Viewer = { playerId: 1, isAdmin: false, spectator: false, name: 'Serena' };
const LYRA: Viewer = { playerId: 2, isAdmin: false, spectator: false, name: 'Lyra' };
const OBS: Viewer = { playerId: null, isAdmin: false, spectator: true, name: 'OBS' };

const view = (viewer: Viewer, tokens = [token(1), token(2)]) => buildView(session(tokens), viewer);
const tok = (v: ReturnType<typeof view>, id: number) => v.tokens.find((t) => t.id === id)!;

describe('table : ce que chacun voit des jetons', () => {
	it('un joueur voit ses chiffres, pas ceux d’un autre joueur aux stats cachées', () => {
		const v = view(SERENA);
		expect(tok(v, 1).stats).not.toBeNull();
		expect(tok(v, 1).pv).toEqual({ current: 1200, max: 2000 });
		expect(tok(v, 2).stats).toBeNull();
		expect(tok(v, 2).qdf).toBeNull();
		expect(tok(v, 2).endurance).toBeNull();
		expect(tok(v, 2).armor).toBeNull();
		// Seulement une proportion, jamais les nombres.
		expect(tok(v, 2).pv).toEqual({ ratio: 0.6 });
	});

	it('le MJ voit tout, la vue OBS rien de plus que les joueurs', () => {
		expect(tok(view(MJ), 2).stats).not.toBeNull();
		expect(tok(view(OBS), 1).stats).toBeNull();
		expect(tok(view(OBS), 2).stats).toBeNull();
	});

	it('les stats révélées par le MJ deviennent visibles de tous', () => {
		const v = view(LYRA, [token(1, { revealed: true }), token(2)]);
		expect(tok(v, 1).stats).not.toBeNull();
		expect(seesNumbers(token(1) as never, LYRA)).toBe(false);
	});

	it('passifs, armes et musique restent au MJ et au propriétaire', () => {
		expect(tok(view(SERENA), 1).passives).toHaveLength(1);
		expect(tok(view(SERENA), 1).weapons).toHaveLength(1);
		expect(tok(view(LYRA), 1).passives).toBeNull();
		expect(tok(view(LYRA), 1).weapons).toBeNull();
		expect(view(LYRA).scenes[0].musicUrl).toBeNull();
		expect(view(MJ).scenes[0].musicUrl).toBe('/secret.mp3');
	});

	it('un nom masqué n’est jamais envoyé aux joueurs', () => {
		const tokens = [token(1), token(3, { kind: 'monster', playerId: null, name: 'Dragon secret', nameHidden: true })];
		expect(JSON.stringify(view(SERENA, tokens))).not.toContain('Dragon secret');
		expect(tok(view(MJ, tokens), 3).name).toBe('Dragon secret');
	});

	it('un jeton caché n’est envoyé qu’au MJ', () => {
		const tokens = [token(1), token(3, { kind: 'monster', playerId: null, hidden: true, name: 'Embuscade' })];
		expect(view(SERENA, tokens).tokens.map((t) => t.id)).toEqual([1]);
		expect(JSON.stringify(view(OBS, tokens))).not.toContain('Embuscade');
		expect(view(MJ, tokens).tokens).toHaveLength(2);
	});
});

describe('table : jeton sans PV max', () => {
	const noHp = token(4, { kind: 'character', playerId: null, stats: { ...STATS, pv: 0 }, pv: 0 });

	it('n’a pas de jauge pour les joueurs, donc n’est pas K.O.', () => {
		expect(tok(view(SERENA, [token(1), noHp]), 4).pv).toBeNull();
	});

	it('pour le MJ, sa jauge 0/0 ne donne pas de proportion (pas K.O. non plus)', () => {
		const pv = tok(view(MJ, [noHp]), 4).pv!;
		expect(pv).toEqual({ current: 0, max: 0 });
		expect(gaugeRatio(pv)).toBeNull();
	});

	it('un jeton à 0 PV sur un vrai maximum reste K.O.', () => {
		const down = token(5, { kind: 'monster', playerId: null, pv: 0 });
		expect(tok(view(SERENA, [token(1), down]), 5).pv).toEqual({ ratio: 0 });
	});
});

describe('table : journal', () => {
	const log = (data: Record<string, unknown>, kind = 'stat') =>
		({ id: 1, sessionId: 1, kind, author: 'Serena', hidden: false, text: 'Jet', data, undone: false, createdAt: new Date(0) }) as never;

	it('le détail chiffré reste au MJ', () => {
		const data = { detail: 'FOR 60 + bonus 10 → 70', publicDetail: 'FOR 60' };
		expect(logView(log(data), SERENA).detail).toBeNull();
		expect(logView(log(data), MJ).detail).toBe('FOR 60 + bonus 10 → 70');
	});
});
