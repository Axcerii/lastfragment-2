// Outils du MJ : modèles de cartes et séries (les exemplaires sont dans copies.ts).
// Rien de ce qui a été possédé n'est supprimé : un modèle avec des exemplaires se retire des
// boosters mais reste en base (la clé étrangère l'interdit aussi).

import { Prisma } from '@prisma/client';
import { isCardType, isTemplateStatus, type CardType, type TemplateStatus } from '$lib/cards/types';
import { prisma } from '../prisma';
import { UploadError } from '../uploads';
import { sanitizeFace } from './face';
import { line } from './text';
import { renderCardImage, resolveImage } from './images';
import { CardError } from './settings';

const SOURCE_KINDS = ['personnage', 'monstre', 'objet'];
const MAX_FACE_JSON = 24_000;

const intOrNull = (value: FormDataEntryValue | null, min: number, max: number): number | null => {
	const text = String(value ?? '').trim();
	if (!/^\d{1,9}$/.test(text)) return null;
	const n = Number(text);
	return n >= min && n <= max ? n : null;
};

// ─── Modèles ─────────────────────────────────────────────────────────────

export interface TemplateInput {
	name: string;
	type: CardType;
	rarity: number;
	setId: number | null;
	number: number | null;
	status: TemplateStatus;
	inAll: boolean;
	weight: number;
	maxPrints: number | null;
	sourceKind: string | null;
	sourceId: number | null;
	/** Séries dont les boosters donnent aussi cette carte (en plus de la sienne). */
	boosters: number[];
	face: unknown;
}

export function readTemplateForm(form: FormData): TemplateInput {
	const type = String(form.get('type'));
	const status = String(form.get('status'));
	const faceText = String(form.get('face') ?? '{}');
	if (faceText.length > MAX_FACE_JSON) throw new CardError('Carte trop chargée.');
	let face: unknown;
	try {
		face = JSON.parse(faceText);
	} catch {
		throw new CardError('Données de la carte illisibles.');
	}
	const sourceKind = String(form.get('sourceKind') ?? '');
	return {
		name: line(form.get('name'), 40),
		type: isCardType(type) ? type : 'personnage',
		rarity: intOrNull(form.get('rarity'), 1, 5) ?? 1,
		setId: intOrNull(form.get('setId'), 1, 1e9),
		number: intOrNull(form.get('number'), 1, 9999),
		status: isTemplateStatus(status) ? status : 'brouillon',
		inAll: form.get('inAll') === 'on' || form.get('inAll') === 'true',
		weight: intOrNull(form.get('weight'), 1, 1000) ?? 10,
		maxPrints: intOrNull(form.get('maxPrints'), 1, 1_000_000),
		sourceKind: SOURCE_KINDS.includes(sourceKind) ? sourceKind : null,
		sourceId: intOrNull(form.get('sourceId'), 1, 1e9),
		boosters: [
			...new Set(
				form
					.getAll('boosters')
					.map((v) => intOrNull(v, 1, 1e9))
					.filter((v): v is number => v !== null)
			)
		].slice(0, 50),
		face
	};
}

async function nextNumber(setId: number, exceptId?: number): Promise<number> {
	const last = await prisma.cardTemplate.aggregate({
		where: { setId, ...(exceptId ? { id: { not: exceptId } } : {}) },
		_max: { number: true }
	});
	return (last._max.number ?? 0) + 1;
}

/** Crée (`id` null) ou met à jour un modèle ; renvoie son id. */
export async function saveTemplate(id: number | null, input: TemplateInput): Promise<number> {
	if (!input.name) throw new CardError('Donne un nom à la carte.');
	const previous = id ? await prisma.cardTemplate.findUnique({ where: { id } }) : null;
	if (id && !previous) throw new CardError('Carte introuvable.', 404);

	if (input.setId !== null && !(await prisma.cardSet.findUnique({ where: { id: input.setId }, select: { id: true } }))) {
		throw new CardError('Cette série n’existe plus.');
	}
	if (previous && input.maxPrints !== null && previous.printed > input.maxPrints) {
		throw new CardError(`${previous.printed} exemplaires existent déjà : la limite ne peut pas descendre en dessous.`);
	}

	let face;
	try {
		face = await sanitizeFace(
			input.face,
			input.type,
			input.rarity,
			previous ? (previous.face as never) : null
		);
	} catch (e) {
		if (e instanceof UploadError) throw new CardError(e.message);
		throw e;
	}

	let number: number | null = null;
	if (input.setId !== null) {
		const sameSet = previous?.setId === input.setId;
		number = input.number ?? (sameSet && previous?.number ? previous.number : await nextNumber(input.setId, id ?? undefined));
	}

	const data = {
		name: input.name,
		type: input.type,
		rarity: input.rarity,
		setId: input.setId,
		number,
		status: input.status,
		inAll: input.inAll,
		weight: input.weight,
		maxPrints: input.maxPrints,
		sourceKind: input.sourceKind,
		sourceId: input.sourceKind ? input.sourceId : null,
		face: face as unknown as Prisma.InputJsonValue
	};
	// Boosters supplémentaires : des séries existantes, sans la sienne (elle y tombe déjà).
	const known = await prisma.cardSet.findMany({ where: { id: { in: input.boosters } }, select: { id: true } });
	const boosters = known.map((s) => s.id).filter((setId) => setId !== input.setId);
	try {
		return await prisma.$transaction(async (tx) => {
			const saved = id ? (await tx.cardTemplate.update({ where: { id }, data })).id : (await tx.cardTemplate.create({ data })).id;
			await tx.cardTemplateBooster.deleteMany({ where: { templateId: saved } });
			if (boosters.length) await tx.cardTemplateBooster.createMany({ data: boosters.map((setId) => ({ templateId: saved, setId })) });
			return saved;
		});
	} catch (e) {
		if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
			throw new CardError(`Le n° ${number} est déjà pris dans cette série.`);
		}
		throw e;
	}
}

