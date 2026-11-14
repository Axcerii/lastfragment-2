// Questions du test de flux (Quiz 2 : Quiz2Reponses/Quiz 2 - Feuille 1.csv), flux et citations repris
// de la V1 (php/fluxDescriptions.php). Chaque réponse rapporte des lettres : voir $lib/flux/quiz.

export type QuizQuestion = { text: string; answers: { text: string; letters: string }[] };

export const QUESTIONS: QuizQuestion[] = [
	{
		text: "Tes paupières sont lourdes, une odeur douce et familière dilate tes narines, tu te réveilles, allongé, dans un champ de...",
		answers: [
			{ text: "Blé", letters: "EIK" },
			{ text: "Maïs", letters: "AB" },
			{ text: "Riz", letters: "DGJ" },
			{ text: "Coquelicots", letters: "CFH" }
		]
	},
	{
		text: "Tu te relèves, tu dépoussières ton équipement, tu plisses les yeux vers l'horizon, le soleil...",
		answers: [
			{ text: "Se lève", letters: "AEGK" },
			{ text: "Se couche", letters: "BH" },
			{ text: "Est au zénith", letters: "DFI" },
			{ text: "N'est plus visible", letters: "CJ" }
		]
	},
	{
		text: "Une ombre se glisse dans la pénombre jusqu'à toi, tes yeux finissent par s'adapter à la lumière. La silhouette est celle...",
		answers: [
			{ text: "d'un vieil homme inquiet pour toi", letters: "DJ" },
			{ text: "d'une enfant un peu trop curieuse", letters: "AFK" },
			{ text: "d'un paysan sali par l'effort", letters: "BEG" },
			{ text: "d'un chevalier en armure", letters: "CHI" }
		]
	},
	{
		text: "Observant ta confusion, la personne fouille dans sa besace et te tend...",
		answers: [
			{ text: "un reste de pain encore un peu moelleux", letters: "CEJK" },
			{ text: "une vessie à moitié remplie d'eau", letters: "DGI" },
			{ text: "une pomme dans un état immaculé", letters: "BFH" },
			{ text: "un sandwich travaillé et monté avec amour", letters: "A" }
		]
	},
	{
		text: "Ton premier réflexe en voyant cet acte de bonté innocent est...",
		answers: [
			{ text: "d'accepter et de le manger sans plus attendre", letters: "AEFI" },
			{ text: "d'accepter avec précaution en vérifiant que le don n'est pas piégé", letters: "CDG" },
			{ text: "d'accepter et de le ranger pour plus tard", letters: "HK" },
			{ text: "de le refuser poliment.", letters: "BJ" }
		]
	},
	{
		text: "Le bienfaiteur te demande comment tu as fini dans cette situation, tu prends une inspiration et tu essaies de te remémorer...",
		answers: [
			{ text: "Tu t'es endormi après une balade pour soigner une énième insomnie", letters: "AFJK" },
			{ text: "Tu as poursuivi un scélérat et tu t'es écroulé de fatigue", letters: "GI" },
			{ text: "Tu as eu une soirée à la taverne qui est allée trop loin, et dont tu espères ne jamais te souvenir", letters: "DE" },
			{ text: "Tu as été téléporté par une magie étrange, tu ne fais jamais rien d'inconscient", letters: "BCH" }
		]
	},
	{
		text: "Il t'indique l'emplacement d'un village à proximité où tu pourras trouver de l'aide. Tu...",
		answers: [
			{ text: "suis l'indication en faisant pleinement confiance à cette aide charitable", letters: "AE" },
			{ text: "remercies, mais tu préfères suivre ta propre voie et prendre un chemin que tu connais", letters: "BFGH" },
			{ text: "feins de suivre son indication, mais bifurques pour éviter un guet-apens", letters: "DK" },
			{ text: "ignores ce qu'il dit, le vagabondage a toujours été la meilleure des vertus", letters: "CIJ" }
		]
	},
	{
		text: "Sur ton chemin, tu croises un lac, tu y remplis ta gourde, en te penchant, tu peux y observer le reflet...",
		answers: [
			{ text: "d'un soldat en armure, perdu dans ce qu'il doit accomplir", letters: "DE" },
			{ text: "d'un mercenaire à la recherche d'une fortune toujours plus importante", letters: "HIK" },
			{ text: "d'un futur héros, qui a encore ses preuves à faire", letters: "BG" },
			{ text: "d'un vagabond lambda sans aucune ambition", letters: "ACFJ" }
		]
	},
	{
		text: "Au loin, le portail d'un hameau de campagne se dresse, tu t'en approches et y cherches de l'aide en...",
		answers: [
			{ text: "allant à la rencontre d'un garde, ce sont des personnes de confiance", letters: "DF" },
			{ text: "cherchant une taverne, les tenanciers ont toujours de bons tuyaux, en plus de pouvoir boire un coup", letters: "AEI" },
			{ text: "parlant à un habitant de la zone, c'est le plus rapide et le plus simple", letters: "BHJ" },
			{ text: "parcourant la ville à la recherche d'une carte, les autres ne doivent pas perdre leur temps à cause de ton erreur", letters: "CGK" }
		]
	},
	{
		text: "Tu passes devant l'église du village, tu te recueilles sur l'autel...",
		answers: [
			{ text: "Le seul véritable Dieu, le Dieu Créateur", letters: "DH" },
			{ text: "Le Dieu de la Vie pour qu'il t'accorde une bonne santé", letters: "CJ" },
			{ text: "Le Dieu du Vent pour que ce dernier t'amène à bon port", letters: "FG" },
			{ text: "Aucun dieu, tu n'es pas du genre religieux", letters: "ABEIK" }
		]
	},
	{
		text: "Tu as obtenu les informations dont tu avais besoin, tu planifies ton départ pour...",
		answers: [
			{ text: "maintenant, tu as déjà perdu assez de temps", letters: "BCG" },
			{ text: "demain, tu prendras une nuit à l'auberge pour te reposer avant de partir", letters: "EHI" },
			{ text: "dans quelques jours, tu te sers de cet heureux événement pour découvrir la région", letters: "AJ" },
			{ text: "tu regardes la position du soleil, et tu t'adaptes en fonction", letters: "DFK" }
		]
	},
	{
		text: "Tu te prépares à partir, tu récupères des vivres, tu resserres ton équipement et tu poses ta main sur ton arme de prédilection, ...",
		answers: [
			{ text: "une hallebarde, arme lourde, demande de l'entraînement mais est la plus efficace", letters: "AK" },
			{ text: "une épée, l'arme des héros, équilibrée, pratique sans être encombrante", letters: "CDFH" },
			{ text: "une hache, puissante, passe aussi bien pour tailler du monstre que des arbres", letters: "EI" },
			{ text: "une simple dague, rapide, discrète, létale, un véritable utilitaire", letters: "BGJ" }
		]
	},
	{
		text: "Le chemin est long, et la solitude est forte, heureusement, tu as pour t'accompagner...",
		answers: [
			{ text: "ton fidèle destrier, un vrai gourmand mais il t'a sorti des pires situations", letters: "BEK" },
			{ text: "ton oiseau voyageur qui te permet de prendre contact avec ta famille sans être encombré", letters: "FGH" },
			{ text: "ton chien de chasse, ton véritable meilleur ami", letters: "DJ" },
			{ text: "ton casse-croûte, cette solitude est un véritable confort pour toi", letters: "ACI" }
		]
	},
	{
		text: "Dans ton sommeil, tu entends un cri de détresse provenant des bois à proximité de toi, tu...",
		answers: [
			{ text: "prends ton arme, et tu cours aider la personne sans attendre", letters: "AFH" },
			{ text: "récupères ton arme, et avances furtivement jusqu'à pouvoir évaluer le danger avant d'agir", letters: "DG" },
			{ text: "fuis, tu n'es pas prêt à risquer ta vie pour sauver un inconnu", letters: "CK" },
			{ text: "te rendors, ce n'est peut-être qu'un renard, et au pire, tu ne dois rien à qui que ce soit", letters: "BEIJ" }
		]
	},
	{
		text: "Dans ton périple, tu trouves une entrée de grotte avec une porte utilisant une technologie nordique, tu...",
		answers: [
			{ text: "te poses et essaies de trouver une solution à cette énigme.", letters: "BDFH" },
			{ text: "sors tes outils et essaies de contourner le circuit en crochetant le mécanisme", letters: "J" },
			{ text: "frappes dedans avec ton arme pour forcer l'ouverture, parfois, ça marche", letters: "AEI" },
			{ text: "pars, il est dangereux d'ouvrir des ruines nordiques sans être préparé", letters: "CGK" }
		]
	},
	{
		text: "Tu te retrouves face à un meurtrier, il est grièvement blessé, tu...",
		answers: [
			{ text: "le tues, avec un léger sourire en pensant aux vies qu'il a détruites", letters: "FIK" },
			{ text: "abrèges ses souffrances, dans une tristesse profonde de devoir en arriver là", letters: "BDHJ" },
			{ text: "le massacres, sans peine, juste de la haine face à l'horreur des crimes qu'il a commis", letters: "CG" },
			{ text: "le laisses mourir, sans montrer d'émotion, il ne faut pas lui laisser le plaisir de t'affecter", letters: "AE" }
		]
	},
	{
		text: "Te voilà rentré chez toi après cette intense aventure, tu te poses dans une taverne, tu commandes...",
		answers: [
			{ text: "un bon verre d'eau bien frais, pour te désaltérer après cette épopée", letters: "AFI" },
			{ text: "une bière, pour te détendre et festoyer", letters: "DE" },
			{ text: "un alcool fort, pour désinfecter la plaie dans ton estomac", letters: "CK" },
			{ text: "un petit thé, pour bien dormir ensuite", letters: "BGHJ" }
		]
	},
	{
		text: "Si tout cela était une mission officielle, tu aurais aimé avoir en récompense...",
		answers: [
			{ text: "une somme d'argent immense pour ne plus jamais avoir à repartir pour cela", letters: "CEK" },
			{ text: "un équipement légendaire pour être prêt pour la prochaine escapade", letters: "GI" },
			{ text: "un nouveau cerveau pour ne plus jamais retomber dans ces travers", letters: "DFJ" },
			{ text: "rien, cette étrange aventure et le sourire des personnes sur le chemin en valaient la peine", letters: "ABH" }
		]
	},
	{
		text: "Finalement, tu t'allonges dans ton lit et tu repenses à ta vie, tu décides de te reprendre en main et de...",
		answers: [
			{ text: "véritablement passer tes classes et devenir un soldat de l'armée", letters: "D" },
			{ text: "te réveiller, continuer à être un mercenaire à ton compte, mais le faire avec sérieux et conviction", letters: "C" },
			{ text: "finalement abandonner, et devenir un brigand, le royaume n'a de cesse de te décevoir, tu vas prendre les armes et te révolter", letters: "IK" },
			{ text: "devenir un aventurier, qui aidera son prochain et vivra grâce à son sourire et ses services", letters: "FH" },
			{ text: "trouver la vérité sur le flux et la magie, devenir un scientifique, c'est ce qui te fait vibrer", letters: "BGJ" },
			{ text: "abandonner la voie de l'épée et devenir un artisan, peut-être monteras-tu jusqu'à la bourgeoisie si tu es suffisamment capable", letters: "AE" }
		]
	}
];

