import { Prisma } from '@prisma/client';
import { error } from '@sveltejs/kit';
import { VIRTUAL_TYPES, type Field, type Option } from '$lib/admin/fields';
import { pairKey } from '$lib/game/badges';
import { parseEffects } from '$lib/game/bonus';
import { STATS, toStatBlock } from '$lib/game/stats';
import { hashPassword } from '../auth';
import { prisma } from '../prisma';
import { readFlag, readStats, saveStats } from '../stats';
import { saveImage, UploadError } from '../uploads';
import { findResource, type Resource } from './resources';

// Le back-office est générique : il lit et écrit n'importe quel modèle d'après sa description
// dans resources.ts. Les accès à Prisma passent donc par des noms de modèles dynamiques.
type Row = Record<string, any>;

const delegate = (resource: Resource) => (prisma as any)[resource.model];

export function getResource(slug: string): Resource {
	const resource = findResource(slug);
	if (!resource) error(404, 'Ressource inconnue.');
	return resource;
}

const columns = (resource: Resource) =>
	resource.fields.filter((f) => !VIRTUAL_TYPES.includes(f.type));

/** Relations à charger : celles du titre, celles des champs relation, et les tables des champs virtuels. */
function includeFor(resource: Resource): Row | undefined {
	const include: Row = { ...resource.include };
	for (const field of resource.fields) {
		if (field.type === 'relation') {
			const target = getResource(field.resource);
			include[field.relation] = target.include ? { include: target.include } : true;
		}
		if (field.type === 'stats') include.statistics = true;
		if (field.type === 'armor') include.armors = true;
		if (field.type === 'armorOverride') include.armorInPlayer = true;
	}
	return Object.keys(include).length ? include : undefined;
}

/** Vrai si la colonne Prisma accepte `null`. */
function isNullable(resource: Resource, column: string): boolean {
	const model = Prisma.dmmf.datamodel.models.find(
		(m) => m.name.toLowerCase() === resource.model.toLowerCase()
	);
	return model?.fields.find((f) => f.name === column)?.isRequired === false;
}

/** Valeur d'une cellule du tableau, prête à afficher. */
function cell(field: Field, record: Row): string | number | boolean | null {
	const value = record[field.name];
	switch (field.type) {
		case 'flag':
		case 'boolean':
			return Boolean(value);
		case 'select':
			return field.options.find((o) => o.value === value)?.label ?? value ?? null;
		case 'relation': {
			const related = record[field.relation];
			return related ? getResource(field.resource).title(related) : (field.nullLabel ?? null);
		}
		case 'effects':
			return parseEffects(value, record[field.valuesField], field.bareAs)
				.map((e) => `${STATS[e.stat].abbr} ${e.kind === 'mult' ? '×' : e.value > 0 ? '+' : ''}${e.value}`)
				.join(' · ');
		default:
			return value ?? null;
	}
}

export async function listRecords(resource: Resource) {
	const records: Row[] = await delegate(resource).findMany({
		include: includeFor(resource),
		orderBy: resource.orderBy
	});
	const listed = resource.fields.filter((f) => f.list);

	return {
		columns: listed.map((f) => ({ name: f.name, label: f.label, type: f.type })),
		rows: records.map((record) => ({
			id: record.id as number,
			title: resource.title(record),
			cells: Object.fromEntries(listed.map((f) => [f.name, cell(f, record)]))
		}))
	};
}

