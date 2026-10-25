// Images des cartes. Le MJ pioche dans tous les fichiers déjà envoyés (portraits, bestiaire,
// médiathèque de la table…) ou en envoie un nouveau. Chaque image posée sur une carte est
// réencodée en WebP par sharp, en deux tailles : métadonnées retirées, fichier piégé neutralisé
// (seuls des pixels ressortent), et le téléphone ne télécharge qu'une image légère.

import { createHash } from 'crypto';
import { mkdir, readdir, stat } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { UploadError, uploadDir } from '../uploads';

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']);
const MAX_UPLOAD = 15 * 1024 * 1024;

/** Dossiers produits ici : jamais proposés dans la bibliothèque. */
const RENDER_FOLDER = 'cartes/rendus';
const THUMB_FOLDER = 'cartes/miniatures';
export const SOURCE_FOLDER = 'cartes/sources';
const HIDDEN_FOLDERS = [RENDER_FOLDER, THUMB_FOLDER];

/** Emblèmes du site, utilisables comme logo de série ou comme illustration. */
const STATIC_FOLDERS = ['dragons', 'pays', 'icones'];

sharp.cache({ memory: 64, items: 50 });
sharp.concurrency(1);

interface Root {
	prefix: string;
	dir: string;
}

/**
 * Où chercher le fichier d'une URL publique. Les envois vont dans `uploadDir()` (un volume en
 * production) ; les fichiers présents au moment du build sont dans `static/` en développement
 * et dans `build/client/` en production.
 */
function roots(): Root[] {
	const list: Root[] = [
		{ prefix: '/uploads/', dir: uploadDir() },
		{ prefix: '/uploads/', dir: path.resolve('static', 'uploads') },
		{ prefix: '/uploads/', dir: path.resolve('build', 'client', 'uploads') }
	];
	for (const folder of STATIC_FOLDERS) {
		list.push(
			{ prefix: `/${folder}/`, dir: path.resolve('static', folder) },
			{ prefix: `/${folder}/`, dir: path.resolve('build', 'client', folder) }
		);
	}
	return list.filter((root, i) => list.findIndex((r) => r.dir === root.dir) === i);
}

