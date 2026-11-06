// Base factice en mémoire pour les tests du jeu de cartes : seulement les requêtes Prisma utilisées
// par collection.ts, trades.ts, secrets.ts, admin.ts, manage.ts (numéros) et la page d'une carte.
// Les tests la branchent avec `vi.mock('$lib/server/prisma', …)` et remplissent `db` eux-mêmes.

type Row = Record<string, any>;

export const db = {
	players: [] as Row[],
	sets: [] as Row[],
	templates: [] as Row[],
	cards: [] as Row[],
	events: [] as Row[],
	trades: [] as Row[],
	tradeItems: [] as Row[],
	openings: [] as Row[],
	wallets: [] as Row[]
};

export function resetDb() {
	for (const list of Object.values(db)) list.length = 0;
}

// ─── Filtres « where » ───────────────────────────────────────────────────

function matchValue(value: unknown, cond: unknown): boolean {
	if (cond === null || typeof cond !== 'object' || cond instanceof Date) return value === cond;
	const c = cond as Row;
	if ('in' in c && !c.in.includes(value)) return false;
	if ('not' in c && (c.not !== null && typeof c.not === 'object' ? matchValue(value, c.not) : value === c.not)) return false;
	if ('lt' in c && !((value as number) < c.lt)) return false;
	if ('lte' in c && !((value as number) <= c.lte)) return false;
	if ('gt' in c && !((value as number) > c.gt)) return false;
	return true;
}

/** `relations` : pour un champ de relation, les lignes liées à `row`. */
function matches(row: Row, where: Row | undefined, relations: Record<string, (row: Row) => Row[] | Row | null> = {}): boolean {
	if (!where) return true;
	for (const [key, cond] of Object.entries(where)) {
		if (cond === undefined) continue;
		if (key === 'OR') {
			if (!(cond as Row[]).some((w) => matches(row, w, relations))) return false;
		} else if (key === 'AND') {
			if (!(cond as Row[]).every((w) => matches(row, w, relations))) return false;
		} else if (key in relations) {
			const linked = relations[key](row);
			if (Array.isArray(linked)) {
				if ('some' in cond && !linked.some((l) => matches(l, cond.some))) return false;
			} else if (!linked || !matches(linked, cond)) return false;
		} else if (!matchValue(row[key], cond)) return false;
	}
	return true;
}

function distinctBy(rows: Row[], keys: string[] | undefined) {
	if (!keys) return rows;
	const seen = new Set<string>();
	return rows.filter((r) => {
		const k = keys.map((key) => r[key]).join('|');
		if (seen.has(k)) return false;
		seen.add(k);
		return true;
	});
}

function pick(row: Row, select: Row | undefined) {
	if (!select) return { ...row };
	return Object.fromEntries(Object.keys(select).filter((k) => select[k]).map((k) => [k, row[k]]));
}

// ─── Relations ───────────────────────────────────────────────────────────

const setOf = (id: number | null) => db.sets.find((s) => s.id === id) ?? null;
const templateOf = (id: number) => db.templates.find((t) => t.id === id)!;
const playerOf = (id: number | null) => db.players.find((p) => p.id === id) ?? null;

const cardRelations = {
	events: (c: Row) => db.events.filter((e) => e.cardId === c.id),
	template: (c: Row) => templateOf(c.templateId)
};

/** `COPY_INCLUDE` : modèle (avec sa série) et propriétaire (avec son personnage). */
function withCopyInclude(card: Row): Row {
	const template = templateOf(card.templateId);
	const owner = playerOf(card.ownerId);
	return {
		...card,
		template: { ...template, set: setOf(template.setId) },
		owner: owner ? { id: owner.id, character: owner.character ? { name: owner.character.name } : null } : null
	};
}

function playerView(p: Row, select?: Row) {
	if (!select) return { ...p };
	const out: Row = {};
	for (const key of Object.keys(select)) {
		if (key === 'character') out.character = p.character ? { ...p.character } : null;
		else if (key === 'cardWallet') out.cardWallet = db.wallets.find((w) => w.playerId === p.id) ?? null;
		else out[key] = p[key];
	}
	return out;
}

