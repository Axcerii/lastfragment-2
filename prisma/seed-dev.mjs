// Jeu de données de développement : deux comptes et de quoi remplir une fiche de jeu complète.
//
//   node prisma/seed-dev.mjs          crée (ou recrée) les données
//   node prisma/seed-dev.mjs --clean  les supprime
//
// Tout ce qui est créé ici est préfixé « dev_ » ou « [dev] » pour être retiré sans toucher au reste.
// À ne jamais lancer sur la base de production : les mots de passe ci-dessous sont publics.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

if (process.env.NODE_ENV === 'production') {
	console.error('Refus : ce script est réservé au développement.');
	process.exit(1);
}

const prisma = new PrismaClient();
const TAG = '[dev]';

const ACCOUNTS = {
	mj: { login: 'dev_mj', password: 'DevMaitre2026', role: 10 },
	player: { login: 'dev_joueur', password: 'DevJoueur2026', role: 0 }
};

async function clean() {
	await prisma.player.deleteMany({ where: { login: { startsWith: 'dev_' } } });
	await prisma.itemInPlayer.deleteMany({ where: { item: { name: { startsWith: TAG } } } });
	await prisma.character.deleteMany({ where: { name: { startsWith: TAG } } });
	await prisma.item.deleteMany({ where: { name: { startsWith: TAG } } });
	await prisma.food.deleteMany({ where: { name: { startsWith: TAG } } });
	await prisma.skill.deleteMany({ where: { name: { startsWith: TAG } } });
	await prisma.badge.deleteMany({ where: { name: { startsWith: TAG } } });
}

async function seed() {
	const character = await prisma.character.create({
		data: {
			name: `${TAG} Mannequin`,
			title: "Cobaye d'entraînement",
			visibility: 0,
			current: 0,
			flux: 'Création de Paille',
			dragon: 'Goliath',
			race: 'Humain',
			country: 'Augeaime',
			image: '/uploads/personnages/placeholder.png',
			category: 'Test',
			description: 'Personnage factice servant à vérifier la fiche de jeu.\nIl ne ressent rien.',
			statistics: {
				create: {
					qdf: 1500, pv: 2100, endurance: 900,
					maitrise: 35, strength: 62, defense: 48, vitesse: 40, accuracy: 30,
					perception: 55, furtivite: 20, charisme: 45, eloquence: 60, intelligence: 72
				}
			},
			passives: {
				create: [
					{ name: 'Colosse', description: 'Sa carrure le rend plus fort, mais plus lent.', active: true, statistics: 'FOR,VIT', maths: 'x1.1,-5' },
					{ name: 'Alcoolique', description: 'En forme après un verre, diminué sans.', active: false, statistics: 'FOR,DEF', maths: 'x1.05,x1.05', inactiveMaths: 'x0.9,x0.9' }
				]
			}
		}
	});

	const hash = (password) => bcrypt.hash(password, 10);
	await prisma.player.create({
		data: { login: ACCOUNTS.mj.login, password: await hash(ACCOUNTS.mj.password), role: ACCOUNTS.mj.role, team: 0 }
	});
	const player = await prisma.player.create({
		data: {
			login: ACCOUNTS.player.login,
			password: await hash(ACCOUNTS.player.password),
			role: ACCOUNTS.player.role,
			team: 0,
			money: 12600,
			characterId: character.id
		}
	});

	const item = (name, category, rarity, weight, description, armor) =>
		prisma.item.create({
			data: {
				name: `${TAG} ${name}`, category, rarity, weight, description,
				armors: armor ? { create: { name, statistics: armor[0], values: armor[1] } } : undefined
			}
		});

	const casque = await item('Casque de fer', 'Casque', 2, 1, 'Un casque cabossé.', ['DEF,PER', '8,-3']);
	const plastron = await item('Plastron de fer', 'Torse', 3, 3, 'Lourd, mais solide.', ['DEF,VIT', '15,-10']);
	const sacADos = await item('Sac à dos', 'Torse', 1, 1, 'Double la capacité de port quand il est porté.', ['VIT', '-2']);
	const epee = await item('Épée de fer', 'Arme', 2, 2, 'Une lame simple.');
	const fiole = await item('Fiole de soin', 'Fiole', 4, 1, 'Rend un peu de santé.');
	const lettre = await item('Lettre scellée', 'Important', 5, 0, 'À remettre en main propre.');
	const sacNourriture = await item('Sac de nourriture', 'Sac', 1, 1, 'De quoi tenir quelques jours.');
	const minerai = await item('Minerai de fer', 'Materiaux', 1, 2, 'Brut.');

	const own = (it, localisation, extra = {}) =>
		prisma.itemInPlayer.create({ data: { itemId: it.id, playerId: player.id, localisation, ...extra } });

	await own(casque, 'main', { equipped: true });
	await own(plastron, 'main');
	await own(sacADos, 'coffre');
	await own(epee, 'main');
	await own(fiole, 'sac', { quantity: 3 });
	await own(lettre, 'sac');
	await own(minerai, 'cheval');
	const bag = await own(sacNourriture, 'sac');
	await prisma.itemInPlayer.create({ data: { itemId: minerai.id, playerId: null, localisation: 'commun', quantity: 4 } });

	const pain = await prisma.food.create({ data: { name: `${TAG} Pain`, weight: 1, type: 'rations', price: 2 } });
	const pomme = await prisma.food.create({ data: { name: `${TAG} Pomme`, weight: 1, type: 'fruits', price: 1 } });
	await prisma.foodInBag.createMany({
		data: [
			{ itemInPlayerId: bag.id, foodId: pain.id, quantity: 4 },
			{ itemInPlayerId: bag.id, foodId: pomme.id, quantity: 2 }
		]
	});

	await prisma.skill.createMany({
		data: [
			{ statistics: 'Force', level: 20, name: `${TAG} Poigne`, description: 'Porte une charge lourde sans effort.' },
			{ statistics: 'Force', level: 50, name: `${TAG} Frappe lourde`, description: 'Un coup qui fait reculer la cible.' },
			{ statistics: 'Force', level: 80, name: `${TAG} Briseur`, description: 'Brise une arme ou un bouclier adverse.' },
			{ statistics: 'Intelligence', level: 40, name: `${TAG} Analyse`, description: 'Repère une faiblesse chez un adversaire.' },
			{ statistics: 'Endurance', level: 600, name: `${TAG} Second souffle`, description: 'Récupère un peu d’endurance une fois par combat.' },
			{ statistics: 'Endurance', level: 1400, name: `${TAG} Infatigable`, description: 'Ignore la fatigue pendant un tour.' }
		]
	});

	await prisma.playerBadge.createMany({
		data: [
			{ playerId: player.id, badge: 'Goliath', used: true },
			{ playerId: player.id, badge: 'Aqua', used: true },
			{ playerId: player.id, badge: 'Drii' },
			{ playerId: player.id, badge: 'Drii' }
		]
	});
	await prisma.badgeFusion.create({ data: { playerId: player.id, badge1: 'Goliath', badge2: 'Aqua' } });
	await prisma.badge.create({
		data: { badges: 'Aqua:Goliath', name: `${TAG} Marée de boue`, description: 'Ralentit tous les ennemis proches pendant un tour.' }
	});
}

await clean();
if (process.argv.includes('--clean')) {
	console.log('Données de développement supprimées.');
} else {
	await seed();
	console.log(`Données de développement créées. Comptes : ${ACCOUNTS.mj.login} (MJ) et ${ACCOUNTS.player.login} (joueur) — mots de passe en tête de ce fichier.`);
}
await prisma.$disconnect();
