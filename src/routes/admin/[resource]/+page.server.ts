import { getResource, listRecords, toggleField } from '$lib/server/admin/crud';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const resource = getResource(params.resource);
	return {
		resource: { slug: resource.slug, label: resource.label, singular: resource.singular, description: resource.description },
		...(await listRecords(resource))
	};
};

export const actions: Actions = {
	toggle: async ({ request, params }) => {
		const form = await request.formData();
		await toggleField(getResource(params.resource), Number(form.get('id')), String(form.get('field')));
	}
};
