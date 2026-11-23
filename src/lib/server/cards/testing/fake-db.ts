// Base factice en mémoire pour les tests du jeu de cartes : seulement les requêtes Prisma utilisées
// par collection.ts, trades.ts, secrets.ts, admin.ts, manage.ts (numéros), boosters.ts, shop.ts,
// le classement et la page d'une carte.
// Les tests la branchent avec `vi.mock('$lib/server/prisma', …)` et remplissent `db` eux-mêmes.
//
// `$transaction` annule tout ce qu'a fait la transaction si elle lève une erreur, comme MySQL :
// les tests vérifient ainsi qu'un échange raté ne laisse rien à moitié fait.

import { DEFAULT_RATES } from '$lib/cards/booster';

type Row = Record<string, any>;

export const db = {
	players: [] as Row[],
	sets: [] as Row[],
	templates: [] as Row[],
	/** Boosters supplémentaires d'un modèle (`card_template_boosters`). */
	templateBoosters: [] as Row[],
	packs: [] as Row[],
	cards: [] as Row[],
	events: [] as Row[],
	trades: [] as Row[],
	tradeItems: [] as Row[],
	openings: [] as Row[],
	wallets: [] as Row[],
	held: [] as Row[],
	offers: [] as Row[],
	purchases: [] as Row[],
	settings: [] as Row[]
};

export function resetDb() {
	for (const list of Object.values(db)) list.length = 0;
}

const nextId = (rows: Row[]) => rows.reduce((max, r) => Math.max(max, r.id ?? 0), 0) + 1;

// ─── Filtres « where » ───────────────────────────────────────────────────

function same(value: unknown, cond: unknown): boolean {
	if (cond instanceof Date) return value instanceof Date && value.getTime() === cond.getTime();
	return value === cond;
}

