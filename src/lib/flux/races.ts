// Les trois portails de /flux : le visiteur choisit sa race avant le test de flux.
// Humains et Géants se rejoignent (un demi-géant peut exister) ; les Éternelles restent à part.

export type RaceId = 'humain' | 'geant' | 'eternelle';

export type Race = {
	id: RaceId;
	name: string;
	/** Couleur du néon du portail et du fil pendant le test */
	color: string;
	/** Symboles posés sur le portail */
	symbols: string[];
	/** Phrase inscrite sur le portail */
	motto: string;
	/** Phrase dévoilée une fois le portail choisi */
	reveal: string;
	/** Mot ajouté au résultat (les géants n'ont pas de flux) */
	resultNote?: string;
	/** Dragons plus probables au test pour ce peuple (poids × FAVORED_BONUS, dans quiz.ts) */
	favored?: string[];
};

// À CONFIRMER : phrases provisoires.
export const RACES: Race[] = [
	{
		id: 'humain',
		name: 'Humain',
		color: '#5b8cff',
		symbols: ['/layout/Logo.svg'],
		motto: "Le peuple le plus nombreux d'Arthera, ceux qui innovent.",
		reveal: 'Tu es né humain. Ton flux s’éveillera tôt, et ne te quittera plus.'
	},
	{
		id: 'geant',
		name: 'Géant',
		color: '#f2f2f2',
		symbols: ['/icones/pays/Saxifra.svg', '/icones/pays/Irisia.svg'],
		motto: 'Le peuple dont rien ne traverse la peau, pas même le flux, ceux qui façonnent.',
		reveal: 'Tu es né géant. Le flux ne coule pas en toi… mais il sait qui tu aurais pu être.',
		favored: ['Pura', 'Drii', 'Aqua', 'Lada', 'Goliath'],
		resultNote: "Les géants ne canalisent pas le flux, mais le monde d'Arthera est plein de surprises : voici le flux que tu aurais pu avoir."
	},
	{
		id: 'eternelle',
		name: 'Éternelle',
		color: '#5fe0a0',
		symbols: ['/icones/pays/Edenia.svg', '/icones/pays/Mudan.svg'],
		motto: 'Ceux que Chronos oublie, et qui ne vieillissent qu’à peine, ceux qui transmettent.',
		reveal: 'Tu es né éternelle. Tu auras tout le temps d’apprendre à maîtriser ton flux.',
		favored: ['Guizamark', 'Shizari', 'Chronos', 'Pestia']
	}
];

/** Lueur où se rejoignent Humains et Géants : la possibilité d'un demi-géant. */
export const HALF_GIANT_COLOR = '#a9d8ff';

export const raceById = (id: unknown) => RACES.find((r) => r.id === id) ?? null;
