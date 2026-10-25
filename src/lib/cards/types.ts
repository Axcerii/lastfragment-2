// Cartes à collectionner : types, finitions, cadres et usure, partagés entre serveur et navigateur.
// Un modèle (`CardTemplate`) est dessiné par le MJ ; chaque exemplaire tiré (`Card`) porte son
// numéro de série et son usure. Le recto, le verso et la finition vivent dans `face` (CardFace).

import { RARITIES } from '$lib/game/inventory';

export const CARD_TYPES = {
	personnage: { label: 'Personnage', icon: '/layout/Logo.svg', accent: '#e5b8cc' },
	monstre: { label: 'Monstre', icon: '/objets/categories/Animal.svg', accent: '#ca4444' },
	arme: { label: 'Arme', icon: '/objets/categories/Arme.svg', accent: '#a6a6a6' },
	objet: { label: 'Objet', icon: '/objets/categories/Fiole.svg', accent: '#d2b674' },
	lieu: { label: 'Lieu', icon: '/icones/pays/Inconnu.svg', accent: '#cfdfc4' },
	dragon: { label: 'Dragon', icon: '/dragons/normal/Goliath.svg', accent: '#615dd3' },
	evenement: { label: 'Événement', icon: '/objets/categories/Important.svg', accent: '#7fa8e0' }
} as const;
export type CardType = keyof typeof CARD_TYPES;
export const CARD_TYPE_KEYS = Object.keys(CARD_TYPES) as CardType[];

// `Object.hasOwn` et non `in` : « __proto__ » ou « toString » ne doivent pas passer pour des clés.
export function isCardType(value: unknown): value is CardType {
	return typeof value === 'string' && Object.hasOwn(CARD_TYPES, value);
}

export { RARITIES };
export const RARITY_VALUES = [1, 2, 3, 4, 5] as const;
/**
 * Les Unique ne comptent pas dans les 100 % d'un album : leur case n'apparaît qu'une fois la carte
 * obtenue, et fait passer l'album au-delà de 100 %.
 */
export const UNIQUE_RARITY = 5;

export function rarityLabel(rarity: number): string {
	return RARITIES[rarity - 1] ?? 'Inconnue';
}

/** Reflet de la carte quand on l'incline : choisi par le MJ pour chaque modèle. */
export const FINISHES = {
	mate: { label: 'Mate', hint: 'Aucun reflet, juste la lumière.' },
	brillante: { label: 'Brillante', hint: 'Un reflet blanc suit le doigt.' },
	holo: { label: 'Holo', hint: 'Arc-en-ciel sur toute l’illustration.' },
	reverse: { label: 'Reverse', hint: 'Arc-en-ciel sur le fond et le cadre, le sujet reste net.' },
	or: { label: 'Or', hint: 'Cadre et reflets en feuille d’or.' },
	prisme: { label: 'Prisme', hint: 'Paillettes qui scintillent.' },
	eclat: { label: 'Éclat', hint: 'Verre brisé qui réfracte la lumière.' }
} as const;
export type Finish = keyof typeof FINISHES;
export const FINISH_KEYS = Object.keys(FINISHES) as Finish[];

/** Finition proposée par défaut pour une rareté. */
export const DEFAULT_FINISH: Record<number, Finish> = {
	1: 'mate',
	2: 'brillante',
	3: 'holo',
	4: 'or',
	5: 'eclat'
};

/** Mise en page du recto. */
export const FRAMES = {
	sport: { label: 'Sport', hint: 'Bordure fine, bandeau en biais avec le nom.' },
	plein: { label: 'Pleine image', hint: 'L’illustration prend toute la carte.' },
	vintage: { label: 'Vintage', hint: 'Large bordure claire, comme les cartes d’autrefois.' }
} as const;
export type Frame = keyof typeof FRAMES;
export const FRAME_KEYS = Object.keys(FRAMES) as Frame[];

/** Fonds dessinés, quand le fond n'est pas une image. */
export const BACKDROPS = {
	halo: 'Halo',
	degrade: 'Dégradé',
	fragments: 'Fragments',
	nuit: 'Nuit'
} as const;
export type Backdrop = keyof typeof BACKDROPS;
export const BACKDROP_KEYS = Object.keys(BACKDROPS) as Backdrop[];

/**
 * Image posée sur la carte. `src` est le fichier d'origine choisi par le MJ ; `large` et `small`
 * sont ses copies WebP calculées par le serveur (jamais fournies par le navigateur).
 * `x` et `y` décalent l'image en % de la zone, `zoom` l'agrandit.
 */
export interface CardImage {
	src: string;
	large: string;
	small: string;
	x: number;
	y: number;
	zoom: number;
	/** `cover` remplit la zone ; `contain` montre l'image entière (portraits détourés). */
	fit: 'cover' | 'contain';
}

export interface CardFact {
	label: string;
	value: string;
}

export interface CardBar {
	label: string;
	/** De 0 à 100. */
	value: number;
	/** Dragon dont la barre prend la couleur, ou vide pour l'accent de la carte. */
	dragon: string;
}

export interface CardFace {
	subtitle: string;
	/** Descendance, au format de la colonne `dragon` (« Goliath-Pura »), ou vide. */
	dragons: string;
	/** Couleur d'accent, `#rrggbb`. */
	accent: string;
	finish: Finish;
	frame: Frame;
	art: CardImage | null;
	/** Le sujet déborde du cadre (portraits détourés). */
	popout: boolean;
	backdrop: Backdrop;
	background: CardImage | null;
	/** Verso */
	flavor: string;
	text: string;
	/** Taille du texte du verso, en % de la taille normale. */
	textSize: number;
	facts: CardFact[];
	bars: CardBar[];
}

