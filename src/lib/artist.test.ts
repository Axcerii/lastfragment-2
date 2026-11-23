import { describe, expect, it } from 'vitest';
import { artistLabel, parseArtistLink, safeArtistLink } from './artist';

describe('parseArtistLink', () => {
	it('vide : null', () => {
		expect(parseArtistLink('   ')).toEqual({ ok: true, value: null });
	});

	it('garde un lien https', () => {
		expect(parseArtistLink(' https://x.com/Pseudo ')).toEqual({ ok: true, value: 'https://x.com/Pseudo' });
	});

	it('ajoute https:// quand il manque', () => {
		expect(parseArtistLink('instagram.com/pseudo')).toEqual({
			ok: true,
			value: 'https://instagram.com/pseudo'
		});
	});

	it('refuse tout ce qui n’est pas un lien web', () => {
		for (const raw of [
			'javascript:alert(1)',
			'JavaScript:alert(1)',
			'data:text/html,<script>alert(1)</script>',
			'mailto:a@b.fr',
			'pseudo',
			'https://user:pass@x.com/a',
			42
		]) {
			expect(parseArtistLink(raw).ok, String(raw)).toBe(false);
		}
	});

	it('refuse un lien trop long', () => {
		expect(parseArtistLink(`https://x.com/${'a'.repeat(300)}`).ok).toBe(false);
	});
});

describe('safeArtistLink', () => {
	it('écarte une valeur dangereuse venue de la base', () => {
		expect(safeArtistLink('javascript:alert(1)')).toBeNull();
		expect(safeArtistLink(null)).toBeNull();
		expect(safeArtistLink('https://bsky.app/profile/a.bsky.social')).toBe('https://bsky.app/profile/a.bsky.social');
	});
});

describe('artistLabel', () => {
	it('@pseudo pour les réseaux connus', () => {
		expect(artistLabel('https://x.com/Pseudo')).toBe('@Pseudo');
		expect(artistLabel('https://twitter.com/Pseudo/status/1')).toBe('@Pseudo');
		expect(artistLabel('https://www.instagram.com/pseudo/')).toBe('@pseudo');
		expect(artistLabel('https://www.tiktok.com/@pseudo')).toBe('@pseudo');
		expect(artistLabel('https://bsky.app/profile/a.bsky.social')).toBe('@a.bsky.social');
	});

	it('site et chemin sinon', () => {
		expect(artistLabel('https://www.artstation.com/pseudo/')).toBe('artstation.com/pseudo');
		expect(artistLabel('https://monsite.fr/')).toBe('monsite.fr');
	});
});
