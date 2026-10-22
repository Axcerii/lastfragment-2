// Jeu de données pour tester les combats : des compétences pour toutes les stats, trois joueurs aux
// profils opposés, des monstres et une partie de table de jeu déjà en combat.
//
//   node prisma/seed-combat.mjs          crée (ou recrée) les données
//   node prisma/seed-combat.mjs --clean  les supprime
//
// Tout ce qui est créé ici est préfixé « combat_ » ou « [combat] » pour être retiré sans toucher au reste.
// À ne jamais lancer sur la base de production : les mots de passe ci-dessous sont publics.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { createServer } from 'vite';

if (process.env.NODE_ENV === 'production') {
	console.error('Refus : ce script est réservé au développement.');
	process.exit(1);
}

const prisma = new PrismaClient();
const TAG = '[combat]';

const ACCOUNTS = {
	mj: { login: 'combat_mj', password: 'CombatMaitre2026', role: 10 },
	guerriere: { login: 'combat_guerriere', password: 'CombatJoueur2026', role: 0 },
	mage: { login: 'combat_mage', password: 'CombatJoueur2026', role: 0 },
	eclaireur: { login: 'combat_eclaireur', password: 'CombatJoueur2026', role: 0 }
};

// ─── Compétences : quatre paliers par stat ───────────────────────────────────
// Les paliers suivent l'échelle de chaque stat : 20/40/60/80, ×30 pour PV et QdF, ×20 pour l'Endurance.

const SKILLS = {
	PV: [30, [
		['Peau dure', 'Ignore les dégâts d’une attaque de puissance 1 une fois par combat.'],
		['Sang-froid', 'Sous la moitié de ses PV, gagne +5 en Défense.'],
		['Increvable', 'Reste debout à 1 PV la première fois qu’il devrait tomber.'],
		['Cœur de géant', 'Récupère 10 % de ses PV max à chaque début de tour.']
	]],
	QDF: [30, [
		['Réserve', 'Une attaque de Maîtrise de puissance 1 ne coûte pas de QdF.'],
		['Canalisation', 'Réduit de 50 le coût en QdF des attaques de Maîtrise.'],
		['Puits de flux', 'Récupère 200 QdF en sautant son tour.'],
		['Flux inépuisable', 'Une fois par combat, une attaque de Maîtrise ne coûte rien.']
	]],
	Endurance: [20, [
		['Souffle court', 'Récupère 50 END à la fin de chaque tour.'],
		['Second souffle', 'Une fois par combat, récupère 300 END.'],
		['Marathonien', 'Les déplacements ne coûtent plus d’END.'],
		['Infatigable', 'Les attaques de Force coûtent 100 END de moins.']
	]],
	Maitrise: [1, [
		['Étincelle', 'Lance une petite décharge de flux à distance.'],
		['Lame de flux', 'Les attaques de Maîtrise ignorent 5 points de Défense.'],
		['Déferlante', 'Une attaque de Maîtrise touche toutes les cibles adjacentes.'],
		['Éveil', 'Double le multiplicateur d’une attaque de Maîtrise une fois par combat.']
	]],
	Force: [1, [
		['Poigne', 'Porte une charge lourde sans effort.'],
		['Frappe lourde', 'Un coup qui fait reculer la cible d’une case.'],
		['Brise-garde', 'Une attaque de Force ignore 10 points de Défense.'],
		['Briseur', 'Brise une arme ou un bouclier adverse.']
	]],
	Defense: [1, [
		['Garde', 'Se protège : +5 en Défense jusqu’à son prochain tour.'],
		['Rempart', 'Peut encaisser une attaque à la place d’un allié adjacent.'],
		['Riposte', 'Après une attaque ratée contre lui, contre-attaque en puissance 1.'],
		['Forteresse', 'Les dégâts subis ne peuvent pas dépasser 300 par attaque.']
	]],
	Vitesse: [1, [
		['Pas léger', 'Se déplace d’une case de plus par tour.'],
		['Esquive', 'Une fois par tour, relance un jet opposé de Vitesse raté.'],
		['Double frappe', 'Attaque deux fois en puissance 1 au lieu d’une.'],
		['Éclair', 'Joue en premier, quel que soit l’ordre de passage.']
	]],
	Precision: [1, [
		['Coup d’œil', 'Repère le point faible d’une armure.'],
		['Tir ajusté', '+2 au d20 sur une attaque à distance.'],
		['Point vital', 'Un 18 ou plus au d20 compte comme un critique.'],
		['Tir parfait', 'Une fois par combat, l’attaque touche automatiquement.']
	]],
	Perception: [1, [
		['Aux aguets', 'Ne peut pas être surpris en début de combat.'],
		['Lire l’adversaire', 'Le MJ révèle une stat d’un ennemi.'],
		['Sixième sens', 'Repère les jetons cachés à deux cases.'],
		['Omniscience', 'Voit l’ordre de passage et les PV de tous les ennemis.']
	]],
	Furtivite: [1, [
		['Discret', 'Se déplace sans bruit hors combat.'],
		['Embuscade', 'La première attaque d’un combat a +5 au d20.'],
		['Ombre', 'Devient invisible un tour s’il ne bouge pas.'],
		['Assassin', 'Une attaque sur une cible qui ne le voit pas fait double dégâts.']
	]],
	Charisme: [1, [
		['Sourire', 'Un PNJ neutre devient bienveillant.'],
		['Cri de ralliement', 'Les alliés gagnent +2 au d20 pendant un tour.'],
		['Meneur', 'Donne son tour à un allié une fois par combat.'],
		['Aura royale', 'Les ennemis faibles hésitent à l’attaquer.']
	]],
	Eloquence: [1, [
		['Beau parleur', 'Négocie un meilleur prix chez les marchands.'],
		['Provocation', 'Force un ennemi à l’attaquer au prochain tour.'],
		['Pourparlers', 'Peut proposer une trêve d’un tour à un ennemi conscient.'],
		['Verbe d’or', 'Retourne un ennemi humanoïde contre ses alliés pendant un tour.']
	]],
	Intelligence: [1, [
		['Analyse', 'Repère une faiblesse chez un adversaire.'],
		['Stratège', 'Réorganise l’ordre de passage des alliés une fois par combat.'],
		['Tacticien', 'Les alliés adjacents gagnent +3 en Défense.'],
		['Génie', 'Copie une compétence vue pendant le combat, une fois.']
	]]
};

