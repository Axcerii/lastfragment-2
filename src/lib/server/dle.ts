import { env } from '$env/dynamic/private';
import { Prisma } from '@prisma/client';
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomInt } from 'crypto';
import { compareGuess, computeStats, previousDay, type DleRow } from '$lib/game/dle';
import { ROLE_ADMIN } from '$lib/game/labels';
import { prisma } from './prisma';

const TIME_ZONE = 'Europe/Paris';
// Jour n°1 du Lastdle.
const FIRST_DAY = Date.UTC(2026, 9, 24);
const DAY_MS = 24 * 60 * 60 * 1000;

/** Date du jour à Paris (AAAA-MM-JJ) : l'énigme change à minuit, heure française. */
export function today(now = new Date()): string {
	return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(now);
}

/** Numéro du jour, à partir de 1. */
export function dayNumber(date: string): number {
	return Math.round((Date.parse(`${date}T00:00:00Z`) - FIRST_DAY) / DAY_MS) + 1;
}

/** Seuls les personnages visibles et non censurés peuvent être à deviner. */
export async function dlePool() {
	return prisma.character.findMany({
		where: { visibility: 1, censored: false },
		select: { id: true, name: true, title: true, image: true, flux: true, job: true, dragon: true, race: true, country: true, dead: true },
		orderBy: { name: 'asc' }
	});
}

export type DlePool = Awaited<ReturnType<typeof dlePool>>;
type PoolCharacter = DlePool[number];

/**
 * Personnage proposé pour un jour donné. Le pool est mélangé une fois pour toutes par une clé
 * secrète, puis parcouru un jour après l'autre : pas de répétition avant d'avoir vu tout le
 * monde, et personne ne peut calculer la réponse depuis le code source.
 */
function pick(pool: DlePool, day: number) {
	if (!pool.length) return null;
	const secret = env.JWT_SECRET ?? '';
	const rank = (id: number) => createHmac('sha256', secret).update(`lastdle:${id}`).digest('hex');
	const order = pool.toSorted((a, b) => rank(a.id).localeCompare(rank(b.id)));
	const index = (((day - 1) % order.length) + order.length) % order.length;
	return order[index];
}

/**
 * Personnage du jour, enregistré au premier passage : il reste le même pour tout le monde jusqu'à
 * minuit. S'il a été caché ou censuré entre-temps, un autre le remplace, puisqu'on ne pourrait plus le proposer.
 */
export async function dailyAnswer(date: string, pool: DlePool): Promise<PoolCharacter | null> {
	const stored = await prisma.dleDay.findUnique({ where: { date } });
	const kept = stored && pool.find((c) => c.id === stored.characterId);
	if (kept) return kept;

	const chosen = pick(pool, dayNumber(date));
	if (!chosen) return null;
	try {
		await prisma.dleDay.upsert({
			where: { date },
			create: { date, characterId: chosen.id },
			update: { characterId: chosen.id }
		});
	} catch (e) {
		// Deux visiteurs au même instant : l'autre a enregistré le même choix.
		if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) throw e;
	}
	return chosen;
}

/** Réponse de la veille, si quelqu'un a joué ce jour-là. */
export async function yesterdayAnswer(date: string) {
	const stored = await prisma.dleDay.findUnique({
		where: { date: previousDay(date) },
		select: { character: { select: { id: true, name: true, image: true } } }
	});
	return stored?.character ?? null;
}

/** Compare des ids d'essais à la réponse ; les ids hors du pool sont ignorés. */
export function compareAll(ids: number[], pool: DlePool, answer: PoolCharacter): DleRow[] {
	const byId = new Map(pool.map((c) => [c.id, c]));
	return ids.flatMap((id) => {
		const guess = byId.get(id);
		return guess ? [compareGuess(guess, answer)] : [];
	});
}

// --- Parties des joueurs connectés ---