/** Chemin du fichier désigné par une URL publique d'image, s'il existe et reste dans un dossier permis. */
export async function resolveImage(url: unknown): Promise<string | null> {
	if (typeof url !== 'string' || url.length > 255 || /[\0\\]|\.\.|\/\//.test(url)) return null;
	if (!IMAGE_EXTENSIONS.has(path.extname(url).toLowerCase())) return null;
	for (const root of roots()) {
		if (!url.startsWith(root.prefix)) continue;
		const file = path.resolve(root.dir, url.slice(root.prefix.length));
		if (!file.startsWith(root.dir + path.sep)) continue;
		try {
			if ((await stat(file)).isFile()) return file;
		} catch {
			// Absent de ce dossier : on essaie le suivant.
		}
	}
	return null;
}

// ─── Bibliothèque ────────────────────────────────────────────────────────

export interface LibraryImage {
	url: string;
	/** Dossier d'origine, pour regrouper (« personnages », « table/fond »…). */
	folder: string;
	name: string;
	modified: number;
}

const MAX_LIBRARY = 4000;
let cache: { at: number; list: LibraryImage[] } | null = null;

async function walk(root: Root, dir: string, depth: number, found: Map<string, LibraryImage>) {
	if (depth > 5 || found.size >= MAX_LIBRARY) return;
	let entries;
	try {
		entries = await readdir(dir, { withFileTypes: true });
	} catch {
		return;
	}
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		const relative = path.relative(root.dir, full).split(path.sep).join('/');
		if (entry.isDirectory()) {
			if (!HIDDEN_FOLDERS.some((f) => relative === f || relative.startsWith(f + '/'))) {
				await walk(root, full, depth + 1, found);
			}
			continue;
		}
		if (!entry.isFile() || !IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
		const url = root.prefix + relative;
		if (found.has(url) || url.length > 255) continue;
		const info = await stat(full).catch(() => null);
		if (!info) continue;
		const folder = (root.prefix === '/uploads/' ? '' : root.prefix.slice(1)) + path.posix.dirname(relative);
		found.set(url, {
			url,
			folder: folder.replace(/\/\.$|^\.$/, '').replace(/\/$/, '') || root.prefix.slice(1, -1),
			name: path.parse(entry.name).name.replace(/^\d{10,}-/, '').replace(/[-_]+/g, ' '),
			modified: info.mtimeMs
		});
	}
}

/** Toutes les images disponibles, les plus récentes d'abord (gardé 20 s en mémoire). */
export async function listLibrary(): Promise<LibraryImage[]> {
	if (cache && Date.now() - cache.at < 20_000) return cache.list;
	const found = new Map<string, LibraryImage>();
	for (const root of roots()) await walk(root, root.dir, 0, found);
	const list = [...found.values()].sort((a, b) => b.modified - a.modified);
	cache = { at: Date.now(), list };
	return list;
}

// ─── Réencodage ──────────────────────────────────────────────────────────

/** File d'attente : une seule image traitée à la fois, le serveur n'a qu'un cœur en production. */
let queue: Promise<unknown> = Promise.resolve();
function serial<T>(task: () => Promise<T>): Promise<T> {
	const run = queue.then(task, task);
	queue = run.catch(() => {});
	return run;
}

const exists = (file: string) => stat(file).then(() => true, () => false);

function decoder(file: string) {
	const isSvg = file.toLowerCase().endsWith('.svg');
	// Un SVG est rastérisé : ses éventuels scripts disparaissent avec lui.
	return sharp(file, { animated: !isSvg, density: isSvg ? 300 : undefined, limitInputPixels: 80_000_000 });
}

async function render(file: string, target: string, width: number, height: number, quality: number) {
	if (await exists(target)) return;
	await serial(() =>
		decoder(file)
			.rotate()
			.resize({ width, height, fit: 'inside', withoutEnlargement: true })
			.webp({ quality, effort: 4 })
			.toFile(target)
	);
}

async function keyOf(url: string, file: string) {
	const info = await stat(file);
	return createHash('sha1').update(`${url}|${info.size}|${info.mtimeMs}`).digest('hex').slice(0, 20);
}

/** Copies WebP d'une image pour une carte : grande (vue détaillée) et petite (grilles). */
export async function renderCardImage(url: string): Promise<{ large: string; small: string }> {
	const file = await resolveImage(url);
	if (!file) throw new UploadError('Image introuvable : choisis-la à nouveau dans la bibliothèque.');
	const key = await keyOf(url, file);
	const dir = path.join(uploadDir(), RENDER_FOLDER);
	await mkdir(dir, { recursive: true });
	try {
		await render(file, path.join(dir, `${key}-l.webp`), 1000, 1400, 84);
		await render(file, path.join(dir, `${key}-s.webp`), 420, 588, 78);
	} catch {
		throw new UploadError('Cette image est illisible.');
	}
	return { large: `/uploads/${RENDER_FOLDER}/${key}-l.webp`, small: `/uploads/${RENDER_FOLDER}/${key}-s.webp` };
}

/** Miniature d'une image de la bibliothèque (créée à la première demande). */
export async function thumbnail(url: string): Promise<string | null> {
	const file = await resolveImage(url);
	if (!file) return null;
	const key = await keyOf(url, file);
	const dir = path.join(uploadDir(), THUMB_FOLDER);
	await mkdir(dir, { recursive: true });
	try {
		await render(file, path.join(dir, `${key}.webp`), 240, 240, 70);
	} catch {
		return null;
	}
	return `/uploads/${THUMB_FOLDER}/${key}.webp`;
}

/**
 * Enregistre une image envoyée depuis le créateur. Elle est réencodée tout de suite : ce qui est
 * gardé sur le disque est un WebP produit par sharp, jamais le fichier reçu.
 */
export async function saveCardSource(file: File): Promise<string> {
	if (!ACCEPTED_TYPES.has(file.type)) throw new UploadError('Format non pris en charge (jpg, png, webp, gif, svg).');
	if (file.size > MAX_UPLOAD) throw new UploadError('Image trop lourde (15 Mo maximum).');

	const input = Buffer.from(await file.arrayBuffer());
	const isSvg = file.type === 'image/svg+xml';
	const stem =
		path
			.parse(file.name)
			.name.normalize('NFD')
			.replace(/[^a-zA-Z0-9]+/g, '-')
			.replace(/^-|-$/g, '')
			.slice(0, 40) || 'image';
	const filename = `${Date.now()}-${stem}.webp`;
	const dir = path.join(uploadDir(), SOURCE_FOLDER);
	await mkdir(dir, { recursive: true });

	try {
		await serial(() =>
			sharp(input, { animated: !isSvg, density: isSvg ? 300 : undefined, limitInputPixels: 80_000_000 })
				.rotate()
				.resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
				.webp({ quality: 90, effort: 4 })
				.toFile(path.join(dir, filename))
		);
	} catch {
		throw new UploadError('Ce fichier n’est pas une image lisible.');
	}
	cache = null;
	return `/uploads/${SOURCE_FOLDER}/${filename}`;
}
