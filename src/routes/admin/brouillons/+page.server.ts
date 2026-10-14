import { listDrafts, rejectDraft } from '$lib/server/drafts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { drafts: await listDrafts() };
};

export const actions: Actions = {
	reject: async ({ request }) => {
		const form = await request.formData();
		await rejectDraft(Number(form.get('id')));
		return { message: 'Brouillon refusé et supprimé.' };
	}
};
