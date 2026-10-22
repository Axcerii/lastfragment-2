// Garantit l'existence du compte MySQL utilisé par le site, avec les seuls droits de lecture
// et d'écriture des données (SELECT, INSERT, UPDATE, DELETE) : pas de DROP, pas d'ALTER.
// Lancé par le service `migrate` avec le compte root, à chaque démarrage ; le mot de passe
// du compte est remis à MYSQL_APP_PASSWORD, ce qui permet de le changer dans le .env.
import { PrismaClient } from '@prisma/client';

const rootUrl = process.env.ROOT_DATABASE_URL;
const database = process.env.MYSQL_DATABASE ?? 'lastfragment';
const user = process.env.MYSQL_APP_USER ?? 'lastfragment_app';
const password = process.env.MYSQL_APP_PASSWORD ?? '';

const IDENTIFIER = /^[A-Za-z0-9_]{1,32}$/;
const MIN_PASSWORD_LENGTH = 16;

if (!rootUrl) {
	console.error('[base] ROOT_DATABASE_URL manquant : impossible de créer le compte du site.');
	process.exit(1);
}
if (!IDENTIFIER.test(user) || !IDENTIFIER.test(database)) {
	console.error('[base] MYSQL_APP_USER et MYSQL_DATABASE : lettres, chiffres et _ uniquement.');
	process.exit(1);
}
if (password.length < MIN_PASSWORD_LENGTH) {
	console.error(`[base] MYSQL_APP_PASSWORD doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.`);
	process.exit(1);
}

// Les mots de passe ne passent pas en paramètre dans CREATE USER : on échappe les guillemets.
const quoted = `'${password.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const account = `'${user}'@'%'`;

const prisma = new PrismaClient({ datasourceUrl: rootUrl });
try {
	await prisma.$executeRawUnsafe(`CREATE USER IF NOT EXISTS ${account} IDENTIFIED BY ${quoted}`);
	await prisma.$executeRawUnsafe(`ALTER USER ${account} IDENTIFIED BY ${quoted}`);
	// On repart de zéro pour qu'un droit ajouté à la main ne survive pas au redémarrage.
	await prisma.$executeRawUnsafe(`REVOKE ALL PRIVILEGES, GRANT OPTION FROM ${account}`);
	await prisma.$executeRawUnsafe(`GRANT SELECT, INSERT, UPDATE, DELETE ON \`${database}\`.* TO ${account}`);
	console.log(`[base] Compte « ${user} » prêt (lecture et écriture des données uniquement).`);
} finally {
	await prisma.$disconnect();
}
