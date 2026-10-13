import { option, type Field } from '$lib/admin/fields';
import { CATEGORY_LABELS, CONTAINER_KEYS, CONTAINERS, RARITIES } from '$lib/game/inventory';
import {
	COUNTRY_LABELS,
	DRAGONS,
	FOOD_TYPE_LABELS,
	RACE_LABELS,
	ROLE_ADMIN,
	ROLE_PLAYER
} from '$lib/game/labels';
import { STAT_KEYS, STATS } from '$lib/game/stats';

// Les enregistrements sont manipulés de façon générique, d'où les `any` de ce fichier.
export interface Resource {
	slug: string;
	/** Nom du modèle côté client Prisma (`prisma.player`, `prisma.itemInPlayer`…). */
	model: string;
	label: string;
	singular: string;
	description: string;
	fields: Field[];
	/** Libellé d'un enregistrement, dans les listes de choix et les titres. */
	title: (record: any) => string;
	/** Relations nécessaires à `title`. */
	include?: Record<string, unknown>;
	orderBy?: Record<string, 'asc' | 'desc'>;
	/** Valeurs imposées à la création pour les colonnes sans champ de formulaire. */
	defaults?: Record<string, unknown>;
	/** Dernière retouche des données avant enregistrement. */
	normalize?: (data: Record<string, any>) => void;
}

const dragons = option(DRAGONS);

