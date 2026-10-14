// Toutes les actions de la table de jeu. Chaque action vérifie les droits, modifie la base,
// écrit au journal si besoin, puis la nouvelle vue est diffusée à tout le monde.
import { error } from '@sveltejs/kit';
import { Prisma, type TableLog } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
	ATTACK_COST_STAT,
	ATTACK_STAT,
	GAUGES,
	MAX_ATTACK_POWER,
	OPPOSED_STAT,
	OUTCOME_LABELS,
	attackCost,
	attackDamage,
	gaugeAlerts,
	opposedOutcome,
	opposedThreshold,
	parseDice,
	powerRollBonus,
	rollDice,
	rollDie,
	soloOutcome,
	statForRoll,
	successChance,
	type AttackKind,
	type Gauge
} from '$lib/game/combat';
import { STATS, STAT_KEYS, emptyStats, type StatBlock, type StatKey } from '$lib/game/stats';
import {
	BLENDS,
	SIDES,
	WEATHERS,
	type Ambience,
	type Blend,
	type MusicState,
	type SceneEffects
} from '$lib/table/types';
import { prisma } from '../prisma';
import { broadcast, pushEvent, pushLogs } from './hub';
import { numbers, statsOf, visibleToPlayers, type LogData, type RawToken, type Viewer } from './state';
import { characterSource, freeCell, monsterSource, playerSource, sourceOf } from './tokens';

type Body = Record<string, unknown>;

// ─── Lecture des paramètres ──────────────────────────────────────────────────

function int(value: unknown, min = -1e9, max = 1e9): number {
	const n = Math.round(Number(value));
	if (!Number.isFinite(n)) error(400, 'Valeur numérique attendue.');
	return Math.max(min, Math.min(max, n));
}

function num(value: unknown, fallback: number, min: number, max: number): number {
	const n = Number(value);
	return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
}

function text(value: unknown, max = 255): string {
	return String(value ?? '').trim().slice(0, max);
}

const optionalText = (value: unknown, max = 255) => (value ? text(value, max) || null : null);

function statKey(value: unknown): StatKey {
	if (!STAT_KEYS.includes(value as StatKey)) error(400, 'Statistique inconnue.');
	return value as StatKey;
}

/** URL d'un média : uniquement nos propres fichiers, jamais une adresse externe. */
function mediaUrl(value: unknown): string | null {
	const url = text(value);
	if (!url) return null;
	if (!url.startsWith('/') || url.startsWith('//')) error(400, 'Média invalide.');
	return url;
}

