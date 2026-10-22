// Description des champs d'une ressource du back-office.
// Partagé entre le serveur (lecture du formulaire) et le navigateur (affichage du formulaire).

interface Base {
	/** Nom de la colonne Prisma (ou identifiant, pour un champ virtuel). */
	name: string;
	label: string;
	required?: boolean;
	help?: string;
	/** Affiché comme colonne dans le tableau de la ressource. */
	list?: boolean;
}

export interface Option {
	value: string | number;
	label: string;
}

export type Field = Base &
	(
		| { type: 'text' | 'textarea' | 'number' | 'boolean' | 'password' }
		/** Entier 0/1 en base, présenté comme un interrupteur. */
		| { type: 'flag' }
		| { type: 'select'; options: Option[]; numeric?: boolean }
		| {
				type: 'relation';
				/** Nom de la relation Prisma à inclure pour afficher l'enregistrement lié. */
				relation: string;
				/** Ressource cible, qui fournit la liste de choix. */
				resource: string;
				/** Libellé du choix « aucun » ; son absence rend la relation obligatoire. */
				nullLabel?: string;
				/** Restreint les enregistrements proposés (filtre Prisma). */
				filter?: Record<string, unknown>;
		  }
		| { type: 'image'; folder: string }
		/** Deux colonnes parallèles stats/valeurs (plus une colonne de valeurs « inactif » pour un passif). */
		| { type: 'effects'; valuesField: string; inactiveField?: string; bareAs: 'flat' | 'mult' }
		| { type: 'badgePair' }
		/** Descendance : un ou plusieurs dragons (« Goliath-Pura »), ou « Aucun » / « Inconnu ». */
		| { type: 'dragons' }
		/** Champs virtuels : enregistrés dans une table liée après la sauvegarde. */
		| { type: 'stats'; owner: 'characterId' | 'monsterId' }
		| { type: 'armor' }
		| { type: 'armorOverride' }
	);

export type FieldType = Field['type'];

/** Champs qui ne correspondent pas à une colonne de la table de la ressource. */
export const VIRTUAL_TYPES: FieldType[] = ['stats', 'armor', 'armorOverride'];

export function option(values: readonly string[], labels: Record<string, string> = {}): Option[] {
	return values.map((value) => ({ value, label: labels[value] ?? value }));
}