function matchValue(value: unknown, cond: unknown): boolean {
	if (cond === null || typeof cond !== 'object' || cond instanceof Date) return same(value, cond);
	const c = cond as Row;
	if ('in' in c && !c.in.includes(value)) return false;
	if ('not' in c && (c.not !== null && typeof c.not === 'object' && !(c.not instanceof Date) ? matchValue(value, c.not) : same(value, c.not))) return false;
	if (value === null && ('lt' in c || 'lte' in c || 'gt' in c || 'gte' in c)) return false;
	if ('lt' in c && !((value as number) < c.lt)) return false;
	if ('lte' in c && !((value as number) <= c.lte)) return false;
	if ('gt' in c && !((value as number) > c.gt)) return false;
	if ('gte' in c && !((value as number) >= c.gte)) return false;
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

/** Écrit `data` dans `row`, avec `{ increment }` / `{ decrement }` comme Prisma. */
function apply(row: Row, data: Row) {
	for (const [key, value] of Object.entries(data)) {
		if (value && typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value)) {
			if ('increment' in value) row[key] = (row[key] ?? 0) + value.increment;
			else if ('decrement' in value) row[key] = (row[key] ?? 0) - value.decrement;
			else row[key] = value;
		} else row[key] = value;
	}
	return row;
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

function groupCount(rows: Row[], by: string, countKey = by) {
	const counts = new Map<unknown, number>();
	for (const r of rows) counts.set(r[by], (counts.get(r[by]) ?? 0) + 1);
	return [...counts].map(([value, n]) => ({ [countKey]: value, _count: { _all: n } }));
}

// ─── Relations ───────────────────────────────────────────────────────────

const setOf = (id: number | null) => db.sets.find((s) => s.id === id) ?? null;
const templateOf = (id: number) => db.templates.find((t) => t.id === id)!;
const playerOf = (id: number | null) => db.players.find((p) => p.id === id) ?? null;

const cardRelations = {
	events: (c: Row) => db.events.filter((e) => e.cardId === c.id),
	template: (c: Row) => templateOf(c.templateId)
};

const templateRelations = {
	boosters: (t: Row) => db.templateBoosters.filter((b) => b.templateId === t.id)
};

/** Exemplaire avec `select`, y compris `template: { select }` imbriqué. */
function cardSelect(card: Row, select: Row | undefined) {
	const out = pick(card, select && Object.fromEntries(Object.entries(select).filter(([k]) => k !== 'template')));
	if (select?.template) out.template = pick(templateOf(card.templateId), select.template.select);
	return out;
}

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

const heldKey = (where: Row) => where.playerId_setId ?? where;
const heldOf = (where: Row) => {
	const { playerId, setId } = heldKey(where);
	return db.held.find((h) => h.playerId === playerId && h.setId === setId) ?? null;
};

const DEFAULT_SETTINGS = {
	id: 1,
	public: false,
	boosterMinutes: 480,
	boosterMax: 3,
	starterBoosters: 1,
	cardsPerBooster: 5,
	guaranteed: 3,
	godPack: 0,
	rates: DEFAULT_RATES
};

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
		groupBy: async ({ where }: Row) => groupCount(db.templates.filter((t) => matches(t, where, templateRelations)), 'setId'),
		findMany: async ({ where, select, include }: Row = {}) =>
			db.templates
				.filter((t) => matches(t, where, templateRelations))
				.map((t) => (include?.set ? { ...t, set: setOf(t.setId) } : pick(t, select))),
		findUnique: async ({ where, select }: Row) => {
			const t = db.templates.find((row) => row.id === where.id);
			return t ? pick(t, select) : null;
		},
		findUniqueOrThrow: async ({ where, select }: Row) => {
			const t = db.templates.find((row) => row.id === where.id);
			if (!t) throw new Error('Modèle introuvable');
			return pick(t, select);
		},
		count: async ({ where }: Row = {}) => db.templates.filter((t) => matches(t, where, templateRelations)).length,
		updateMany: async ({ where, data }: Row) => {
			const rows = db.templates.filter((t) => matches(t, where, templateRelations));
			for (const t of rows) {
				// Unicité (série, n°), comme la base.
				if ('number' in data && data.number !== null && db.templates.some((o) => o !== t && o.setId === t.setId && o.number === data.number)) {
					throw Object.assign(new Error('P2002'), { code: 'P2002' });
				}
				apply(t, data);
			}
			return { count: rows.length };
		}
	},

	cardSet: {
		findMany: async ({ where, include, select }: Row = {}) =>
			db.sets
				.filter((s) => matches(s, where))
				.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id)
				.map((s) => ({
					...(select ? pick(s, select) : s),
					...(include?.templates
						? {
								templates: db.templates
									.filter((t) => t.setId === s.id && matches(t, include.templates.where))
									.sort((a, b) => (a.number ?? 0) - (b.number ?? 0))
									.map((t) => pick(t, include.templates.select))
							}
						: {})
				})),
		findFirst: async ({ where, select }: Row) => {
			const s = db.sets.find((row) => matches(row, where));
			return s ? pick(s, select) : null;
		},
		findUnique: async ({ where, select }: Row) => {
			const s = setOf(where.id);
			return s ? pick(s, select) : null;
		},
		count: async ({ where }: Row = {}) => db.sets.filter((s) => matches(s, where)).length
	},

	cardPack: {
		findMany: async ({ where }: Row = {}) => db.packs.filter((p) => matches(p, where)),
		findFirst: async ({ where, select }: Row) => {
			const p = db.packs.find((row) => matches(row, where));
			return p ? pick(p, select) : null;
		}
	},

	card: {
		findMany: async ({ where, include, select, distinct, orderBy }: Row = {}) => {
			let rows = db.cards.filter((c) => matches(c, where, cardRelations));
			if (orderBy?.id === 'desc') rows = [...rows].sort((a, b) => b.id - a.id);
			else rows = [...rows].sort((a, b) => a.id - b.id);
			rows = distinctBy(rows, distinct);
			if (include) return rows.map(withCopyInclude);
			return rows.map((c) => cardSelect(c, select));
		},
		findUnique: async ({ where, include, select }: Row) => {
			const c = db.cards.find((card) => card.id === where.id);
			if (!c) return null;
			return include ? withCopyInclude(c) : cardSelect(c, select);
		},
		groupBy: async ({ by, where }: Row) => groupCount(db.cards.filter((c) => matches(c, where, cardRelations)), by[0]),
		count: async ({ where }: Row = {}) => db.cards.filter((c) => matches(c, where, cardRelations)).length,
		create: async ({ data }: Row) => {
			const row = { id: nextId(db.cards), pinned: false, obtainedAt: new Date(), ...data };
			db.cards.push(row);
			return { ...row };
		},
		update: async ({ where, data }: Row) => apply(db.cards.find((c) => c.id === where.id)!, data),
		updateMany: async ({ where, data }: Row) => {
			const rows = db.cards.filter((c) => matches(c, where, cardRelations));
			for (const c of rows) apply(c, data);
			return { count: rows.length };
		}
	},

	cardEvent: {
		findMany: async ({ where }: Row = {}) =>
			db.events.filter((e) => matches(e, where)).map((e) => ({ ...e, createdAt: new Date(0), from: playerOf(e.fromId), to: playerOf(e.toId) })),
		create: async ({ data }: Row) => {
			db.events.push({ id: nextId(db.events), ...data });
			return data;
		},
		createMany: async ({ data }: Row) => {
			for (const row of data as Row[]) db.events.push({ id: nextId(db.events), fromId: null, toId: null, ...row });
			return { count: data.length };
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
		updateMany: async ({ where, data }: Row = {}) => {
			// Seul le cas « propositions qui portent sur ces cartes » est géré (expireTradesFor).
			const ids: number[] | undefined = where?.items?.some?.cardId?.in;
			if (!ids) return { count: 0 };
			const rows = db.trades.filter((t) => t.status === 'attente' && db.tradeItems.some((i) => i.tradeId === t.id && ids.includes(i.cardId)));
			for (const t of rows) apply(t, data);
			return { count: rows.length };
		},
		count: async () => 0
	},

	cardWallet: {
		findUnique: async ({ where }: Row) => {
			const w = db.wallets.find((row) => row.playerId === where.playerId);
			return w ? { ...w } : null;
		},
		findUniqueOrThrow: async ({ where, select }: Row) => {
			const w = db.wallets.find((row) => row.playerId === where.playerId);
			if (!w) throw new Error('Réserve introuvable');
			return pick(w, select);
		},
		create: async ({ data }: Row) => {
			if (db.wallets.some((w) => w.playerId === data.playerId)) throw Object.assign(new Error('P2002'), { code: 'P2002' });
			const row = { opened: 0, points: 0, ...data };
			db.wallets.push(row);
			return { ...row };
		},
		update: async ({ where, data }: Row) => {
			const w = db.wallets.find((row) => row.playerId === where.playerId);
			if (!w) throw new Error('Réserve introuvable');
			return { ...apply(w, data) };
		},
		updateMany: async ({ where, data }: Row) => {
			const rows = db.wallets.filter((w) => matches(w, where));
			for (const w of rows) apply(w, data);
			return { count: rows.length };
		}
	},

	cardOpening: {
		create: async ({ data }: Row) => {
			const row = { id: nextId(db.openings), createdAt: new Date(), seenAt: null, ...data };
			db.openings.push(row);
			return { ...row };
		}
	},

	cardHeldBooster: {
		findUnique: async ({ where }: Row) => {
			const h = heldOf(where);
			return h ? { ...h } : null;
		},
		findMany: async ({ where, include }: Row = {}) =>
			db.held.filter((h) => matches(h, where)).map((h) => (include?.set ? { ...h, set: setOf(h.setId) } : { ...h })),
		upsert: async ({ where, create, update }: Row) => {
			const existing = heldOf(where);
			if (existing) return { ...apply(existing, update) };
			const row = { count: 0, ...create };
			db.held.push(row);
			return { ...row };
		},
		update: async ({ where, data }: Row) => {
			const h = heldOf(where);
			if (!h) throw new Error('Booster gardé introuvable');
			return { ...apply(h, data) };
		},
		updateMany: async ({ where, data }: Row) => {
			const rows = db.held.filter((h) => matches(h, where));
			for (const h of rows) apply(h, data);
			return { count: rows.length };
		}
	},

	cardShopOffer: {
		findUnique: async ({ where }: Row) => {
			const o = db.offers.find((row) => row.id === where.id);
			return o ? { ...o } : null;
		},
		findMany: async ({ where }: Row = {}) =>
			db.offers.filter((o) => matches(o, where)).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id),
		create: async ({ data }: Row) => {
			const row = { id: nextId(db.offers), createdAt: new Date(), ...data };
			db.offers.push(row);
			return { ...row };
		},
		updateMany: async ({ where, data }: Row) => {
			const rows = db.offers.filter((o) => matches(o, where));
			for (const o of rows) apply(o, data);
			return { count: rows.length };
		},
		deleteMany: async ({ where }: Row) => {
			const before = db.offers.length;
			const kept = db.offers.filter((o) => !matches(o, where));
			db.offers.length = 0;
			db.offers.push(...kept);
			return { count: before - kept.length };
		}
	},

	cardShopPurchase: {
		count: async ({ where }: Row = {}) => db.purchases.filter((p) => matches(p, where)).length,
		groupBy: async ({ by, where }: Row) => groupCount(db.purchases.filter((p) => matches(p, where)), by[0]),
		create: async ({ data }: Row) => {
			const row = { id: nextId(db.purchases), createdAt: new Date(), ...data };
			db.purchases.push(row);
			return { ...row };
		}
	},

	cardSettings: {
		upsert: async () => {
			if (!db.settings.length) db.settings.push({ ...DEFAULT_SETTINGS });
			return { ...db.settings[0] };
		},
		findUnique: async () => (db.settings[0] ? { ...db.settings[0] } : null)
	},

	/** Verrou de ligne (`SELECT … FOR UPDATE`) : sans objet dans une base en mémoire. */
	async $queryRaw() {
		return [];
	},

	async $transaction(arg: unknown) {
		if (typeof arg !== 'function') return Promise.all(arg as Promise<unknown>[]);
		// Annulation : en cas d'erreur, la base revient à son état d'avant la transaction.
		const saved = Object.fromEntries(Object.entries(db).map(([key, rows]) => [key, structuredClone(rows)]));
		try {
			return await arg(fakePrisma);
		} catch (e) {
			for (const [key, rows] of Object.entries(saved)) {
				const list = db[key as keyof typeof db];
				list.length = 0;
				list.push(...rows);
			}
			throw e;
		}
	}
};
