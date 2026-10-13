import { error, type RequestHandler } from '@sveltejs/kit';
import { readFile } from 'fs/promises';
import path from 'path';
import { uploadDir } from '$lib/server/uploads';

// Sert les images envoyées après le build (portraits, icônes) depuis le dossier d'uploads.
// Les fichiers déjà présents dans static/ au moment du build sont servis directement, avant cette route.

const TYPES: Record<string, string> = {
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.webp': 'image/webp',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml'
};

export const GET: RequestHandler = async ({ params }) => {
	const root = uploadDir();
	const file = path.resolve(root, params.path ?? '');
	const type = TYPES[path.extname(file).toLowerCase()];

	// Le chemin demandé doit rester dans le dossier d'uploads et désigner une image.
	if (!type || !file.startsWith(root + path.sep)) error(404, 'Image introuvable.');

	let content: Buffer;
	try {
		content = await readFile(file);
	} catch {
		error(404, 'Image introuvable.');
	}

	return new Response(new Uint8Array(content), {
		headers: {
			'Content-Type': type,
			// Les noms de fichiers sont uniques (horodatés) : le navigateur peut les garder longtemps.
			'Cache-Control': 'public, max-age=31536000, immutable',
			// Un SVG envoyé ne doit pas pouvoir exécuter de script s'il est ouvert directement.
			'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
			'X-Content-Type-Options': 'nosniff'
		}
	});
};
