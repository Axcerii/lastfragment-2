import { computeSheet, type ArmorPiece, type PassiveEffect, type Sheet } from './bonus';
import {
	CONTAINER_KEYS,
	containerCapacity,
	isBackpack,
	totalWeight,
	type ContainerKey
} from './inventory';
import type { StatBlock } from './stats';

interface Entry {
	container: ContainerKey;
	equipped: boolean;
	quantity: number;
	slot: string | null;
	bonus: ArmorPiece | null;
	item: { name: string; weight: number };
}

/** Stats finales d'une fiche : base + pièces équipées + passifs. */
export function sheetOf(base: StatBlock, inventory: Entry[], passives: PassiveEffect[]): Sheet {
	const pieces = inventory.filter((e) => e.equipped && e.bonus).map((e) => e.bonus!);
	return computeSheet(base, pieces, passives);
}

export interface ContainerLoad {
	weight: number;
	capacity: number;
	over: boolean;
}

/** Charge et capacité de chaque conteneur. */
export function containerLoads(
	base: StatBlock,
	inventory: Entry[]
): Record<ContainerKey, ContainerLoad> {
	const hasBackpack = inventory.some(
		(e) => e.equipped && e.slot === 'Torse' && isBackpack(e.item.name)
	);
	return Object.fromEntries(
		CONTAINER_KEYS.map((key) => {
			const weight = totalWeight(inventory.filter((e) => e.container === key));
			const capacity = containerCapacity(key, base.strength, hasBackpack);
			return [key, { weight, capacity, over: weight > capacity }];
		})
	) as Record<ContainerKey, ContainerLoad>;
}
