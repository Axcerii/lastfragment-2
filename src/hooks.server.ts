import type { Handle } from '@sveltejs/kit';
import { readSession, requireAdmin } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
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
