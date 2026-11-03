import { readProgress } from '$lib/server/flux/discovery';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Un joueur connecté retrouve sa progression depuis la base ; un visiteur, depuis son navigateur.
	return { progress: locals.user ? await readProgress(locals.user.id) : null };
};