const color = (value: unknown) => (/^#[0-9a-f]{6}$/i.test(String(value)) ? String(value) : '#000000');
const blend = (value: unknown): Blend => (BLENDS.includes(value as Blend) ? (value as Blend) : 'normal');

/** Effets de scène reçus du navigateur, vérifiés champ par champ. */
function sceneEffects(value: unknown): Prisma.InputJsonValue {
	const input = (value && typeof value === 'object' ? value : {}) as Record<string, any>;
	const effects: SceneEffects = {
		tint: input.tint
			? { color: color(input.tint.color), opacity: num(input.tint.opacity, 0.4, 0, 0.95), blend: blend(input.tint.blend) }
			: null,
		weather: WEATHERS.includes(input.weather) ? input.weather : 'aucune',
		intensity: num(input.intensity, 0.6, 0.1, 1),
		overlay: input.overlay?.url
			? { url: mediaUrl(input.overlay.url)!, opacity: num(input.overlay.opacity, 1, 0, 1), blend: blend(input.overlay.blend) }
			: null
	};
	return effects as unknown as Prisma.InputJsonValue;
}

/** Recalcule le brouillard pour une nouvelle grille : chaque case reprend l'état de celle qu'elle recouvre. */
function resizeFog(fog: number[], oldCols: number, oldRows: number, cols: number, rows: number): number[] {
	const revealed = new Set(fog);
	const result: number[] = [];
	for (let y = 0; y < rows; y++) {
		for (let x = 0; x < cols; x++) {
			const ox = Math.min(oldCols - 1, Math.floor(((x + 0.5) * oldCols) / cols));
			const oy = Math.min(oldRows - 1, Math.floor(((y + 0.5) * oldRows) / rows));
			if (revealed.has(oy * oldCols + ox)) result.push(y * cols + x);
		}
	}
	return result;
}

// ─── Contexte d'une action ───────────────────────────────────────────────────

class Context {
	logs: TableLog[] = [];

	constructor(
		readonly sessionId: number,
		readonly viewer: Viewer
	) {}

	requireAdmin() {
		if (!this.viewer.isAdmin) error(403, 'Action réservée au MJ.');
	}

	async session() {
		const session = await prisma.tableSession.findUnique({
			where: { id: this.sessionId },
			include: { scenes: true }
		});
		if (!session) error(404, 'Partie introuvable.');
		return session;
	}

	async token(id: unknown) {
		const token = await prisma.tableToken.findFirst({
			where: { id: int(id), sessionId: this.sessionId }
		});
		if (!token) error(404, 'Jeton introuvable.');
		return token;
	}

	async scene(id: unknown) {
		const scene = await prisma.tableScene.findFirst({
			where: { id: int(id), sessionId: this.sessionId }
		});
		if (!scene) error(404, 'Scène introuvable.');
		return scene;
	}

	/** Jeton qu'un joueur peut faire agir : le sien. Le MJ fait agir n'importe lequel. */
	async actor(id: unknown) {
		const token = await this.token(id);
		if (!this.viewer.isAdmin && !(token.kind === 'player' && token.playerId === this.viewer.playerId)) {
			error(403, 'Ce jeton ne t’appartient pas.');
		}
		return token;
	}

	/** Cible d'un jet : pour un joueur, elle doit être visible sur la scène montrée. */
	async target(id: unknown) {
		const token = await this.token(id);
		if (!this.viewer.isAdmin) {
			const session = await this.session();
			const scene = session.scenes.find((s) => s.id === session.sceneId);
			if (!visibleToPlayers(token, scene)) error(404, 'Jeton introuvable.');
		}
		return token;
	}

	async log(kind: string, text: string, options: { hidden?: boolean; data?: LogData; author?: string } = {}) {
		const log = await prisma.tableLog.create({
			data: {
				sessionId: this.sessionId,
				kind,
				author: options.author ?? this.viewer.name,
				playerId: this.viewer.playerId,
				hidden: options.hidden ?? false,
				text,
				data: (options.data ?? undefined) as Prisma.InputJsonValue | undefined
			}
		});
		this.logs.push(log);
		return log;
	}

	/** Change une jauge et annonce les seuils franchis (fatigue, K.O.…). */
	async setGauge(token: RawToken, gauge: Gauge, value: number, hidden = false) {
		const before = token[gauge];
		await prisma.tableToken.update({ where: { id: token.id }, data: { [gauge]: value } });
		token[gauge] = value;
		const max = statsOf(token)[gauge];
		for (const alert of gaugeAlerts(gauge, before, value, max, token.name)) {
			await this.log('alert', alert, { hidden: hidden || token.hidden, author: 'Table' });
		}
		return value - before;
	}
}

// ─── Actions ─────────────────────────────────────────────────────────────────

type Handler = (ctx: Context, body: Body) => Promise<unknown>;

const admin =
	(handler: Handler): Handler =>
	(ctx, body) => {
		ctx.requireAdmin();
		return handler(ctx, body);
	};

/** Nom affiché d'un jeton dans le journal. */
const label = (token: RawToken) => token.name;

function signed(n: number) {
	return n >= 0 ? `+${n}` : `${n}`;
}

const handlers: Record<string, Handler> = {
	// ── Partie ──
	'session.update': admin(async (ctx, body) => {
		const data: Prisma.TableSessionUpdateInput = {};
		if (body.name !== undefined) data.name = text(body.name) || 'Partie';
		if (body.open !== undefined) data.open = Boolean(body.open);
		await prisma.tableSession.update({ where: { id: ctx.sessionId }, data });
		if (body.open !== undefined) {
			await ctx.log('system', body.open ? 'La partie est ouverte aux joueurs.' : 'La partie est fermée.', {
				author: 'Table'
			});
		}
	}),

	'combat.set': admin(async (ctx, body) => {
		const combat = Boolean(body.combat);
		await prisma.tableSession.update({
			where: { id: ctx.sessionId },
			data: combat ? { combat } : { combat, turn: null }
		});
		await ctx.log('system', combat ? 'Le combat commence !' : 'Le combat est terminé.', { author: 'Table' });
	}),

	'order.set': admin(async (ctx, body) => {
		const ids = Array.isArray(body.order) ? body.order.map((id) => int(id)) : [];
		const existing = await prisma.tableToken.findMany({
			where: { sessionId: ctx.sessionId, id: { in: ids } },
			select: { id: true }
		});
		const valid = new Set(existing.map((t) => t.id));
		await prisma.tableSession.update({
			where: { id: ctx.sessionId },
			data: { order: ids.filter((id) => valid.has(id)) }
		});
	}),

	/** Ordre de passage trié par Vitesse décroissante, pour les jetons de la scène montrée. */
	'order.sort': admin(async (ctx) => {
		const session = await ctx.session();
		const tokens = await prisma.tableToken.findMany({
			where: { sessionId: ctx.sessionId, sceneId: session.sceneId ?? -1 }
		});
		const order = tokens
			.map((t) => ({ id: t.id, speed: statsOf(t).vitesse }))
			.sort((a, b) => b.speed - a.speed)
			.map((t) => t.id);
		await prisma.tableSession.update({ where: { id: ctx.sessionId }, data: { order } });
	}),

	'order.visible': admin(async (ctx, body) => {
		await prisma.tableSession.update({
			where: { id: ctx.sessionId },
			data: { orderVisible: Boolean(body.visible) }
		});
	}),

	'order.turn': admin(async (ctx, body) => {
		const turn = body.turn === null || body.turn === undefined ? null : int(body.turn);
		await prisma.tableSession.update({ where: { id: ctx.sessionId }, data: { turn } });
		if (turn !== null) {
			const token = await ctx.token(turn);
			await ctx.log('system', `Au tour de ${label(token)}.`, { author: 'Table', hidden: token.hidden });
		}
	}),

	// ── Scènes ──
	'scene.create': admin(async (ctx, body) => {
		const count = await prisma.tableScene.count({ where: { sessionId: ctx.sessionId } });
		const scene = await prisma.tableScene.create({
			data: { sessionId: ctx.sessionId, name: text(body.name) || `Scène ${count + 1}`, fog: [], sortOrder: count }
		});
		// La première scène est montrée d'office.
		const session = await ctx.session();
		if (!session.sceneId) {
			await prisma.tableSession.update({ where: { id: ctx.sessionId }, data: { sceneId: scene.id } });
			await prisma.tableToken.updateMany({
				where: { sessionId: ctx.sessionId, sceneId: null },
				data: { sceneId: scene.id }
			});
		}
		return { id: scene.id };
	}),

	'scene.update': admin(async (ctx, body) => {
		const scene = await ctx.scene(body.id);
		const data: Prisma.TableSceneUpdateInput = {};
		if (body.name !== undefined) data.name = text(body.name) || scene.name;
		if (body.background !== undefined) data.background = mediaUrl(body.background);
		if (body.cols !== undefined) data.cols = int(body.cols, 4, 120);
		if (body.rows !== undefined) data.rows = int(body.rows, 4, 120);
		if (body.gridVisible !== undefined) data.gridVisible = Boolean(body.gridVisible);
		if (body.fogEnabled !== undefined) data.fogEnabled = Boolean(body.fogEnabled);
		if (body.musicUrl !== undefined) {
			data.musicUrl = mediaUrl(body.musicUrl);
			data.musicName = data.musicUrl ? optionalText(body.musicName) : null;
		}
		if (body.effects !== undefined) data.effects = sceneEffects(body.effects);

		// Nouvelle taille de cases : le brouillard et les jetons sont replacés à proportion.
		const cols = (data.cols as number | undefined) ?? scene.cols;
		const rows = (data.rows as number | undefined) ?? scene.rows;
		if (cols !== scene.cols || rows !== scene.rows) {
			data.fog = resizeFog(numbers(scene.fog), scene.cols, scene.rows, cols, rows);
			const tokens = await prisma.tableToken.findMany({ where: { sceneId: scene.id } });
			for (const token of tokens) {
				const size = Math.min(token.size, cols, rows);
				await prisma.tableToken.update({
					where: { id: token.id },
					data: {
						x: Math.max(0, Math.min(cols - size, Math.round((token.x * cols) / scene.cols))),
						y: Math.max(0, Math.min(rows - size, Math.round((token.y * rows) / scene.rows)))
					}
				});
			}
		}
		await prisma.tableScene.update({ where: { id: scene.id }, data });
	}),

	'scene.delete': admin(async (ctx, body) => {
		const scene = await ctx.scene(body.id);
		const session = await ctx.session();
		// Les jetons des joueurs ne disparaissent pas avec la scène.
		await prisma.tableToken.deleteMany({ where: { sceneId: scene.id, kind: { not: 'player' } } });
		await prisma.tableScene.delete({ where: { id: scene.id } });
		if (session.sceneId === scene.id) {
			const next = session.scenes.find((s) => s.id !== scene.id);
			await prisma.tableSession.update({ where: { id: ctx.sessionId }, data: { sceneId: next?.id ?? null } });
			await prisma.tableToken.updateMany({
				where: { sessionId: ctx.sessionId, kind: 'player' },
				data: { sceneId: next?.id ?? null }
			});
		}
	}),

	/** Montre une scène aux joueurs ; leurs jetons la suivent et sa musique se lance. */
	'scene.activate': admin(async (ctx, body) => {
		const scene = await ctx.scene(body.id);
		const players = await prisma.tableToken.findMany({
			where: { sessionId: ctx.sessionId, kind: 'player' }
		});
		for (const token of players) {
			if (token.sceneId === scene.id) continue;
			const fits = token.x < scene.cols && token.y < scene.rows;
			const cell = fits ? { x: token.x, y: token.y } : await freeCell(scene.id, scene.cols, scene.rows);
			await prisma.tableToken.update({ where: { id: token.id }, data: { sceneId: scene.id, ...cell } });
		}
		const data: Prisma.TableSessionUpdateInput = { sceneId: scene.id, turn: null };
		if (scene.musicUrl) {
			data.music = {
				url: scene.musicUrl,
				name: scene.musicName ?? 'Musique',
				loop: true,
				playing: true,
				startedAt: Date.now(),
				offset: 0
			} satisfies MusicState;
		}
		// Pas d'annonce au journal : le nom de la scène pourrait en dire trop aux joueurs.
		await prisma.tableSession.update({ where: { id: ctx.sessionId }, data });
	}),

	// ── Brouillard ──
	'fog.set': admin(async (ctx, body) => {
		const scene = await ctx.scene(body.sceneId);
		const total = scene.cols * scene.rows;
		const cells = (Array.isArray(body.cells) ? body.cells : [])
			.map((c) => int(c))
			.filter((c) => c >= 0 && c < total);
		const fog = new Set(numbers(scene.fog));
		for (const cell of cells) {
			if (body.revealed) fog.add(cell);
			else fog.delete(cell);
		}
		await prisma.tableScene.update({ where: { id: scene.id }, data: { fog: [...fog] } });
	}),

	'fog.all': admin(async (ctx, body) => {
		const scene = await ctx.scene(body.sceneId);
		const fog = body.revealed ? Array.from({ length: scene.cols * scene.rows }, (_, i) => i) : [];
		await prisma.tableScene.update({ where: { id: scene.id }, data: { fog } });
	}),

	// ── Jetons ──
	'token.add': admin(async (ctx, body) => {
		const scene = await ctx.scene(body.sceneId);
		const source = String(body.source);
		const refId = body.refId === undefined ? null : int(body.refId);

		let data: Pick<
			Prisma.TableTokenUncheckedCreateInput,
			'name' | 'image' | 'playerId' | 'refId' | 'kind' | 'side' | 'revealed'
		> & { stats: StatBlock; armor: StatBlock };

		if (source === 'player') {
			const existing = await prisma.tableToken.findFirst({
				where: { sessionId: ctx.sessionId, kind: 'player', playerId: refId ?? -1 }
			});
			if (existing) {
				// Un joueur n'a qu'un jeton : on le ramène sur cette scène.
				const cell = await freeCell(scene.id, scene.cols, scene.rows);
				await prisma.tableToken.update({ where: { id: existing.id }, data: { sceneId: scene.id, ...cell } });
				return { id: existing.id };
			}
			const s = await playerSource(refId ?? -1);
			data = { ...s, kind: 'player', side: 'ally', revealed: true };
		} else if (source === 'character') {
			data = { ...(await characterSource(refId ?? -1)), kind: 'character', side: 'neutral', revealed: false };
		} else if (source === 'monster') {
			data = { ...(await monsterSource(refId ?? -1)), kind: 'monster', side: 'enemy', revealed: false };
		} else {
			data = {
				name: text(body.name) || 'Jeton',
				image: mediaUrl(body.image),
				stats: emptyStats(),
				armor: emptyStats(),
				playerId: null,
				refId: null,
				kind: 'custom',
				side: 'enemy',
				revealed: false
			};
		}

		const cell =
			body.x !== undefined && body.y !== undefined
				? { x: int(body.x, 0, scene.cols - 1), y: int(body.y, 0, scene.rows - 1) }
				: await freeCell(scene.id, scene.cols, scene.rows);
		const token = await prisma.tableToken.create({
			data: {
				...data,
				sessionId: ctx.sessionId,
				sceneId: scene.id,
				...cell,
				// Ajouté par le MJ sur la scène qu'il prépare : caché tant qu'il ne le révèle pas.
				hidden: Boolean(body.hidden),
				pv: data.stats.pv,
				qdf: data.stats.qdf,
				endurance: data.stats.endurance
			}
		});
		return { id: token.id };
	}),

	'token.update': admin(async (ctx, body) => {
		const token = await ctx.token(body.id);
		const data: Prisma.TableTokenUpdateInput = {};
		if (body.name !== undefined) data.name = text(body.name) || token.name;
		if (body.image !== undefined) data.image = mediaUrl(body.image);
		if (body.side !== undefined && SIDES.includes(body.side as never)) data.side = String(body.side);
		if (body.size !== undefined) data.size = int(body.size, 1, 6);
		if (body.hidden !== undefined) data.hidden = Boolean(body.hidden);
		if (body.revealed !== undefined) data.revealed = Boolean(body.revealed);
		if (body.stats && typeof body.stats === 'object') {
			const stats = statsOf(token);
			for (const k of STAT_KEYS) {
				const value = (body.stats as Record<string, unknown>)[k];
				if (value !== undefined) stats[k] = int(value, 0, 100000);
			}
			data.stats = stats;
		}
		await prisma.tableToken.update({ where: { id: token.id }, data });
	}),

	'token.delete': admin(async (ctx, body) => {
		const token = await ctx.token(body.id);
		await prisma.tableToken.delete({ where: { id: token.id } });
		const session = await ctx.session();
		const order = numbers(session.order).filter((id) => id !== token.id);
		await prisma.tableSession.update({
			where: { id: ctx.sessionId },
			data: { order, turn: session.turn === token.id ? null : session.turn }
		});
	}),

	/** Déplacement : le joueur bouge son jeton, le MJ bouge tout (et peut changer de scène). */
	'token.move': async (ctx, body) => {
		const token = await ctx.actor(body.id);
		const sceneId = ctx.viewer.isAdmin && body.sceneId ? (await ctx.scene(body.sceneId)).id : token.sceneId;
		const scene = sceneId ? await ctx.scene(sceneId) : null;
		if (!scene) error(400, 'Ce jeton n’est sur aucune scène.');
		await prisma.tableToken.update({
			where: { id: token.id },
			data: {
				sceneId,
				x: int(body.x, 0, scene.cols - token.size),
				y: int(body.y, 0, scene.rows - token.size)
			}
		});
	},

	/** Change une jauge : `delta` (dégâts, soins) ou `value` (valeur exacte). */
	'token.gauge': admin(async (ctx, body) => {
		const token = await ctx.token(body.id);
		const gauge = body.gauge as Gauge;
		if (!GAUGES.includes(gauge)) error(400, 'Jauge inconnue.');
		const value = body.value !== undefined ? int(body.value) : token[gauge] + int(body.delta);
		await ctx.setGauge(token, gauge, value);
	}),

	/** Remet les jauges au maximum : un jeton, ou tous ceux de la partie. */
	'token.restore': admin(async (ctx, body) => {
		const tokens = body.id
			? [await ctx.token(body.id)]
			: await prisma.tableToken.findMany({ where: { sessionId: ctx.sessionId } });
		for (const token of tokens) {
			const stats = statsOf(token);
			await prisma.tableToken.update({
				where: { id: token.id },
				data: { pv: stats.pv, qdf: stats.qdf, endurance: stats.endurance }
			});
		}
		if (!body.id) await ctx.log('system', 'Tout le monde récupère ses forces.', { author: 'Table' });
	}),

	/** Relit la fiche d'origine (armure changée, passif activé…) sans toucher aux jauges actuelles. */
	'token.refresh': admin(async (ctx, body) => {
		const tokens = body.id
			? [await ctx.token(body.id)]
			: await prisma.tableToken.findMany({ where: { sessionId: ctx.sessionId } });
		for (const token of tokens) {
			const source = await sourceOf(token.kind as never, token.refId, token.playerId).catch(() => null);
			if (!source) continue;
			await prisma.tableToken.update({
				where: { id: token.id },
				data: { stats: source.stats, armor: source.armor, image: source.image ?? token.image }
			});
		}
	}),

	// ── Jets ──
	'roll.dice': async (ctx, body) => {
		const formula = parseDice(text(body.formula, 60));
		if (!formula) error(400, 'Formule de dés invalide (exemples : d20, 2d6+3, d100).');
		const result = rollDice(formula);
		const detail =
			result.rolls.length > 1 || result.modifier
				? `${result.rolls.map((r) => `${r.sign < 0 ? '−' : ''}${r.value}`).join(' + ')}${
						result.modifier ? ` ${result.modifier > 0 ? '+' : '−'} ${Math.abs(result.modifier)}` : ''
					}`
				: undefined;
		const reason = optionalText(body.label, 80);
		await ctx.log('roll', `${reason ? `${reason} — ` : ''}${result.formula} : ${result.total}`, {
			hidden: ctx.viewer.isAdmin && Boolean(body.hidden),
			data: { detail, publicDetail: detail }
		});
	},

	/** Jet de stat au d100, seul ou opposé à la stat d'une cible. */
	'roll.stat': async (ctx, body) => {
		const actor = await ctx.actor(body.tokenId);
		const stat = statKey(body.stat);
		const isAdmin = ctx.viewer.isAdmin;
		const bonus = isAdmin ? int(body.bonus ?? 0, -100, 100) : 0;
		// Comme dans le simulateur V1, l'armure ne compte pas dans les jets opposés.
		const own = statForRoll(stat, statsOf(actor)[stat] - (actor.armor as StatBlock)[stat]) + bonus;
		const roll = rollDie(100);
		const s = STATS[stat];

		if (!body.targetId) {
			const outcome = soloOutcome(roll, own);
			await ctx.log('stat', `Jet de ${s.label} de ${label(actor)} : ${roll} — ${OUTCOME_LABELS[outcome]}`, {
				hidden: (isAdmin && Boolean(body.hidden)) || actor.hidden,
				data: {
					detail: `${s.abbr} ${own}${bonus ? ` (bonus ${signed(bonus)})` : ''} · réussi dès ${100 - own}`,
					publicDetail: actor.revealed ? `${s.abbr} ${own} · réussi dès ${100 - own}` : undefined
				}
			});
			return { roll, outcome };
		}

		const target = await ctx.target(body.targetId);
		const targetStat = body.targetStat ? statKey(body.targetStat) : OPPOSED_STAT[stat];
		const targetBonus = isAdmin ? int(body.targetBonus ?? 0, -100, 100) : 0;
		const other =
			statForRoll(targetStat, statsOf(target)[targetStat] - (target.armor as StatBlock)[targetStat]) + targetBonus;
		const threshold = opposedThreshold(own, other);
		const outcome = opposedOutcome(roll, threshold);
		const t = STATS[targetStat];
		const chance = successChance(threshold);

		await ctx.log(
			'opposed',
			`${s.label} de ${label(actor)} contre ${t.label} de ${label(target)} : ${roll} — ${OUTCOME_LABELS[outcome]}`,
			{
				hidden: (isAdmin && Boolean(body.hidden)) || actor.hidden || target.hidden,
				data: {
					detail: `${s.abbr} ${own} contre ${t.abbr} ${other} · seuil ${threshold} · chance ${chance} %`,
					publicDetail: target.revealed
						? `${s.abbr} ${own} contre ${t.abbr} ${other} · seuil ${threshold} · chance ${chance} %`
						: `Chance estimée : ${chance} %`
				}
			}
		);
		return { roll, outcome };
	},

	/** Attaque Force ou Maîtrise : d20, dégâts à la cible, coût à l'attaquant, appliqués aussitôt. */
	attack: async (ctx, body) => {
		const attacker = await ctx.actor(body.attackerId);
		const target = await ctx.target(body.targetId);
		const kind: AttackKind = body.kind === 'maitrise' ? 'maitrise' : 'force';
		const power = int(body.power ?? 1, 1, MAX_ATTACK_POWER);
		const isAdmin = ctx.viewer.isAdmin;
		const multiplier = isAdmin ? num(body.multiplier, 1, 0, 10) : 1;
		const attackBonus = isAdmin ? int(body.attackBonus ?? 0, -100, 100) : 0;
		const defenseBonus = isAdmin ? int(body.defenseBonus ?? 0, -100, 100) : 0;

		const attackStat = ATTACK_STAT[kind];
		const attack = statsOf(attacker)[attackStat];
		const defense = statsOf(target).defense;
		const roll = rollDie(20);
		const damage = attackDamage({ kind, power, attack, defense, roll, multiplier, attackBonus, defenseBonus });
		const costStat = ATTACK_COST_STAT[kind];
		const cost = attackCost(kind, power);

		const hidden = (isAdmin && Boolean(body.hidden)) || attacker.hidden || target.hidden;
		const effects: LogData['effects'] = [];
		const costDelta = await ctx.setGauge(attacker, costStat, Math.max(0, attacker[costStat] - cost), hidden);
		effects.push({ tokenId: attacker.id, gauge: costStat, delta: costDelta });
		// Une attaque sur soi-même : on repart de la valeur à jour.
		const victim = target.id === attacker.id ? attacker : target;
		const damageDelta = await ctx.setGauge(victim, 'pv', Math.max(0, victim.pv - damage), hidden);
		effects.push({ tokenId: victim.id, gauge: 'pv', delta: damageDelta });

		const verb = kind === 'force' ? 'attaque' : 'lance un sort sur';
		const bonusRoll = powerRollBonus(power);
		const rollText = `jet de ${roll}${bonusRoll ? ` (+${bonusRoll})` : ''}`;
		const costText = `−${cost} ${STATS[costStat].abbr}`;
		const log = await ctx.log(
			'attack',
			`${label(attacker)} ${verb} ${label(target)} (puissance ${power}) : ${rollText} → ${damage} dégâts`,
			{
				hidden,
				data: {
					detail: `${STATS[attackStat].abbr} ${attack}${attackBonus ? ` ${signed(attackBonus)}` : ''} contre DEF ${defense}${
						defenseBonus ? ` ${signed(defenseBonus)}` : ''
					}${multiplier !== 1 ? ` · ×${multiplier}` : ''} · ${costText}`,
					publicDetail: target.revealed
						? `${STATS[attackStat].abbr} ${attack} contre DEF ${defense} · ${costText}`
						: costText,
					effects
				}
			}
		);
		// L'attaque passe avant ses alertes dans le journal.
		ctx.logs = [log, ...ctx.logs.filter((l) => l.id !== log.id)];
		return { roll, damage };
	},

	chat: async (ctx, body) => {
		const message = text(body.text, 1000);
		if (!message) return;
		await ctx.log('chat', message, { hidden: ctx.viewer.isAdmin && Boolean(body.hidden) });
	},

	/** Annule les dégâts et le coût d'une attaque. */
	'log.undo': admin(async (ctx, body) => {
		const log = await prisma.tableLog.findFirst({ where: { id: int(body.id), sessionId: ctx.sessionId } });
		if (!log || log.undone) error(404, 'Rien à annuler.');
		for (const effect of ((log.data ?? {}) as LogData).effects ?? []) {
			await prisma.tableToken.updateMany({
				where: { id: effect.tokenId, sessionId: ctx.sessionId },
				data: { [effect.gauge]: { decrement: effect.delta } }
			});
		}
		ctx.logs.push(await prisma.tableLog.update({ where: { id: log.id }, data: { undone: true } }));
	}),

	// ── Son et images ──
	'music.play': admin(async (ctx, body) => {
		const url = mediaUrl(body.url);
		if (!url) error(400, 'Piste manquante.');
		const music: MusicState = {
			url,
			name: text(body.name) || 'Musique',
			loop: body.loop !== false,
			playing: true,
			startedAt: Date.now(),
			offset: 0
		};
		await prisma.tableSession.update({ where: { id: ctx.sessionId }, data: { music: { ...music } } });
	}),

	'music.pause': admin(async (ctx) => {
		const session = await ctx.session();
		const music = session.music as MusicState | null;
		if (!music?.playing) return;
		const offset = (Date.now() - music.startedAt) / 1000;
		await prisma.tableSession.update({
			where: { id: ctx.sessionId },
			data: { music: { ...music, playing: false, offset } }
		});
	}),

	'music.resume': admin(async (ctx) => {
		const session = await ctx.session();
		const music = session.music as MusicState | null;
		if (!music || music.playing) return;
		await prisma.tableSession.update({
			where: { id: ctx.sessionId },
			data: { music: { ...music, playing: true, startedAt: Date.now() - music.offset * 1000 } }
		});
	}),

	'music.loop': admin(async (ctx, body) => {
		const session = await ctx.session();
		const music = session.music as MusicState | null;
		if (!music) return;
		await prisma.tableSession.update({
			where: { id: ctx.sessionId },
			data: { music: { ...music, loop: Boolean(body.loop) } }
		});
	}),

	'music.stop': admin(async (ctx) => {
		await prisma.tableSession.update({
			where: { id: ctx.sessionId },
			data: { music: Prisma.DbNull }
		});
	}),

	'ambience.add': admin(async (ctx, body) => {
		const url = mediaUrl(body.url);
		if (!url) error(400, 'Ambiance manquante.');
		const session = await ctx.session();
		const ambiences = (session.ambiences as unknown as Ambience[]) ?? [];
		ambiences.push({ id: randomUUID(), url, name: text(body.name) || 'Ambiance', volume: 0.6 });
		await prisma.tableSession.update({
			where: { id: ctx.sessionId },
			data: { ambiences: ambiences as unknown as Prisma.InputJsonValue }
		});
	}),

	'ambience.volume': admin(async (ctx, body) => {
		const session = await ctx.session();
		const ambiences = ((session.ambiences as unknown as Ambience[]) ?? []).map((a) =>
			a.id === body.id ? { ...a, volume: num(body.volume, a.volume, 0, 1) } : a
		);
		await prisma.tableSession.update({
			where: { id: ctx.sessionId },
			data: { ambiences: ambiences as unknown as Prisma.InputJsonValue }
		});
	}),

	'ambience.remove': admin(async (ctx, body) => {
		const session = await ctx.session();
		const ambiences = ((session.ambiences as unknown as Ambience[]) ?? []).filter((a) => a.id !== body.id);
		await prisma.tableSession.update({
			where: { id: ctx.sessionId },
			data: { ambiences: ambiences as unknown as Prisma.InputJsonValue }
		});
	}),

	/** Effet sonore joué une fois chez tout le monde, sans changer l'état de la partie. */
	'sfx.play': admin(async (ctx, body) => {
		const url = mediaUrl(body.url);
		if (url) pushEvent(ctx.sessionId, 'sfx', { url });
		return { silent: true };
	}),

	'showcase.set': admin(async (ctx, body) => {
		await prisma.tableSession.update({
			where: { id: ctx.sessionId },
			data: { showcase: mediaUrl(body.url) }
		});
	})
};

export async function runAction(sessionId: number, viewer: Viewer, body: Body) {
	if (viewer.spectator) error(403, 'La vue OBS est en lecture seule.');
	const handler = handlers[String(body.type)];
	if (!handler) error(400, 'Action inconnue.');

	const ctx = new Context(sessionId, viewer);
	const result = (await handler(ctx, body)) as { silent?: boolean } | undefined;
	if (ctx.logs.length) pushLogs(sessionId, ctx.logs);
	if (!result?.silent) broadcast(sessionId);
	return result ?? {};
}
