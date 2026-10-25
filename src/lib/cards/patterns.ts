// Motifs dessinés des cartes (verre brisé, paillettes, dégâts d'usure), calculés à partir d'une
// graine : un même exemplaire a toujours les mêmes rayures, d'un affichage à l'autre.
// Ce sont des effets visuels, pas un tirage : `Math.random` n'intervient nulle part.

/** Générateur pseudo-aléatoire déterministe (mulberry32), valeurs dans [0, 1[. */
export function seeded(seed: number) {
	let a = (seed * 2654435761) >>> 0 || 1;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export interface Shard {
	/** Sommets en % de la boîte. */
	points: [number, number][];
	/** Intensité du reflet propre à l'éclat, de 0 à 1. */
	shine: number;
}

/**
 * Verre étoilé autour d'un point d'impact : des fissures qui rayonnent, coupées par un ou deux
 * anneaux. Sert au reflet « Éclat » et à l'ouverture des boosters.
 */
export function shatter(seed: number, rays = 11, rings = [18, 42], center?: [number, number]): Shard[] {
	const rand = seeded(seed);
	const [cx, cy] = center ?? [35 + rand() * 30, 30 + rand() * 30];
	const angles: number[] = [];
	for (let i = 0; i < rays; i++) angles.push(((i + 0.25 + rand() * 0.5) / rays) * Math.PI * 2);
	const radii = [0, ...rings.map((r) => r * (0.8 + rand() * 0.4)), 150];
	const at = (angle: number, radius: number, wobble: number): [number, number] => [
		r1(cx + Math.cos(angle) * radius * wobble),
		r1(cy + Math.sin(angle) * radius * wobble)
	];

	const shards: Shard[] = [];
	for (let ring = 0; ring < radii.length - 1; ring++) {
		for (let i = 0; i < rays; i++) {
			const a = angles[i];
			const b = angles[(i + 1) % rays] + (i === rays - 1 ? Math.PI * 2 : 0);
			const inner = radii[ring];
			const outer = radii[ring + 1];
			const w = () => 0.9 + rand() * 0.2;
			const points: [number, number][] =
				inner === 0 ? [[cx, cy], at(a, outer, w()), at(b, outer, w())] : [at(a, inner, 1), at(a, outer, w()), at(b, outer, w()), at(b, inner, 1)];
			shards.push({ points, shine: rand() });
		}
	}
	return shards;
}

const svgUri = (body: string, w: number, h: number) =>
	`url("data:image/svg+xml,${encodeURIComponent(
		`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}' preserveAspectRatio='none'>${body}</svg>`
	)}")`;

/** Masque du reflet « Éclat » : chaque éclat laisse passer plus ou moins de lumière. */
export function shardMask(seed: number): string {
	const body = shatter(seed)
		.map((s) => `<polygon points='${s.points.map((p) => p.join(',')).join(' ')}' fill='#fff' fill-opacity='${(0.15 + s.shine * 0.85).toFixed(2)}'/>`)
		.join('');
	return svgUri(body, 100, 100);
}

/** Fissures du verre, en traits clairs. */
export function shardLines(seed: number): string {
	const body = shatter(seed)
		.map((s) => `<polygon points='${s.points.map((p) => p.join(',')).join(' ')}' fill='none' stroke='#fff' stroke-opacity='0.55' stroke-width='0.35' vector-effect='non-scaling-stroke'/>`)
		.join('');
	return svgUri(body, 100, 100);
}

/** Paillettes du reflet « Prisme ». */
export function glitter(seed: number, count = 160): string {
	const rand = seeded(seed);
	let body = '';
	for (let i = 0; i < count; i++) {
		const size = 0.15 + rand() * 0.55;
		body += `<circle cx='${r1(rand() * 100)}' cy='${r1(rand() * 140)}' r='${size.toFixed(2)}' fill='#fff' fill-opacity='${(0.3 + rand() * 0.7).toFixed(2)}'/>`;
		if (rand() > 0.85) {
			const x = r1(rand() * 100);
			const y = r1(rand() * 140);
			body += `<path d='M${x - 1.6} ${y}h3.2M${x} ${y - 1.6}v3.2' stroke='#fff' stroke-width='0.25' stroke-opacity='0.9'/>`;
		}
	}
	return svgUri(body, 100, 140);
}

// ─── Dégâts : plis, coins, déchirures ────────────────────────────────────
//
// Contrairement aux rayures, ce sont des dégâts du carton : ils traversent la carte, donc on les
// retrouve au même endroit au verso (vu en miroir). Seuils d'usure :
//   0,38  un coin corné          0,45  un pli         0,62  deux plis      0,75  trois coins cornés
//   0,78  une déchirure          0,85  un coin replié  0,92  deux déchirures  0,93  un morceau arraché

type Point = [number, number];

