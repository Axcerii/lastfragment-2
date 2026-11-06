// Les images envoyées ne sont acceptées que si leur contenu est bien du format annoncé : un fichier
// d'un autre format renommé (HEIF, TIFF…) n'atteint jamais le décodeur correspondant de sharp.

import { mkdtempSync, readdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterAll, describe, expect, it, vi } from 'vitest';

const dir = mkdtempSync(join(tmpdir(), 'lf-uploads-'));
vi.mock('$env/dynamic/private', () => ({ env: { UPLOAD_DIR: dir } }));

const { imageKind, saveImage, UploadError } = await import('./uploads');

const bytes = (...values: number[]) => new Uint8Array(values);
const text = (value: string) => new TextEncoder().encode(value);

const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13);
const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0, 0, 16);
const GIF = text('GIF89a....');
const WEBP = text('RIFF\u0000\u0000\u0000\u0000WEBPVP8 ');
// En-tête d'un fichier HEIF (boîte ftyp) : le format que vise une des failles de libheif.
const HEIF = bytes(0, 0, 0, 0x18, ...text('ftypheic'), 0, 0, 0, 0);
const TIFF = bytes(0x49, 0x49, 0x2a, 0x00, 8, 0, 0, 0);

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe('imageKind', () => {
	it('reconnaît les formats acceptés à leurs premiers octets', () => {
		expect(imageKind(PNG)).toBe('png');
		expect(imageKind(JPEG)).toBe('jpeg');
		expect(imageKind(GIF)).toBe('gif');
		expect(imageKind(WEBP)).toBe('webp');
		expect(imageKind(text('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBe('svg');
		expect(imageKind(text('﻿<?xml version="1.0"?>\n<svg width="1"></svg>'))).toBe('svg');
	});

	it('refuse tout le reste', () => {
		expect(imageKind(HEIF)).toBeNull();
		expect(imageKind(TIFF)).toBeNull();
		expect(imageKind(text('<html><body>pas une image</body></html>'))).toBeNull();
		expect(imageKind(text('RIFF\u0000\u0000\u0000\u0000WAVEfmt '))).toBeNull();
		expect(imageKind(bytes())).toBeNull();
	});
});

describe('saveImage', () => {
	const file = (data: Uint8Array, type: string, name = 'image.png') => new File([new Uint8Array(data)], name, { type });

	it('garde une image dont le contenu correspond au type annoncé', async () => {
		const url = await saveImage(file(PNG, 'image/png'), 'essai');
		expect(url).toMatch(/^\/uploads\/essai\/\d+-image\.png$/);
	});

	it('refuse un fichier d’un autre format présenté comme une image', async () => {
		await expect(saveImage(file(HEIF, 'image/png'), 'piege')).rejects.toBeInstanceOf(UploadError);
		await expect(saveImage(file(JPEG, 'image/png'), 'piege')).rejects.toBeInstanceOf(UploadError);
		await expect(saveImage(file(text('<svg></svg>'), 'image/png'), 'piege')).rejects.toBeInstanceOf(UploadError);
		// Rien n'a été écrit sur le disque.
		expect(readdirSync(dir)).not.toContain('piege');
	});
});
