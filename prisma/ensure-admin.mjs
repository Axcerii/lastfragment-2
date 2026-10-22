// Garantit l'existence du compte MJ décrit par ADMIN_LOGIN et ADMIN_PASSWORD.
// Lancé à chaque démarrage du conteneur ; utilisable aussi à la main : node prisma/ensure-admin.mjs
//
// - Le compte n'existe pas : il est créé avec le rôle MJ.
// - Il existe déjà : il est promu MJ si besoin, son mot de passe n'est pas touché.
//   (Pour le réinitialiser, ajouter ADMIN_RESET_PASSWORD=true le temps d'un démarrage.)
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const ROLE_ADMIN = 10;
const MIN_PASSWORD_LENGTH = 12;
const BCRYPT_ROUNDS = 12;

const login = process.env.ADMIN_LOGIN?.trim();
const password = process.env.ADMIN_PASSWORD ?? '';
const reset = process.env.ADMIN_RESET_PASSWORD === 'true';

if (!login) {
	console.log('[admin] ADMIN_LOGIN non défini : aucun compte MJ créé automatiquement.');
	process.exit(0);
}

const prisma = new PrismaClient();
try {
	const existing = await prisma.player.findUnique({ where: { login } });

	if (!existing || reset) {
		if (password.length < MIN_PASSWORD_LENGTH) {
			console.error(`[admin] ADMIN_PASSWORD doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.`);
			process.exit(1);
		}
	}

	if (!existing) {
		await prisma.player.create({
			data: { login, password: await bcrypt.hash(password, BCRYPT_ROUNDS), role: ROLE_ADMIN, team: 0 }
		});
		console.log(`[admin] Compte MJ « ${login} » créé.`);
	} else {
		await prisma.player.update({
			where: { id: existing.id },
			data: { role: ROLE_ADMIN, ...(reset ? { password: await bcrypt.hash(password, BCRYPT_ROUNDS) } : {}) }
		});
		console.log(
			`[admin] Compte MJ « ${login} » déjà présent${reset ? ', mot de passe réinitialisé' : ''}.`
		);
	}
} finally {
	await prisma.$disconnect();
}
