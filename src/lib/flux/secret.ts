import { gendered } from './address';
import { QUESTIONS } from './quiz-data';
import type { RaceId } from './races';

// Le secret du don de flux. Il ne s'éveille que pour qui arrive par la page d'accueil (et non par
// la barre de navigation) : le titre de l'onglet le guide alors pas à pas. Sur la constellation, sur
// la carte, puis le temps d'un survol : la bonne porte, et la bonne réponse de chaque question.
// Tout se règle ici : phrases, bonne porte, chemin de réponses. Visible dans le code du navigateur,
// et c'est accepté : c'est un jeu de piste. La page secrète, elle, est gardée par le serveur
// ($lib/server/flux/secret.ts, où se trouve aussi son texte) : impossible d'y entrer par l'adresse.

/** Titres de l'onglet, étape par étape, quand le secret est éveillé. */
export const SECRET_TITLES = {
	/** Sur la constellation des dragons */
	constellation: 'Relie-les, tu les connais.',
	/** Sur la carte du monde */
	map: 'Complète-les, ne te joue pas de moi.',
	/** En survolant la bonne porte (SECRET_DOOR) */
	door: 'Prends cette porte et suis-moi.'
};

/** La bonne porte : 'humain', 'geant' ou 'eternelle'. Le chemin des réponses ne vaut que par elle. */
// À CONFIRMER : porte d'exemple.
export const SECRET_DOOR: RaceId = 'eternelle';

export type SecretStep = {
	/** Numéro de la question (1 = la première) */
	question: number;
	/** Texte exact de la bonne réponse, tel qu'il s'affiche au masculin (quiz-data.ts, voir address.ts) */
	answer: string;
	/** Titre de l'onglet en survolant cette réponse */
	title: string;
};

/**
 * Le chemin : une bonne réponse par question, dans l'ordre, sur tout le test (une question absente
 * de la liste laisserait libre). Le titre d'une étape n'apparaît que si toutes les étapes d'avant
 * ont été suivies ; la dernière bonne réponse mène à la page secrète au lieu du certificat.
 *
 * Chaque réponse est celle qu'un être omniscient choisirait. Sa place à l'écran varie d'une
 * question à l'autre (en haut ou en bas, à gauche ou à droite), pour que le chemin ne se devine pas.
 *
 * Le test `secret.test.ts` vérifie que chaque réponse existe bien dans sa question.
 */
