// Libellés affichés pour les valeurs des enums Prisma (les clés n'ont pas d'accents).

export const DRAGONS = [
	'Artrish',
	'Yinva',
	'Guizamark',
	'Shizari',
	'Pestia',
	'Chronos',
	'Aqua',
	'Goliath',
	'Drii',
	'Lada',
	'Pura'
] as const;
export type Dragon = (typeof DRAGONS)[number];

export function isDragon(name: string | null | undefined): name is Dragon {
	return (DRAGONS as readonly string[]).includes(name ?? '');
}

/**
 * Dragons d'une descendance, dans l'ordre où elle les cite. Comme en V1, une descendance peut en
 * réunir plusieurs (« Goliath-Pura ») ; « Aucun » et « Inconnu » n'en contiennent aucun.
 */
export function parseDragons(descent: string | null | undefined): Dragon[] {
	const found: Dragon[] = [];
	for (const word of (descent ?? '').split(/[^A-Za-z]+/)) {
		const dragon = DRAGONS.find((d) => d.toLowerCase() === word.toLowerCase());
		if (dragon && !found.includes(dragon)) found.push(dragon);
	}
	return found;
}

/** Descendance inconnue, à distinguer de l'absence de descendance (« Aucun »). */
export function isUnknownDescent(descent: string | null | undefined): boolean {
	return parseDragons(descent).length === 0 && descent?.trim().toLowerCase() === 'inconnu';
}

/** Valeur de la colonne `dragon` : « Goliath-Pura », ou « Aucun » / « Inconnu » sans dragon. */
export function formatDescent(dragons: readonly Dragon[], unknown = false): string {
	if (dragons.length) return [...new Set(dragons)].join('-');
	return unknown ? 'Inconnu' : 'Aucun';
}

/** Remet une descendance saisie au format de la base. */
export function normalizeDescent(descent: string | null | undefined): string {
	return formatDescent(parseDragons(descent), isUnknownDescent(descent));
}

// Couleurs trop sombres pour porter un texte sombre.
const DARK_DRAGONS = ['Shizari', 'Pestia', 'Chronos', 'Goliath', 'Drii'];

export function isDarkDragon(dragon: string): boolean {
	return DARK_DRAGONS.includes(dragon);
}

/** Couleur d'un dragon éclaircie, lisible sur le fond sombre du site. */
export function dragonText(dragon: string): string {
	return dragon === 'Shizari' ? '#9a9a9a' : `color-mix(in srgb, var(--${dragon}) 75%, #fff)`;
}

/**
 * Variables CSS d'un dragon : `--c` sa couleur, `--ink` le texte lisible posé dessus,
 * `--c-text` sa couleur éclaircie, lisible sur le fond sombre du site.
 */
export function dragonVars(dragon: string): string {
	const ink = isDarkDragon(dragon) ? 'var(--foreground)' : 'var(--background)';
	return `--c: var(--${dragon}); --ink: ${ink}; --c-text: ${dragonText(dragon)}`;
}

export const RACE_LABELS: Record<string, string> = {
	Humain: 'Humain',
	Geant: 'Géant',
	Eternelle: 'Éternelle',
	Inconnu: 'Inconnu',
	Dragon: 'Dragon',
	Ange: 'Ange'
};

export const COUNTRY_LABELS: Record<string, string> = {
	Augeaime: 'Augeaime',
	Inconnu: 'Inconnu',
	Irisia: 'Irisia',
	Amari: 'Amari',
	Mudan: 'Mudan',
	Edenia: 'Edenia',
	Celeste: 'Céleste',
	Saxifra: 'Saxifra'
};

// Pays disposant d'un emblème dans /static/pays.
const COUNTRY_ICONS = ['Amari', 'Augeaime', 'Celeste', 'Edenia', 'Inconnu', 'Irisia', 'Mudan', 'Saxifra'];

export function countryIcon(country: string): string {
	return `/pays/${COUNTRY_ICONS.includes(country) ? country : 'Inconnu'}.svg`;
}

export const FOOD_TYPE_LABELS: Record<string, string> = {
	viandes: 'Viandes',
	boissons: 'Boissons',
	fruits: 'Fruits',
	rations: 'Rations'
};

/** Silhouette affichée pour un personnage sans portrait. */
export const DEFAULT_PORTRAIT = '/uploads/personnages/placeholder.png';

export function portrait(image: string | null | undefined): string {
	return image || DEFAULT_PORTRAIT;
}

/** Les tags d'un personnage sont stockés en une seule chaîne séparée par des virgules. */
export function splitTags(category: string | null | undefined): string[] {
	return (category ?? '')
		.split(',')
		.map((t) => t.trim())
		.filter(Boolean);
}

export const ROLE_PLAYER = 0;
export const ROLE_ADMIN = 10;