const STEPS = [20, 40, 60, 80];

// Fusions de badges avec une compétence, et une sans (pour voir le message par défaut).
const BADGE_SKILLS = [
	['Chronos:Lada', 'Éclair figé', 'Arrête le temps un instant : rejoue immédiatement.'],
	['Goliath:Pura', 'Poing du colosse', 'La prochaine attaque de Force a un multiplicateur ×1,5.'],
	['Drii:Pestia', 'Nuée d’ombres', 'Aveugle tous les ennemis adjacents pendant un tour.']
];

// ─── Personnages joueurs ─────────────────────────────────────────────────────

const HEROES = [
	{
		account: 'guerriere',
		name: 'Brunhild',
		title: 'Mur d’acier',
		dragon: 'Goliath',
		race: 'Geant',
		country: 'Augeaime',
		flux: 'Acier vivant',
		job: 'Garde',
		description: 'Tank au contact : beaucoup de PV et de Défense, attaque de Force.\nSon armure lourde la ralentirait, mais sa Force (≥ 60) annule la gêne en Vitesse.',
		stats: { qdf: 600, pv: 2700, endurance: 1500, maitrise: 15, strength: 68, defense: 55, vitesse: 30, accuracy: 35, perception: 40, furtivite: 10, charisme: 45, eloquence: 25, intelligence: 30 },
		passives: [
			{ name: 'Colosse', description: 'Sa carrure la rend plus forte.', active: true, statistics: 'FOR,DEF', maths: 'x1.1,+5' },
			{ name: 'Rancunière', description: 'Plus dangereuse blessée, distraite sinon.', active: false, statistics: 'FOR,PER', maths: 'x1.2,x1', inactiveMaths: 'x1,x0.9' }
		],
		gear: [
			['Heaume de garde', 'Casque', 3, 2, 'DEF,PER', '+8,-5'],
			['Cuirasse lourde', 'Torse', 3, 4, 'DEF,VIT,PV', '+15,-10,+300'],
			['Gantelets cloutés', 'Gantelets', 2, 1, 'FOR', '+5'],
			['Grèves de fer', 'Jambieres', 2, 2, 'DEF,VIT', '+6,-4']
		],
		weapons: [['Hache d’armes', 'Arme', 3, 3, 'Lourde et tranchante.']],
		money: 3200,
		badges: [['Goliath', true], ['Pura', true], ['Goliath', false], ['Aqua', false]],
		fusions: [['Goliath', 'Pura']]
	},
	{
		account: 'mage',
		name: 'Ysolde',
		title: 'Voix du flux',
		dragon: 'Drii',
		race: 'Eternelle',
		country: 'Irisia',
		flux: 'Lumière noire',
		job: 'Érudite',
		description: 'Attaque de Maîtrise à distance : énorme QdF, peu de Défense et de PV.\nSon passif actif amplifie la Maîtrise mais rogne sa Défense.',
		stats: { qdf: 2700, pv: 1200, endurance: 600, maitrise: 72, strength: 15, defense: 20, vitesse: 45, accuracy: 50, perception: 55, furtivite: 30, charisme: 40, eloquence: 65, intelligence: 82 },
		passives: [
			{ name: 'Conduit', description: 'Le flux passe à travers elle, au prix de sa garde.', active: true, statistics: 'MDF,DEF,QDF', maths: 'x1.15,x0.8,+300' }
		],
		gear: [
			['Capuche runique', 'Casque', 4, 1, 'MDF,PER', '+4,+5'],
			['Robe de flux', 'Torse', 4, 1, 'QDF,DEF', '+300,-3']
		],
		weapons: [['Bâton de cristal', 'Arme', 4, 2, 'Concentre le flux.']],
		money: 8400,
		badges: [['Drii', true], ['Pestia', true], ['Chronos', false], ['Yinva', false], ['Yinva', true]],
		fusions: [['Drii', 'Pestia'], ['Yinva', 'Artrish']]
	},
	{
		account: 'eclaireur',
		name: 'Kael',
		title: 'Ombre rapide',
		dragon: 'Lada',
		race: 'Humain',
		country: 'Mudan',
		flux: 'Vent',
		job: 'Éclaireur',
		description: 'Rapide et précis, fragile : premier dans l’ordre de passage.\nSa Précision (≥ 50) annule la gêne de son armure ; son passif inactif lui coûte de la Défense.',
		stats: { qdf: 900, pv: 1500, endurance: 1200, maitrise: 30, strength: 40, defense: 28, vitesse: 78, accuracy: 70, perception: 65, furtivite: 75, charisme: 30, eloquence: 35, intelligence: 45 },
		passives: [
			{ name: 'Insaisissable', description: 'Plus vif en mouvement.', active: true, statistics: 'VIT,FUR', maths: 'x1.1,+5' },
			{ name: 'Insomniaque', description: 'Mal reposé, il baisse sa garde.', active: false, statistics: 'DEF', maths: 'x1', inactiveMaths: 'x0.85' }
		],
		gear: [
			['Masque de cuir', 'Casque', 2, 1, 'FUR,ACC', '+5,-3'],
			['Brigandine', 'Torse', 2, 2, 'DEF,VIT', '+6,-2']
		],
		weapons: [['Arc court', 'Arme', 2, 1, 'Léger et maniable.'], ['Dague', 'Arme', 1, 1, 'Pour le corps à corps.']],
		money: 950,
		badges: [['Chronos', true], ['Lada', true], ['Shizari', false]],
		fusions: [['Chronos', 'Lada']]
	}
];