export const SECRET_PATH: SecretStep[] = [
	// 1. … tu te réveilles, allongé, dans un champ de... (la fleur du sommeil et des songes)
	{ question: 1, answer: 'Coquelicots', title: 'Par ici.' },
	// 2. … tu plisses les yeux vers l'horizon, le soleil... (l'heure où tout est éclairé)
	{ question: 2, answer: 'Est au zénith', title: 'Par là.' },
	// 3. … La silhouette est celle... (la soif de tout savoir)
	{ question: 3, answer: "d'une enfant un peu trop curieuse", title: 'Encore.' },
	// 4. … la personne fouille dans sa besace et te tend... (le fruit de la connaissance)
	{ question: 4, answer: 'une pomme dans un état immaculé', title: 'Plus loin.' },
	// 5. Ton premier réflexe en voyant cet acte de bonté innocent est... (il sait qu'il n'y a pas de piège)
	{ question: 5, answer: "d'accepter et de le manger sans plus attendre", title: 'Suis-moi.' },
	// 6. … tu essaies de te remémorer... (qui sait tout ne trouve jamais le sommeil)
	{ question: 6, answer: "Tu t'es endormi après une balade pour soigner une énième insomnie", title: 'Ne t’arrête pas.' },
	// 7. Il t'indique l'emplacement d'un village… Tu... (le chemin, il le connaît déjà)
	{ question: 7, answer: 'remercies, mais tu préfères suivre ta propre voie et prendre un chemin que tu connais', title: 'Par ici.' },
	// 8. … tu peux y observer le reflet... (qui a tout n'a plus rien à désirer)
	{ question: 8, answer: "d'un vagabond lambda sans aucune ambition", title: 'Tu me vois ?' },
	// 9. … y cherches de l'aide en... (il sait qui détient la réponse)
	{ question: 9, answer: "parlant à un habitant de la zone, c'est le plus rapide et le plus simple", title: 'Par là.' },
	// 10. … tu te recueilles sur l'autel... (il sait qui a créé le monde)
	{ question: 10, answer: 'Le seul véritable Dieu, le Dieu Créateur', title: 'Continue.' },
	// 11. … tu planifies ton départ pour... (il lit le monde plutôt que les horaires des hommes)
	{ question: 11, answer: "tu regardes la position du soleil, et tu t'adaptes en fonction", title: 'Plus profond.' },
	// 12. … ton arme de prédilection, ... (l'équilibre)
	{ question: 12, answer: "une épée, l'arme des héros, équilibrée, pratique sans être encombrante", title: 'Par ici.' },
	// 13. … tu as pour t'accompagner... (il lit dans les cœurs : seule la loyauté d'un chien est sans arrière-pensée)
	{ question: 13, answer: 'ton chien de chasse, ton véritable meilleur ami', title: 'Écoute.' },
	// 14. … un cri de détresse… tu... (il sait déjà ce qui l'attend dans les bois)
	{ question: 14, answer: 'prends ton arme, et tu cours aider la personne sans attendre', title: 'Par là.' },
	// 15. … une porte utilisant une technologie nordique, tu... (l'énigme n'en est pas une pour lui)
	{ question: 15, answer: 'te poses et essaies de trouver une solution à cette énigme.', title: 'Tu chauffes, ici.' },
	// 16. … face à un meurtrier, il est grièvement blessé, tu... (il connaît chaque vie, la sienne aussi)
	{ question: 16, answer: 'abrèges ses souffrances, dans une tristesse profonde de devoir en arriver là', title: 'Ne te retourne pas.' },
	// 17. … tu te poses dans une taverne, tu commandes... (l'insomnie, encore)
	{ question: 17, answer: 'un petit thé, pour bien dormir ensuite', title: 'Presque.' },
	// 18. … tu aurais aimé avoir en récompense... (il ne manque de rien)
	{ question: 18, answer: 'rien, cette étrange aventure et le sourire des personnes sur le chemin en valaient la peine', title: 'Encore un pas.' },
	// 19. … tu décides de te reprendre en main et de...
	{ question: 19, answer: "trouver la vérité sur le flux et la magie, devenir un scientifique, c'est ce qui te fait vibrer", title: 'Entre.' }
];

// ---- Mécanique (rien à régler en dessous).

/** Clé posée par le lien de la page d'accueil, juste avant d'ouvrir /flux. */
const ORIGIN_KEY = 'flux_origine';
/** Le passage par l'accueil ne vaut que pour la navigation qui suit (ms). */
const ORIGIN_MAX_AGE = 60_000;

/** Lien « Ton don de flux » de l'accueil : marque l'arrivée par la grande porte. */
export function markFromHome() {
	try {
		localStorage.setItem(ORIGIN_KEY, String(Date.now()));
	} catch {
		// Stockage indisponible : pas de secret, rien de grave.
	}
}

/** Lu une fois à l'ouverture de /flux : vrai si l'on vient de l'accueil. La marque est effacée. */
export function consumeFromHome(): boolean {
	try {
		const at = Number(localStorage.getItem(ORIGIN_KEY));
		localStorage.removeItem(ORIGIN_KEY);
		return at > 0 && Date.now() - at < ORIGIN_MAX_AGE;
	} catch {
		return false;
	}
}

const answerIndex = (step: SecretStep) =>
	QUESTIONS[step.question - 1]?.answers.findIndex((a) => gendered(a.text) === step.answer) ?? -1;

/** Vrai si les réponses données (indices, question par question) suivent le chemin jusqu'ici. */
export function onSecretPath(answers: number[]): boolean {
	return SECRET_PATH.every((step) => step.question > answers.length || answers[step.question - 1] === answerIndex(step));
}

/**
 * Titre de l'onglet pour la réponse `choice` à la question `index` (0 = la première), ou undefined si ce
 * n'est pas la bonne réponse ou si le chemin a déjà été quitté.
 */
export function secretTitle(answers: number[], index: number, choice: number): string | undefined {
	const step = SECRET_PATH.find((s) => s.question === index + 1);
	if (!step || answerIndex(step) !== choice || !onSecretPath(answers.slice(0, index))) return undefined;
	return step.title;
}

/** Vrai si ces réponses viennent d'achever le chemin. */
export function secretComplete(answers: number[]): boolean {
	const last = SECRET_PATH.at(-1);
	return !!last && answers.length === last.question && onSecretPath(answers);
}
