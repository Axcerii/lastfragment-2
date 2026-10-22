import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Serveur Node autonome (`node build`), utilisé par l'image Docker.
		adapter: adapter(),

		// Politique de sécurité du contenu : seuls les scripts du site s'exécutent (SvelteKit ajoute
		// lui-même l'empreinte de ses scripts en ligne). Dernier rempart si une faille XSS apparaissait.
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ['self'],
				'script-src': ['self'],
				'style-src': ['self', 'unsafe-inline', 'https://fonts.googleapis.com'],
				'font-src': ['self', 'https://fonts.gstatic.com'],
				// blob: : aperçu de l'image choisie dans le créateur de personnage.
				'img-src': ['self', 'data:', 'blob:'],
				// Musiques, ambiances et calques vidéo de la table de jeu.
				'media-src': ['self', 'blob:'],
				'connect-src': ['self'],
				'object-src': ['none'],
				'base-uri': ['self'],
				'form-action': ['self'],
				'frame-ancestors': ['none']
			}
		}
	}
};

export default config;