export async function duplicateTemplate(id: number): Promise<number> {
	const source = await prisma.cardTemplate.findUnique({ where: { id }, include: { boosters: { select: { setId: true } } } });
	if (!source) throw new CardError('Carte introuvable.', 404);
	const copy = await prisma.cardTemplate.create({
		data: {
			name: `${source.name} (copie)`.slice(0, 40),
			type: source.type,
			rarity: source.rarity,
			setId: source.setId,
			number: source.setId ? await nextNumber(source.setId) : null,
			status: 'brouillon',
			inAll: source.inAll,
			weight: source.weight,
			maxPrints: source.maxPrints,
			sourceKind: source.sourceKind,
			sourceId: source.sourceId,
			face: source.face as Prisma.InputJsonValue,
			boosters: { create: source.boosters.map((b) => ({ setId: b.setId })) }
		}
	});
	return copy.id;
}

/** Supprime un modèle jamais tiré. Avec des exemplaires, il ne peut qu'être retiré. */
export async function deleteTemplate(id: number) {
	const copies = await prisma.card.count({ where: { templateId: id } });
	if (copies > 0) {
		throw new CardError(`${copies} exemplaire${copies > 1 ? 's existent' : ' existe'} : passe la carte en « Retirée » plutôt.`);
	}
	await prisma.cardTemplate.delete({ where: { id } });
}

// ─── Séries ──────────────────────────────────────────────────────────────

export interface SetInput {
	name: string;
	code: string;
	description: string | null;
	logo: string | null;
	banner: string | null;
	color: string;
	active: boolean;
	startsAt: Date | null;
	endsAt: Date | null;
	sortOrder: number;
}

function dateOrNull(value: FormDataEntryValue | null): Date | null {
	const text = String(value ?? '').trim();
	if (!text) return null;
	const date = new Date(text);
	return Number.isNaN(date.getTime()) ? null : date;
}

/** Image d'une série : copie WebP calculée ici, ou copie déjà calculée renvoyée telle quelle. */
async function setImage(value: FormDataEntryValue | null, size: 'large' | 'small'): Promise<string | null> {
	const url = String(value ?? '').trim();
	if (!url) return null;
	if (url.startsWith('/uploads/cartes/rendus/') && (await resolveImage(url))) return url;
	try {
		return (await renderCardImage(url))[size];
	} catch (e) {
		if (e instanceof UploadError) throw new CardError(e.message);
		throw e;
	}
}

export async function readSetForm(form: FormData): Promise<SetInput> {
	const color = String(form.get('color') ?? '');
	return {
		name: line(form.get('name'), 80),
		code: line(form.get('code'), 8).toUpperCase().replace(/[^A-Z0-9-]/g, ''),
		description: line(form.get('description'), 400) || null,
		logo: await setImage(form.get('logo'), 'small'),
		banner: await setImage(form.get('banner'), 'large'),
		color: /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : '#e5b8cc',
		active: form.get('active') === 'on',
		startsAt: dateOrNull(form.get('startsAt')),
		endsAt: dateOrNull(form.get('endsAt')),
		sortOrder: intOrNull(form.get('sortOrder'), 0, 9999) ?? 0
	};
}

export async function saveSet(id: number | null, input: SetInput): Promise<number> {
	if (!input.name) throw new CardError('Donne un nom à la série.');
	if (!input.code) throw new CardError('Donne un code à la série (ARC1, DRAG…).');
	if (input.startsAt && input.endsAt && input.endsAt <= input.startsAt) {
		throw new CardError('La fin de la bannière doit venir après son début.');
	}
	if (id) {
		await prisma.cardSet.update({ where: { id }, data: input });
		return id;
	}
	return (await prisma.cardSet.create({ data: input })).id;
}

export async function deleteSet(id: number) {
	const templates = await prisma.cardTemplate.count({ where: { setId: id } });
	if (templates > 0) throw new CardError('Cette série contient des cartes : déplace-les ou désactive la série.');
	await prisma.cardSet.delete({ where: { id } });
}

// ─── Paquets ─────────────────────────────────────────────────────────────

export interface PackInput {
	name: string;
	color: string;
	image: string | null;
	showText: boolean;
	sortOrder: number;
}

export async function readPackForm(form: FormData): Promise<PackInput> {
	const color = String(form.get('color') ?? '');
	return {
		name: line(form.get('name'), 60),
		color: /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : '#e5b8cc',
		image: await setImage(form.get('image'), 'large'),
		showText: form.get('showText') === 'on',
		sortOrder: intOrNull(form.get('sortOrder'), 0, 9999) ?? 0
	};
}

/** Crée (`id` null) ou met à jour un paquet de la série `setId` (null : booster All). */
export async function savePack(id: number | null, setId: number | null, input: PackInput) {
	if (!input.name) throw new CardError('Donne un nom au paquet.');
	if (setId !== null && !(await prisma.cardSet.findUnique({ where: { id: setId }, select: { id: true } }))) {
		throw new CardError('Cette série n’existe plus.');
	}
	if (id) {
		const done = await prisma.cardPack.updateMany({ where: { id, setId }, data: input });
		if (done.count !== 1) throw new CardError('Paquet introuvable.', 404);
		return;
	}
	if ((await prisma.cardPack.count({ where: { setId } })) >= 8) throw new CardError('8 paquets au plus par série.');
	await prisma.cardPack.create({ data: { ...input, setId } });
}

/** Supprime un paquet ; les boosters déjà ouverts avec lui gardent leurs cartes. */
export async function deletePack(id: number) {
	await prisma.cardPack.deleteMany({ where: { id } });
}
