import { redirect, type RequestHandler } from '@sveltejs/kit';
import { endSession } from '$lib/server/auth';

export const POST: RequestHandler = ({ cookies }) => {
	endSession(cookies);
	redirect(303, '/accueil');
};
