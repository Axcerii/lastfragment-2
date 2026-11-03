import { DRAGONS, type DragonName } from '$lib/flux/discovery';

// Ordre de la Genèse : c'est la réponse de la constellation, elle ne quitte jamais le serveur.
const ORDER: DragonName[] = [
	'Artrish',
	'Yinva',
	'Guizamark',
	'Shizari',
	'Pestia',
	'Chronos',
	'Aqua',
	'Goliath',
	'Drii',
	'Lada',
	'Pura'
];

// L'indice n mène au dragon n de l'ordre. Écrits pour qui ne connaît pas le monde : chaque dragon
// a autant de sommets que son rang, l'indice met sur la piste sans le nommer.
// Ils se dévoilent un à un, après un premier échec.
const HINTS = [
	"Au commencement, il n'y avait qu'un seul.",
	'Puis vint son reflet : deux, face à face.',
	'Trois pointes soutiennent la vie.',
	'Quatre coins enferment le trépas.',
	'Cinq étoiles éclairent la nuit.',
	'Six sommets retiennent le sable du temps.',
	'Le septième coule, goutte après goutte.',
	"Huit côtés, forgés comme l'acier.",
	'Neuf rayons brûlent au cœur de la flamme.',
	'Dix côtés tournent dans la tempête.',
	'Onze, et la boucle est bouclée.'
];

// Pays à deviner : chacun porte le nom d'une fleur, que son énigme décrit. Le nom du pays comme
// celui de la fleur sont acceptés. Les réponses sont comparées sans majuscules, accents, espaces,
// tirets ni apostrophes.
const SECRETS: Record<string, { answers: string[]; description: string }> = {
	irisia: {
		answers: ['irisia', 'irysia', 'iris', 'irys'],
		description: "Irisia, la terre du sud. Elle tient son nom de l'iris."
	},
	amari: {
		answers: ['amari', 'amary', 'amaryllis', 'amarylis', 'amarilis', 'amaryllys', 'amarillys'],
		description: "Amari, la terre du sud-ouest. Elle tient son nom de l'amaryllis."
	},
	saxifra: {
		answers: ['saxifra', 'saxyfra', 'saxifrage', 'saxifrages', 'saxifraga'],
		description: 'Saxifra, la terre du nord. Elle tient son nom de la saxifrage, la fleur qui brise la pierre.'
	},
	edenia: {
		answers: ['edenia', 'eden', 'paradis', 'paradise', 'oiseau de paradis', 'oiseau du paradis', 'strelitzia'],
		description: "Edenia, la terre du nord-ouest. Elle tient son nom de l'oiseau de paradis."
	},
	mudan: {
		answers: ['mudan', 'pivoine', 'pivoines', 'peony', '牡丹'],
		description: 'Mudan, la terre de l’est. Elle tient son nom de la pivoine, « mǔdān » en chinois.'
	}
};

const normalize = (text: string) =>
	text
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.toLowerCase()
		.replace(/[\s'’-]+/g, '');

/** Longueur du début de séquence qui suit l'ordre attendu. */
function validPrefix(sequence: string[]): number {
	let n = 0;
	while (n < sequence.length && sequence[n] === ORDER[n]) n++;
	return n;
}

export function isDragon(name: unknown): name is DragonName {
	return typeof name === 'string' && (DRAGONS as readonly string[]).includes(name);
}

/**
 * Vérifie une séquence de dragons cliqués, et renvoie les indices débloqués jusqu'au prochain
 * dragon à trouver (la page ne les montre qu'après un premier échec).
 */
export function checkConstellation(sequence: DragonName[]) {
	const prefix = validPrefix(sequence);
	return {
		valid: prefix === sequence.length,
		complete: prefix === ORDER.length,
		hints: HINTS.slice(0, Math.min(prefix + 1, HINTS.length))
	};
}

/** Description du pays si le nom proposé est le bon, sinon null. */
export function checkCountry(id: string, guess: string): string | null {
	const secret = SECRETS[id];
	if (!secret) return null;
	const answer = normalize(guess);
	return secret.answers.some((a) => normalize(a) === answer) ? secret.description : null;
}
