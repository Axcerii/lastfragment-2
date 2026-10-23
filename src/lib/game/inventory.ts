// Conteneurs d'inventaire. La clé est la valeur stockée dans `items_in_player.localisation`.
export const CONTAINER_KEYS = ['main', 'sac', 'coffre', 'cheval', 'commun'] as const;
export type ContainerKey = (typeof CONTAINER_KEYS)[number];

export const CONTAINERS: Record<ContainerKey, { label: string; icon: string }> = {
	main: { label: 'Main', icon: 'Main' },
	sac: { label: 'Sac', icon: 'Sac' },
	coffre: { label: 'Coffre', icon: 'Coffre' },
	cheval: { label: 'Cheval', icon: 'Monture' },
	commun: { label: 'Coffre commun', icon: 'Partage' }
};

/** Les valeurs inconnues (anciennes données) sont rangées dans le coffre. */
export function toContainer(localisation: string | null | undefined): ContainerKey {
	return (CONTAINER_KEYS as readonly string[]).includes(localisation ?? '')
		? (localisation as ContainerKey)
		: 'coffre';
}

export const CHEST_CAPACITY = 1024;
export const HORSE_CAPACITY = 3;

/** Emplacements que le personnage peut porter sur lui (et autant dans son sac). */
export function carryCapacity(strength: number, hasBackpack = false): number {
	const capacity = 3 + Math.floor(strength / 20);
	return hasBackpack ? capacity * 2 : capacity;
}

export function containerCapacity(
	container: ContainerKey,
	strength: number,
	hasBackpack = false
): number {
	if (container === 'main' || container === 'sac') return carryCapacity(strength, hasBackpack);
	if (container === 'cheval') return HORSE_CAPACITY;
	return CHEST_CAPACITY;
}

/** Un sac à dos équipé au torse double la capacité de port. */
export function isBackpack(itemName: string): boolean {
	return /sac\s+[àa]\s+dos/i.test(itemName);
}

export const RARITIES = ['Commun', 'Singulier', 'Rare', 'Légendaire', 'Unique'] as const;

export function rarityLabel(rarity: number): string {
	return RARITIES[rarity - 1] ?? 'Inconnu';
}

// Emplacements d'armure, d'après la catégorie de l'objet (enum Prisma `ItemCategory`).
export const ARMOR_SLOTS = ['Casque', 'Torse', 'Gantelets', 'Jambieres'] as const;
export type ArmorSlot = (typeof ARMOR_SLOTS)[number];

export function armorSlot(category: string): ArmorSlot | null {
	return (ARMOR_SLOTS as readonly string[]).includes(category) ? (category as ArmorSlot) : null;
}

export const CATEGORY_LABELS: Record<string, string> = {
	Casque: 'Casque',
	Torse: 'Torse',
	Gantelets: 'Gantelets',
	Jambieres: 'Jambières',
	Outil: 'Outil',
	Arme: 'Arme',
	Fiole: 'Fiole',
	Nourriture: 'Nourriture',
	Munitions: 'Munitions',
	Important: 'Important',
	Autre: 'Autre',
	Materiaux: 'Matériaux',
	Animal: 'Animal',
	Sac: 'Sac'
};

const CATEGORY_ICONS: Record<string, string> = {
	Casque: 'Armure',
	Torse: 'Armure',
	Gantelets: 'Armure',
	Jambieres: 'Armure',
	Munitions: 'Munition',
	Materiaux: 'Matériaux'
};

/** Icône d'un objet : la sienne si le MJ en a fourni une, sinon celle de sa catégorie. */
export function itemIcon(item: { icon?: string | null; category: string }): string {
	return item.icon || `/objets/categories/${CATEGORY_ICONS[item.category] ?? item.category}.svg`;
}

interface Weighted {
	quantity: number;
	equipped: boolean;
	item: { weight: number };
}

/** Poids occupé par une pile d'objets ; une armure équipée ne pèse rien. */
export function stackWeight(entry: Weighted): number {
	return entry.equipped ? 0 : entry.item.weight * entry.quantity;
}

export function totalWeight(entries: Weighted[]): number {
	return entries.reduce((sum, e) => sum + stackWeight(e), 0);
}

/** Argent affiché aux joueurs : arrondi au millier au-delà de 1 000, au million au-delà. */
export function formatMoney(amount: number, exact = false): string {
	if (exact || Math.abs(amount) <= 1000) return amount.toLocaleString('fr-FR');
	if (Math.abs(amount) < 999_500) return `${Math.round(amount / 1000)}k`;
	return `${(amount / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}M`;
}