export type FluxEntry = { dragons: [string, string]; name: string; names: string[]; description: string };

/** Flux né de deux dragons (dans un ordre ou dans l'autre). */
export const FLUXES: FluxEntry[] = [
	{
		dragons: [
			"Aqua",
			"Aqua"
		],
		name: "Créateur d'Eau",
		names: [
			"Aqua"
		],
		description: "Vous êtes un Créateur d’Eau, vous serez à l’origine de torrents et de tsunamis. Il s’agit d’un flux plus utile que combatif ; cependant, utilisé avec créativité, ce pouvoir peut être dévastateur."
	},
	{
		dragons: [
			"Chronos",
			"Aqua"
		],
		name: "Créateur de Slime",
		names: [
			"Noah",
			"Kuro",
			"Kroa"
		],
		description: "Vous êtes un Créateur de Slime, une substance entre le liquide et le solide qui ne lâche jamais sa cible. Aussi pratique qu’agaçant, ce pouvoir fera faire des cauchemars à certains adversaires."
	},
	{
		dragons: [
			"Drii",
			"Aqua"
		],
		name: "Créateur de Vapeur",
		names: [
			"Drya",
			"Ria",
			"Kurii",
			"Ahrii"
		],
		description: "Vous êtes un Créateur de Vapeur, capable de créer des brumes et des jets de vapeur aussi brûlants que de l’huile sur le feu. Bien qu’un peu handicapant, ce pouvoir est destructeur."
	},
	{
		dragons: [
			"Goliath",
			"Aqua"
		],
		name: "Créateur de Boue",
		names: [
			"Kugo",
			"Ahli",
			"Liha"
		],
		description: "Vous êtes un Créateur de Boue, capable de réaliser des bains et vagues de boue. À première vue inutile et sale, ce pouvoir utilisé à mauvais escient est ravageur."
	},
	{
		dragons: [
			"Guizamark",
			"Aqua"
		],
		name: "Créateur de Plante",
		names: [
			"Zaha",
			"Maka",
			"Maha",
			"Kark"
		],
		description: "Vous êtes un Créateur de Plantes. Que ce soient des fleurs ou des arbres, laissez le pouvoir de la vie s’emparer de votre créativité pour devenir un puissant combattant."
	},
	{
		dragons: [
			"Lada",
			"Aqua"
		],
		name: "Créateur de Glace",
		names: [
			"Laha",
			"Daha",
			"Kuda",
			"Kula"
		],
		description: "Vous êtes un Créateur de Glace. Un matériau fragile qui peut s’avérer tranchant et dangereux. Un pouvoir subtil, simple et efficace."
	},
	{
		dragons: [
			"Pestia",
			"Aqua"
		],
		name: "Créateur de Nuage",
		names: [
			"Tiha",
			"Tiku",
			"Sepia"
		],
		description: "Vous êtes un Créateur de Nuage. À vous de vous entraîner afin de leur faire cracher des torrents jusqu’aux éclairs. Un flux nécessitant une forte dévotion, mais le pouvoir acquis en vaut la chandelle."
	},
	{
		dragons: [
			"Pura",
			"Aqua"
		],
		name: "Créateur de Résine",
		names: [
			"Hapu",
			"Raha",
			"Ra",
			"Kara"
		],
		description: "Vous êtes un Créateur de Résine, qu’elle soit liquide ou solide, utilisez votre créativité pour bloquer vos adversaires et les transformer en œuvres d’art morbides."
	},
	{
		dragons: [
			"Shizari",
			"Aqua"
		],
		name: "Créateur de Poison Liquide",
		names: [
			"Zaha",
			"Hashi",
			"Shiku",
			"Kuri"
		],
		description: "Vous êtes un Créateur de Poison Liquide. Mortel ou paralysant, à vous de vous démener pour créer les infusions adéquates à chaque situation."
	},
	{
		dragons: [
			"Chronos",
			"Chronos"
		],
		name: "Accélérateur Temporel",
		names: [
			"Chronos",
			"Kro",
			"Nos",
			"Son"
		],
		description: "Vous êtes un Accélérateur Temporel. Vous pouvez viser des zones dans lesquelles le temps sera accéléré. Un pouvoir qui semble surpuissant au premier abord mais extrêmement subtil à maîtriser. Un flux rare dont les bons utilisateurs le sont encore plus."
	},
	{
		dragons: [
			"Drii",
			"Chronos"
		],
		name: "Créateur de Météorite",
		names: [
			"Driinos",
			"Riinos",
			"Kronii"
		],
		description: "Tel Chicxulub, vous aurez une puissance dévastatrice, un flux rare d’une complexité immense, vous devrez sans doute vous entraîner toute votre vie pour parfaire ce pouvoir. Un pouvoir aussi dangereux pour son utilisateur que pour ses ennemis."
	},
	{
		dragons: [
			"Goliath",
			"Chronos"
		],
		name: "Créateur de Fossile",
		names: [
			"Linos",
			"Gonos",
			"Lianos",
			"Kroli"
		],
		description: "Vous êtes un Créateur de Fossiles. Un flux rare qui dépend de la connaissance et de l’imagination de son utilisateur. Peut-être qu’un jour vous serez le premier à faire renaître ces géants d’antan."
	},
	{
		dragons: [
			"Guizamark",
			"Chronos"
		],
		name: "Soigneur",
		names: [
			"Zanos",
			"Noma",
			"Kroma"
		],
		description: "Vous êtes un Soigneur. Votre flux permet d’accélérer la récupération d’une plaie ou d’une maladie. Un flux extrêmement rare, très recherché. Deviendrez-vous le soigneur d’une contrée entière ou un combattant immortel ? À vous de choisir."
	},
	{
		dragons: [
			"Lada",
			"Chronos"
		],
		name: "Créateur de Poussière",
		names: [
			"Lanos",
			"Danos",
			"Nala",
			"Dana"
		],
		description: "Vous êtes un Créateur de Poussière. Vous pouvez créer de la poussière de tout type. Un pouvoir étrangement rare, qui nécessitera sans doute beaucoup de réflexion à son porteur."
	},
	{
		dragons: [
			"Pestia",
			"Chronos"
		],
		name: "Créateur de Mirage",
		names: [
			"Tiano",
			"Kroya",
			"Noya"
		],
		description: "Vous êtes un Créateur de Mirages. Vous pouvez ralentir la vitesse de la lumière afin de faire apparaître des images du passé. Un pouvoir très rare qui facilitera grandement le travail au marché noir…"
	},
	{
		dragons: [
			"Pura",
			"Chronos"
		],
		name: "Destructeur de Temps",
		names: [
			"Ranos",
			"Krora",
			"Nosu"
		],
		description: "Vous êtes un Destructeur de Temps. Vous pouvez stopper le temps dans une zone donnée. Un pouvoir rare possédant de fortes contraintes, qui est beaucoup plus dur à maîtriser que ce que l'on peut penser. Je me demande ce que vous en ferez."
	},
	{
		dragons: [
			"Shizari",
			"Chronos"
		],
		name: "Créateur de Peste",
		names: [
			"Zanos",
			"Shino",
			"Rinos"
		],
		description: "Vous êtes un Créateur de Peste. Vous créez des monstres microscopiques pouvant mettre à mal le plus robuste des combattants. C’est un pouvoir extrêmement rare et dévastateur. Il nécessite une connaissance approfondie de la santé pour fonctionner à son plein potentiel."
	},
	{
		dragons: [
			"Drii",
			"Drii"
		],
		name: "Créateur de Feu",
		names: [
			"Drii",
			"Reed",
			"Lily"
		],
		description: "Vous êtes un Créateur de Feu. Un pouvoir aussi simple qu’il est dangereux, aussi bien pour l’utilisateur que ses adversaires. Il s’agit d’un des flux les plus communs mais reste d’une grande puissance."
	},
	{
		dragons: [
			"Goliath",
			"Drii"
		],
		name: "Créateur de Magma",
		names: [
			"Gori",
			"Dryath",
			"Liry"
		],
		description: "Vous êtes un Créateur de Magma. Vous générez des roches d’une chaleur intense. Un pouvoir très dangereux pour quiconque le possède, mais tout aussi destructeur pour les lignes ennemies."
	},
	{
		dragons: [
			"Guizamark",
			"Drii"
		],
		name: "Créateur de Sang",
		names: [
			"Zari",
			"Mari",
			"Giri"
		],
		description: "Vous êtes un Créateur de Sang. Un flux étrange, similaire à celui de l’eau. À vous de vous démarquer en utilisant chaque composant de ce liquide sous toutes ses formes pour devenir un combattant remarquable."
	},
	{
		dragons: [
			"Lada",
			"Drii"
		],
		name: "Créateur de Chaleur",
		names: [
			"Lari",
			"Dari",
			"Rida",
			"Rila"
		],
		description: "Vous êtes un Créateur de Chaleur. Vous pouvez augmenter la chaleur d’un endroit à votre guise. Un pouvoir subtil qui vous permettra de faire connaître l’enfer à vos opposants, ou de devenir le plus grand cuisinier que ce monde ait connu."
	},
	{
		dragons: [
			"Pestia",
			"Drii"
		],
		name: "Créateur d'Éclairs",
		names: [
			"Drya",
			"Rya",
			"Tiry"
		],
		description: "Vous êtes un Créateur d'Éclairs. Foudroyez vos adversaires avec une vitesse hors du commun. Un pouvoir très puissant mais avec des contrecoups qui peuvent s’avérer fatals."
	},
	{
		dragons: [
			"Pura",
			"Drii"
		],
		name: "Créateur de Flammes Ardentes",
		names: [
			"Rira",
			"Dura",
			"Lyra"
		],
		description: "Vous êtes un Créateur de Flammes Ardentes. Un pouvoir ayant une puissance supérieure à celle des flammes classiques, cependant très gourmand en flux et encore plus dangereux pour son utilisateur que celui des flammes. Certains maîtres de ce flux arrivent même à générer des flammes pouvant virer au bleu azur."
	},
	{
		dragons: [
			"Shizari",
			"Drii"
		],
		name: "Créateur d'Os",
		names: [
			"Shiri",
			"Zari",
			"Lily"
		],
		description: "Vous êtes un Créateur d’Os. Bien que morbide, ce pouvoir possède de nombreuses qualités, seule votre imagination vous limitera. Vous ferez sans doute peur aux enfants, mais aussi à vos cibles."
	},
	{
		dragons: [
			"Goliath",
			"Goliath"
		],
		name: "Créateur de Terre",
		names: [
			"Goliath"
		],
		description: "Vous êtes un Créateur de Terre. Un flux très commun mais avec énormément de possibilités. Une imagination débordante est importante pour maîtriser ce pouvoir. Avec de l’entraînement, même des rochers peuvent être générés."
	},
	{
		dragons: [
			"Guizamark",
			"Goliath"
		],
		name: "Créateur de Coquillages",
		names: [
			"Goli",
			"Zayath",
			"Zalia",
			"Mali"
		],
		description: "Vous êtes un Créateur de Coquillages. Un flux rare et très spécifique, à l’instar d’un animal, vous pourrez vous rendre indestructible et créer des lames aussi tranchantes que du verre."
	},
	{
		dragons: [
			"Lada",
			"Goliath"
		],
		name: "Créateur de Sable",
		names: [
			"Dali",
			"Gola",
			"Dago"
		],
		description: "Vous êtes un Créateur de Sable. Ce flux, bien que commun, peut se révéler très puissant. Pour vos adversaires vous serez un démon venu du désert, capable de créer des tempêtes de sable à sa guise."
	},
	{
		dragons: [
			"Pestia",
			"Goliath"
		],
		name: "Créateur de Cristaux",
		names: [
			"Gotia",
			"Ai",
			"Talia"
		],
		description: "Vous êtes un Créateur de Cristaux. On dit souvent que le diamant est le matériau le plus dur du monde, que ferez-vous avec un tel pouvoir ?"
	},
	{
		dragons: [
			"Pura",
			"Goliath"
		],
		name: "Créateur de Fer",
		names: [
			"Gora",
			"Pulia",
			"Raliath",
			"Ralia"
		],
		description: "Vous êtes un Créateur de Fer. En un claquement de doigts, vous pourrez revêtir une armure impénétrable ou vous forger la plus grande des épées. Il s’agit d’un flux où l’imagination est très importante."
	},
	{
		dragons: [
			"Shizari",
			"Goliath"
		],
		name: "Créateur de Cendre",
		names: [
			"Zayath",
			"Zalia",
			"Shigo",
			"Goshi"
		],
		description: "Vous êtes un Créateur de Cendre. Un pouvoir quelque peu rare, à vous et à votre imagination de déterminer son potentiel. Réduirez-vous le monde à l’image de votre flux ?"
	},
	{
		dragons: [
			"Guizamark",
			"Guizamark"
		],
		name: "Donneur de Vie",
		names: [
			"Guizamark"
		],
		description: "Vous êtes un Donneur de Vie. Un flux très rare qui vous permet d’insuffler la vie temporairement à des objets et leur donner des ordres. L’individu possédant ce flux possède aussi une grande force régénératrice."
	},
	{
		dragons: [
			"Lada",
			"Guizamark"
		],
		name: "Créateur d'Ailes",
		names: [
			"Daza",
			"Mala",
			"Guida",
			"Guila"
		],
		description: "Vous êtes un Créateur d’Ailes. Un flux très rare et très convoité permettant de créer des ailes de toutes tailles et formes. On raconte qu’une excellente maîtrise de ce pouvoir permettrait de créer des ailes si grandes qu’on pourrait s’envoler."
	},
	{
		dragons: [
			"Pestia",
			"Guizamark"
		],
		name: "Créateur d'Yeux",
		names: [
			"Giya",
			"Zaya",
			"Maya"
		],
		description: "Vous êtes un Créateur d’Yeux. Un flux aussi rare qu’il est morbide. Vous pouvez créer des yeux. Bien qu’il soit inutile en combat, on raconte que ceux capables de le maîtriser parfaitement arrivent à voir ce qu’observent les yeux créés. Je vous laisse réfléchir aux possibilités de ce pouvoir…"
	},
	{
		dragons: [
			"Pura",
			"Guizamark"
		],
		name: "Créateur de Fibres Musculaires",
		names: [
			"Zara",
			"Gira",
			"Mara"
		],
		description: "Vous êtes un Créateur de Fibres Musculaires. Bien qu’un peu étrange, ce pouvoir vous permettrait de renforcer votre physique. Avec un brin de créativité, ce flux est sans doute plus fort qu’on ne le pense."
	},
	{
		dragons: [
			"Shizari",
			"Guizamark"
		],
		name: "Immortel",
		names: [
			"Za",
			"Shiza",
			"Mashi",
			"Shigi"
		],
		description: "Vous êtes Immortel. Un flux mythique qui n’a jamais existé, jusqu’à maintenant. Votre corps refuse de mourir, quels que soient les dégâts qu’il reçoit et la vieillesse qu’il subit. Vous finissez toujours par récupérer votre forme normale. Une bénédiction pour certains, un enfer pour d'autres."
	},
	{
		dragons: [
			"Lada",
			"Lada"
		],
		name: "Créateur de Vent",
		names: [
			"Lada",
			"Dala"
		],
		description: "Vous êtes un Créateur de Vent. Un flux très commun mais à ne surtout pas sous-estimer. Peut-être qu’au début ce ne sera qu’une brise, mais avec de l’entraînement, cela conduira à un ouragan."
	},
	{
		dragons: [
			"Pestia",
			"Lada"
		],
		name: "Créateur de Typhon",
		names: [
			"Lydia",
			"Daya",
			"Pelia"
		],
		description: "Vous êtes un Créateur de Typhon. Un pouvoir dévastateur à utiliser avec précaution, pour le bien de son créateur et celui du monde."
	},
	{
		dragons: [
			"Pura",
			"Lada"
		],
		name: "Créateur de Tornade",
		names: [
			"Dara",
			"Lara",
			"Pula"
		],
		description: "Vous êtes un Créateur de Tornade. Balayez tous vos adversaires et leurs habitations d’un simple tour de bras. Un flux puissant, dévastateur et gourmand."
	},
	{
		dragons: [
			"Shizari",
			"Lada"
		],
		name: "Créateur de Gaz",
		names: [
			"Laza",
			"Shila",
			"Shida",
			"Lashi"
		],
		description: "Toxique, inflammable, explosif, à vous de connaître tous les types de gaz à votre disposition pour devenir un combattant inattrapable."
	},
	{
		dragons: [
			"Pestia",
			"Pestia"
		],
		name: "Créateur de Lumière",
		names: [
			"Pestia",
			"Tia"
		],
		description: "Vous êtes un Créateur de Lumière. Flashs aveuglants, illusions, intimidation : à vous de découvrir votre propre style avec ce pouvoir."
	},
	{
		dragons: [
			"Pura",
			"Pestia"
		],
		name: "Créateur d'Orage",
		names: [
			"Tiara",
			"Pera",
			"Ratia"
		],
		description: "Vous êtes un Créateur d’Orage. Que la pluie, le vent et les éclairs grondent et répondent à votre appel. Un flux rare et dévastateur. Utilisez-le à bon escient."
	},
	{
		dragons: [
			"Shizari",
			"Pestia"
		],
		name: "Créateur d'Acide",
		names: [
			"Zaya",
			"Shiya",
			"Rya"
		],
		description: "Vous êtes un Créateur d’Acide. Un flux d’une extrême rareté mais d’un extrême danger. Prouvez que la destruction peut mener à autre chose que la désolation."
	},
	{
		dragons: [
			"Pura",
			"Pura"
		],
		name: "Créateur de Force Pure",
		names: [
			"Pura"
		],
		description: "Vous êtes un Créateur de Force Pure. C’est un flux simple, augmentant votre force de frappe. Vous l’aurez compris, il est aussi simple que surpuissant. Faites-en bon usage et attention aux contrecoups."
	},
	{
		dragons: [
			"Shizari",
			"Pura"
		],
		name: "Créateur d'Armure Morbide",
		names: [
			"Zara",
			"Shira",
			"Shipu",
			"Zaria"
		],
		description: "Vous êtes un Créateur d’Armure Morbide. C’est un flux complexe qui recouvre le corps d’un individu. Chaque coup que ce dernier recevra sera redirigé vers votre corps. Une armure pour lui, un enfer pour vous."
	},
	{
		dragons: [
			"Shizari",
			"Shizari"
		],
		name: "Annihilateur de Vie",
		names: [
			"Shiza",
			"Shy",
			"Shizari"
		],
		description: "Vous êtes un Annihilateur de Vie. D’un simple contact avec un individu, vous pouvez gangréner le corps d’autrui. Vous serez sûrement haï et fui pour ce pouvoir, mais sachez que peu d'individus arriveront à votre cheville."
	}
];

/** Citation du dragon de bénédiction, affichée avec le résultat. */
export const QUOTES: Record<string, string> = {
	Aqua: "Dans les tréfonds, le calme règne...",
	Chronos: "Les Nograds ne sont pas prêts pour leur futur...",
	Drii: "La sagesse, le chaos, la conscience, tant de choses à découvrir...",
	Goliath: "Tu as donc fait ton choix, soit...",
	Guizamark: "La vie, ce mystère que la nature tend à perpétuer...",
	Lada: "Perfectionne ta brise avant de t'essayer à la tempête...",
	Pestia: "Mon peuple a besoin que je le guide...",
	Pura: "Sois fort, et rien de grave ne t'arrivera...",
	Shizari: "Je les ai tous découverts...",
	Yinva: "Suis-moi, le monde que tu connais est si petit...",
	Chaos: "Qui es-tu ?.."
};
