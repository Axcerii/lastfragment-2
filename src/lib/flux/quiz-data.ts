// Questions, flux et citations du test de flux, repris tels quels de la V1
// (table `quizz` et php/fluxDescriptions.php). Chaque réponse rapporte des lettres : voir $lib/flux/quiz.

export type QuizQuestion = { text: string; answers: { text: string; letters: string }[] };

export const QUESTIONS: QuizQuestion[] = [
	{
		text: "Quelle activité préférez-vous réaliser durant votre temps libre ?",
		answers: [
			{
				text: "Faire du Sport",
				letters: "I"
			},
			{
				text: "Lire",
				letters: "CEGO"
			},
			{
				text: "Être avec des amis",
				letters: "HJKLMPQ"
			},
			{
				text: "Me balader",
				letters: "ABDFN"
			}
		]
	},
	{
		text: "À quel point te connais-tu ?",
		answers: [
			{
				text: "0%",
				letters: "KNPQ"
			},
			{
				text: "25%",
				letters: "FHO"
			},
			{
				text: "50%",
				letters: "AJ"
			},
			{
				text: "75%",
				letters: "BCGM"
			},
			{
				text: "100%",
				letters: "DEHL"
			}
		]
	},
	{
		text: "Les gens vous considèrent :",
		answers: [
			{
				text: "Optimiste",
				letters: "AEHIJLM"
			},
			{
				text: "Réaliste",
				letters: "BDGO"
			},
			{
				text: "Pessimiste",
				letters: "CKNPQ"
			},
			{
				text: "Lunatique",
				letters: "F"
			}
		]
	},
	{
		text: "Lorsque vous prenez une décision simple :",
		answers: [
			{
				text: "Vous le faites rapidement, sans hésitation, on n’a pas de temps à perdre dans notre vie.",
				letters: "AFI"
			},
			{
				text: "Vous pesez le pour et le contre et malgré tout, l’hésitation reste mais après de longues minutes de réflexion vous faites votre choix.",
				letters: "BCGOP"
			},
			{
				text: "Vous hésitez longuement et vous finissez souvent par laisser le hasard choisir.",
				letters: "EHJLMN"
			},
			{
				text: "Vous demandez à une personne tierce de choisir, que vous blâmez en cas de pépins.",
				letters: "DKQ"
			}
		]
	},
	{
		text: "Quelle mort vous convient le plus parmi celle-ci :",
		answers: [
			{
				text: "Mourir de gloire en martyre / en combat.",
				letters: "LI"
			},
			{
				text: "Mourir paisiblement AVANT mon/ma compagne, comme ça, je n’ai pas à la/le voir souffrir.",
				letters: "ACEHM"
			},
			{
				text: "Mourir paisiblement APRÈS mon/ma compagne, comme ça, il/elle n’a pas à souffrir de mon départ.",
				letters: "FGOQ"
			},
			{
				text: "Mourir seule, paisiblement.",
				letters: "JN"
			},
			{
				text: "Mourir éclaté.e par une Bombe Atomique, autant ne pas se faire d’idée.",
				letters: "BDKP"
			}
		]
	},
	{
		text: "Ce soir, je regarde :",
		answers: [
			{
				text: "Une Romance, pour l'AMOUR.",
				letters: "AHKM"
			},
			{
				text: "Une série dramatique, pour relativiser.",
				letters: "FOP"
			},
			{
				text: "Un documentaire, pour apprendre.",
				letters: "DG"
			},
			{
				text: "Une série/dessin animé d'exploration, pour rêver.",
				letters: "ELNQ"
			},
			{
				text: "Un thriller avec de l'action, pour poser mon cerveau.",
				letters: "BCI"
			},
			{
				text: "Une vidéo -18, il n'y a plus que cela qui me fait de l'effet...",
				letters: "J"
			}
		]
	},
	{
		text: "Vous arrivez chez un collègue, il vous propose par courtoisie si vous souhaitez un thé ou un café :",
		answers: [
			{
				text: "Vous prenez un café",
				letters: "BCDGKP"
			},
			{
				text: "Vous prenez un thé",
				letters: "AFHJMQO"
			},
			{
				text: "Vous dites que vous préférez de l'Eau",
				letters: "IE"
			},
			{
				text: "Vous prenez l'un ou l'autre et le buvez malgré le fait que vous n'aimiez ni l'un, ni l'autre",
				letters: "LN"
			}
		]
	},
	{
		text: "Noir ou blanc ? Ange ou Démon ?",
		answers: [
			{
				text: "Noir et Démon",
				letters: "BCDFJKPOQ"
			},
			{
				text: "Blanc et Ange",
				letters: "AEGHILM"
			},
			{
				text: "Caramel au beurre salé avec supplément crème fouettée.",
				letters: "N"
			}
		]
	},
	{
		text: "Vous arrivez dans une crêperie, vous commandez :",
		answers: [
			{
				text: "Une crêpe salée",
				letters: "QPABDGK"
			},
			{
				text: "Une crêpe sucrée",
				letters: "OMLCEFHIJ"
			},
			{
				text: "J'ai déjà répondu à cette question juste avant.",
				letters: "N"
			}
		]
	},
	{
		text: "Votre couleur préféré de l'arc en ciel :",
		answers: [
			{
				text: "Violet",
				letters: "LO"
			},
			{
				text: "Bleu",
				letters: "AH"
			},
			{
				text: "Vert",
				letters: "FBGJMQ"
			},
			{
				text: "Jaune",
				letters: "DIKP"
			},
			{
				text: "Orange",
				letters: "E"
			},
			{
				text: "Rouge",
				letters: "CN"
			}
		]
	},
	{
		text: "Le plus important dans une oeuvre c'est :",
		answers: [
			{
				text: "L'histoire qu'elle raconte",
				letters: "AFIL"
			},
			{
				text: "Le message qu'il fait passer",
				letters: "CDGQ"
			},
			{
				text: "Les émotions ressentis",
				letters: "EHKMOP"
			},
			{
				text: "Son originalité",
				letters: "BJN"
			}
		]
	},
	{
		text: "Aimez vous être au centre de l'attention ?",
		answers: [
			{
				text: "Pas du tout",
				letters: "DF"
			},
			{
				text: "Un peu",
				letters: "BCLMP"
			},
			{
				text: "Cela m'est égale",
				letters: "AGKN"
			},
			{
				text: "Oui",
				letters: "EHOQ"
			},
			{
				text: "Complètement",
				letters: "IJ"
			}
		]
	},
	{
		text: "Dans un groupe de rock, vous seriez :",
		answers: [
			{
				text: "Keyboardiste (Synthétiseur)",
				letters: "CGJMOP"
			},
			{
				text: "Guitariste",
				letters: "EHIL"
			},
			{
				text: "Bassiste",
				letters: "AFKQ"
			},
			{
				text: "Batteur",
				letters: "BDN"
			}
		]
	},
	{
		text: "Selon toi l'intelligence est :",
		answers: [
			{
				text: "La capacité à anticipé le futur",
				letters: "BCJNO"
			},
			{
				text: "La capacité à s'adapter",
				letters: "DEKQ"
			},
			{
				text: "La capacité à comprendre",
				letters: "AGIL"
			},
			{
				text: "La capacité à ressentir",
				letters: "FHMP"
			}
		]
	},
	{
		text: "Quelle saison vous représente le mieux :",
		answers: [
			{
				text: "L'Automne",
				letters: "GJMNQ"
			},
			{
				text: "Hiver",
				letters: "BFOP"
			},
			{
				text: "Printemps",
				letters: "AHKL"
			},
			{
				text: "Été",
				letters: "CDEI"
			}
		]
	},
	{
		text: "Dans un film d'horreur, vous seriez :",
		answers: [
			{
				text: "Le tueur",
				letters: "BGIPQ"
			},
			{
				text: "Le / La Beau/Belle gosse de service",
				letters: "EO"
			},
			{
				text: "Le/La Protagoniste un peu niais.e",
				letters: "AHKLM"
			},
			{
				text: "Le premier à mourir",
				letters: "CF"
			},
			{
				text: "La tronçonneuse",
				letters: "DJN"
			}
		]
	},
	{
		text: "Lorsque vous avez une série de tâches à effectuer :",
		answers: [
			{
				text: "Vous les faites toutes une à une.",
				letters: "BDGHKO"
			},
			{
				text: "Vous les commencez toutes en même temps et peiné à en finir une.",
				letters: "ACIMQ"
			},
			{
				text: "Vous les abandonnez toutes.",
				letters: "EFJLP"
			},
			{
				text: "La javel, ça nettoie les taches.",
				letters: "N"
			}
		]
	},
	{
		text: "Quelle est votre plus grande peur :",
		answers: [
			{
				text: "La mort",
				letters: "CDIKLP"
			},
			{
				text: "La solitude",
				letters: "GHJM"
			},
			{
				text: "Être victime d'injustice",
				letters: "AGQ"
			},
			{
				text: "Vous-même",
				letters: "BFNO"
			}
		]
	},
	{
		text: "Quel trait de caractère les personnes vous attribuent elles :",
		answers: [
			{
				text: "Colérique",
				letters: "CDHI"
			},
			{
				text: "Pitoyable (de qui on a pitié)",
				letters: "FPQ"
			},
			{
				text: "Excentrique",
				letters: "BJKLO"
			},
			{
				text: "Stoïque",
				letters: "AEGMN"
			}
		]
	},
	{
		text: "Vous trouvez une créature inconnue, que faites vous ?",
		answers: [
			{
				text: "Ni une, ni deux, je l'affronte.",
				letters: "EH"
			},
			{
				text: "J'observe ses habitudes et je la laisse tranquille.",
				letters: "CDGO"
			},
			{
				text: "Je ne me rends même pas compte que c'est une créature inconnue.",
				letters: "ABKN"
			},
			{
				text: "Je fuis.",
				letters: "FPQ"
			},
			{
				text: "J'ai peur, je laisse ma garde. On ne sait jamais.",
				letters: "JLM"
			}
		]
	},
	{
		text: "Vous avez eu une mauvaise note à un examen que vous avez un peu préparé, qui aura potentiellement un impact sur vos futurs résultats :",
		answers: [
			{
				text: "Vous persistez, vous aurez une meilleure note la prochaine fois.",
				letters: "AGHLM"
			},
			{
				text: "Vous abandonnez, après tout le peu de préparation aurait dû suffire, je ne suis pas à la hauteur.",
				letters: "ENP"
			},
			{
				text: "Vous vous dites que c’est la faute du professeur, en plus sa matière est nulle, vous vous préparerez tout autant pour le prochain contrôle.",
				letters: "BCDKO"
			},
			{
				text: "Vous souriez comme si ce malheureux évènement n'avait jamais eu lieu.",
				letters: "FIJQ"
			}
		]
	},
	{
		text: "Une maladie infecte et tue 1 / 1 000 000, tu peux endiguer la maladie en te sacrifiant, le ferais-tu ?",
		answers: [
			{
				text: "Oui",
				letters: "AEFGHNOPQ"
			},
			{
				text: "Non",
				letters: "BCDIJKLM"
			}
		]
	},
	{
		text: "Quel péché capital te représente le plus ;",
		answers: [
			{
				text: "Gourmandise/Envie",
				letters: "ABQ"
			},
			{
				text: "Orgueil",
				letters: "CI"
			},
			{
				text: "Cupidité",
				letters: "DJ"
			},
			{
				text: "Luxure",
				letters: "NO"
			},
			{
				text: "Paresse",
				letters: "EKLP"
			},
			{
				text: "Colère",
				letters: "FGHM"
			}
		]
	},
	{
		text: "Quel est la chose la plus dévastatrice sur terre :",
		answers: [
			{
				text: "La Famine",
				letters: "AE"
			},
			{
				text: "Les épidémies",
				letters: "HIJ"
			},
			{
				text: "Le Pouvoir",
				letters: "BDFGMNOPQ"
			},
			{
				text: "Les Guerres",
				letters: "CKL"
			}
		]
	},
	{
		text: "Que signifie 'entropie' :",
		answers: [
			{
				text: "Epique",
				letters: "AKLM"
			},
			{
				text: "Synonyme de géant",
				letters: "CEQ"
			},
			{
				text: "Destruction",
				letters: "OBDFP"
			},
			{
				text: "Le Chaos",
				letters: "NIJ"
			}
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
		description: "Vous êtes un Créateur d’Eau, vous serez à l’origine de torrent et tsunami. Il s’agit d’un flux plus utile que combatif cependant utilisé avec créativité, ce pouvoir peut être dévastateur."
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
		description: "Vous êtes un Créateur de Slime, une substance entre le liquide et le solide qui ne lâche jamais sa cible. Aussi pratique que agaçant, ce pouvoir fera faire des cauchemars à certains adversaires."
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
		description: "Vous êtes un Créateur de Vapeur, capable de créer des brumes et jet de vapeur aussi brûlant que de l’huile sur le feu, bien qu’un peu handicapant, ce pouvoir est destructeur."
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
		description: "Vous êtes un Créateur de Plantes. Que ce soit des fleurs, des arbres, laissez le pouvoir de la vie s’accaparer de votre créativité pour devenir un puissant combattant."
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
		description: "Vous êtes un Créateur de Glace. Un matériau fragile qui peut s’avérer tranchant et dangereux. Un pouvoir subtile, simple et efficace."
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
		description: "Vous êtes un Créateur de Nuage. À vous de vous entraînez afin de les faire cracher des torrents jusqu’aux éclairs. Un flux nécessitant une forte dévotion, mais le pouvoir acquis en vaut la chandelle."
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
		description: "Vous êtes un Créateur de Résine, qu’elle soit liquide ou solide, utilisez votre créativité pour bloquer vos adversaires et les transformer en œuvres d’arts morbides."
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
		description: "Vous êtes un Créateur de Poison Liquide. Mortelle, ou paralysante, à vous de vous démenez pour créer les infusions adéquates à chaque situation."
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
		description: "Vous êtes un Accélérateur Temporel. Vous pouvez viser des zones dans lesquelles le temps sera accéléré. Un pouvoir qui semble surpuissant au premier abord mais étant extrêmement subtil à maîtriser. Un flux rare dont les bons utilisateurs le sont encore plus."
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
		description: "Telle Chicxulub, vous aurez une puissance dévastatrice, un flux rare d’une complexité immense, vous devrez sans doute vous entraîner toute votre vie pour parfaire ce pouvoir. Un pouvoir aussi dangereux pour son utilisateur que pour ses ennemis."
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
		description: "Vous êtes un Soigneur. Votre flux permet d’accélérer la récupération d’une plaie ou d’une maladie. Un flux extrêmement rare, très recherché. Deviendrez vous le soigneur d’une contrée entière ou un combattant immortel ? À vous de choisir."
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
		description: "Vous êtes un Destructeur de Temps. Vous pouvez stopper le temps dans une zone donnée. Un pouvoir rare possédant de forte contrainte, qui est beaucoup plus dur à maîtriser que ce que l'on peut penser. Je me demande ce que vous en ferez."
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
		description: "Vous êtes un Créateur de Peste. Vous créer des monstres microscopiques pouvant mettre à mal le plus robuste des combattants. C’est un pouvoir extrêmement rare et dévastateur. Il nécessite une connaissance approfondie de la santé pour fonctionner à son plein potentiel."
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
		description: "Vous êtes un Créateur de Sang. Un flux étrange, similaire à celui de l’eau. À vous de vous démarquer avec, d'utilisez chaque composant de ce liquide et toutes ses formes pour devenir un combattant remarquable."
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
		description: "Vous êtes un Créateur de Chaleur. Vous pouvez augmenter la chaleur d’un endroit à votre guise. Un pouvoir subtil qui vous permettra de faire connaître l’enfer à vos opposants, ou de devenir le plus grand cuisinier que ce monde aie connu."
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
		description: "Vous êtes un Créateur d'Éclairs. Foudroyez vos adversaires avec une vitesse hors du commun. Un pouvoir très puissant mais avec des contrecoups qui peuvent s’avérer fatal."
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
		description: "Vous êtes un Créateur de Flammes Ardentes. Un pouvoir ayant une puissance supérieure à celle des flammes classiques, cependant très gourmand en flux et encore plus dangereuse pour son utilisateur que celui des flammes. Certains maîtres de ce flux arrivent même à générer des flammes pouvant virer au bleu azur."
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
		description: "Vous êtes un Créateur d’Os. Bien que morbide ce pouvoir possède de nombreuses qualités, seule votre imagination vous limitera. Vous ferez sans doute peur aux enfants, mais aussi à vos cibles."
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
		description: "Vous êtes un Créateur de Terre. Un flux très commun mais avec énormément de possibilités. Une imagination débordante est importante pour maîtriser ce pouvoir. Avec de l’entraînement même des rochers peuvent être générés."
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
		description: "Vous êtes un Créateur de Coquillages. Un flux rare et très spécifique, à l’instar d’un animal vous pourrez vous rendre indestructible et créer des lames aussi tranchantes que du verre."
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
		description: "Vous êtes un Créateur de Sable. Un flux, bien que commun, peut se révéler très puissant. Pour vos adversaires vous serez un démon venue du désert, capable de créer des tempêtes de sable à sa guise."
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
		description: "Vous êtes un créateur de cristaux. On dit souvent que le diamant est le matériau le plus dur du monde, que ferez-vous avec un tel pouvoir ?"
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
		description: "Vous êtes un Créateur de Fer. En un claquement de doigt vous pourrez revêtir une armure impénétrable ou vous forger la plus grande des épées. Il s’agit d’un flux où l’imagination est très importante."
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
		description: "Vous êtes un Créateur de Cendre. Un pouvoir quelque peu rare, à vous et votre imagination de déterminer son potentiel. Réduirez-vous le monde à l’image de votre flux ?"
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
		description: "Vous êtes un Donneur de Vie. Un flux très rare qui vous permet d’insuffler la vie temporairement à des objets et leur donner des ordres. L' individu possédant ce flux possède aussi une grande force régénératrice."
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
		name: "Créateur d'Oeils",
		names: [
			"Giya",
			"Zaya",
			"Maya"
		],
		description: "Vous êtes un Créateur d’Oeils. Un flux aussi rare qu’il est morbide. Vous pouvez créer des yeux. Bien qu’inutile en combat, on raconte que ceux capable de le maîtriser parfaitement arrivent à voir ce que les yeux créer observent. Je vous laisse réfléchir aux possibilités de ce pouvoir…"
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
		description: "Vous êtes Immortel. Un flux mythique qui n’a jamais existé, jusqu’à maintenant. Votre corps se refuse de mourir, qu’importe les dégâts et la vieillesse qu’il reçoit. Vous finissez toujours par récupérer votre forme normale. Une bénédiction pour certains, un enfer pour d'autres."
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
		description: "Vous êtes un Créateur de Vent. Un flux très commun mais à ne surtout pas sous-estimé. Peut-être qu’au début ce ne sera qu’une brise, mais avec de l’entraînement, cela conduira à un ouragan."
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
		description: "Empoisonné, inflammable, explosif, à vous de connaître tous les types de gaz à votre disposition pour devenir un combattant inattrapable."
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
		description: "Vous êtes un Créateur de Lumière. Flash bombe, Illusion, Intimidation, à vous de découvrir votre propre style avec ce pouvoir."
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
		description: "Vous êtes un Créateur de Force Pure. C’est un flux simple, augmentant votre force de frappe. Vous l’aurez compris, il est aussi simple que surpuissant. Faites en bon usage et attention aux contrecoups."
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
		description: "Vous êtes un Annihilateur de Vie. D’un simple contact avec un individu, vous pouvez gangréner le corps d’autrui. Vous serez surement haït et fuit pour ce pouvoir, mais sachez que peu d'individus arriveront à votre cheville."
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
	Pura: "Soit fort, et rien de grave ne t'arriveras...",
	Shizari: "Je les ai tous découverts...",
	Yinva: "Suis-moi, le monde que tu connais est si petit...",
	Chaos: "Qui es-tu ?.."
};
