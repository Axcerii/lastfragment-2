// src/routes/api/logout/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies }) => {
	cookies.delete('jwt', { path: '/' });
	redirect(302, '/accueil');
};