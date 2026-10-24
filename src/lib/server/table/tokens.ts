// Création des jetons à partir des fiches : stats finales d'un joueur, d'un personnage ou d'un monstre.
import { error } from '@sveltejs/kit';
import type { Prisma } from '@prisma/client';
import { computeSheet, type ArmorPiece, type Sheet } from '$lib/game/bonus';
import { armorSlot } from '$lib/game/inventory';
import { portrait } from '$lib/game/labels';
import { sheetOf } from '$lib/game/sheet';
import { STAT_KEYS, emptyStats, toStatBlock, type StatBlock, type StatKey } from '$lib/game/stats';
import type { WeaponBonus } from '$lib/game/weapons';
import { baseName, instanceName } from '$lib/table/naming';
import type { TokenKind } from '$lib/table/types';
import { prisma } from '../prisma';
import { loadSheet } from '../sheet';
import { broadcast } from './hub';
import { numbers } from './state';

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

/**
 * Relit les stats des jetons d'un joueur, dans toutes les parties, après un changement d'équipement
 * fait depuis sa fiche. Les jauges actuelles ne bougent pas.
 */
export async function refreshPlayerTokens(playerId: number) {
	const tokens = await prisma.tableToken.findMany({ where: { kind: 'player', playerId } });
	if (!tokens.length) return;
	const source = await playerSource(playerId).catch(() => null);
	if (!source) return;
	await prisma.tableToken.updateMany({
		where: { id: { in: tokens.map((t) => t.id) } },
		data: { stats: source.stats, armor: source.armor }
	});
	for (const sessionId of new Set(tokens.map((t) => t.sessionId))) broadcast(sessionId);
}

export interface AttackWeapon {
	/** Arme choisie, ou `null` pour frapper sans arme. */
	weapon: { id: number; name: string; bonuses: WeaponBonus[] } | null;
	/**
	 * Part de la stat d'attaque due aux armes tenues mais pas utilisées, à retirer :
	 * frapper sans arme (ou avec l'autre main) ne profite pas de leurs bonus de stats.
	 */
	unused: number;
	/** Le joueur tient au moins une arme (pour écrire « sans arme » au journal). */
	holding: boolean;
}

/** Arme d'un joueur pour une attaque : elle doit être équipée. */
export async function attackWeapon(
	playerId: number,
	weaponId: number | null,
	stat: StatKey
): Promise<AttackWeapon> {
	const sheet = await loadSheet(playerId);
	const weapons = sheet.inventory.filter((e) => e.hand && e.container === 'main');
	const chosen = weaponId === null ? null : weapons.find((e) => e.id === weaponId);
	if (weaponId !== null && !chosen) error(400, 'Cette arme n’est pas équipée.');

	const unusedIds = new Set(weapons.filter((e) => e !== chosen).map((e) => e.id));
	let unused = 0;
	if (unusedIds.size) {
		const full = sheetOf(sheet.stats, sheet.inventory, sheet.passives);
		const without = sheetOf(
			sheet.stats,
			sheet.inventory.filter((e) => !unusedIds.has(e.id)),
			sheet.passives
		);
		unused = full[stat].total - without[stat].total;
	}
	return {
		weapon: chosen ? { id: chosen.id, name: chosen.item.name, bonuses: chosen.weaponBonuses } : null,
		unused,
		holding: weapons.length > 0
	};
}

/** Pièces d'armure choisies par le MJ pour un personnage ou un monstre. */
async function armorPieces(armorIds: Prisma.JsonValue | null): Promise<ArmorPiece[]> {
	const ids = numbers(armorIds);
	if (!ids.length) return [];
	const armors = await prisma.armor.findMany({
		where: { id: { in: ids } },
		select: { statistics: true, values: true, item: { select: { name: true } } }
	});
	return armors.map((a) => ({ name: a.item.name, statistics: a.statistics, values: a.values }));
}

export async function characterSource(id: number): Promise<TokenSource> {
	const character = await prisma.character.findUnique({
		where: { id },
		include: { statistics: true, passives: true }
	});
	if (!character) error(404, 'Personnage introuvable.');
	const pieces = await armorPieces(character.armorIds);
	return {
		name: character.name,
		image: portrait(character.image),
		...split(computeSheet(toStatBlock(character.statistics), pieces, character.passives)),
		playerId: null,
		refId: id
	};
}

export async function monsterSource(id: number): Promise<TokenSource> {
	const monster = await prisma.monster.findUnique({ where: { id }, include: { statistics: true } });
	if (!monster) error(404, 'Monstre introuvable.');
	const pieces = await armorPieces(monster.armorIds);
	return {
		name: monster.name,
		image: monster.image || null,
		...split(computeSheet(toStatBlock(monster.statistics), pieces)),
		playerId: null,
		refId: id
	};
}

/**
 * Change l'armure d'un personnage ou d'un monstre, n'importe quelle pièce du catalogue,
 * sans regarder d'inventaire. Une seule pièce par emplacement : la dernière demandée l'emporte.
 */
export async function setSheetArmor(kind: 'character' | 'monster', id: number, armorIds: number[]) {
	const armors = await prisma.armor.findMany({
		where: { id: { in: armorIds } },
		select: { id: true, item: { select: { category: true } } }
	});
	const bySlot = new Map<string, number>();
	for (const armorId of armorIds) {
		const armor = armors.find((a) => a.id === armorId);
		const slot = armor && armorSlot(armor.item.category);
		if (slot) bySlot.set(slot, armorId);
	}
	const data = { armorIds: [...bySlot.values()] };
	if (kind === 'character') await prisma.character.update({ where: { id }, data });
	else await prisma.monster.update({ where: { id }, data });
}

/** Relit la fiche d'origine d'un jeton (après un changement d'armure, de passif…). */
export async function sourceOf(kind: TokenKind, refId: number | null, playerId: number | null) {
	if (kind === 'player' && playerId) return playerSource(playerId);
	if (kind === 'character' && refId) return characterSource(refId);
	if (kind === 'monster' && refId) return monsterSource(refId);
	return null;
}

/**
 * Nom d'un nouveau jeton (hors joueurs) : numéroté s'il y en a déjà un du même nom dans la partie,
 * auquel cas le premier passe à « [1] ».
 */
export async function numberedName(sessionId: number, name: string): Promise<string> {
	const base = baseName(name);
	const siblings = await prisma.tableToken.findMany({
		where: { sessionId, kind: { not: 'player' }, name: { startsWith: base } },
		select: { id: true, name: true }
	});
	const next = instanceName(base, siblings.map((t) => t.name));
	if (next.renameFirst) {
		await prisma.tableToken.updateMany({
			where: { sessionId, kind: { not: 'player' }, name: base },
			data: { name: `${base} [1]` }
		});
	}
	return next.name;
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
