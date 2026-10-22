// Numérotation des jetons invoqués plusieurs fois : « Serena [1] », « Serena [2] »…

const NUMBERED = /^(.*?)\s*\[(\d+)\]$/;

/** Nom sans son numéro : « Loup [3] » → « Loup ». */
export function baseName(name: string): string {
	return name.match(NUMBERED)?.[1] ?? name;
}

/**
 * Nom du nouveau jeton parmi ceux déjà présents. Le premier garde son nom tant qu'il est seul ;
 * dès le deuxième, le premier devient « [1] » (`renameFirst`) et le nouveau prend le numéro suivant.
 */
export function instanceName(name: string, existing: string[]): { name: string; renameFirst: boolean } {
	const base = baseName(name);
	let plain = false;
	const used = new Set<number>();
	for (const other of existing) {
		if (other === base) plain = true;
		else {
			const m = other.match(NUMBERED);
			if (m && m[1] === base) used.add(Number(m[2]));
		}
	}
	if (!plain && used.size === 0) return { name: base, renameFirst: false };

	const renameFirst = plain && !used.has(1);
	if (renameFirst) used.add(1);
	return { name: `${base} [${Math.max(0, ...used) + 1}]`, renameFirst };
}