export interface Damage {
	/** Plis à travers la carte (tracés SVG). */
	folds: string[];
	/** Coins cornés : le pli et le triangle blanchi qu'il délimite. */
	corners: { line: string; shade: string }[];
	/** Coin replié sur le recto : le rabat (dos de la carte) et son ombre. Absent au verso. */
	flap: { flap: string; shadow: string } | null;
	tears: { d: string; width: number }[];
	/** Bord du morceau arraché, en fibres claires. */
	notchEdge: string | null;
	/** Zones retirées de la carte (coin replié, morceau arraché), pour le masque. */
	cuts: string[];
	/** Encre craquelée le long des plis et des coins cornés : éclats clairs (un seul tracé). */
	cracks: string;
	/** Fils de carton qui dépassent des déchirures et du morceau arraché (un seul tracé). */
	fibers: string;
}

const W = 63;
const H = 88;
const CORNERS: { at: Point; dir: Point }[] = [
	{ at: [0, 0], dir: [1, 1] },
	{ at: [W, 0], dir: [-1, 1] },
	{ at: [W, H], dir: [-1, -1] },
	{ at: [0, H], dir: [1, -1] }
];

/** Points le long d'une courbe de Bézier quadratique (ou d'un segment si `c` est au milieu). */
function sample(a: Point, c: Point, b: Point, n: number): Point[] {
	const out: Point[] = [];
	for (let i = 0; i <= n; i++) {
		const t = i / n;
		const u = 1 - t;
		out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]);
	}
	return out;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function cardDamage(seed: number, wear: number, mirror = false): Damage {
	const rand = seeded(seed * 13 + 5);
	// Les détails (éclats, fibres) ont leur propre tirage : ajoutés après coup, ils ne déplacent pas
	// les plis et les déchirures des exemplaires existants.
	const detail = seeded(seed * 17 + 11);
	const p = ([x, y]: Point): string => `${r1(mirror ? W - x : x)} ${r1(y)}`;
	const q = ([x, y]: Point): string => `${r2(mirror ? W - x : x)} ${r2(y)}`;
	const poly = (points: Point[]) => `M${points.map(p).join('L')}Z`;
	const damage: Damage = { folds: [], corners: [], flap: null, tears: [], notchEdge: null, cuts: [], cracks: '', fibers: '' };

	/**
	 * Éclats d'encre le long d'un pli : par grappes (là où le pli a le plus travaillé), de longueurs
	 * très variables, chacun brisé en deux ou trois morceaux de travers, jamais en pointillé régulier.
	 */
	function crack(points: Point[], density: number) {
		const phase = detail() * 10;
		let travelled = 0;
		for (let i = 1; i < points.length; i++) {
			const [x0, y0] = points[i - 1];
			const [x1, y1] = points[i];
			const length = Math.hypot(x1 - x0, y1 - y0);
			const ux = (x1 - x0) / length;
			const uy = (y1 - y0) / length;
			for (let t = 0; t < length; t += 0.18 + detail() * 0.5) {
				const cluster = 0.15 + 0.85 * Math.abs(Math.sin((travelled + t) * 0.28 + phase));
				if (detail() > density * cluster) continue;
				let sx = x0 + ux * t - uy * (detail() - 0.5) * 0.4;
				let sy = y0 + uy * t + ux * (detail() - 0.5) * 0.4;
				let path = `M${q([sx, sy])}`;
				const pieces = 1 + Math.floor(detail() * 3);
				for (let k = 0; k < pieces; k++) {
					const l = 0.08 + detail() ** 2 * 0.7;
					const tilt = (detail() - 0.5) * 1.1;
					sx += (ux - uy * tilt) * l;
					sy += (uy + ux * tilt) * l;
					path += `L${q([sx, sy])}`;
				}
				damage.cracks += path;
			}
			travelled += length;
		}
	}

	/** Fils de carton des deux côtés d'une déchirure : courts, de biais, plus nombreux près du bord. */
	function fray(points: Point[], width: number) {
		for (let i = 1; i < points.length; i++) {
			const [x0, y0] = points[i - 1];
			const [x1, y1] = points[i];
			const length = Math.hypot(x1 - x0, y1 - y0);
			const ux = (x1 - x0) / length;
			const uy = (y1 - y0) / length;
			for (let t = 0; t < length; t += 0.22) {
				for (const side of [-1, 1]) {
					if (detail() < 0.35) continue;
					const nx = -uy * side;
					const ny = ux * side;
					const sx = x0 + ux * t + nx * width * 0.5;
					const sy = y0 + uy * t + ny * width * 0.5;
					const angle = Math.atan2(ny, nx) + (detail() - 0.5) * 1.4;
					const l = 0.15 + detail() * 0.75;
					damage.fibers += `M${q([sx, sy])}L${q([sx + Math.cos(angle) * l, sy + Math.sin(angle) * l])}`;
				}
			}
		}
	}

	// Plis : d'un bord à l'autre, le plus souvent en travers, parfois en biais.
	const folds = wear >= 0.8 ? 3 : wear >= 0.62 ? 2 : wear >= 0.45 ? 1 : 0;
	for (let i = 0; i < folds; i++) {
		if (rand() < 0.7) {
			const y1 = 12 + rand() * 64;
			const y2 = y1 + (rand() - 0.5) * 24;
			const bend = (rand() - 0.5) * 3;
			damage.folds.push(`M${p([-1, y1])}Q${p([W / 2, (y1 + y2) / 2 + bend])} ${p([W + 1, y2])}`);
			crack(sample([-1, y1], [W / 2, (y1 + y2) / 2 + bend], [W + 1, y2], 40), 0.55);
		} else {
			const x1 = 6 + rand() * 51;
			const x2 = x1 + (rand() - 0.5) * 30;
			damage.folds.push(`M${p([x1, -1])}L${p([x2, H + 1])}`);
			crack(sample([x1, -1], [(x1 + x2) / 2, H / 2], [x2, H + 1], 40), 0.55);
		}
	}

	// Coins : l'ordre est tiré une fois, le coin replié prend le premier.
	const order = [0, 1, 2, 3].sort(() => rand() - 0.5);
	const cornered = wear >= 0.75 ? 3 : wear >= 0.55 ? 2 : wear >= 0.38 ? 1 : 0;
	const dogEar = wear >= 0.85;
	for (let i = dogEar ? 1 : 0; i < cornered + (dogEar ? 1 : 0) && i < 4; i++) {
		const { at, dir } = CORNERS[order[i]];
		const s = 3.5 + rand() * 5;
		const a: Point = [at[0] + s * dir[0], at[1]];
		const b: Point = [at[0], at[1] + s * dir[1]];
		damage.corners.push({ line: `M${p(a)}L${p(b)}`, shade: poly([at, a, b]) });
		crack(sample(a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], b, 8), 0.4);
	}

	if (dogEar) {
		const { at, dir } = CORNERS[order[0]];
		const s = 6 + rand() * 6;
		const a: Point = [at[0] + s * dir[0], at[1]];
		const b: Point = [at[0], at[1] + s * dir[1]];
		const tip: Point = [at[0] + s * dir[0], at[1] + s * dir[1]];
		const out: Point = [at[0] - dir[0] * 2, at[1] - dir[1] * 2];
		damage.cuts.push(poly([out, [a[0], at[1] - dir[1] * 2], a, b, [at[0] - dir[0] * 2, b[1]]]));
		if (!mirror) {
			const shadowTip: Point = [tip[0] + dir[0] * 1.2, tip[1] + dir[1] * 1.2];
			damage.flap = { flap: poly([a, tip, b]), shadow: poly([a, shadowTip, b]) };
		}
	}

	// Déchirures : partent d'un bord et s'enfoncent en zigzag.
	const tears = wear >= 0.92 ? 2 : wear >= 0.78 ? 1 : 0;
	for (let i = 0; i < tears; i++) {
		const edge = Math.floor(rand() * 4);
		const start: Point =
			edge === 0 ? [8 + rand() * 47, 0] : edge === 1 ? [8 + rand() * 47, H] : edge === 2 ? [0, 10 + rand() * 68] : [W, 10 + rand() * 68];
		const inward: Point = edge === 0 ? [0, 1] : edge === 1 ? [0, -1] : edge === 2 ? [1, 0] : [-1, 0];
		const base = Math.atan2(inward[1], inward[0]) + (rand() - 0.5) * 0.9;
		const points: Point[] = [start];
		let [x, y] = start;
		const steps = 5 + Math.floor(rand() * 5);
		for (let k = 0; k < steps; k++) {
			const angle = base + (rand() - 0.5) * 1.3;
			const length = 1.4 + rand() * 2.2;
			x += Math.cos(angle) * length;
			y += Math.sin(angle) * length;
			points.push([x, y]);
		}
		const width = 0.35 + rand() * 0.35;
		damage.tears.push({ d: `M${points.map(p).join('L')}`, width });
		fray(points, width);

		// La première déchirure des cartes les plus abîmées a perdu un morceau sur le bord.
		if (i === 0 && wear >= 0.93) {
			const tangent: Point = [Math.abs(inward[1]), Math.abs(inward[0])];
			const half = 2 + rand() * 2.5;
			const depth = 2 + rand() * 2.5;
			const at = (t: number, n: number): Point => [
				start[0] + tangent[0] * t + inward[0] * n,
				start[1] + tangent[1] * t + inward[1] * n
			];
			const inner: Point[] = [];
			for (let k = 0; k <= 4; k++) inner.push(at(-half + (k * 2 * half) / 4, k === 0 || k === 4 ? 0 : depth * (0.5 + rand() * 0.7)));
			damage.cuts.push(poly([at(-half, -2), ...inner, at(half, -2)]));
			damage.notchEdge = `M${inner.map(p).join('L')}`;
			fray(inner, 0.2);
		}
	}
	return damage;
}

/** Masque CSS qui retire de la carte le coin replié et le morceau arraché, ou null. */
export function damageMask(damage: Damage): string | null {
	if (damage.cuts.length === 0) return null;
	const body = `<path fill='#fff' fill-rule='evenodd' d='M-2 -2H${W + 2}V${H + 2}H-2Z${damage.cuts.join('')}'/>`;
	return svgUri(body, W, H);
}
