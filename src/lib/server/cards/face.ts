// Nettoyage du recto / verso envoyé par le créateur. Rien n'est repris tel quel : chaque champ
// est borné, les listes fermées sont vérifiées, et les images sont recalculées par le serveur.

import { isDragon, parseDragons } from '$lib/game/labels';
import {
	BACKDROP_KEYS,
	defaultFace,
	FACE_LIMITS,
	FINISH_KEYS,
	FRAME_KEYS,
	type CardBar,
	type CardFace,
	type CardFact,
	type CardImage,
	type CardType
} from '$lib/cards/types';
import { renderCardImage } from './images';
import { line, paragraph } from './text';

const COLOR = /^#[0-9a-f]{6}$/i;

const clamp = (value: unknown, min: number, max: number, fallback: number) => {
	const n = Number(value);
	return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

const pick = <T extends string>(value: unknown, list: readonly T[], fallback: T): T =>
	list.includes(value as T) ? (value as T) : fallback;

async function image(input: unknown, previous: CardImage | null | undefined): Promise<CardImage | null> {
	if (!input || typeof input !== 'object') return null;
	const raw = input as Record<string, unknown>;
	if (typeof raw.src !== 'string' || !raw.src) return null;

	// Même fichier qu'avant : les copies déjà calculées sont gardées.
	const rendered =
		previous && previous.src === raw.src ? { large: previous.large, small: previous.small } : await renderCardImage(raw.src);
	return {
		src: raw.src,
		...rendered,
		x: Math.round(clamp(raw.x, -100, 100, 0) * 10) / 10,
		y: Math.round(clamp(raw.y, -100, 100, 0) * 10) / 10,
		zoom: Math.round(clamp(raw.zoom, 0.2, 5, 1) * 100) / 100,
		fit: raw.fit === 'contain' ? 'contain' : 'cover'
	};
}

/** Recto, verso et finition propres, prêts à enregistrer. */
export async function sanitizeFace(
	input: unknown,
	type: CardType,
	rarity: number,
	previous?: CardFace | null
): Promise<CardFace> {
	const base = defaultFace(type, rarity);
	const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;

	const facts: CardFact[] = (Array.isArray(raw.facts) ? raw.facts : [])
		.slice(0, FACE_LIMITS.facts)
		.map((f) => ({
			label: line((f as CardFact)?.label, FACE_LIMITS.factLabel),
			value: line((f as CardFact)?.value, FACE_LIMITS.factValue)
		}))
		.filter((f) => f.label || f.value);

	const bars: CardBar[] = (Array.isArray(raw.bars) ? raw.bars : [])
		.slice(0, FACE_LIMITS.bars)
		.map((b) => {
			const bar = (b ?? {}) as Record<string, unknown>;
			return {
				label: line(bar.label, FACE_LIMITS.barLabel),
				value: Math.round(clamp(bar.value, 0, 100, 0)),
				dragon: isDragon(String(bar.dragon)) ? String(bar.dragon) : ''
			};
		})
		.filter((b) => b.label);

	return {
		subtitle: line(raw.subtitle, FACE_LIMITS.subtitle),
		dragons: parseDragons(String(raw.dragons ?? '')).slice(0, 3).join('-'),
		accent: typeof raw.accent === 'string' && COLOR.test(raw.accent) ? raw.accent.toLowerCase() : base.accent,
		finish: pick(raw.finish, FINISH_KEYS, base.finish),
		frame: pick(raw.frame, FRAME_KEYS, base.frame),
		art: await image(raw.art, previous?.art),
		popout: raw.popout === true,
		backdrop: pick(raw.backdrop, BACKDROP_KEYS, base.backdrop),
		background: await image(raw.background, previous?.background),
		flavor: paragraph(raw.flavor, FACE_LIMITS.flavor),
		text: paragraph(raw.text, FACE_LIMITS.text),
		textSize: Math.round(clamp(raw.textSize, FACE_LIMITS.textSize[0], FACE_LIMITS.textSize[1], 100)),
		facts,
		bars
	};
}
