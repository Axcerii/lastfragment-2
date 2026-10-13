import type { Handle } from '@sveltejs/kit';
import { readSession, requireAdmin } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = await readSession(event.cookies);

	// Tout ce qui est sous /admin est réservé au MJ, pages comme actions.
	if (event.url.pathname === '/admin' || event.url.pathname.startsWith('/admin/')) {
		requireAdmin(event.locals);
	}

	return resolve(event);
};