const idsOf = (guesses: Prisma.JsonValue): number[] =>
	Array.isArray(guesses) ? guesses.filter((id): id is number => Number.isInteger(id)) : [];

export async function playerGuesses(playerId: number, date: string): Promise<number[]> {
	const game = await prisma.dleGame.findUnique({ where: { playerId_date: { playerId, date } } });
	return game ? idsOf(game.guesses) : [];
}

/** Ajoute un essai à la partie du jour. Une partie gagnée n'accepte plus d'essai. */
export async function recordGuess(playerId: number, date: string, id: number, correct: boolean): Promise<number[]> {
	return prisma.$transaction(async (tx) => {
		const game = await tx.dleGame.findUnique({ where: { playerId_date: { playerId, date } } });
		const ids = game ? idsOf(game.guesses) : [];
		if (game?.solvedAt || ids.includes(id)) return ids;

		const next = [...ids, id];
		const solvedAt = correct ? new Date() : null;
		if (game) await tx.dleGame.update({ where: { id: game.id }, data: { guesses: next, solvedAt } });
		else await tx.dleGame.create({ data: { playerId, date, guesses: next, solvedAt } });
		return next;
	});
}

export async function playerStats(playerId: number, date: string) {
	const wins = await prisma.dleGame.findMany({
		where: { playerId, solvedAt: { not: null } },
		select: { date: true }
	});
	return computeStats(
		wins.map((w) => w.date),
		date
	);
}

/**
 * Classement du jour : les joueurs qui ont trouvé, du moins d'essais au plus, puis du plus rapide.
 * Le MJ connaît toutes les fiches : il joue, mais hors classement.
 */
export async function ranking(date: string, viewerId: number) {
	const games = await prisma.dleGame.findMany({
		where: { date, player: { role: { lt: ROLE_ADMIN } } },
		select: {
			playerId: true,
			guesses: true,
			solvedAt: true,
			player: { select: { login: true, character: { select: { name: true, image: true } } } }
		}
	});

	const solved = games
		.filter((g) => g.solvedAt)
		.map((g) => ({ ...g, tries: idsOf(g.guesses).length }))
		.sort((a, b) => a.tries - b.tries || a.solvedAt!.getTime() - b.solvedAt!.getTime());

	const time = new Intl.DateTimeFormat('fr-FR', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit' });
	return {
		entries: solved.map((g, i) => ({
			rank: i + 1,
			login: g.player.login,
			character: g.player.character,
			tries: g.tries,
			time: time.format(g.solvedAt!),
			me: g.playerId === viewerId
		})),
		playing: games.filter((g) => !g.solvedAt && idsOf(g.guesses).length > 0).length
	};
}

// --- Mode infini ---
// Le personnage à trouver voyage chiffré dans un jeton : le navigateur le garde sans pouvoir le lire.

const tokenKey = () => createHash('sha256').update(`lastdle-infini:${env.JWT_SECRET ?? ''}`).digest();

export function infiniteToken(pool: DlePool): string | null {
	if (!pool.length) return null;
	const id = pool[randomInt(pool.length)].id;
	const iv = randomBytes(12);
	const cipher = createCipheriv('aes-256-gcm', tokenKey(), iv);
	const sealed = Buffer.concat([cipher.update(String(id), 'utf8'), cipher.final()]);
	return Buffer.concat([iv, cipher.getAuthTag(), sealed]).toString('base64url');
}

/** Personnage caché dans un jeton, ou `null` si le jeton a été altéré. */
export function readInfiniteToken(token: string): number | null {
	try {
		const raw = Buffer.from(token, 'base64url');
		if (raw.length < 29 || raw.length > 64) return null;
		const decipher = createDecipheriv('aes-256-gcm', tokenKey(), raw.subarray(0, 12));
		decipher.setAuthTag(raw.subarray(12, 28));
		const id = Number(Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8'));
		return Number.isInteger(id) ? id : null;
	} catch {
		return null;
	}
}