/** Enregistrement à éditer, avec les valeurs des champs virtuels. `null` pour une création. */
export async function getRecord(resource: Resource, id: number | null) {
	if (id === null) return null;
	const record: Row | null = await delegate(resource).findUnique({
		where: { id },
		include: includeFor(resource)
	});
	if (!record) error(404, `Ce ${resource.singular} n'existe pas.`);

	const values: Row = { id: record.id };
	for (const field of resource.fields) {
		switch (field.type) {
			case 'password':
				break; // Le hash ne quitte jamais le serveur.
			case 'effects':
				values[field.name] = record[field.name];
				values[field.valuesField] = record[field.valuesField];
				if (field.inactiveField) values[field.inactiveField] = record[field.inactiveField];
				break;
			case 'stats':
				values[field.name] = toStatBlock(record.statistics);
				break;
			case 'armor': {
				const armor = record.armors?.[0];
				values[field.name] = { statistics: armor?.statistics ?? '', values: armor?.values ?? '' };
				break;
			}
			case 'armorOverride': {
				const custom = record.armorInPlayer?.[0];
				values[field.name] = {
					statistics: custom?.statistics ?? '',
					values: custom?.values ?? '',
					descriptionAdd: custom?.descriptionAdd ?? '',
					notes: custom?.notes ?? ''
				};
				break;
			}
			default:
				values[field.name] = record[field.name];
		}
	}
	return { title: resource.title(record), values };
}

/** Listes de choix des champs relation. */
export async function relationOptions(resource: Resource): Promise<Record<string, Option[]>> {
	const fields = resource.fields.filter((f) => f.type === 'relation');
	const lists = await Promise.all(
		fields.map(async (field) => {
			const target = getResource(field.resource);
			const records: Row[] = await delegate(target).findMany({
				where: field.filter,
				include: target.include,
				orderBy: target.orderBy
			});
			return records.map((r) => ({ value: r.id as number, label: target.title(r) }));
		})
	);
	return Object.fromEntries(fields.map((f, i) => [f.name, lists[i]]));
}

export class FormError extends Error {}

const text = (form: FormData, name: string) => String(form.get(name) ?? '').trim();

/** Convertit le formulaire en données Prisma pour les colonnes de la ressource. */
async function readColumns(resource: Resource, form: FormData, creating: boolean): Promise<Row> {
	const data: Row = {};

	for (const field of columns(resource)) {
		const raw = text(form, field.name);
		const missing = () => new FormError(`« ${field.label} » est obligatoire.`);
		const empty = () => (isNullable(resource, field.name) ? null : '');

		switch (field.type) {
			case 'flag':
				data[field.name] = readFlag(form, field.name) ? 1 : 0;
				break;
			case 'boolean':
				data[field.name] = readFlag(form, field.name);
				break;
			case 'number': {
				if (!raw && field.required) throw missing();
				const value = Math.round(Number(raw || 0));
				if (!Number.isFinite(value)) throw new FormError(`« ${field.label} » doit être un nombre.`);
				data[field.name] = value;
				break;
			}
			case 'select': {
				const chosen = field.options.find((o) => String(o.value) === raw);
				if (!chosen) throw missing();
				data[field.name] = chosen.value;
				break;
			}
			case 'relation':
				if (!raw && !field.nullLabel) throw missing();
				data[field.name] = raw ? Number(raw) : null;
				break;
			case 'password':
				if (raw) data[field.name] = await hashPassword(String(form.get(field.name)));
				else if (creating) throw missing();
				break;
			case 'image': {
				const file = form.get(field.name);
				if (file instanceof File && file.size > 0) {
					data[field.name] = await saveImage(file, field.folder);
				} else if (readFlag(form, `${field.name}_remove`) && !field.required) {
					data[field.name] = null;
				} else if (creating && field.required) {
					throw missing();
				}
				break;
			}
			case 'effects':
				data[field.name] = raw;
				data[field.valuesField] = text(form, field.valuesField);
				if (field.inactiveField) data[field.inactiveField] = text(form, field.inactiveField) || null;
				break;
			case 'badgePair': {
				const [a, b] = [text(form, `${field.name}_1`), text(form, `${field.name}_2`)];
				if (!a || !b) throw missing();
				data[field.name] = pairKey(a, b);
				break;
			}
			default:
				if (!raw && field.required) throw missing();
				data[field.name] = raw || empty();
		}
	}

	if (creating) Object.assign(data, resource.defaults);
	resource.normalize?.(data);
	return data;
}

