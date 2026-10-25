// Prépare les textures d'usure : niveaux de gris → blanc (ou brun) sur transparent, opacité = intensité.
const sharp = require('sharp');
const path = require('path');
const [src, out] = process.argv.slice(2);
const S = (f) => path.join(src, f);

async function gray(file, size) {
	return sharp(file).flatten({ background: '#000' }).grayscale().resize(size, size).raw().toBuffer({ resolveWithObject: true });
}

/** Passe-haut : retire les variations lentes (taches floues), garde les détails fins. */
async function highpass(file, size, radius) {
	const { data, info } = await gray(file, size);
	const blur = await sharp(data, { raw: info }).blur(radius).raw().toBuffer();
	const res = Buffer.alloc(data.length);
	for (let i = 0; i < data.length; i++) res[i] = Math.max(0, data[i] - blur[i]);
	return { data: res, info };
}

function levels({ data, info }, lo, hi, gamma = 1) {
	const res = Buffer.alloc(data.length);
	for (let i = 0; i < data.length; i++) {
		const v = Math.min(1, Math.max(0, (data[i] - lo) / (hi - lo)));
		res[i] = Math.round(Math.pow(v, gamma) * 255);
	}
	return { data: res, info };
}

async function writeAlpha({ data, info }, rgb, file, quality = 82) {
	const alpha = await sharp(data, { raw: info }).toColourspace('b-w').raw().toBuffer();
	await sharp({ create: { width: info.width, height: info.height, channels: 3, background: rgb } })
		.joinChannel(alpha, { raw: { width: info.width, height: info.height, channels: 1 } })
		.webp({ quality, alphaQuality: 90 })
		.toFile(path.join(out, file));
}

(async () => {
	// Rayures fines et courbes (rugosité d'un métal rayé).
	{
		// Les halos flous de la texture d'origine contiennent eux-mêmes du grain : on éteint les zones
		// dont la luminosité moyenne sort du fond.
		const file = S('Metal003_1K-JPG_Roughness.jpg');
		const hp = await highpass(file, 1024, 2.5);
		const { data, info } = await gray(file, 1024);
		const halo = await sharp(data, { raw: info }).blur(24).raw().toBuffer();
		for (let i = 0; i < hp.data.length; i++) {
			const att = Math.min(1, Math.max(0, (halo[i] - 38) / 8));
			hp.data[i] = Math.round(hp.data[i] * (1 - att));
		}
		await writeAlpha(levels(hp, 12, 55, 1), '#ffffff', 'rayures-fines.webp');
	}
	// Frottement : rayures serrées et orientées.
	await writeAlpha(levels(await highpass(S('Metal056A_1K-JPG_Roughness.jpg'), 1024, 5), 8, 110, 1.1), '#ffffff', 'rayures-frottement.webp');
	// Poussière et petites saletés claires.
	await writeAlpha(levels(await gray(S('SurfaceImperfections013_1K-JPG_Opacity.jpg'), 1024), 40, 200, 1), '#f3ecdc', 'poussiere.webp');
	// Crasse : les zones sombres du papier peint défraîchi, en brun.
	{
		const { data, info } = await gray(S('decrepit_wallpaper_diff_1k.jpg'), 512);
		const inv = Buffer.alloc(data.length);
		for (let i = 0; i < data.length; i++) inv[i] = 255 - data[i];
		await writeAlpha(levels({ data: inv, info }, 140, 230, 1.2), '#2e2416', 'crasse.webp', 70);
	}
	// Tache de café (déjà détourée).
	await sharp(S('StainCoffee.png')).resize(640).webp({ quality: 80, alphaQuality: 90 }).toFile(path.join(out, 'tache-cafe.webp'));
	// Grain de carton pour le verso : fibres sombres sur transparent.
	{
		const hp = await highpass(S('Cardboard002_1K-JPG_Color.jpg'), 512, 12);
		const { data, info } = await gray(S('Cardboard002_1K-JPG_Color.jpg'), 512);
		const blur = await sharp(data, { raw: info }).blur(12).raw().toBuffer();
		const dark = Buffer.alloc(data.length);
		for (let i = 0; i < data.length; i++) dark[i] = Math.max(0, blur[i] - data[i]);
		await writeAlpha(levels({ data: dark, info }, 2, 40, 1), '#4a3a24', 'carton.webp', 75);
		void hp;
	}
	console.log('ok');
})();
