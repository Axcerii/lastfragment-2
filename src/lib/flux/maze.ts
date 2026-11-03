// Traits néon abstraits, comme des bouts de labyrinthe : des marches au hasard à angle droit,
// tirées à chaque visite pour que le fond ne se répète jamais.

export type MazeOptions = {
	width: number;
	height: number;
	/** Pas de la grille sur laquelle les traits tournent */
	step: number;
	walks: number;
	/** Nombre de virages par trait */
	turns: [number, number];
	/** Point de départ de chaque trait */
	start: (random: () => number) => { x: number; y: number };
	/** Zone que les traits évitent (le portail lui-même) */
	avoid?: { x: number; y: number; w: number; h: number };
};

const DIRS = [
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1]
] as const;

/** Chemins SVG (attribut `d`) des traits du labyrinthe. */
export function maze(options: MazeOptions, random: () => number = Math.random): string[] {
	const { width, height, step, walks, turns, start, avoid } = options;
	const snap = (v: number) => Math.round(v / step) * step;
	const blocked = (x: number, y: number) =>
		x < 0 ||
		y < 0 ||
		x > width ||
		y > height ||
		(!!avoid && x > avoid.x && x < avoid.x + avoid.w && y > avoid.y && y < avoid.y + avoid.h);

	const paths: string[] = [];
	for (let w = 0; w < walks; w++) {
		const origin = start(random);
		let x = snap(origin.x);
		let y = snap(origin.y);
		let d = `M${x} ${y}`;
		let dir = DIRS[Math.floor(random() * 4)];
		const count = turns[0] + Math.floor(random() * (turns[1] - turns[0] + 1));
		for (let t = 0; t < count; t++) {
			// Tourner à angle droit, jamais faire demi-tour.
			const options = DIRS.filter(([dx, dy]) => dx !== -dir[0] || dy !== -dir[1]);
			const next = options[Math.floor(random() * options.length)];
			const length = step * (1 + Math.floor(random() * 4));
			const nx = x + next[0] * length;
			const ny = y + next[1] * length;
			if (blocked(nx, ny)) continue;
			dir = next;
			x = nx;
			y = ny;
			d += next[0] ? ` H${x}` : ` V${y}`;
		}
		if (d.includes(' ')) paths.push(d);
	}
	return paths;
}

/**
 * Traits qui relient un bord à l'autre d'une bande (de gauche à droite, ou de haut en bas si
 * `vertical`), en zigzag à angle droit.
 */
export function bridge(
	length: number,
	thickness: number,
	step: number,
	count: number,
	vertical = false,
	random: () => number = Math.random
): string[] {
	const paths: string[] = [];
	for (let i = 0; i < count; i++) {
		let along = 0;
		let across = step + Math.floor(random() * ((thickness - 2 * step) / step)) * step;
		const point = () => (vertical ? `${across} ${along}` : `${along} ${across}`);
		let d = `M${point()}`;
		while (along < length) {
			along = Math.min(length, along + step * (1 + Math.floor(random() * 3)));
			d += ` L${point()}`;
			if (along < length && random() < 0.6) {
				const jog = step * (random() < 0.5 ? -1 : 1) * (1 + Math.floor(random() * 2));
				across = Math.max(step, Math.min(thickness - step, across + jog));
				d += ` L${point()}`;
			}
		}
		paths.push(d);
	}
	return paths;
}