// ─── Client Prisma factice ───────────────────────────────────────────────

export const fakePrisma: Row = {
	player: {
		findUnique: async ({ where, select }: Row) => {
			const p = playerOf(where.id);
			return p ? playerView(p, select) : null;
		},
		findMany: async ({ where, select }: Row = {}) => db.players.filter((p) => matches(p, where)).map((p) => playerView(p, select))
	},

	cardTemplate: {
		groupBy: async ({ where }: Row) => {
			const counts = new Map<number, number>();
			for (const t of db.templates.filter((t) => matches(t, where))) counts.set(t.setId, (counts.get(t.setId) ?? 0) + 1);
			return [...counts].map(([setId, n]) => ({ setId, _count: { _all: n } }));
		},
		findMany: async ({ where, select }: Row = {}) => db.templates.filter((t) => matches(t, where)).map((t) => pick(t, select)),
		updateMany: async ({ where, data }: Row) => {
			const rows = db.templates.filter((t) => matches(t, where));
			for (const t of rows) {
				// Unicité (série, n°), comme la base.
				if ('number' in data && data.number !== null && db.templates.some((o) => o !== t && o.setId === t.setId && o.number === data.number)) {
					throw Object.assign(new Error('P2002'), { code: 'P2002' });
				}
				Object.assign(t, data);
			}
			return { count: rows.length };
		}
	},

	cardSet: {
		findMany: async ({ include }: Row = {}) =>
			[...db.sets]
				.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id)
				.map((s) => ({
					...s,
					...(include?.templates
						? {
								templates: db.templates
									.filter((t) => t.setId === s.id && matches(t, include.templates.where))
									.sort((a, b) => (a.number ?? 0) - (b.number ?? 0))
									.map((t) => pick(t, include.templates.select))
							}
						: {})
				}))
	},

	card: {
		findMany: async ({ where, include, select, distinct, orderBy }: Row = {}) => {
			let rows = db.cards.filter((c) => matches(c, where, cardRelations));
			if (orderBy?.id === 'desc') rows = [...rows].sort((a, b) => b.id - a.id);
			else rows = [...rows].sort((a, b) => a.id - b.id);
			rows = distinctBy(rows, distinct);
			if (include) return rows.map(withCopyInclude);
			return rows.map((c) => pick(c, select));
		},
		findUnique: async ({ where, include, select }: Row) => {
			const c = db.cards.find((card) => card.id === where.id);
			if (!c) return null;
			return include ? withCopyInclude(c) : pick(c, select);
		},
		count: async ({ where }: Row = {}) => db.cards.filter((c) => matches(c, where, cardRelations)).length,
		update: async ({ where, data }: Row) => Object.assign(db.cards.find((c) => c.id === where.id)!, data),
		updateMany: async ({ where, data }: Row) => {
			const rows = db.cards.filter((c) => matches(c, where, cardRelations));
			for (const c of rows) Object.assign(c, data);
			return { count: rows.length };
		}
	},

	cardEvent: {
		findMany: async ({ where }: Row = {}) =>
			db.events.filter((e) => matches(e, where)).map((e) => ({ ...e, createdAt: new Date(0), from: playerOf(e.fromId), to: playerOf(e.toId) })),
		create: async ({ data }: Row) => {
			db.events.push({ id: db.events.length + 1, ...data });
			return data;
		}
	},

	cardTrade: {
		findMany: async ({ where }: Row = {}) =>
			db.trades
				.filter((t) => matches(t, where))
				.map((t) => ({
					...t,
					from: playerView(playerOf(t.fromId)!, { id: true, character: true }),
					to: playerView(playerOf(t.toId)!, { id: true, character: true }),
					items: db.tradeItems.filter((i) => i.tradeId === t.id).map((i) => ({ ...i, card: withCopyInclude(db.cards.find((c) => c.id === i.cardId)!) }))
				})),
		updateMany: async () => ({ count: 0 }),
		count: async () => 0
	},

	async $transaction(arg: unknown) {
		if (typeof arg === 'function') return arg(fakePrisma);
		return Promise.all(arg as Promise<unknown>[]);
	}
};
