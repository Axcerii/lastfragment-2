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
// a autant de sommets que son rang, et l'indice le nomme en décrivant son symbole.
// Ils se dévoilent un à un, après un premier échec, et se lisent à la suite comme un seul texte :
// la genèse d'Arthera.
const HINTS = [
	"Au commencement, il était seul. On raconte qu'il naquit d'une fleur à six pétales.",
	'Dans le miroir, il fit naître son reflet : Yinva, la manipulatrice, qui tisse ses fils depuis sa croix.',
	"Puis vint la vie, et le gardien Guizamark porta sur son bouclier la croix de celle qui l'avait précédé.",
	'Pour lui faire contrepoids, la mort dut se dresser : Shizari alluma sa lanterne et signala sa présence.',
	"À sa lueur, les sept étoiles de Pestia entamèrent leur ronde, et la gravité s'abattit sur Arthera.",
	"Chronos retourna le sablier du temps, afin que l'existence des vivants connaisse une fin.",
	"Accablé d'une profonde tristesse, Aqua versa ses larmes, et de ses larmes émergèrent les éléments.",
	"Pour que l'humanité ne sombre pas sous les eaux, Goliath forgea les continents de terre et de pierre.",
	'Le soleil embrasa le monde de ses rayons, et Drii chuta sur le sol des Nograds.',
	"Pour attiser les flammes de celui qui l'avait précédé, Lada fit tourner les moulins du monde.",
	"Enfin, Pura retira son masque pour contempler l'œuvre achevée du créateur."
];

// Pays à deviner : chacun porte le nom d'une fleur, que son énigme décrit. Le nom du pays comme
// celui de la fleur sont acceptés. Les réponses sont comparées sans majuscules, accents, espaces,
// tirets ni apostrophes.
const SECRETS: Record<string, { answers: string[]; description: string }> = {
	irisia: {
		answers: ['irisia', 'irysia', 'iris', 'irys'],
		description: "Irisia, la terre du Sud. Les habitants ne prient que des divinités locales, ils ne croient pas en la sagesse des Dragons et encore moins aux pouvoirs créateurs d'Artrish."
	},
	amari: {
		answers: ['amari', 'amary', 'amaryllis', 'amarylis', 'amarilis', 'amaryllys', 'amarillys'],
		description: "Amari, le royaume de la chaotique Pura. Il est fermé à tous, on raconte qu'une malédiction frappe ceux qui traversent ses frontières."
	},
	saxifra: {
		answers: ['saxifra', 'saxyfra', 'saxifrage', 'saxifrages', 'saxifraga'],
		description: 'Saxifra, le pays enneigé. Goliath y vivait jadis, ces confins furent son tombeau. Cette mort brisa le sentiment d\'invincibilité des Dieux, bouleversant l\'ordre établi ; depuis, géants et humains ne cessent de se faire la guerre en ce lieu.'
	},
	edenia: {
		answers: ['edenia', 'eden', 'paradis', 'paradise', 'oiseau de paradis', 'oiseau du paradis', 'strelitzia'],
		description: "Edenia, ou bien Paradis. Maison du Dieu de la Vie et de la Mort, une véritable anarchie s'est installée depuis la disparition soudaine du premier. Éternelles et Humains y cohabitent dans un massacre constant."
	},
	mudan: {
		answers: ['mudan', 'pivoine', 'pivoines', 'peony', '牡丹'],
		description: 'Mudan, le plus grand empire d\'Arthera. Pestia et Lada guident le pays avec sagesse et conscience afin qu\'humain comme Éternelle vivent dans une paix assurée.'
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
