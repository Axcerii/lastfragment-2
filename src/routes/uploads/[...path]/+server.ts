import { error, type RequestHandler } from '@sveltejs/kit';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
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
	// video/webm convient aussi aux balises <audio>.
	'.webm': 'video/webm',
	'.mp4': 'video/mp4',
	'.m4a': 'audio/mp4',
	'.aac': 'audio/aac',
	'.flac': 'audio/flac'
};

const HEADERS = {
	// Les noms de fichiers sont uniques (horodatés) : le navigateur peut les garder longtemps.
	'Cache-Control': 'public, max-age=31536000, immutable',
	// Un SVG envoyé ne doit pas pouvoir exécuter de script s'il est ouvert directement.
	'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
	'X-Content-Type-Options': 'nosniff',
	'Accept-Ranges': 'bytes'
};

/** Lit le fichier au fil de l'envoi : une musique de 40 Mo ne passe jamais entière en mémoire. */
const streamOf = (file: string, start?: number, end?: number) =>
	Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream;

export const GET: RequestHandler = async ({ params, request }) => {
	const root = uploadDir();
	const file = path.resolve(root, params.path ?? '');
	const type = TYPES[path.extname(file).toLowerCase()];

	// Le chemin demandé doit rester dans le dossier d'uploads et désigner un média connu.
	if (!type || !file.startsWith(root + path.sep)) error(404, 'Fichier introuvable.');

	let size: number;
	try {
		const info = await stat(file);
		if (!info.isFile()) error(404, 'Fichier introuvable.');
		size = info.size;
	} catch {
		error(404, 'Fichier introuvable.');
	}

	// Les lecteurs audio demandent des morceaux du fichier (avance rapide, reprise en boucle).
	const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range') ?? '');
	if (range && (range[1] || range[2])) {
		const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
		const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
		if (start >= size || start > end) {
			return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
		}
		return new Response(streamOf(file, start, end), {
			status: 206,
			headers: {
				...HEADERS,
				'Content-Type': type,
				'Content-Range': `bytes ${start}-${end}/${size}`,
				'Content-Length': String(end - start + 1)
			}
		});
	}

	return new Response(streamOf(file), {
		headers: { ...HEADERS, 'Content-Type': type, 'Content-Length': String(size) }
	});
};
