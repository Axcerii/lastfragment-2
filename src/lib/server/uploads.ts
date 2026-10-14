import { mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { env } from '$env/dynamic/private';

/**
 * Dossier des images envoyées. En développement c'est `static/uploads`, servi par Vite.
 * En production `UPLOAD_DIR` pointe vers un volume, servi par la route /uploads/[...path].
 */
export function uploadDir(): string {
	return path.resolve(env.UPLOAD_DIR || path.join('static', 'uploads'));
}

const EXTENSIONS: Record<string, string> = {
	'image/jpeg': '.jpg',
	'image/png': '.png',
	'image/webp': '.webp',
	'image/gif': '.gif',
	'image/svg+xml': '.svg'
};
const MAX_SIZE = 8 * 1024 * 1024;

const AUDIO_EXTENSIONS: Record<string, string> = {
	'audio/mpeg': '.mp3',
	'audio/mp3': '.mp3',
	'audio/ogg': '.ogg',
	'audio/wav': '.wav',
	'audio/x-wav': '.wav',
	'audio/wave': '.wav',
	'audio/webm': '.webm',
	'audio/mp4': '.m4a',
	'audio/x-m4a': '.m4a',
	'audio/aac': '.aac',
	'audio/flac': '.flac'
};
const MAX_AUDIO_SIZE = 40 * 1024 * 1024;

const VIDEO_EXTENSIONS: Record<string, string> = {
	'video/webm': '.webm',
	'video/mp4': '.mp4'
};

export class UploadError extends Error {}

/**
 * Enregistre une image envoyée par un formulaire et renvoie son URL publique.
 * `folder` est un nom de sous-dossier fixé par le code, jamais par l'utilisateur.
 */
export async function saveImage(file: File, folder: string): Promise<string> {
	const extension = EXTENSIONS[file.type];
	if (!extension) throw new UploadError('Format d’image non pris en charge.');
	if (file.size > MAX_SIZE) throw new UploadError('Image trop lourde (8 Mo maximum).');
	return writeUpload(file, folder, extension);
}

/** Enregistre un fichier audio (musique, ambiance, effet) et renvoie son URL publique. */
export async function saveAudio(file: File, folder: string): Promise<string> {
	const extension = AUDIO_EXTENSIONS[file.type] ?? audioExtensionOf(file.name);
	if (!extension) throw new UploadError('Format audio non pris en charge (mp3, ogg, wav, m4a, flac).');
	if (file.size > MAX_AUDIO_SIZE) throw new UploadError('Fichier audio trop lourd (40 Mo maximum).');
	return writeUpload(file, folder, extension);
}

/** Enregistre une vidéo courte (calque animé, webm transparent ou mp4) et renvoie son URL publique. */
export async function saveVideo(file: File, folder: string): Promise<string> {
	const extension = VIDEO_EXTENSIONS[file.type];
	if (!extension) throw new UploadError('Format vidéo non pris en charge (webm, mp4).');
	if (file.size > MAX_AUDIO_SIZE) throw new UploadError('Vidéo trop lourde (40 Mo maximum).');
	return writeUpload(file, folder, extension);
}

// Certains navigateurs envoient un type vide pour l'audio : on se rabat sur l'extension.
function audioExtensionOf(name: string): string | undefined {
	const extension = path.extname(name).toLowerCase();
	return Object.values(AUDIO_EXTENSIONS).includes(extension) ? extension : undefined;
}

async function writeUpload(file: File, folder: string, extension: string): Promise<string> {
	const dir = path.join(uploadDir(), folder);
	await mkdir(dir, { recursive: true });

	// Le nom d'origine n'est gardé que pour la lisibilité, débarrassé de tout caractère à risque.
	const stem = path
		.parse(file.name)
		.name.normalize('NFD')
		.replace(/[^a-zA-Z0-9]+/g, '-')
		.slice(0, 40);
	const filename = `${Date.now()}-${stem || 'fichier'}${extension}`;

	await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
	return `/uploads/${folder}/${filename}`;
}

/** Supprime un fichier envoyé à partir de son URL publique ; ignore tout ce qui sort du dossier. */
export async function removeUpload(url: string): Promise<void> {
	if (!url.startsWith('/uploads/')) return;
	const root = uploadDir();
	const file = path.resolve(root, url.slice('/uploads/'.length));
	if (!file.startsWith(root + path.sep)) return;
	await unlink(file).catch(() => {});
}
