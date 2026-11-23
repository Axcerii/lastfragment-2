import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],

	optimizeDeps: {
		// three n'est importé que par la page Don de flux : sans cette ligne, Vite ne le découvre qu'à
		// la première visite de /flux (après un vidage de son cache) et recharge alors la page.
		include: ['three']
	},

	server: {
		// Compile dès le démarrage ce que toutes les pages chargent, pendant qu'on ouvre le navigateur.
		warmup: {
			ssrFiles: ['./src/hooks.server.ts', './src/routes/+layout.server.ts', './src/routes/+layout.svelte'],
			clientFiles: ['./src/routes/+layout.svelte']
		},
		// Dossiers sans code du site (build, sauvegardes, ancien client Prisma, sources de textures) :
		// inutile que le serveur de développement les surveille.
		watch: {
			ignored: ['**/build/**', '**/backups/**', '**/generated/**', '**/textures-sources/**']
		}
	}
});
