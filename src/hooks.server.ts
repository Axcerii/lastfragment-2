import type { Handle } from '@sveltejs/kit';
import { readSession, requireAdmin } from '$lib/server/auth';

const UNSAFE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

export const handle: Handle = async ({ event, resolve }) => {
	// SvelteKit ne contrôle l'origine que des formulaires : on l'étend aux requêtes JSON
	// (actions de la table de jeu, médiathèque) et au flux temps réel, qu'une autre origine ne
	// doit jamais pouvoir ouvrir avec le cookie du joueur.
	const origin = event.request.headers.get('origin');
	const stream = event.request.headers.get('accept')?.includes('text/event-stream');
	if (origin && origin !== event.url.origin && (UNSAFE_METHODS.includes(event.request.method) || stream)) {
		return new Response('Requête d’une autre origine refusée.', { status: 403 });
	}

	event.locals.user = await readSession(event.cookies);

	// Tout ce qui est sous /admin est réservé au MJ, pages comme actions.
	if (event.url.pathname === '/admin' || event.url.pathname.startsWith('/admin/')) {
		requireAdmin(event.locals);
	}

	const response = await resolve(event);
	// En-têtes de durcissement, posés sur toutes les réponses (la CSP est dans svelte.config.js).
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	if (event.url.protocol === 'https:') {
		response.headers.set('Strict-Transport-Security', 'max-age=31536000');
	}
	return response;
};
