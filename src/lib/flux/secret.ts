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
	/** Texte exact de la bonne réponse, tel qu'il est écrit dans quiz-data.ts */
	answer: string;
	/** Titre de l'onglet en survolant cette réponse */
	title: string;
};

/**
 * Le chemin : une bonne réponse par question, dans l'ordre, sur tout le test (une question absente
 * de la liste laisserait libre). Le titre d'une étape n'apparaît que si toutes les étapes d'avant
 * ont été suivies ; la dernière bonne réponse mène à la page secrète au lieu du certificat.
 *
 * Le test `secret.test.ts` vérifie que chaque réponse existe bien dans sa question.
 */
// À CONFIRMER : chemin d'exemple sur tout le test, à remplacer par celui du porteur du projet.
export const SECRET_PATH: SecretStep[] = [
	// 1. Tes paupières sont lourdes, une odeur douce et familière dilate tes narines, tu te réveilles, allongé, dans un champ de...
	{ question: 1, answer: 'Coquelicots', title: 'Par ici.' },
	// 2. Tu te relèves, tu dépoussières ton équipement, tu plisses les yeux vers l'horizon, le soleil...
	{ question: 2, answer: "N'est plus visible", title: 'Par là.' },
	// 3. Une ombre se glisse dans la pénombre jusqu'à toi, tes yeux finissent par s'adapter à la lumière. La silhouette est celle...
	{ question: 3, answer: "d'une enfant un peu trop curieuse", title: 'Encore.' },
	// 4. Observant ta confusion, la personne fouille dans sa besace et te tend...
	{ question: 4, answer: 'une pomme dans un état immaculé', title: 'Plus loin.' },
	// 5. Ton premier réflexe en voyant cet acte de bonté innocent est...
	{ question: 5, answer: 'de le refuser poliment.', title: 'Suis-moi.' },
	// 6. Le bienfaiteur te demande comment tu as fini dans cette situation, tu prends une inspiration et tu essaies de te remémorer...
	{ question: 6, answer: "Tu as été téléporté par une magie étrange, tu ne fais jamais rien d'inconscient", title: 'Ne t’arrête pas.' },
	// 7. Il t'indique l'emplacement d'un village à proximité où tu pourras trouver de l'aide. Tu...
	{ question: 7, answer: "ignores ce qu'il dit, le vagabondage a toujours été la meilleure des vertus", title: 'Par ici.' },
	// 8. Sur ton chemin, tu croises un lac, tu y remplis ta gourde, en te penchant, tu peux y observer le reflet...
	{ question: 8, answer: "d'un vagabond lambda sans aucune ambition", title: 'Tu me vois ?' },
	// 9. Au loin, le portail d'un hameau de campagne se dresse, tu t'en approches et y cherches de l'aide en...
	{ question: 9, answer: "parcourant la ville à la recherche d'une carte, les autres ne doivent pas perdre leur temps à cause de ton erreur", title: 'Par là.' },
	// 10. Tu passes devant l'église du village, tu te recueilles sur l'autel...
	{ question: 10, answer: "Aucun dieu, tu n'es pas du genre religieux", title: 'Continue.' },
	// 11. Tu as obtenu les informations dont tu avais besoin, tu planifies ton départ pour...
	{ question: 11, answer: "tu regardes la position du soleil, et tu t'adaptes en fonction", title: 'Plus profond.' },
	// 12. Tu te prépares à partir, tu récupères des vivres, tu resserres ton équipement et tu poses ta main sur ton arme de prédilection, ...
	{ question: 12, answer: 'une simple dague, rapide, discrète, létale, un véritable utilitaire', title: 'Par ici.' },
	// 13. Le chemin est long, et la solitude est forte, heureusement, tu as pour t'accompagner...
	{ question: 13, answer: 'ton casse-croûte, cette solitude est un véritable confort pour toi', title: 'Écoute.' },
	// 14. Dans ton sommeil, tu entends un cri de détresse provenant des bois à proximité de toi, tu...
	{ question: 14, answer: "te rendors, ce n'est peut-être qu'un renard, et au pire, tu ne dois rien à qui que ce soit", title: 'Par là.' },
	// 15. Dans ton périple, tu trouves une entrée de grotte avec une porte utilisant une technologie nordique, tu...
	{ question: 15, answer: "pars, il est dangereux d'ouvrir des ruines nordiques sans être préparé", title: 'Tu chauffes, ici.' },
	// 16. Tu te retrouves face à un meurtrier, il est grièvement blessé, tu...
	{ question: 16, answer: "le laisses mourir, sans montrer d'émotion, il ne faut pas lui laisser le plaisir de t'affecter", title: 'Ne te retourne pas.' },
	// 17. Te voilà rentré chez toi après cette intense aventure, tu te poses dans une taverne, tu commandes...
	{ question: 17, answer: 'un petit thé, pour bien dormir ensuite', title: 'Presque.' },
	// 18. Si tout cela était une mission officielle, tu aurais aimé avoir en récompense...
	{ question: 18, answer: 'rien, cette étrange aventure et le sourire des personnes sur le chemin en valaient la peine', title: 'Encore un pas.' },
	// 19. Finalement, tu t'allonges dans ton lit et tu repenses à ta vie, tu décides de te reprendre en main et de...
	{ question: 19, answer: "trouver la vérité sur le flux et la magie, devenir un scientifique, c'est ce qui te fait vibrer", title: 'Entre.' },
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
	QUESTIONS[step.question - 1]?.answers.findIndex((a) => a.text === step.answer) ?? -1;

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
