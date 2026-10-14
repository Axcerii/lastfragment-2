// Création des jetons à partir des fiches : stats finales d'un joueur, d'un personnage ou d'un monstre.
import { error } from '@sveltejs/kit';
import { computeSheet, type Sheet } from '$lib/game/bonus';
import { portrait } from '$lib/game/labels';
import { sheetOf } from '$lib/game/sheet';
import { STAT_KEYS, emptyStats, toStatBlock, type StatBlock } from '$lib/game/stats';
import type { TokenKind } from '$lib/table/types';
import { prisma } from '../prisma';
import { loadSheet } from '../sheet';

export interface TokenSource {
	name: string;
	image: string | null;
	stats: StatBlock;
	armor: StatBlock;
	playerId: number | null;
	refId: number | null;
}

function split(sheet: Sheet): { stats: StatBlock; armor: StatBlock } {
	const stats = emptyStats();
	const armor = emptyStats();
	for (const k of STAT_KEYS) {
		stats[k] = sheet[k].total;
		armor[k] = sheet[k].armor;
	}
	return { stats, armor };
}

/** Stats d'un joueur telles qu'en jeu : base + armure équipée + passifs. */
export async function playerSource(playerId: number): Promise<TokenSource> {
	const sheet = await loadSheet(playerId);
	if (!sheet.character) error(400, 'Ce joueur n’a pas de personnage.');
	return {
		name: sheet.character.name,
		image: sheet.character.image,
		...split(sheetOf(sheet.stats, sheet.inventory, sheet.passives)),
		playerId,
		refId: sheet.character.id
	};
}

export async function characterSource(id: number): Promise<TokenSource> {
	const character = await prisma.character.findUnique({
		where: { id },
		include: { statistics: true, passives: true }
	});
	if (!character) error(404, 'Personnage introuvable.');
	return {
		name: character.name,
		image: portrait(character.image),
		...split(computeSheet(toStatBlock(character.statistics), [], character.passives)),
		playerId: null,
		refId: id
	};
}

export async function monsterSource(id: number): Promise<TokenSource> {
	const monster = await prisma.monster.findUnique({ where: { id }, include: { statistics: true } });
	if (!monster) error(404, 'Monstre introuvable.');
	return {
		name: monster.name,
		image: monster.image || null,
		stats: toStatBlock(monster.statistics),
		armor: emptyStats(),
		playerId: null,
		refId: id
	};
}

/** Relit la fiche d'origine d'un jeton (après un changement d'armure, de passif…). */
export async function sourceOf(kind: TokenKind, refId: number | null, playerId: number | null) {
	if (kind === 'player' && playerId) return playerSource(playerId);
	if (kind === 'character' && refId) return characterSource(refId);
	if (kind === 'monster' && refId) return monsterSource(refId);
	return null;
}

/** Première case libre de la scène, en partant du coin haut-gauche. */
export async function freeCell(sceneId: number | null, cols: number, rows: number) {
	const taken = new Set(
		sceneId
			? (await prisma.tableToken.findMany({ where: { sceneId }, select: { x: true, y: true } })).map(
					(t) => `${t.x},${t.y}`
				)
			: []
	);
	for (let y = 1; y < rows; y++) {
		for (let x = 1; x < cols; x++) if (!taken.has(`${x},${y}`)) return { x, y };
	}
	return { x: 0, y: 0 };
}

/** Le jeton du joueur dans la partie, créé à sa première venue. */
export async function ensurePlayerToken(sessionId: number, playerId: number) {
	const existing = await prisma.tableToken.findFirst({
		where: { sessionId, kind: 'player', playerId }
	});
	if (existing) return { token: existing, created: false };

	const session = await prisma.tableSession.findUnique({
		where: { id: sessionId },
		include: { scenes: true }
	});
	const scene = session?.scenes.find((s) => s.id === session.sceneId);
	const source = await playerSource(playerId);
	const cell = await freeCell(scene?.id ?? null, scene?.cols ?? 24, scene?.rows ?? 16);
	const token = await prisma.tableToken.create({
		data: {
			sessionId,
			sceneId: scene?.id ?? null,
			kind: 'player',
			playerId,
			refId: source.refId,
			name: source.name,
			image: source.image,
			side: 'ally',
			revealed: true,
			...cell,
			stats: source.stats,
			armor: source.armor,
			pv: source.stats.pv,
			qdf: source.stats.qdf,
			endurance: source.stats.endurance
		}
	});
	return { token, created: true };
}
