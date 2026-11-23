import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	// Adresse de contact affichée dans les CGU (CONTACT_EMAIL du .env) ; vide tant qu'elle n'est pas renseignée.
	contact: (env.CONTACT_EMAIL ?? '').trim()
});
