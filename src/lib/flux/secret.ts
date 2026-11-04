import { QUESTIONS } from './quiz-data';

// Le secret du don de flux. Il ne s'éveille que pour qui arrive par la page d'accueil (et non par
// la barre de navigation) : le titre de l'onglet le guide alors pas à pas (sur la constellation, sur
// la carte, puis le temps d'un survol : une porte, la bonne réponse de chaque étape). Les mêmes
// phrases s'affichent aussi en bulle au survol.
// Tout se règle ici : phrases, chemin de réponses, page secrète. Visible dans le code du
// navigateur, et c'est accepté : c'est un jeu de piste, pas un coffre-fort.

/** Titres de l'onglet (et bulles au survol), étape par étape, quand le secret est éveillé. */
export const SECRET_TITLES = {
	/** Sur la constellation des dragons */
	constellation: 'Relie-les, tu les connais.',
	/** Sur la carte du monde */
	map: 'Complète-les, ne te joue pas de moi.',
	/** Sur chacune des trois portes */
	door: 'Prends cette porte et suis-moi.'
};

export type SecretStep = {
	/** Numéro de la question (1 = la première) */
	question: number;
	/** Texte exact de la bonne réponse, tel qu'il est écrit dans quiz-data.ts */
	answer: string;
	/** Titre de l'onglet (et bulle) en survolant cette réponse */
	title: string;
};

/**
 * Le chemin : une bonne réponse par étape, dans l'ordre des questions. Une question absente de la
 * liste laisse libre. Le titre d'une étape n'apparaît que si toutes les étapes d'avant ont été
 * suivies ; la dernière bonne réponse mène à la page secrète, sans finir le test.
 *
 * Le test `quiz.test.ts` vérifie que chaque réponse existe bien dans sa question.
 */
// À CONFIRMER : chemin d'exemple, à remplacer par celui du porteur du projet.
export const SECRET_PATH: SecretStep[] = [
	{ question: 1, answer: 'Me balader', title: 'Par ici.' },
	{ question: 2, answer: '0%', title: 'Par là.' },
	{ question: 3, answer: 'Lunatique', title: 'Encore.' },
	{
		question: 4,
		answer: 'Vous hésitez longuement et vous finissez souvent par laisser le hasard choisir.',
		title: 'Plus loin.'
	},
	{ question: 5, answer: 'Mourir seule, paisiblement.', title: 'Suis-moi.' }
];

/** La page secrète (/flux/secret). */
// À CONFIRMER : texte provisoire.
export const SECRET_PAGE = {
	title: 'Tu m’as suivi.',
	paragraphs: [
		'Peu de voyageurs prennent la peine de passer par la grande porte. Toi, tu l’as fait.',
		'Ce que tu cherches n’est pas encore écrit. Reviens quand les fragments se seront assemblés.'
	]
};

// ---- Mécanique (rien à régler en dessous).

/** Clé posée par le lien de la page d'accueil, juste avant d'ouvrir /flux. */
const ORIGIN_KEY = 'flux_origine';
/** Clé posée une fois le chemin suivi jusqu'au bout : ouvre la page secrète. */
export const SECRET_UNLOCKED_KEY = 'flux_secret';
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
 * Bulle de la réponse `choice` à la question `index` (0 = la première), ou undefined si ce
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
