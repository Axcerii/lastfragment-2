import { error, fail, type RequestEvent } from '@sveltejs/kit';
import {
	CONTAINER_KEYS,
	CONTAINERS,
	armorSlot,
	toContainer,
	type ContainerKey
} from '$lib/game/inventory';
import { portrait } from '$lib/game/labels';
import { toStatBlock } from '$lib/game/stats';
import { requireUser } from './auth';
import { prisma } from './prisma';

const entryInclude = {
	item: { include: { armors: true } },
	armorInPlayer: true,
	foodsInBags: { include: { food: true } }
} as const;

type RawEntry = Awaited<
	ReturnType<typeof prisma.itemInPlayer.findMany<{ include: typeof entryInclude }>>
>[number];

function toEntry(raw: RawEntry) {
	// Le bonus propre à cet exemplaire, s'il existe, remplace celui du modèle d'armure.
	const custom = raw.armorInPlayer[0];
	const armor = custom ?? raw.item.armors[0];
	return {
		id: raw.id,
		quantity: raw.quantity,
		container: toContainer(raw.localisation),
		equipped: raw.equipped,
		slot: armorSlot(raw.item.category),
		bonus: armor ? { statistics: armor.statistics, values: armor.values } : null,
		note: custom?.descriptionAdd || null,
		item: {
			id: raw.item.id,
			name: raw.item.name,
			category: raw.item.category as string,
			rarity: raw.item.rarity,
			weight: raw.item.weight,
			description: raw.item.description,
			icon: raw.item.icon
		},
		foods: raw.foodsInBags.map((f) => ({
			name: f.food.name,
			type: f.food.type as string,
			quantity: f.quantity
		}))
	};
}

export type InventoryEntry = ReturnType<typeof toEntry>;

export async function getGameState() {
	return prisma.gameState.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
}

/** Conteneurs ouverts par le MJ. */
export function openContainers(
	state: Awaited<ReturnType<typeof getGameState>>
): Record<ContainerKey, boolean> {
	return {
		main: state.mainOpen,
		sac: state.bagOpen,
		coffre: state.chestOpen,
		cheval: state.horseOpen,
		commun: state.commonOpen
	};
}

/** Tout ce qu'il faut pour afficher la fiche de jeu d'un joueur. */
export async function loadSheet(playerId: number) {
	const [player, common, skills, badgeSkills, state] = await Promise.all([
		prisma.player.findUnique({
			where: { id: playerId },
			include: {
				character: { include: { statistics: true, passives: { orderBy: { name: 'asc' } } } },
				itemsInPlayer: { include: entryInclude },
				badges: true,
				badgesFusions: true
			}
		}),
		prisma.itemInPlayer.findMany({ where: { playerId: null }, include: entryInclude }),
		prisma.skill.findMany({ orderBy: { level: 'asc' } }),
		prisma.badge.findMany(),
		getGameState()
	]);

	if (!player) error(404, 'Joueur introuvable.');

	const { character } = player;
	const byWeight = (a: InventoryEntry, b: InventoryEntry) =>
		b.item.weight - a.item.weight || a.item.name.localeCompare(b.item.name);

	return {
		player: { id: player.id, login: player.login, money: player.money },
		character: character && {
			id: character.id,
			name: character.name,
			title: character.title,
			image: portrait(character.image),
			country: character.country as string,
			race: character.race as string,
			flux: character.flux,
			job: character.job,
			dragon: character.dragon,
			description: character.description
		},
		stats: toStatBlock(character?.statistics),
		passives: (character?.passives ?? []).map((p) => ({
			id: p.id,
			name: p.name,
			description: p.description,
			active: p.active,
			statistics: p.statistics,
			maths: p.maths,
			inactiveMaths: p.inactiveMaths
		})),
		inventory: [
			...player.itemsInPlayer.map(toEntry),
			// Un objet sans propriétaire est dans le coffre commun, quelle que soit sa localisation enregistrée.
			...common.map((raw) => ({ ...toEntry(raw), container: 'commun' as const }))
		].sort(byWeight),
		skills: skills.map((s) => ({
			id: s.id,
			stat: s.statistics as string,
			name: s.name,
			description: s.description,
			level: s.level
		})),
		badges: player.badges.map((b) => ({ id: b.id, badge: b.badge as string, used: b.used })),
		fusions: player.badgesFusions.map((f) => ({
			id: f.id,
			badge1: f.badge1 as string,
			badge2: f.badge2 as string
		})),
		badgeSkills: badgeSkills.map((b) => ({
			id: b.id,
			badges: b.badges,
			name: b.name,
			description: b.description
		})),
		access: openContainers(state)
	};
}

