import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { prisma } from '$lib/server/prisma';
import { UploadError, removeUpload, saveAudio, saveImage, saveVideo } from '$lib/server/uploads';
import { ASSET_KINDS, AUDIO_KINDS, type AssetKind } from '$lib/table/types';

// Bibliothèque de médias du MJ : envoi de fichiers (plusieurs à la fois), renommage, suppression.

export const POST: RequestHandler = async ({ locals, request }) => {
	requireAdmin(locals);
	const form = await request.formData();
	const kind = String(form.get('kind')) as AssetKind;
	if (!ASSET_KINDS.includes(kind)) error(400, 'Type de média inconnu.');

	const files = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
	if (files.length === 0) error(400, 'Aucun fichier envoyé.');

	const created = [];
	try {
		for (const file of files) {
			const url = AUDIO_KINDS.includes(kind)
				? await saveAudio(file, `table/${kind}`)
				: kind === 'calque' && file.type.startsWith('video/')
					? await saveVideo(file, `table/${kind}`)
					: await saveImage(file, `table/${kind}`);
			const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim().slice(0, 255) || kind;
			const asset = await prisma.tableAsset.create({ data: { kind, name, url } });
			created.push({ id: asset.id, kind: asset.kind, name: asset.name, url: asset.url });
		}
	} catch (e) {
		if (e instanceof UploadError) error(400, e.message);
		throw e;
	}
	return json(created);
};

export const PATCH: RequestHandler = async ({ locals, request }) => {
	requireAdmin(locals);
	const body = await request.json();
	const name = String(body.name ?? '').trim().slice(0, 255);
	if (!name) error(400, 'Nom manquant.');
	await prisma.tableAsset.update({ where: { id: Number(body.id) }, data: { name } });
	return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ locals, url }) => {
	requireAdmin(locals);
	const asset = await prisma.tableAsset.findUnique({ where: { id: Number(url.searchParams.get('id')) } });
	if (!asset) error(404, 'Média introuvable.');
	await prisma.tableAsset.delete({ where: { id: asset.id } });
	await removeUpload(asset.url);
	return json({ ok: true });
};
