// Édition rapide des personnages : les colonnes modifiables en masse et leur validation.
// Partagé entre le navigateur (tableau) et le serveur (contrôle avant enregistrement).

import { COUNTRY_LABELS, normalizeDescent, RACE_LABELS } from '$lib/game/labels';
import type { Option } from './fields';

export type BulkValue = string | boolean;

export type BulkField = {
	name: string;
	label: string;
	/** Colonne affichée tant que le MJ ne l'a pas masquée. */
	shown: boolean;
} & (
	| { type: 'text'; required?: boolean; nullable?: boolean }
	| { type: 'select'; options: Option[] }
	| { type: 'dragons' }
	/** `flag` : entier 0/1 en base ; `boolean` : vrai booléen. */
	| { type: 'flag' | 'boolean' }
);

const MAX_TEXT = 255;

const options = (labels: Record<string, string>): Option[] =>
	Object.entries(labels).map(([value, label]) => ({ value, label }));

export const BULK_FIELDS: BulkField[] = [
	{ name: 'name', label: 'Nom', type: 'text', required: true, shown: true },
	{ name: 'title', label: 'Titre', type: 'text', nullable: true, shown: false },
	{ name: 'job', label: 'Métier', type: 'text', nullable: true, shown: true },
	{ name: 'flux', label: 'Flux', type: 'text', nullable: true, shown: true },
	{ name: 'race', label: 'Race', type: 'select', options: options(RACE_LABELS), shown: true },
	{ name: 'country', label: 'Pays', type: 'select', options: options(COUNTRY_LABELS), shown: true },
	{ name: 'dragon', label: 'Descendance', type: 'dragons', shown: true },
	{ name: 'category', label: 'Tags', type: 'text', shown: false },
	{ name: 'visibility', label: 'Visible', type: 'flag', shown: true },
	{ name: 'current', label: 'Arc actuel', type: 'flag', shown: false },
	{ name: 'dead', label: 'Mort', type: 'boolean', shown: false },
	{ name: 'censored', label: 'Censuré', type: 'boolean', shown: false }
];

export function findBulkField(name: unknown): BulkField | undefined {
	return BULK_FIELDS.find((f) => f.name === name);
}

/** Valeur de la base telle que le tableau l'édite. */
export function toEditable(field: BulkField, value: unknown): BulkValue {
	switch (field.type) {
		case 'flag':
			return value === 1;
		case 'boolean':
			return value === true;
		default:
			return typeof value === 'string' ? value : '';
	}
}

/** Vrai si la valeur est vide (pour le filtre « vides seulement »). */
export function isEmptyValue(field: BulkField, value: BulkValue): boolean {
	if (field.type === 'dragons') return normalizeDescent(String(value)) === 'Inconnu';
	return typeof value === 'string' && value.trim() === '';
}

/** Mise en forme d'une saisie : la valeur qui sera enregistrée, ou un message d'erreur. */
export function parseEditable(
	field: BulkField,
	value: unknown
): { ok: true; value: string | number | boolean | null } | { ok: false; error: string } {
	switch (field.type) {
		case 'flag':
		case 'boolean':
			if (typeof value !== 'boolean') return { ok: false, error: `« ${field.label} » doit valoir oui ou non.` };
			return { ok: true, value: field.type === 'flag' ? (value ? 1 : 0) : value };
		case 'select':
			if (!field.options.some((o) => o.value === value)) {
				return { ok: false, error: `« ${field.label} » : valeur inconnue.` };
			}
			return { ok: true, value: value as string };
		case 'dragons':
			if (typeof value !== 'string' || value.length > MAX_TEXT) {
				return { ok: false, error: `« ${field.label} » : valeur invalide.` };
			}
			return { ok: true, value: normalizeDescent(value) };
		case 'text': {
			if (typeof value !== 'string') return { ok: false, error: `« ${field.label} » : valeur invalide.` };
			const text = value.trim();
			if (text.length > MAX_TEXT) return { ok: false, error: `« ${field.label} » dépasse ${MAX_TEXT} caractères.` };
			if (!text && field.required) return { ok: false, error: `« ${field.label} » ne peut pas être vide.` };
			return { ok: true, value: text || (field.nullable ? null : '') };
		}
	}
}

/** Une modification envoyée au serveur. `before` sert à vérifier que personne n'a changé la fiche entre-temps. */
export interface BulkChange {
	id: number;
	field: string;
	before: BulkValue;
	after: BulkValue;
}

/** Plafond d'une seule sauvegarde : 12 colonnes pour un peu plus de 400 personnages. */
export const MAX_BULK_CHANGES = 5000;