export type SheetData = Awaited<ReturnType<typeof loadSheet>>;

/**
 * Actions de la fiche de jeu. `target` désigne le joueur dont on modifie la fiche :
 * soi-même sur /profil, n'importe qui pour le MJ.
 */
export function sheetActions(target: (event: RequestEvent) => number) {
	async function context(event: RequestEvent) {
		const user = requireUser(event.locals);
		const playerId = target(event);
		if (playerId !== user.id && !user.isAdmin) error(403, 'Cette fiche ne vous appartient pas.');
		return { user, playerId, form: await event.request.formData() };
	}

	return {
		/** Active ou désactive un passif du personnage. */
		passive: async (event: RequestEvent) => {
			const { playerId, form } = await context(event);
			const player = await prisma.player.findUnique({
				where: { id: playerId },
				select: { characterId: true }
			});
			const { count } = await prisma.passive.updateMany({
				where: { id: Number(form.get('id')), characterId: player?.characterId ?? -1 },
				data: { active: form.get('active') === 'on' }
			});
			if (!count) return fail(404, { error: 'Passif introuvable.' });
		},

		/** Équipe ou retire une pièce d'armure portée. */
		equip: async (event: RequestEvent) => {
			const { playerId, form } = await context(event);
			const equip = form.get('equip') === 'on';
			const entry = await prisma.itemInPlayer.findFirst({
				where: { id: Number(form.get('id')), playerId },
				include: { item: true }
			});
			const slot = entry && armorSlot(entry.item.category);

			if (!entry || !slot) return fail(400, { error: 'Cet objet ne s’équipe pas.' });
			if (equip && toContainer(entry.localisation) !== 'main') {
				return fail(400, { error: 'Il faut avoir l’armure en main pour l’équiper.' });
			}

			await prisma.$transaction([
				// Une seule pièce par emplacement : celle qui occupait la place est retirée.
				prisma.itemInPlayer.updateMany({
					where: { playerId, equipped: true, item: { category: entry.item.category } },
					data: { equipped: false }
				}),
				prisma.itemInPlayer.update({ where: { id: entry.id }, data: { equipped: equip } })
			]);
		},

		/** Déplace des objets d'un conteneur à un autre (coffre commun compris). */
		transfer: async (event: RequestEvent) => {
			const { user, playerId, form } = await context(event);
			const from = String(form.get('from')) as ContainerKey;
			const to = String(form.get('to')) as ContainerKey;
			const ids = form.getAll('ids').map(Number);

			if (!CONTAINER_KEYS.includes(from) || !CONTAINER_KEYS.includes(to) || from === to) {
				return fail(400, { error: 'Choisis deux conteneurs différents.' });
			}
			if (ids.length === 0) return fail(400, { error: 'Aucun objet sélectionné.' });

			// Le MJ peut fermer un conteneur (pas de coffre en voyage) ; lui-même n'est pas limité.
			if (!user.isAdmin) {
				const access = openContainers(await getGameState());
				const closed = [from, to].find((key) => !access[key]);
				if (closed) {
					return fail(403, { error: `${CONTAINERS[closed].label} : fermé par le MJ pour le moment.` });
				}
			}

			const owner = from === 'commun' ? null : playerId;
			const entries = await prisma.itemInPlayer.findMany({
				where: { id: { in: ids }, playerId: owner },
				select: { id: true, localisation: true }
			});
			const movable = entries.filter((e) => owner === null || toContainer(e.localisation) === from);
			if (movable.length !== ids.length) {
				return fail(409, { error: 'Certains objets ne sont plus dans ce conteneur.' });
			}

			await prisma.itemInPlayer.updateMany({
				where: { id: { in: ids } },
				data: {
					localisation: to,
					// Un objet déposé dans le coffre commun n'appartient plus à personne.
					playerId: to === 'commun' ? null : playerId,
					// Une armure qui change de conteneur n'est plus portée.
					equipped: false
				}
			});
		}
	};
}
