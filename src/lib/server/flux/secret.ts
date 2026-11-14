import type { Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createHmac, timingSafeEqual } from 'crypto';
import { QUESTIONS } from '$lib/flux/quiz-data';
import { SECRET_DOOR, secretComplete } from '$lib/flux/secret';

// La page secrète du don de flux (/flux/secret). Son texte reste sur le serveur, et elle ne s'ouvre
// qu'avec le cookie signé posé quand le chemin a été suivi jusqu'au bout (voir $lib/flux/secret).
// Changer l'adresse à la main ou bricoler le navigateur ne suffit donc pas.

/** Le texte de la page secrète. */
// À CONFIRMER : texte provisoire.
export const SECRET_PAGE = {
	title: 'Tu m’as suivi.',
	paragraphs: [
		'Peu de voyageurs prennent la peine de passer par la grande porte. Toi, tu l’as fait.',
		'Ce que tu cherches n’est pas encore écrit. Reviens quand les fragments se seront assemblés.'
	]
};

const COOKIE = 'flux_secret';
const COOKIE_DAYS = 365;

// Jeton propre à ce serveur : il ne peut pas être fabriqué sans JWT_SECRET.
const token = () => createHmac('sha256', env.JWT_SECRET ?? '').update('flux:secret').digest('base64url');

/** Vrai si ces réponses, données derrière cette porte, achèvent le chemin secret. */
export function checkSecret(race: unknown, answers: unknown): boolean {
	return (
		race === SECRET_DOOR &&
		Array.isArray(answers) &&
		answers.length <= QUESTIONS.length &&
		answers.every((a, i) => Number.isInteger(a) && a >= 0 && a < (QUESTIONS[i]?.answers.length ?? 0)) &&
		secretComplete(answers)
	);
}

/** Ouvre la page secrète à ce navigateur. */
export function unlockSecret(cookies: Cookies) {
	cookies.set(COOKIE, token(), {
		httpOnly: true,
		sameSite: 'lax',
		secure: (env.ORIGIN ?? '').startsWith('https://'),
		path: '/flux',
		maxAge: COOKIE_DAYS * 24 * 60 * 60
	});
}

/** Vrai si ce navigateur a mérité la page secrète. */
export function hasSecret(cookies: Cookies): boolean {
	const value = Buffer.from(cookies.get(COOKIE) ?? '');
	const expected = Buffer.from(token());
	return value.length === expected.length && timingSafeEqual(value, expected);
}
