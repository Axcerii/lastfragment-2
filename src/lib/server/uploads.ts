import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const EXTENSIONS: Record<string, string> = {
	'image/jpeg': '.jpg',
	'image/png': '.png',
	'image/webp': '.webp',
	'image/gif': '.gif',
	'image/svg+xml': '.svg'
};
const MAX_SIZE = 8 * 1024 * 1024;

export class UploadError extends Error {}

/**
 * Enregistre une image envoyée par un formulaire et renvoie son URL publique.
 * `folder` est un nom de sous-dossier fixé par le code, jamais par l'utilisateur.
 */
export async function saveImage(file: File, folder: string): Promise<string> {
	const extension = EXTENSIONS[file.type];
	if (!extension) throw new UploadError('Format d’image non pris en charge.');
	if (file.size > MAX_SIZE) throw new UploadError('Image trop lourde (8 Mo maximum).');

	const dir = path.join(process.cwd(), 'static', 'uploads', folder);
	await mkdir(dir, { recursive: true });

	// Le nom d'origine n'est gardé que pour la lisibilité, débarrassé de tout caractère à risque.
	const stem = path
		.parse(file.name)
		.name.normalize('NFD')
		.replace(/[^a-zA-Z0-9]+/g, '-')
		.slice(0, 40);
	const filename = `${Date.now()}-${stem || 'image'}${extension}`;

	await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
	return `/uploads/${folder}/${filename}`;
}