// ─── Monstres et PNJ ─────────────────────────────────────────────────────────

const statBlock = (pv, qdf, endurance, [maitrise, strength, defense, vitesse, accuracy], [perception, furtivite, charisme, eloquence, intelligence]) => ({
	pv, qdf, endurance, maitrise, strength, defense, vitesse, accuracy, perception, furtivite, charisme, eloquence, intelligence
});

const MONSTERS = [
	{ name: 'Loup des cendres', dragon: 'Goliath', size: '1,2 m', weight: '60 kg', dangerosity: 2, effect: 'Attaque en meute : +2 au d20 par loup adjacent à la cible.', description: 'Faible seul, dangereux en groupe.', stats: statBlock(900, 0, 900, [0, 35, 20, 60, 40], [60, 45, 5, 0, 10]), count: 2 },
	{ name: 'Golem de granit', dragon: 'Aqua', size: '3 m', weight: '2 t', dangerosity: 5, effect: 'Les attaques de Force de puissance 1 ne lui font que le minimum de dégâts.', description: 'Lent, mais presque impossible à entamer.', stats: statBlock(3600, 0, 2000, [0, 70, 75, 10, 30], [20, 0, 0, 0, 5]) },
	{ name: 'Spectre hurleur', dragon: 'Pestia', size: '2 m', weight: '—', dangerosity: 4, effect: 'Attaque de Maîtrise ; insensible aux armes ordinaires.', description: 'Un cri qui glace le sang.', stats: statBlock(1500, 2400, 0, [65, 5, 30, 55, 50], [70, 80, 0, 10, 40]) },
	{ name: 'Dragonnet de Chronos', dragon: 'Chronos', size: '4 m', weight: '800 kg', dangerosity: 8, effect: 'Boss : agit deux fois par tour.', description: 'Le temps se trouble autour de lui.', stats: statBlock(4500, 2400, 1800, [70, 75, 60, 65, 60], [75, 40, 50, 30, 70]) }
];

