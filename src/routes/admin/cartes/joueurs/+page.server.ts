import { requireAdmin } from '$lib/server/auth';
import { collectorsOverview } from '$lib/server/cards/admin';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	requireAdmin(locals);
	return collectorsOverview();
};
