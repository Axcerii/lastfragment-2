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
};

// À CONFIRMER : phrases provisoires.
export const RACES: Race[] = [
	{
		id: 'humain',
		name: 'Humain',
		color: '#5b8cff',
		symbols: ['/layout/Logo.svg'],
		motto: "Le peuple le plus nombreux d'Aeteria, et celui que le flux traverse le plus.",
		reveal: 'Tu es né humain. Ton flux s’éveillera tôt, et ne te quittera plus.'
	},
	{
		id: 'geant',
		name: 'Géant',
		color: '#f2f2f2',
		symbols: ['/icones/pays/Saxifra.svg', '/icones/pays/Irisia.svg'],
		motto: 'Les peuples du Nord, dont la peau encaisse ce que le flux ne leur donne pas.',
		reveal: 'Tu es né géant. Le flux ne coule pas en toi… mais il sait qui tu aurais pu être.',
		resultNote: "Les géants ne canalisent pas le flux : voici celui qui t'aurait été destiné."
	},
	{
		id: 'eternelle',
		name: 'Éternelle',
		color: '#5fe0a0',
		symbols: ['/icones/pays/Edenia.svg', '/icones/pays/Mudan.svg'],
		motto: 'Ceux que le temps oublie, et qui ne vieillissent qu’à peine.',
		reveal: 'Tu es né éternel. Tu auras tout le temps d’apprendre à maîtriser ton flux.'
	}
];

/** Lueur où se rejoignent Humains et Géants : la possibilité d'un demi-géant. */
export const HALF_GIANT_COLOR = '#a9d8ff';

export const raceById = (id: unknown) => RACES.find((r) => r.id === id) ?? null;
