// src/routes/api/logout/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies }) => {
	cookies.delete('jwt', { path: '/' });
	return json({ message: 'Logged out successfully' });
};