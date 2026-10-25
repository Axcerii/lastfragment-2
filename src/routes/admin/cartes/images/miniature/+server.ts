import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { thumbnail } from '$lib/server/cards/images';

// Miniature d'une image de la bibliothèque, créée à la première demande puis servie comme
// n'importe quel fichier envoyé : la grille du créateur reste légère même avec des portraits de 4 Mo.
export const GET: RequestHandler = async ({ locals, url, setHeaders }) => {
	requireAdmin(locals);
	const thumb = await thumbnail(url.searchParams.get('src') ?? '');
	if (!thumb) error(404, 'Image introuvable.');
	setHeaders({ 'Cache-Control': 'private, max-age=86400' });
	redirect(302, thumb);
};
