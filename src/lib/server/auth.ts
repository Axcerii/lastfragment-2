import { error, redirect, type Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ROLE_ADMIN } from '$lib/game/labels';
import { prisma } from './prisma';

const COOKIE = 'jwt';
const SESSION_DAYS = 30;

function secret(): string {
	if (!env.JWT_SECRET) throw new Error('JWT_SECRET est absent du fichier .env');
	return env.JWT_SECRET;
}

export function startSession(cookies: Cookies, playerId: number) {
	const token = jwt.sign({ userId: String(playerId) }, secret(), {
		expiresIn: `${SESSION_DAYS}d`
	});
	cookies.set(COOKIE, token, {
		httpOnly: true,
		sameSite: 'strict',
		secure: env.NODE_ENV === 'production',
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

	let playerId: number;
	try {
		playerId = Number((jwt.verify(token, secret()) as { userId: string }).userId);
	} catch {
		return null;
	}

	const player = await prisma.player.findUnique({
		where: { id: playerId },
		select: { id: true, login: true, role: true, characterId: true }
	});
	return player && { ...player, isAdmin: player.role >= ROLE_ADMIN };
}

export const hashPassword = (password: string) => bcrypt.hash(password, 10);
export const checkPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

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
