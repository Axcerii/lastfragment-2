import { error } from '@sveltejs/kit';
import { SECRET_PAGE, hasSecret } from '$lib/server/flux/secret';
import type { PageServerLoad } from './$types';

// Sans le cookie posé à la fin du chemin, la page n'existe pas : taper l'adresse ne mène à rien.
export const load: PageServerLoad = ({ cookies }) => {
	if (!hasSecret(cookies)) error(404, 'Page introuvable');
	return { page: SECRET_PAGE };
};
