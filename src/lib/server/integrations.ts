import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { timingSafeEqual } from 'crypto';

/**
 * Routes lues par des outils externes (n8n), sans session : elles exigent l'en-tête
 * `Authorization: Bearer <INTEGRATION_TOKEN>`. Sans jeton configuré, elles n'existent pas.
 */
export function requireIntegration(request: Request): void {
	const expected = env.INTEGRATION_TOKEN ?? '';
	if (expected.length < 32) error(404, 'Page introuvable.');

	const given = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
	const a = Buffer.from(given);
	const b = Buffer.from(expected);
	// Comparaison en temps constant : le temps de réponse ne dit rien du jeton.
	if (!(a.length === b.length && timingSafeEqual(a, b))) error(401, 'Jeton invalide.');
}

/** Adresse publique du site, pour des liens qui fonctionnent depuis Discord. */
export function publicOrigin(url: URL): string {
	return (env.ORIGIN || url.origin).replace(/\/+$/, '');
}
