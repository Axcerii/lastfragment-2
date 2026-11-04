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
	// 1. Quelle activité préférez-vous réaliser durant votre temps libre ?
	{ question: 1, answer: 'Me balader', title: 'Par ici.' },
	// 2. À quel point te connais-tu ?
	{ question: 2, answer: '0%', title: 'Par là.' },
	// 3. Les gens vous considèrent :
	{ question: 3, answer: 'Lunatique', title: 'Encore.' },
	// 4. Lorsque vous prenez une décision simple :
	{ question: 4, answer: 'Vous hésitez longuement et vous finissez souvent par laisser le hasard choisir.', title: 'Plus loin.' },
	// 5. Quelle mort vous convient le plus parmi celle-ci :
	{ question: 5, answer: 'Mourir seule, paisiblement.', title: 'Suis-moi.' },
	// 6. Ce soir, je regarde :
	{ question: 6, answer: "Une série/dessin animé d'exploration, pour rêver.", title: 'Ne t’arrête pas.' },
	// 7. Vous arrivez chez un collègue, il vous propose par courtoisie si vous souhaitez un thé ou un café :
	{ question: 7, answer: "Vous prenez l'un ou l'autre et le buvez malgré le fait que vous n'aimiez ni l'un, ni l'autre", title: 'Par ici.' },
	// 8. Noir ou blanc ? Ange ou Démon ?
	{ question: 8, answer: 'Caramel au beurre salé avec supplément crème fouettée.', title: 'Tu me vois ?' },
	// 9. Vous arrivez dans une crêperie, vous commandez :
	{ question: 9, answer: "J'ai déjà répondu à cette question juste avant.", title: 'Par là.' },
	// 10. Votre couleur préféré de l'arc en ciel :
	{ question: 10, answer: 'Violet', title: 'Continue.' },
	// 11. Le plus important dans une oeuvre c'est :
	{ question: 11, answer: 'Son originalité', title: 'Plus profond.' },
	// 12. Aimez vous être au centre de l'attention ?
	{ question: 12, answer: 'Pas du tout', title: 'Par ici.' },
	// 13. Dans un groupe de rock, vous seriez :
	{ question: 13, answer: 'Bassiste', title: 'Écoute.' },
	// 14. Selon toi l'intelligence est :
	{ question: 14, answer: 'La capacité à comprendre', title: 'Par là.' },
	// 15. Quelle saison vous représente le mieux :
	{ question: 15, answer: 'Hiver', title: 'Il fait froid, ici.' },
	// 16. Dans un film d'horreur, vous seriez :
	{ question: 16, answer: 'Le premier à mourir', title: 'Encore.' },
	// 17. Lorsque vous avez une série de tâches à effectuer :
	{ question: 17, answer: 'Vous les commencez toutes en même temps et peiné à en finir une.', title: 'Ne te retourne pas.' },
	// 18. Quelle est votre plus grande peur :
	{ question: 18, answer: 'Vous-même', title: 'Par ici.' },
	// 19. Quel trait de caractère les personnes vous attribuent elles :
	{ question: 19, answer: 'Excentrique', title: 'Presque.' },
	// 20. Vous trouvez une créature inconnue, que faites vous ?
	{ question: 20, answer: "J'observe ses habitudes et je la laisse tranquille.", title: 'Observe.' },
	// 21. Vous avez eu une mauvaise note à un examen que vous avez un peu préparé, qui aura potentiellement un impact sur vos futurs résultats :
	{ question: 21, answer: "Vous souriez comme si ce malheureux évènement n'avait jamais eu lieu.", title: 'Souris.' },
	// 22. Une maladie infecte et tue 1 / 1 000 000, tu peux endiguer la maladie en te sacrifiant, le ferais-tu ?
	{ question: 22, answer: 'Oui', title: 'Par là.' },
	// 23. Quel péché capital te représente le plus ;
	{ question: 23, answer: 'Orgueil', title: 'Tu me ressembles.' },
	// 24. Quel est la chose la plus dévastatrice sur terre :
	{ question: 24, answer: 'Le Pouvoir', title: 'Encore un pas.' },
	// 25. Que signifie 'entropie' :
	{ question: 25, answer: 'Le Chaos', title: 'Entre.' },
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
