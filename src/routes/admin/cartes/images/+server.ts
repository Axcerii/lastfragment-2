import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { listLibrary, saveCardSource } from '$lib/server/cards/images';
import { UploadError } from '$lib/server/uploads';

// Bibliothèque d'images du créateur de cartes : tout ce qui a déjà été envoyé sur le site,
// plus les images envoyées d'ici (réencodées en WebP avant d'être gardées).

export const GET: RequestHandler = async ({ locals }) => {
	requireAdmin(locals);
	return json(await listLibrary());
};

export const POST: RequestHandler = async ({ locals, request }) => {
	requireAdmin(locals);
	const form = await request.formData();
	const files = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
	if (files.length === 0) error(400, 'Aucun fichier envoyé.');
	if (files.length > 20) error(400, '20 images au plus à la fois.');

	const urls: string[] = [];
	try {
		for (const file of files) urls.push(await saveCardSource(file));
	} catch (e) {
		if (e instanceof UploadError) error(400, e.message);
		throw e;
	}
	return json(urls);
};