const MERCENARY = {
	name: 'Gaspard',
	title: 'Lame à louer',
	dragon: 'Pura',
	race: 'Humain',
	country: 'Saxifra',
	flux: 'Or',
	job: 'Mercenaire',
	description: 'PNJ neutre : peut rejoindre un camp ou l’autre pendant le combat.',
	stats: { qdf: 900, pv: 1800, endurance: 1000, maitrise: 25, strength: 55, defense: 45, vitesse: 50, accuracy: 55, perception: 50, furtivite: 35, charisme: 60, eloquence: 55, intelligence: 40 },
	passives: [{ name: 'Vénal', description: 'Se bat mieux quand il est bien payé.', active: true, statistics: 'FOR,CHA', maths: 'x1.1,-10' }]
};

// ─── Calcul des stats finales ────────────────────────────────────────────────
// Les jetons de la table gardent les stats finales (base + armure + passifs) : on reprend le calcul
// du site plutôt que de le recopier, en chargeant le module TypeScript à travers Vite.

async function loadRules() {
	const vite = await createServer({
		configFile: false,
		root: fileURLToPath(new URL('..', import.meta.url)),
		logLevel: 'silent',
		appType: 'custom',
		server: { middlewareMode: true, hmr: false, ws: false },
		optimizeDeps: { noDiscovery: true, include: [] }
	});
	try {
		const { sheetOf } = await vite.ssrLoadModule('/src/lib/game/sheet.ts');
		const { computeSheet } = await vite.ssrLoadModule('/src/lib/game/bonus.ts');
		return { sheetOf, computeSheet };
	} finally {
		await vite.close();
	}
}

/** Stats finales et part de l'armure, telles que les attend un jeton. */
function split(sheet) {
	const stats = {};
	const armor = {};
	for (const [key, line] of Object.entries(sheet)) {
		stats[key] = line.total;
		armor[key] = line.armor;
	}
	return { stats, armor };
}

// ─── Nettoyage ───────────────────────────────────────────────────────────────

async function clean() {
	await prisma.tableSession.deleteMany({ where: { name: { startsWith: TAG } } });
	await prisma.player.deleteMany({ where: { login: { startsWith: 'combat_' } } });
	await prisma.character.deleteMany({ where: { name: { startsWith: TAG } } });
	await prisma.monster.deleteMany({ where: { name: { startsWith: TAG } } });
	await prisma.item.deleteMany({ where: { name: { startsWith: TAG } } });
	await prisma.skill.deleteMany({ where: { name: { startsWith: TAG } } });
	await prisma.badge.deleteMany({ where: { name: { startsWith: TAG } } });
}