/** Enregistre les champs virtuels dans leurs tables liées. */
async function saveVirtual(resource: Resource, id: number, form: FormData, record: Row) {
	for (const field of resource.fields) {
		if (field.type === 'stats') {
			const owner = field.owner === 'characterId' ? { characterId: id } : { monsterId: id };
			await saveStats(owner, readStats(form));
		}

		if (field.type === 'armor') {
			const bonus = { statistics: text(form, 'armor_statistics'), values: text(form, 'armor_values') };
			const existing = await prisma.armor.findFirst({ where: { itemId: id } });
			if (existing) {
				await prisma.armor.update({ where: { id: existing.id }, data: { ...bonus, name: record.name } });
			} else if (bonus.statistics) {
				await prisma.armor.create({ data: { ...bonus, name: record.name, itemId: id } });
			}
		}

		if (field.type === 'armorOverride') {
			const custom = {
				statistics: text(form, 'override_statistics'),
				values: text(form, 'override_values'),
				descriptionAdd: text(form, 'override_descriptionAdd'),
				notes: text(form, 'override_notes')
			};
			await prisma.armorInPlayer.deleteMany({ where: { itemInPlayerId: id } });
			if (Object.values(custom).some(Boolean)) {
				// Une particularité se rattache au modèle d'armure de l'objet, créé vide au besoin.
				const armor =
					(await prisma.armor.findFirst({ where: { itemId: record.itemId } })) ??
					(await prisma.armor.create({
						data: { name: '', statistics: '', values: '', itemId: record.itemId }
					}));
				await prisma.armorInPlayer.create({
					data: {
						...custom,
						// Sans bonus propre, l'exemplaire garde celui du modèle.
						statistics: custom.statistics || armor.statistics,
						values: custom.statistics ? custom.values : armor.values,
						itemInPlayerId: id,
						armorId: armor.id
					}
				});
			}
		}
	}
}

/** Fusionner deux badges consomme un badge disponible de chaque type. */
async function consumeBadges(record: Row) {
	for (const badge of [record.badge1, record.badge2]) {
		const free = await prisma.playerBadge.findFirst({
			where: { playerId: record.playerId, badge, used: false }
		});
		if (free) await prisma.playerBadge.update({ where: { id: free.id }, data: { used: true } });
	}
}

/** Crée (`id` nul) ou met à jour un enregistrement. Renvoie son identifiant. */
export async function saveRecord(resource: Resource, id: number | null, form: FormData) {
	const data = await readColumns(resource, form, id === null);
	const record: Row =
		id === null
			? await delegate(resource).create({ data })
			: await delegate(resource).update({ where: { id }, data });

	await saveVirtual(resource, record.id, form, record);
	if (id === null && resource.model === 'badgeFusion') await consumeBadges(record);
	return record.id as number;
}

export async function deleteRecord(resource: Resource, id: number) {
	await delegate(resource).delete({ where: { id } });
}

/** Bascule un interrupteur directement depuis le tableau. */
export async function toggleField(resource: Resource, id: number, name: string) {
	const field = resource.fields.find((f) => f.name === name);
	if (!field || (field.type !== 'flag' && field.type !== 'boolean')) error(400, 'Champ invalide.');

	const record: Row = await delegate(resource).findUniqueOrThrow({ where: { id } });
	const data: Row = { ...record, [name]: field.type === 'flag' ? (record[name] ? 0 : 1) : !record[name] };
	resource.normalize?.(data);
	await delegate(resource).update({ where: { id }, data: { [name]: data[name] } });
}

/** Message lisible pour une erreur de base de données courante. */
export function describeError(e: unknown): string | null {
	if (e instanceof FormError || e instanceof UploadError) return e.message;
	if (e instanceof Prisma.PrismaClientKnownRequestError) {
		if (e.code === 'P2002') return 'Cette valeur est déjà utilisée par un autre enregistrement.';
		if (e.code === 'P2003') return 'Impossible : cet enregistrement est encore utilisé ailleurs.';
	}
	return null;
}
