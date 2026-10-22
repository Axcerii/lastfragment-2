import { error, redirect, type Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import bcrypt from 'bcrypt';
import { createHmac } from 'crypto';
import jwt from 'jsonwebtoken';
import { ROLE_ADMIN } from '$lib/game/labels';
import { prisma } from './prisma';

const COOKIE = 'jwt';
const SESSION_DAYS = 30;
const ALGORITHM = 'HS256';
const BCRYPT_ROUNDS = 12;
const MIN_SECRET_LENGTH = 32;

let warnedWeakSecret = false;

function secret(): string {
	if (!env.JWT_SECRET) throw new Error('JWT_SECRET est absent du fichier .env');
	if (env.JWT_SECRET.length < MIN_SECRET_LENGTH && !warnedWeakSecret) {
		warnedWeakSecret = true;
		console.warn(
			`[sécurité] JWT_SECRET fait moins de ${MIN_SECRET_LENGTH} caractères : les sessions peuvent être forgées. Voir .env.example.`
		);
	}
	return env.JWT_SECRET;
}

/**
 * Empreinte du mot de passe glissée dans le jeton : changer le mot de passe d'un compte
 * invalide toutes ses sessions ouvertes, y compris un cookie volé.
 */
function passwordStamp(hash: string): string {
	return createHmac('sha256', secret()).update(hash).digest('base64url').slice(0, 22);
}

export function startSession(cookies: Cookies, player: { id: number; password: string }) {
	const token = jwt.sign(
		{ userId: String(player.id), pwd: passwordStamp(player.password) },
		secret(),
		{ algorithm: ALGORITHM, expiresIn: `${SESSION_DAYS}d` }
	);
	cookies.set(COOKIE, token, {
		httpOnly: true,
		sameSite: 'strict',
		// Cookie réservé au HTTPS dès que le site est servi en HTTPS (voir ORIGIN dans .env).
		secure: (env.ORIGIN ?? '').startsWith('https://'),
		path: '/',
		maxAge: SESSION_DAYS * 24 * 60 * 60
	});
}

export function endSession(cookies: Cookies) {
	cookies.delete(COOKIE, { path: '/' });
}

/** Retrouve le joueur connecté à partir du cookie, ou `null`. */
export async function readSession(cookies: Cookies): Promise<App.Locals['user']> {
	const token = cookies.get(COOKIE);
	if (!token) return null;

	let payload: { userId: string; pwd?: string };
	try {
		payload = jwt.verify(token, secret(), { algorithms: [ALGORITHM] }) as typeof payload;
	} catch {
		return null;
	}
	const playerId = Number(payload.userId);
	if (!Number.isInteger(playerId)) return null;

	const found = await prisma.player.findUnique({
		where: { id: playerId },
		select: { id: true, login: true, role: true, characterId: true, password: true }
	});
	if (!found || payload.pwd !== passwordStamp(found.password)) return null;

	const { password: _, ...player } = found;
	return { ...player, isAdmin: player.role >= ROLE_ADMIN };
}

export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_ROUNDS);

// Hash de comparaison pour un login inconnu : la réponse prend le même temps qu'un vrai
// mot de passe faux, ce qui évite de deviner quels comptes existent au chronomètre.
const dummyHash = bcrypt.hash('lastfragment', BCRYPT_ROUNDS);

/** Le joueur si le couple login / mot de passe est bon, sinon `null`. */
export async function verifyCredentials(login: string, password: string) {
	const player = await prisma.player.findUnique({ where: { login } });
	if (!player) {
		await bcrypt.compare(password, await dummyHash);
		return null;
	}
	if (!(await bcrypt.compare(password, player.password))) return null;

	// Les anciens comptes ont été hachés avec un coût plus faible : on en profite pour les remettre à niveau.
	if (bcrypt.getRounds(player.password) < BCRYPT_ROUNDS) {
		return prisma.player.update({
			where: { id: player.id },
			data: { password: await hashPassword(password) }
		});
	}
	return player;
}

type User = NonNullable<App.Locals['user']>;

export function requireUser(locals: App.Locals): User {
	if (!locals.user) redirect(303, '/auth/login');
	return locals.user;
}

export function requireAdmin(locals: App.Locals): User {
	const user = requireUser(locals);
	if (!user.isAdmin) error(403, 'Cette page est réservée au MJ.');
	return user;
}