// ─── Création ────────────────────────────────────────────────────────────────

async function seedSkills() {
	await prisma.skill.createMany({
		data: Object.entries(SKILLS).flatMap(([statistics, [scale, tiers]]) =>
			tiers.map(([name, description], i) => ({
				statistics,
				level: STEPS[i] * scale,
				name: `${TAG} ${name}`,
				description
			}))
		)
	});
	await prisma.badge.createMany({
		data: BADGE_SKILLS.map(([badges, name, description]) => ({ badges, name: `${TAG} ${name}`, description }))
	});
}

const character = (hero, extra = {}) =>
	prisma.character.create({
		data: {
			name: `${TAG} ${hero.name}`,
			title: hero.title,
			visibility: 0,
			current: 0,
			flux: hero.flux,
			job: hero.job,
			dragon: hero.dragon,
			race: hero.race,
			country: hero.country,
			image: null,
			category: 'Test',
			description: hero.description,
			statistics: { create: hero.stats },
			passives: { create: hero.passives },
			...extra
		}
	});

async function seedHero(hero, hash) {
	const created = await character(hero);
	const account = ACCOUNTS[hero.account];
	const player = await prisma.player.create({
		data: {
			login: account.login,
			password: hash,
			role: account.role,
			team: 1,
			money: hero.money,
			characterId: created.id
		}
	});

	// Armure équipée, armes dans les mains, et une fiole de soin dans le sac.
	const inventory = [];
	for (const [name, category, rarity, weight, statistics, values] of hero.gear) {
		const item = await prisma.item.create({
			data: {
				name: `${TAG} ${name}`, category, rarity, weight,
				description: 'Équipement de test.',
				armors: { create: { name, statistics, values } }
			}
		});
		await prisma.itemInPlayer.create({ data: { itemId: item.id, playerId: player.id, localisation: 'main', equipped: true } });
		inventory.push({ container: 'main', equipped: true, quantity: 1, slot: category, bonus: { statistics, values }, item: { name, weight } });
	}
	for (const [name, category, rarity, weight, description] of hero.weapons) {
		const item = await prisma.item.create({ data: { name: `${TAG} ${name}`, category, rarity, weight, description } });
		await prisma.itemInPlayer.create({ data: { itemId: item.id, playerId: player.id, localisation: 'main' } });
	}
	const potion = await prisma.item.create({
		data: { name: `${TAG} Fiole de soin`, category: 'Fiole', rarity: 2, weight: 1, description: 'Rend 300 PV.' }
	});
	await prisma.itemInPlayer.create({ data: { itemId: potion.id, playerId: player.id, localisation: 'sac', quantity: 3 } });

	await prisma.playerBadge.createMany({
		data: hero.badges.map(([badge, used]) => ({ playerId: player.id, badge, used }))
	});
	await prisma.badgeFusion.createMany({
		data: hero.fusions.map(([badge1, badge2]) => ({ playerId: player.id, badge1, badge2 }))
	});

	return { player, character: created, hero, inventory };
}

