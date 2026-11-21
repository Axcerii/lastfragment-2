// Serveur de production (`node server.js`, lancé par docker/entrypoint.sh) : le gestionnaire
// d'adapter-node, plus une durée de cache pour les fichiers de static/ (images, icônes, sons).
//
// adapter-node envoie ces fichiers sans Cache-Control. Le navigateur devine alors lui-même une
// durée (10 % de l'âge du fichier), puis redemande chaque image une à une : d'où des pages qui
// rechargent toutes leurs images tous les jours ou deux, sans que rien ait changé.
import http from 'node:http';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { handler } from './build/handler.js';

// Un jour sans rien redemander. Pendant les 30 jours suivants, l'image en cache s'affiche tout de
// suite et le navigateur vérifie en arrière-plan si elle a changé : une image remplacée sous le
// même nom apparaît donc au plus tard à la visite suivante.
const STATIC_CACHE = 'public, max-age=86400, stale-while-revalidate=2592000';
// Laisse finir les requêtes en cours à l'arrêt, sous les 10 s qu'accorde `docker stop`.
const SHUTDOWN_GRACE_MS = 5000;

/** Adresses (/dragons/…) des fichiers copiés depuis static/, hors /_app (géré par SvelteKit). */
function staticPaths(dir, prefix = '', found = new Set()) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const url = `${prefix}/${entry.name}`;
		if (entry.isDirectory()) {
			if (url !== '/_app') staticPaths(path.join(dir, entry.name), url, found);
		} else {
			found.add(url);
		}
	}
	return found;
}

const STATIC = staticPaths(fileURLToPath(new URL('./build/client', import.meta.url)));

const server = http.createServer((req, res) => {
	if (req.method === 'GET' || req.method === 'HEAD') {
		let pathname = (req.url ?? '/').split('?')[0];
		try {
			pathname = decodeURIComponent(pathname);
		} catch {
			// Adresse mal encodée : ce n'est pas un fichier connu.
		}
		// Posé avant que sirv (le serveur de fichiers d'adapter-node) écrive sa réponse, qui le garde.
		if (STATIC.has(pathname)) res.setHeader('Cache-Control', STATIC_CACHE);
	}
	handler(req, res, () => {
		res.statusCode = 404;
		res.end();
	});
});

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';
server.listen(port, host, () => console.log(`Listening on http://${host}:${port}`));

function shutdown() {
	server.closeIdleConnections();
	server.close(() => process.exit(0));
	// Les flux temps réel de la table de jeu ne se ferment pas d'eux-mêmes.
	setTimeout(() => server.closeAllConnections(), SHUTDOWN_GRACE_MS).unref();
}
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
