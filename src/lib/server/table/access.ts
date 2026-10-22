import { error } from '@sveltejs/kit';
import { timingSafeEqual } from 'crypto';
import { prisma } from '../prisma';
import type { Viewer } from './state';

type User = App.Locals['user'];

/** Comparaison en temps constant : le temps de réponse ne dit rien de la clé OBS. */
function sameSecret(given: string, expected: string): boolean {
	const a = Buffer.from(given);
	const b = Buffer.from(expected);
	return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Qui regarde la partie : le MJ, un joueur avec un personnage (partie ouverte),
 * ou la vue OBS munie de sa clé secrète.
 */
export async function tableViewer(sessionId: number, user: User, key?: string | null): Promise<Viewer> {
	if (!Number.isInteger(sessionId)) error(404, 'Partie introuvable.');
	const session = await prisma.tableSession.findUnique({
		where: { id: sessionId },
		select: { open: true, obsKey: true }
	});
	if (!session) error(404, 'Partie introuvable.');

	if (key) {
		if (!sameSecret(key, session.obsKey)) error(403, 'Lien de vue OBS invalide.');
		return { playerId: null, isAdmin: false, spectator: true, name: 'OBS' };
	}
	if (!user) error(401, 'Connecte-toi pour rejoindre la partie.');
	if (user.isAdmin) return { playerId: user.id, isAdmin: true, spectator: false, name: 'MJ' };
	if (!user.characterId) error(403, 'Il te faut un personnage pour rejoindre une partie.');
	if (!session.open) error(403, 'Cette partie n’est pas ouverte pour le moment.');
	const character = await prisma.character.findUnique({
		where: { id: user.characterId },
		select: { name: true }
	});
	return { playerId: user.id, isAdmin: false, spectator: false, name: character?.name ?? user.login };
}