export const FACE_LIMITS = {
	name: 40,
	subtitle: 60,
	flavor: 180,
	text: 420,
	facts: 6,
	factLabel: 16,
	factValue: 40,
	bars: 10,
	barLabel: 12,
	textSize: [70, 200]
} as const;

export function defaultFace(type: CardType = 'personnage', rarity = 1): CardFace {
	return {
		subtitle: '',
		dragons: '',
		accent: CARD_TYPES[type].accent,
		finish: DEFAULT_FINISH[rarity] ?? 'mate',
		frame: 'sport',
		art: null,
		popout: false,
		backdrop: 'halo',
		background: null,
		flavor: '',
		text: '',
		textSize: 100,
		facts: [],
		bars: []
	};
}

/** Relit un `face` enregistré (JSON) : il a été nettoyé à l'écriture, il ne manque au plus que des champs ajoutés depuis. */
export function readFace(json: unknown, type: CardType, rarity: number): CardFace {
	const base = defaultFace(type, rarity);
	if (!json || typeof json !== 'object') return base;
	const face = { ...base, ...(json as Partial<CardFace>) };
	// Fond retiré depuis (« rayons ») : la carte reprend le fond par défaut.
	if (!BACKDROP_KEYS.includes(face.backdrop)) face.backdrop = base.backdrop;
	return face;
}

// ─── Usure ───────────────────────────────────────────────────────────────

/**
 * Usure d'un exemplaire, comme le « float » de CS : une tranche est tirée selon son poids, puis
 * une valeur au hasard dans la tranche. Les poids reprennent à peu près ceux de CS.
 */
export const WEAR_TIERS = [
	{ key: 'neuve', label: 'Neuve', min: 0, max: 0.07, weight: 3 },
	{ key: 'quasi', label: 'Quasi neuve', min: 0.07, max: 0.15, weight: 24 },
	{ key: 'eprouvee', label: 'Éprouvée', min: 0.15, max: 0.38, weight: 33 },
	{ key: 'usee', label: 'Usée', min: 0.38, max: 0.45, weight: 24 },
	{ key: 'marquee', label: 'Marquée par le combat', min: 0.45, max: 1, weight: 16 }
] as const;

export function wearTier(wear: number) {
	return WEAR_TIERS.find((t) => wear < t.max) ?? WEAR_TIERS[WEAR_TIERS.length - 1];
}

/** « 0,071234 » : six décimales, comme un float de CS. */
export function formatWear(wear: number): string {
	return wear.toFixed(6).replace('.', ',');
}

// ─── Statuts et séries ───────────────────────────────────────────────────

export const TEMPLATE_STATUSES = {
	brouillon: 'Brouillon',
	publiee: 'Publiée',
	retiree: 'Retirée'
} as const;
export type TemplateStatus = keyof typeof TEMPLATE_STATUSES;

export function isTemplateStatus(value: unknown): value is TemplateStatus {
	return typeof value === 'string' && Object.hasOwn(TEMPLATE_STATUSES, value);
}

/** « 012 » */
export function padNumber(n: number | null | undefined, width = 3): string {
	return n == null ? '—' : String(n).padStart(width, '0');
}

/** N° de série d'un exemplaire : « #12 », ou « #12/50 » pour un tirage limité. */
export function formatSerial(serial: number | null | undefined, maxPrints: number | null | undefined): string {
	if (serial == null) return '#—';
	return maxPrints ? `#${serial}/${maxPrints}` : `#${serial}`;
}

export const TRADE_STATUSES = {
	attente: 'En attente',
	acceptee: 'Acceptée',
	refusee: 'Refusée',
	annulee: 'Annulée',
	caduque: 'Caduque'
} as const;
export type TradeStatus = keyof typeof TRADE_STATUSES;

/** Encre lisible (sombre ou claire) sur une couleur `#rrggbb`. */
export function inkOn(hex: string): string {
	const n = parseInt(hex.slice(1), 16);
	if (Number.isNaN(n)) return '#fff';
	const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
		const s = c / 255;
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.32 ? '#1b1b1b' : '#ffffff';
}

// ─── Données envoyées au navigateur ──────────────────────────────────────

/** Ce qu'il faut pour dessiner une carte : un modèle enregistré ou celui en cours de création. */
export interface CardLook {
	type: CardType;
	rarity: number;
	name: string;
	number: number | null;
	maxPrints: number | null;
	set: { code: string; color: string; logo: string | null; total: number } | null;
	face: CardFace;
}

export interface TemplateView {
	id: number;
	type: CardType;
	rarity: number;
	name: string;
	status: TemplateStatus;
	maxPrints: number | null;
	printed: number;
	number: number | null;
	set: { id: number; name: string; code: string; color: string; logo: string | null; total: number } | null;
	face: CardFace;
}

export interface CopyView {
	id: number;
	serial: number;
	wear: number;
	origin: string;
	pinned: boolean;
	obtainedAt: string;
	owner: { id: number; name: string } | null;
}

export interface OwnedCard {
	copy: CopyView;
	template: TemplateView;
}

/** Paquet de booster : seulement son apparence, le contenu dépend de la série. */
export interface PackView {
	/** null : paquet par défaut (la série n'en a pas dessiné). */
	id: number | null;
	name: string;
	color: string;
	/** Illustration de toute la face avant (dessinée par le MJ). */
	image: string | null;
	/** Ajoute par-dessus le nom de la série et le logo ; sans illustration, ils sont toujours là. */
	showText: boolean;
	/** Paquet par défaut d'une série sans paquet dessiné : sa bannière, dans la fenêtre du paquet. */
	banner?: string | null;
}

export interface SetView {
	id: number;
	name: string;
	code: string;
	description: string | null;
	logo: string | null;
	banner: string | null;
	color: string;
	endsAt: string | null;
	total: number;
}
