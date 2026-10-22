import { fail } from '@sveltejs/kit';
import { allowSubmission, DRAFT_IMAGE_FOLDER, DRAFT_KINDS } from '$lib/server/drafts';
import { prisma } from '$lib/server/prisma';
import { readStats } from '$lib/server/stats';
import { saveImage, UploadError } from '$lib/server/uploads';
import type { Actions } from './$types';

const MAX_NAME = 255;
const MAX_AUTHOR = 100;
const MAX_DESCRIPTION = 5000;

export const actions: Actions = {
	/** N'importe quel visiteur peut proposer un brouillon ; il attend la validation du MJ. */
	submit: async ({ request, locals, getClientAddress }) => {
		const form = await request.formData();

		// Champ invisible : seul un robot le remplit.
		if (String(form.get('website') ?? '')) return { submitted: true };

		const kind = String(form.get('kind'));
		const name = String(form.get('name') ?? '').trim();
		const author = String(form.get('author') ?? '').trim();
		const description = String(form.get('description') ?? '').trim();
		const keep = { kind, name, author, description };

		if (!(kind in DRAFT_KINDS)) return fail(400, { ...keep, error: 'Choisis personnage ou monstre.' });
		if (!name) return fail(400, { ...keep, error: 'Donne-lui au moins un nom.' });
		if (name.length > MAX_NAME || author.length > MAX_AUTHOR) {
			return fail(400, { ...keep, error: 'Le nom ou le pseudo est trop long.' });
		}
		if (description.length > MAX_DESCRIPTION) {
			return fail(400, { ...keep, error: `La description dépasse ${MAX_DESCRIPTION} caractères.` });
		}
		if (!allowSubmission(getClientAddress())) {
			return fail(429, { ...keep, error: 'Beaucoup de propositions d’un coup : réessaie dans quelques minutes.' });
		}

		let image: string | null = null;
		const file = form.get('image');
		if (file instanceof File && file.size > 0) {
			// Un SVG peut contenir du script : on ne l'accepte pas d'un visiteur anonyme.
			if (file.type === 'image/svg+xml') {
				return fail(400, { ...keep, error: 'Les images SVG ne sont pas acceptées ici (jpg, png, webp, gif).' });
			}
			try {
				image = await saveImage(file, DRAFT_IMAGE_FOLDER);
			} catch (e) {
				if (e instanceof UploadError) return fail(400, { ...keep, error: e.message });
				throw e;
			}
		}

		await prisma.draft.create({
			data: {
				kind,
				name,
				description,
				image,
				author: author || null,
				playerId: locals.user?.id ?? null,
				stats: readStats(form)
			}
		});
		return { submitted: true, name };
	}
};
