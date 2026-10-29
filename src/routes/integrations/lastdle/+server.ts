import { error, json } from '@sveltejs/kit';
import { dailyAnnouncement, today } from '$lib/server/dle';
import { cardsPublic } from '$lib/server/cards/settings';
import { publicOrigin, requireIntegration } from '$lib/server/integrations';
import type { RequestHandler } from './$types';

/**
 * Lu par n8n juste après minuit pour annoncer le Lastdle du jour sur Discord.
 * `?date=AAAA-MM-JJ` rejoue l'annonce d'un jour passé, pour tester le workflow ; jamais d'un jour
 * à venir, dont l'annonce révélerait la réponse du jour.
 */
export const GET: RequestHandler = async ({ request, url }) => {
	requireIntegration(request);
	const now = today();
	const date = url.searchParams.get('date') ?? now;
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > now) error(400, 'Date invalide.');

	const [announcement, booster] = await Promise.all([dailyAnnouncement(date, publicOrigin(url)), cardsPublic()]);
	// L'énigme rapporte un booster : n'en parler que si le jeu de cartes est public.
	return json({ ...announcement, booster }, { headers: { 'Cache-Control': 'no-store' } });
};