const resources: Resource[] = [
	{
		slug: 'joueurs',
		model: 'player',
		label: 'Joueurs',
		singular: 'joueur',
		description: 'Comptes, rôle, personnage associé et argent.',
		title: (r) => r.login,
		orderBy: { login: 'asc' },
		defaults: { team: 0 },
		fields: [
			{ name: 'login', label: "Nom d'utilisateur", type: 'text', required: true, list: true },
			{
				name: 'password',
				label: 'Mot de passe',
				type: 'password',
				help: 'Laisser vide pour ne pas le changer.'
			},
			{
				name: 'role',
				label: 'Rôle',
				type: 'select',
				numeric: true,
				list: true,
				options: [
					{ value: ROLE_PLAYER, label: 'Joueur' },
					{ value: ROLE_ADMIN, label: 'MJ' }
				]
			},
			{
				name: 'characterId',
				label: 'Personnage joué',
				type: 'relation',
				relation: 'character',
				resource: 'personnages',
				nullLabel: 'Aucun',
				list: true
			},
			{ name: 'money', label: "Pièces d'or", type: 'number', list: true }
		]
	},
	{
		slug: 'personnages',
		model: 'character',
		label: 'Personnages',
		singular: 'personnage',
		description: 'Fiches, visibilité, arc actuel et statistiques.',
		title: (r) => r.name,
		orderBy: { name: 'asc' },
		fields: [
			{ name: 'image', label: 'Portrait', type: 'image', folder: 'personnages', required: true, list: true },
			{ name: 'name', label: 'Nom', type: 'text', required: true, list: true },
			{ name: 'title', label: 'Titre', type: 'text', list: true },
			{ name: 'country', label: 'Pays', type: 'select', options: option(Object.keys(COUNTRY_LABELS), COUNTRY_LABELS), required: true },
			{ name: 'race', label: 'Race', type: 'select', options: option(Object.keys(RACE_LABELS), RACE_LABELS), required: true },
			{ name: 'dragon', label: 'Dragon de descendance', type: 'select', options: dragons, required: true },
			{ name: 'flux', label: 'Flux', type: 'text' },
			{ name: 'category', label: 'Tags', type: 'text', list: true, help: 'Séparés par des virgules : Promo, Soldats, Arènes' },
			{ name: 'description', label: 'Description', type: 'textarea' },
			{ name: 'visibility', label: 'Visible des joueurs', type: 'flag', list: true },
			{ name: 'current', label: 'Arc actuel', type: 'flag', list: true },
			{ name: 'dead', label: 'Mort', type: 'boolean', list: true },
			{ name: 'censored', label: 'Censuré (teaser)', type: 'boolean', list: true, help: 'Le personnage apparaît, mais ses informations sont masquées pour les joueurs.' },
			{ name: 'quote', label: 'Citation', type: 'text', help: 'Affichée à la place de la description quand la fiche est censurée.' },
			{ name: 'stats', label: 'Statistiques', type: 'stats', owner: 'characterId' }
		]
	},
	{
		slug: 'monstres',
		model: 'monster',
		label: 'Bestiaire',
		singular: 'monstre',
		description: 'Monstres, niveau de danger et statistiques.',
		title: (r) => r.name,
		orderBy: { name: 'asc' },
		fields: [
			{ name: 'image', label: 'Illustration', type: 'image', folder: 'monsters', required: true, list: true },
			{ name: 'name', label: 'Nom', type: 'text', required: true, list: true },
			{ name: 'dragon', label: 'Dragon de descendance', type: 'select', options: dragons, required: true, list: true },
			{ name: 'size', label: 'Taille', type: 'text' },
			{ name: 'weight', label: 'Poids', type: 'text' },
			{ name: 'dangerosity', label: 'Niveau de danger', type: 'number', list: true, help: 'De 0 à 10.' },
			{ name: 'effect', label: 'Effet', type: 'textarea' },
			{ name: 'description', label: 'Description', type: 'textarea' },
			{ name: 'visibility', label: 'Visible des joueurs', type: 'flag', list: true },
			{ name: 'current', label: 'Arc actuel', type: 'flag', list: true },
			{ name: 'stats', label: 'Statistiques', type: 'stats', owner: 'monsterId' }
		]
	},
	{
		slug: 'objets',
		model: 'item',
		label: 'Objets',
		singular: 'objet',
		description: 'Catalogue des objets et bonus des armures.',
		title: (r) => r.name,
		orderBy: { name: 'asc' },
		fields: [
			{ name: 'name', label: 'Nom', type: 'text', required: true, list: true },
			{ name: 'category', label: 'Catégorie', type: 'select', options: option(Object.keys(CATEGORY_LABELS), CATEGORY_LABELS), required: true, list: true, help: 'Casque, Torse, Gantelets et Jambières peuvent être équipés.' },
			{ name: 'rarity', label: 'Rareté', type: 'select', numeric: true, list: true, options: RARITIES.map((label, i) => ({ value: i + 1, label })) },
			{ name: 'weight', label: 'Poids (emplacements)', type: 'number', list: true },
			{ name: 'description', label: 'Description', type: 'textarea' },
			{ name: 'icon', label: 'Icône', type: 'image', folder: 'objets', help: "Facultative : sans icône, celle de la catégorie est utilisée." },
			{ name: 'armor', label: "Bonus d'armure", type: 'armor', help: 'Pour les objets qui s’équipent. Laisser vide sinon.' }
		]
	},
	{
		slug: 'inventaire',
		model: 'itemInPlayer',
		label: 'Inventaires',
		singular: 'objet possédé',
		description: 'Qui possède quoi, et où. Coffre commun compris.',
		title: (r) => `${r.item?.name ?? 'Objet'} — ${r.player?.login ?? 'Coffre commun'}`,
		include: { item: true, player: true },
		orderBy: { id: 'desc' },
		// Un objet sans propriétaire est dans le coffre commun, et inversement.
		normalize: (data) => {
			if (data.playerId == null) data.localisation = 'commun';
			if (data.localisation === 'commun') data.playerId = null;
			if (data.localisation !== 'main') data.equipped = false;
		},
		fields: [
			{ name: 'playerId', label: 'Propriétaire', type: 'relation', relation: 'player', resource: 'joueurs', nullLabel: 'Coffre commun', list: true },
			{ name: 'itemId', label: 'Objet', type: 'relation', relation: 'item', resource: 'objets', required: true, list: true },
			{ name: 'quantity', label: 'Quantité', type: 'number', list: true },
			{ name: 'localisation', label: 'Conteneur', type: 'select', list: true, required: true, options: CONTAINER_KEYS.map((value) => ({ value, label: CONTAINERS[value].label })) },
			{ name: 'equipped', label: 'Équipé', type: 'boolean', list: true, help: "Uniquement pour une armure tenue en main." },
			{ name: 'override', label: 'Particularités de cet exemplaire', type: 'armorOverride', help: 'Pour une armure modifiée : ce bonus remplace celui de l’objet.' }
		]
	},
	{
		slug: 'passifs',
		model: 'passive',
		label: 'Passifs',
		singular: 'passif',
		description: 'Passifs des personnages et leurs effets sur les stats.',
		title: (r) => r.name || `Passif n°${r.id}`,
		orderBy: { name: 'asc' },
		fields: [
			{ name: 'characterId', label: 'Personnage', type: 'relation', relation: 'character', resource: 'personnages', required: true, list: true },
			{ name: 'name', label: 'Nom', type: 'text', required: true, list: true },
			{ name: 'description', label: 'Description', type: 'textarea' },
			{ name: 'active', label: 'Actif', type: 'boolean', list: true },
			{ name: 'statistics', label: 'Effets', type: 'effects', valuesField: 'maths', inactiveField: 'inactiveMaths', bareAs: 'mult', list: true }
		]
	},
	{
		slug: 'competences',
		model: 'skill',
		label: 'Compétences',
		singular: 'compétence',
		description: 'Paliers débloqués quand une stat atteint un niveau.',
		title: (r) => r.name,
		orderBy: { level: 'asc' },
		fields: [
			{ name: 'statistics', label: 'Statistique', type: 'select', required: true, list: true, options: STAT_KEYS.map((k) => ({ value: STATS[k].skill, label: STATS[k].label })) },
			{ name: 'level', label: 'Palier', type: 'number', required: true, list: true, help: 'Valeur de la stat à atteindre (jusqu’à 3 000 pour QDF et HP, 2 000 pour END).' },
			{ name: 'name', label: 'Nom', type: 'text', required: true, list: true },
			{ name: 'description', label: 'Description', type: 'textarea', required: true }
		]
	},
	{
		slug: 'jetons',
		model: 'playerBadge',
		label: 'Badges des joueurs',
		singular: 'badge',
		description: 'Badges distribués aux joueurs, à fusionner deux par deux.',
		title: (r) => `${r.badge} — ${r.player?.login ?? ''}`,
		include: { player: true },
		orderBy: { id: 'desc' },
		fields: [
			{ name: 'playerId', label: 'Joueur', type: 'relation', relation: 'player', resource: 'joueurs', required: true, list: true },
			{ name: 'badge', label: 'Badge', type: 'select', options: dragons, required: true, list: true },
			{ name: 'used', label: 'Utilisé dans une fusion', type: 'boolean', list: true }
		]
	},
	{
		slug: 'fusions',
		model: 'badgeFusion',
		label: 'Fusions de badges',
		singular: 'fusion',
		description: 'Deux badges fusionnés par un joueur : débloque la compétence correspondante.',
		title: (r) => `${r.badge1} + ${r.badge2} — ${r.player?.login ?? ''}`,
		include: { player: true },
		orderBy: { id: 'desc' },
		fields: [
			{ name: 'playerId', label: 'Joueur', type: 'relation', relation: 'player', resource: 'joueurs', required: true, list: true },
			{ name: 'badge1', label: 'Premier badge', type: 'select', options: dragons, required: true, list: true },
			{ name: 'badge2', label: 'Second badge', type: 'select', options: dragons, required: true, list: true, help: 'À la création, un badge disponible de chaque type est marqué comme utilisé.' }
		]
	},
	{
		slug: 'badges',
		model: 'badge',
		label: 'Compétences de badges',
		singular: 'compétence de badge',
		description: 'Ce que débloque chaque paire de badges.',
		title: (r) => r.name,
		orderBy: { name: 'asc' },
		fields: [
			{ name: 'badges', label: 'Paire de badges', type: 'badgePair', required: true, list: true },
			{ name: 'name', label: 'Nom', type: 'text', required: true, list: true },
			{ name: 'description', label: 'Description', type: 'textarea', required: true }
		]
	},
	{
		slug: 'aliments',
		model: 'food',
		label: 'Aliments',
		singular: 'aliment',
		description: 'Nourriture rangée dans les sacs.',
		title: (r) => r.name,
		orderBy: { name: 'asc' },
		fields: [
			{ name: 'name', label: 'Nom', type: 'text', required: true, list: true },
			{ name: 'type', label: 'Type', type: 'select', options: option(Object.keys(FOOD_TYPE_LABELS), FOOD_TYPE_LABELS), required: true, list: true },
			{ name: 'weight', label: 'Poids', type: 'number', list: true },
			{ name: 'price', label: 'Prix', type: 'number', list: true }
		]
	},
	{
		slug: 'sacs',
		model: 'foodInBag',
		label: 'Contenu des sacs',
		singular: 'aliment dans un sac',
		description: 'Aliments contenus dans les sacs de nourriture des joueurs.',
		title: (r) => `${r.food?.name ?? 'Aliment'} ×${r.quantity}`,
		include: { food: true },
		orderBy: { id: 'desc' },
		fields: [
			{ name: 'itemInPlayerId', label: 'Sac', type: 'relation', relation: 'itemInPlayer', resource: 'inventaire', filter: { item: { category: 'Sac' } }, required: true, list: true, help: 'Un objet de catégorie Sac, dans l’inventaire d’un joueur.' },
			{ name: 'foodId', label: 'Aliment', type: 'relation', relation: 'food', resource: 'aliments', required: true, list: true },
			{ name: 'quantity', label: 'Quantité', type: 'number', list: true }
		]
	}
];

export const RESOURCES = resources;

export function findResource(slug: string): Resource | undefined {
	return resources.find((r) => r.slug === slug);
}
