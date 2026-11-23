// Jets de stat : un joueur peut ajouter un bonus ou un malus à son propre jeton, borné, et il est
// écrit dans la ligne du journal que tout le monde voit. Le bonus du MJ, lui, reste dans le détail.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Viewer } from './state';

const tokens: Record<string, unknown>[] = [];
const logs: Record<string, any>[] = [];

vi.mock('$lib/server/prisma', () => ({
	prisma: {
		tableToken: {
			findFirst: async ({ where }: { where: { id: number; sessionId: number } }) =>
				tokens.find((t) => t.id === where.id && t.sessionId === where.sessionId) ?? null
		},
		tableLog: {
			create: async ({ data }: { data: Record<string, unknown> }) => {
				const row = { id: logs.length + 1, createdAt: new Date(0), undone: false, ...data };
				logs.push(row);
				return row;
			}
		}
	}
}));
// Pas de diffusion en temps réel pendant les tests.
vi.mock('./hub', () => ({ broadcast: () => {}, pushLogs: () => {}, pushEvent: () => {} }));

const { runAction } = await import('./actions');
const { MAX_ROLL_BONUS } = await import('$lib/game/combat');

const SERENA: Viewer = { playerId: 1, isAdmin: false, spectator: false, name: 'Serena' };
const LYRA: Viewer = { playerId: 2, isAdmin: false, spectator: false, name: 'Lyra' };
const MJ: Viewer = { playerId: null, isAdmin: true, spectator: false, name: 'MJ' };

function token(id: number, playerId: number | null, name: string) {
	return {
		id,
		sessionId: 1,
		sceneId: 1,
		kind: playerId ? 'player' : 'monster',
		playerId,
		refId: null,
		name,
		image: null,
		side: 'ally',
		x: 0,
		y: 0,
		size: 1,
		hidden: false,
		nameHidden: false,
		revealed: false,
		stats: { perception: 40 },
		armor: {},
		pv: 0,
		qdf: 0,
		endurance: 0
	};
}

beforeEach(() => {
	tokens.length = 0;
	logs.length = 0;
	tokens.push(token(1, 1, 'Serena'), token(2, 2, 'Lyra'));
});

const roll = (viewer: Viewer, body: Record<string, unknown>) =>
	runAction(1, viewer, { type: 'roll.stat', tokenId: 1, stat: 'perception', manual: 50, ...body });

describe('table : bonus et malus des joueurs', () => {
	it('le bonus d’un joueur est écrit dans la ligne publique du journal', async () => {
		await roll(SERENA, { bonus: 10 });
		expect(logs[0].text).toContain('Jet de Perception de Serena (bonus +10)');
		await roll(SERENA, { bonus: -5 });
		expect(logs[1].text).toContain('(malus −5)');
		expect(logs[1].data.detail).toContain('bonus -5');
	});

	it('le bonus est borné, et refusé s’il n’est pas un nombre', async () => {
		await roll(SERENA, { bonus: 5000 });
		expect(logs[0].text).toContain(`(bonus +${MAX_ROLL_BONUS})`);
		await roll(SERENA, { bonus: -5000 });
		expect(logs[1].text).toContain(`(malus −${MAX_ROLL_BONUS})`);
		await expect(roll(SERENA, { bonus: 'beaucoup' })).rejects.toMatchObject({ status: 400 });
		expect(logs).toHaveLength(2);
	});

	it('un joueur ne fait pas jouer le jeton d’un autre', async () => {
		await expect(roll(LYRA, { bonus: 10 })).rejects.toMatchObject({ status: 403 });
		expect(logs).toHaveLength(0);
	});

	it('le bonus du MJ reste secret : seulement dans le détail', async () => {
		await roll(MJ, { bonus: 20 });
		expect(logs[0].text).not.toContain('bonus');
		expect(logs[0].data.detail).toContain('bonus +20');
	});
});
