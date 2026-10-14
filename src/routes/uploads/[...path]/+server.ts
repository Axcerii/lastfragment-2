import { error, type RequestHandler } from '@sveltejs/kit';
import { readFile, stat } from 'fs/promises';
import path from 'path';
import { uploadDir } from '$lib/server/uploads';

// Sert les fichiers envoyés après le build (portraits, icônes, médias de la table de jeu)
// depuis le dossier d'uploads. Les fichiers déjà présents dans static/ au moment du build
// sont servis directement, avant cette route.

const TYPES: Record<string, string> = {
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.webp': 'image/webp',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml',
	'.mp3': 'audio/mpeg',
	'.ogg': 'audio/ogg',
	'.wav': 'audio/wav',
	'.webm': 'audio/webm',
	'.m4a': 'audio/mp4',
	'.aac': 'audio/aac',
	'.flac': 'audio/flac'
};

const HEADERS = {
	// Les noms de fichiers sont uniques (horodatés) : le navigateur peut les garder longtemps.
	'Cache-Control': 'public, max-age=31536000, immutable',
	// Un SVG envoyé ne doit pas pouvoir exécuter de script s'il est ouvert directement.
	'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
	'X-Content-Type-Options': 'nosniff',
	'Accept-Ranges': 'bytes'
};

export const GET: RequestHandler = async ({ params, request }) => {
	const root = uploadDir();
	const file = path.resolve(root, params.path ?? '');
	const type = TYPES[path.extname(file).toLowerCase()];

	// Le chemin demandé doit rester dans le dossier d'uploads et désigner un média connu.
	if (!type || !file.startsWith(root + path.sep)) error(404, 'Fichier introuvable.');

	let size: number;
	try {
		size = (await stat(file)).size;
	} catch {
		error(404, 'Fichier introuvable.');
	}
	const content = await readFile(file);

	// Les lecteurs audio demandent des morceaux du fichier (avance rapide, reprise en boucle).
	const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') ?? '');
	if (range && (range[1] || range[2])) {
		const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
		const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
		if (start >= size || start > end) {
			return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
		}
		return new Response(new Uint8Array(content.subarray(start, end + 1)), {
			status: 206,
			headers: {
				...HEADERS,
				'Content-Type': type,
				'Content-Range': `bytes ${start}-${end}/${size}`,
				'Content-Length': String(end - start + 1)
			}
		});
	}

	return new Response(new Uint8Array(content), {
		headers: { ...HEADERS, 'Content-Type': type, 'Content-Length': String(size) }
	});
};