async function seedTable(rules, heroes, mercenary, monsters) {
	const session = await prisma.tableSession.create({
		data: {
			name: `${TAG} Arène d’entraînement`,
			open: true,
			combat: true,
			orderVisible: true,
			obsKey: randomBytes(16).toString('hex'),
			order: [],
			ambiences: [],
			scenes: { create: { name: 'Arène', cols: 24, rows: 16, fog: [] } }
		},
		include: { scenes: true }
	});
	const scene = session.scenes[0];

	const token = (data) =>
		prisma.tableToken.create({
			data: {
				sessionId: session.id,
				sceneId: scene.id,
				pv: data.stats.pv,
				qdf: data.stats.qdf,
				endurance: data.stats.endurance,
				...data
			}
		});

	const tokens = [];
	// Les joueurs à gauche, en colonne.
	for (const [i, h] of heroes.entries()) {
		const sheet = rules.sheetOf(h.hero.stats, h.inventory, h.hero.passives);
		tokens.push(
			await token({
				kind: 'player',
				playerId: h.player.id,
				refId: h.character.id,
				name: h.hero.name,
				side: 'ally',
				revealed: true,
				x: 4,
				y: 5 + i * 2,
				...split(sheet)
			})
		);
	}

	// Le mercenaire au milieu, neutre.
	tokens.push(
		await token({
			kind: 'character',
			refId: mercenary.id,
			name: MERCENARY.name,
			side: 'neutral',
			x: 11,
			y: 3,
			...split(rules.computeSheet(MERCENARY.stats, [], MERCENARY.passives))
		})
	);

	// Les monstres à droite. Le golem est déjà entamé et le spectre a dépensé du flux, pour voir les jauges.
	let row = 4;
	for (const m of monsters) {
		const { stats, armor } = split(rules.computeSheet(m.def.stats));
		for (let n = 0; n < (m.def.count ?? 1); n++) {
			const name = m.def.count ? `${m.def.name} ${n + 1}` : m.def.name;
			const worn = m.def.name === 'Golem de granit' ? { pv: Math.round(stats.pv * 0.4) } : {};
			const drained = m.def.name === 'Spectre hurleur' ? { qdf: Math.round(stats.qdf * 0.15) } : {};
			tokens.push(
				await token({
					kind: 'monster',
					refId: m.monster.id,
					name,
					side: 'enemy',
					size: m.def.name === 'Dragonnet de Chronos' ? 2 : 1,
					x: m.def.name === 'Dragonnet de Chronos' ? 18 : 16,
					y: row,
					stats,
					armor,
					...worn,
					...drained
				})
			);
			row += m.def.name === 'Dragonnet de Chronos' ? 3 : 2;
		}
	}

	// Ordre de passage par Vitesse décroissante, comme le bouton « Trier » de la table.
	const order = [...tokens].sort((a, b) => b.stats.vitesse - a.stats.vitesse).map((t) => t.id);
	await prisma.tableSession.update({
		where: { id: session.id },
		data: { sceneId: scene.id, order, turn: order[0] }
	});
	await prisma.tableLog.create({
		data: { sessionId: session.id, kind: 'system', author: 'Table', text: 'Le combat commence !' }
	});
	return session;
}

async function seed() {
	const rules = await loadRules();
	await seedSkills();

	const hash = await bcrypt.hash(ACCOUNTS.guerriere.password, 10);
	await prisma.player.create({
		data: { login: ACCOUNTS.mj.login, password: await bcrypt.hash(ACCOUNTS.mj.password, 10), role: ACCOUNTS.mj.role, team: 0 }
	});
	const heroes = [];
	for (const hero of HEROES) heroes.push(await seedHero(hero, hash));

	const mercenary = await character(MERCENARY);
	const monsters = [];
	for (const def of MONSTERS) {
		const monster = await prisma.monster.create({
			data: {
				name: `${TAG} ${def.name}`,
				visibility: 1,
				current: 0,
				dragon: def.dragon,
				size: def.size,
				weight: def.weight,
				dangerosity: def.dangerosity,
				image: '',
				effect: def.effect,
				description: def.description,
				statistics: { create: def.stats }
			}
		});
		monsters.push({ monster, def });
	}

	return seedTable(rules, heroes, mercenary, monsters);
}

await clean();
if (process.argv.includes('--clean')) {
	console.log('Données de combat supprimées.');
} else {
	const session = await seed();
	console.log(
		[
			'Données de combat créées.',
			`  52 compétences (4 par stat), ${HEROES.length} joueurs, ${MONSTERS.length} monstres, 1 PNJ.`,
			`  Partie en combat : /outils/table/${session.id}`,
			`  MJ : ${ACCOUNTS.mj.login} / ${ACCOUNTS.mj.password}`,
			`  Joueurs : ${HEROES.map((h) => ACCOUNTS[h.account].login).join(', ')} / ${ACCOUNTS.guerriere.password}`
		].join('\n')
	);
}
await prisma.$disconnect();
