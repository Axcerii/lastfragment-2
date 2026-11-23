// Lien vers l'artiste d'une illustration (compte Twitter/X, Instagram, site perso…), affiché sur la
// fiche d'un personnage ou d'un monstre quand il est renseigné.
// Partagé entre le serveur (contrôle avant enregistrement) et le navigateur (affichage).

export const MAX_ARTIST_LINK = 255;

/** Comptes dont le premier segment du chemin est le pseudo : affichés « @pseudo ». */
const HANDLE_HOSTS = ['x.com', 'twitter.com', 'instagram.com', 'tiktok.com', 'threads.net'];

function toUrl(value: string): URL | null {
	try {
		const url = new URL(value);
		// Seuls les liens web sont acceptés : jamais de `javascript:`, `data:`…
		if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
		if (!url.hostname.includes('.') || url.username || url.password) return null;
		return url;
	} catch {
		return null;
	}
}

/**
 * Saisie du MJ → lien enregistré. Vide : `null`. Sans « https:// » (« x.com/pseudo »), il est ajouté.
 */
export function parseArtistLink(
	raw: unknown
): { ok: true; value: string | null } | { ok: false; error: string } {
	if (typeof raw !== 'string') return { ok: false, error: '« Artiste » : valeur invalide.' };
	const text = raw.trim();
	if (!text) return { ok: true, value: null };
	const url = toUrl(/^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`);
	if (!url) return { ok: false, error: '« Artiste » doit être un lien web (https://…).' };
	const value = url.href;
	if (value.length > MAX_ARTIST_LINK) {
		return { ok: false, error: `« Artiste » dépasse ${MAX_ARTIST_LINK} caractères.` };
	}
	return { ok: true, value };
}

/** Lien sûr à mettre dans un `href`, ou `null` (valeur vide ou venue d'ailleurs que du formulaire). */
export function safeArtistLink(value: string | null | undefined): string | null {
	return value ? (toUrl(value)?.href ?? null) : null;
}

function decode(text: string): string {
	try {
		return decodeURIComponent(text);
	} catch {
		return text;
	}
}

/** Texte du lien : « @pseudo » pour les réseaux connus, sinon le site et le chemin. */
export function artistLabel(href: string): string {
	const url = new URL(href);
	const host = url.hostname.replace(/^www\./, '');
	const segments = url.pathname.split('/').filter(Boolean);
	const handle = host === 'bsky.app' && segments[0] === 'profile' ? segments[1] : segments[0];
	if (handle && (HANDLE_HOSTS.includes(host) || host === 'bsky.app')) {
		return `@${decode(handle).replace(/^@/, '')}`;
	}
	return decode(host + url.pathname.replace(/\/$/, ''));
}
