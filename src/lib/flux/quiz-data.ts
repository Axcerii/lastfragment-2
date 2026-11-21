// Questions du test de flux (Quiz 2 : Quiz2Reponses/Quiz 2 - Feuille 1.csv), flux repris de
// Quiz2Reponses/Résultats Flux - Flux - Résultats.csv, citations de la V1. Chaque réponse rapporte des
// lettres : voir $lib/flux/quiz.
//
// Tout ce qui s'adresse au personnage s'accorde : « {masculin|féminin} », résolu à l'affichage par
// gendered() ($lib/flux/address) selon le choix fait à l'entrée du don de flux.

export type QuizQuestion = { text: string; answers: { text: string; letters: string }[] };

export const QUESTIONS: QuizQuestion[] = [
	{
		text: "Tes paupières sont lourdes, une odeur douce et familière dilate tes narines, tu te réveilles, {allongé|allongée}, dans un champ de...",
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
			{ text: "Tu t'es {endormi|endormie} après une balade pour soigner une énième insomnie", letters: "AFJK" },
			{ text: "Tu as poursuivi un scélérat et tu t'es {écroulé|écroulée} de fatigue", letters: "GI" },
			{ text: "Tu as eu une soirée à la taverne qui est allée trop loin, et dont tu espères ne jamais te souvenir", letters: "DE" },
			{ text: "Tu as été {téléporté|téléportée} par une magie étrange, tu ne fais jamais rien d'inconscient", letters: "BCH" }
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
			{ text: "{d'un soldat en armure, perdu dans ce qu'il doit accomplir|d'une soldate en armure, perdue dans ce qu'elle doit accomplir}", letters: "DE" },
			{ text: "{d'un|d'une} mercenaire à la recherche d'une fortune toujours plus importante", letters: "HIK" },
			{ text: "{d'un futur héros|d'une future héroïne}, qui a encore ses preuves à faire", letters: "BG" },
			{ text: "{d'un vagabond|d'une vagabonde} lambda sans aucune ambition", letters: "ACFJ" }
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
			{ text: "Aucun dieu, tu n'es pas du genre {religieux|religieuse}", letters: "ABEIK" }
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
			{ text: "ton fidèle destrier, un vrai gourmand mais il t'a {sorti|sortie} des pires situations", letters: "BEK" },
			{ text: "ton oiseau voyageur qui te permet de prendre contact avec ta famille sans être {encombré|encombrée}", letters: "FGH" },
			{ text: "ton chien de chasse, ton véritable meilleur ami", letters: "DJ" },
			{ text: "ton casse-croûte, cette solitude est un véritable confort pour toi", letters: "ACI" }
		]
	},
	{
		text: "Dans ton sommeil, tu entends un cri de détresse provenant des bois à proximité de toi, tu...",
		answers: [
			{ text: "prends ton arme, et tu cours aider la personne sans attendre", letters: "AFH" },
			{ text: "récupères ton arme, et avances furtivement jusqu'à pouvoir évaluer le danger avant d'agir", letters: "DG" },
			{ text: "fuis, tu n'es pas {prêt|prête} à risquer ta vie pour sauver un inconnu", letters: "CK" },
			{ text: "te rendors, ce n'est peut-être qu'un renard, et au pire, tu ne dois rien à qui que ce soit", letters: "BEIJ" }
		]
	},
	{
		text: "Dans ton périple, tu trouves une entrée de grotte avec une porte utilisant une technologie nordique, tu...",
		answers: [
			{ text: "te poses et essaies de trouver une solution à cette énigme.", letters: "BDFH" },
			{ text: "sors tes outils et essaies de contourner le circuit en crochetant le mécanisme", letters: "J" },
			{ text: "frappes dedans avec ton arme pour forcer l'ouverture, parfois, ça marche", letters: "AEI" },
			{ text: "pars, il est dangereux d'ouvrir des ruines nordiques sans être {préparé|préparée}", letters: "CGK" }
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
		text: "Te voilà {rentré|rentrée} chez toi après cette intense aventure, tu te poses dans une taverne, tu commandes...",
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
			{ text: "un équipement légendaire pour être {prêt|prête} pour la prochaine escapade", letters: "GI" },
			{ text: "un nouveau cerveau pour ne plus jamais retomber dans ces travers", letters: "DFJ" },
			{ text: "rien, cette étrange aventure et le sourire des personnes sur le chemin en valaient la peine", letters: "ABH" }
		]
	},
	{
		text: "Finalement, tu t'allonges dans ton lit et tu repenses à ta vie, tu décides de te reprendre en main et de...",
		answers: [
			{ text: "véritablement passer tes classes et devenir {un soldat|une soldate} de l'armée", letters: "D" },
			{ text: "te réveiller, continuer à être {un|une} mercenaire à ton compte, mais le faire avec sérieux et conviction", letters: "C" },
			{ text: "finalement abandonner, et devenir {un brigand|une brigande}, le royaume n'a de cesse de te décevoir, tu vas prendre les armes et te révolter", letters: "IK" },
			{ text: "devenir {un aventurier|une aventurière}, qui aidera son prochain et vivra grâce à son sourire et ses services", letters: "FH" },
			{ text: "trouver la vérité sur le flux et la magie, devenir {un|une} scientifique, c'est ce qui te fait vibrer", letters: "BGJ" },
			{ text: "abandonner la voie de l'épée et devenir {un artisan|une artisane}, peut-être monteras-tu jusqu'à la bourgeoisie si tu es suffisamment capable", letters: "AE" }
		]
	}
];

export type FluxEntry = { dragons: [string, string]; name: string; names: string[]; description: string };

/** Flux né de deux dragons (dans un ordre ou dans l'autre). */
export const FLUXES: FluxEntry[] = [
	{
		dragons: ["Aqua", "Aqua"],
		name: "{Créateur|Créatrice} d'Eau",
		names: ["Aqua"],
		description: "Tu es {un descendant|une descendante} du Dieu de l'Eau pure. Ton pouvoir est de créer de l'eau. Un élément simple : tout le monde y voit son côté pratique, mais souvent, les plus ignorants n'arrivent pas à l'imaginer puissant lors d'un affrontement. Ce sera à toi de leur couper le souffle en leur montrant pourquoi l'Humanité a toujours craint le Déluge."
	},
	{
		dragons: ["Chronos", "Aqua"],
		name: "{Créateur|Créatrice} d'Oxydation",
		names: ["Noah", "Kuro", "Kroa"],
		description: "Tu es {un descendant|une descendante} du Dieu du Temps et de l'Eau. Ton pouvoir est de créer de l'oxydation. Si la rouille n'est pour toi qu'un outil pour empoisonner, ne t'es-tu jamais demandé ce qu'il se passe quand les métaux dans le sang s'oxydent ? Non ? C'est bien normal. Cependant, sur Arthera, un seul de tes touchers te donnera la réponse à cette interrogation tordue."
	},
	{
		dragons: ["Drii", "Aqua"],
		name: "{Créateur|Créatrice} de Vapeur",
		names: ["Drya", "Ria", "Kurii", "Ahrii"],
		description: "Tu es {un descendant|une descendante} du Dieu des Flammes et du Dieu de l'Eau. Ton pouvoir est de créer de la vapeur. Vas-tu réveiller l'assassin en toi, te camouflant dans cette épaisse fumée, ou vas-tu être {un mage réputé|une mage réputée} pour faire cuire les chevaliers les plus robustes malgré leurs protections clinquantes ? Arthera t'acceptera comme tu es, même si tu décides d'être {le plus grand cuiseur|la plus grande cuiseuse} de raviolis du pays."
	},
	{
		dragons: ["Goliath", "Aqua"],
		name: "{Créateur|Créatrice} de Boue",
		names: ["Kugo", "Ahli", "Liha"],
		description: "Tu es {un descendant|une descendante} du Dieu de l'Eau et du Dieu de la Terre. Ton pouvoir est la création de boue. Certains individus moqueront ton pouvoir car il est sale et manque de classe, ce qui te laissera le temps de les bétonner au sol, voire de les noyer sous ton flux. Il serait temps de rappeler aux personnes superficielles la disparition de régions entières à cause d'une simple coulée."
	},
	{
		dragons: ["Guizamark", "Aqua"],
		name: "{Créateur|Créatrice} de Plante",
		names: ["Zaha", "Maka", "Maha", "Kark"],
		description: "Tu es {un descendant|une descendante} du Dieu de l'Eau et du Dieu de la Vie. Ton pouvoir est la création de plantes. Des fleurs empoisonnées, des ronces urticantes, des racines indéchirables... Ta puissance n'aura de limite que ta connaissance botanique. Je me demande comment tu utiliseras un pouvoir aussi vaste que celui-ci..."
	},
	{
		dragons: ["Lada", "Aqua"],
		name: "{Créateur|Créatrice} de Glace",
		names: ["Laha", "Daha", "Kuda", "Kula"],
		description: "Tu es {un descendant|une descendante} du Dieu de l'Eau et du Vent. Ton pouvoir te permet de générer de la glace. Un flux élémentaire simple, et pourtant son nombre d'usages n'a de limite que ta créativité. Une magie à double tranchant, aussi efficace pour neutraliser tes adversaires que pour ralentir tes propres mouvements."
	},
	{
		dragons: ["Pestia", "Aqua"],
		name: "{Créateur|Créatrice} de Nuage",
		names: ["Tiha", "Tiku", "Sepia"],
		description: "Tu es {un descendant|une descendante} de la Déesse de la Lumière et du Dieu de l'Eau. Ton pouvoir te permet de fabriquer des nuages. Seront-ils orageux ? Pluvieux ? Nombreux ? Lourds ? Légers ? Un pouvoir versatile nécessitant une grande créativité et une connaissance aiguë de la météo. En seras-tu digne ? Ou deviendras-tu {un paysan|une paysanne} avec des terres efficaces 24/24, peu importent les saisons ?"
	},
	{
		dragons: ["Pura", "Aqua"],
		name: "{Créateur|Créatrice} de Résine",
		names: ["Hapu", "Raha", "Ra", "Kara"],
		description: "Tu es {un descendant|une descendante} du Dieu de la Force et du Dieu de l'Eau. Ton pouvoir est de créer de la résine. Une magie colorée pour couler les cercueils les plus créatifs avant d'enterrer tes cibles. Ce flux est aussi bon défensivement qu'offensivement : ses limites sont déterminées par ta créativité à utiliser un élément alternant entre le solide et le liquide aussi rapidement que le béton moderne."
	},
	{
		dragons: ["Shizari", "Aqua"],
		name: "{Créateur|Créatrice} de Poison Liquide",
		names: ["Zaha", "Hashi", "Shiku", "Kuri"],
		description: "Tu es {un descendant|une descendante} du Dieu de la Mort et du Dieu de l'Eau. Ton pouvoir est de créer du poison liquide. Entre les remèdes des apothicaires et les venins mortels, ton flux ne laisse aucune chance à ceux qui sous-estiment la pureté d'un liquide. Une flasque suffit à transformer un banquet en tragédie silencieuse. La convoitise de ton pouvoir par autrui sera le fardeau que tu transporteras."
	},
	{
		dragons: ["Chronos", "Chronos"],
		name: "{Accélérateur Temporel|Accélératrice Temporelle}",
		names: ["Chronos", "Kro", "Nos", "Son"],
		description: "Tu es {un descendant|une descendante} du Dieu du Temps. Ton pouvoir est l'accélération temporelle. Un flux d'une rareté inouïe qui semble semer le chaos d'un simple clin d'œil. Si d'autres voient en toi {un prodige|une prodige} capable de plier les secondes à sa volonté, ils oublieront les années de pratique qui t'ont {mené|menée} à cette maîtrise. {Seul un véritable maître|Seule une véritable maîtresse} de l'effort et de la patience arrivera à dompter le don de Chronos."
	},
	{
		dragons: ["Drii", "Chronos"],
		name: "{Créateur|Créatrice} de Météorite",
		names: ["Driinos", "Riinos", "Kronii"],
		description: "Tu es {un descendant|une descendante} du Dieu des Flammes et du Dieu du Temps. Ton pouvoir est de créer des météorites. Tel un cataclysme ancien, tu copieras le ciel en invoquant des masses incandescentes soumises aux lois de la gravité. Un flux d'une puissance dévastatrice et d'une rareté absolue, aussi dangereux pour tes ennemis que pour toi-même. Combien de personnes arriveras-tu à éliminer avant que cette même force mette un point final à ton histoire ?"
	},
	{
		dragons: ["Goliath", "Chronos"],
		name: "{Créateur|Créatrice} de Fossile",
		names: ["Linos", "Gonos", "Lianos", "Kroli"],
		description: "Tu es {un descendant|une descendante} du Dieu de la Terre et du Dieu du Temps. Ton pouvoir est de créer des fossiles. Tu manipules la mémoire pétrifiée de la terre et des âges révolus. Ce flux rare exige une imagination et une érudition sans faille pour redonner forme à ce que la poussière du temps a oublié. Seras-tu {celui|celle} qui fera renaître les géants d'antan ?"
	},
	{
		dragons: ["Guizamark", "Chronos"],
		name: "{Soigneur|Soigneuse}",
		names: ["Zanos", "Noma", "Kroma"],
		description: "Tu es {un descendant|une descendante} du Dieu de la Vie et du Dieu du Temps. Ton pouvoir est la guérison et l'accélération cellulaire. {Doté|Dotée} d'un flux rarissime et ardemment convoité, tu disposes du pouvoir de recoudre les chairs et de repousser la mort. Deviendras-tu {le bienfaiteur|la bienfaitrice} d'une contrée entière ou {un combattant immortel|une combattante immortelle} renaissant de ses cendres après chaque assaut ?"
	},
	{
		dragons: ["Lada", "Chronos"],
		name: "{Créateur|Créatrice} de Poussière",
		names: ["Lanos", "Danos", "Nala", "Dana"],
		description: "Tu es {un descendant|une descendante} du Dieu du Vent et du Dieu du Temps. Ton pouvoir est de créer de la poussière. Un flux étrangement rare, où le souffle du vent et l'usure des âges se conjuguent. Ce qui semble n'être qu'une brume futile devient entre tes mains un outil d'aveuglement et de dégradation redoutable. Un flux subtil pour {celui|celle} qui saura s'en servir."
	},
	{
		dragons: ["Pestia", "Chronos"],
		name: "{Créateur|Créatrice} de Mirage",
		names: ["Tiano", "Kroya", "Noya"],
		description: "Tu es {un descendant|une descendante} de la Déesse de la Lumière et de l'Espace et du Dieu du Temps. Ton pouvoir est de créer des mirages en ralentissant la vitesse de la lumière pour projeter des images du passé. Un pouvoir fascinant et rare qui fera des merveilles dans l'ombre et le secret. Duperas-tu tes futures cibles, ou réaliseras-tu le plus beau des spectacles ?"
	},
	{
		dragons: ["Pura", "Chronos"],
		name: "{Destructeur|Destructrice} de Temps",
		names: ["Ranos", "Krora", "Nosu"],
		description: "Tu es {un descendant|une descendante} du Dieu de la Force et du Dieu du Temps. Ton pouvoir est {le Destructeur|la Destructrice} de Temps, capable de figer le cours du monde dans une zone donnée. Un pouvoir d'une immense rareté aux contraintes tout aussi grandes, bien plus lourd à porter que la simple force physique. Quand le monde autour de toi sera figé, comment t'en sortiras-tu ?"
	},
	{
		dragons: ["Shizari", "Chronos"],
		name: "{Créateur|Créatrice} de Peste",
		names: ["Zanos", "Shino", "Rinos"],
		description: "Tu es {un descendant|une descendante} du Dieu de la Mort et du Dieu du Temps. Ton pouvoir est de créer la peste, générant des fléaux microscopiques capables d'abattre les plus robustes guerriers. Un flux terrifiant qui exige une science médicale poussée pour être libéré à son plein potentiel. Un pouvoir que certains auraient préféré bannir en temps de guerre."
	},
	{
		dragons: ["Drii", "Drii"],
		name: "{Créateur|Créatrice} de Feu",
		names: ["Drii", "Reed", "Lily"],
		description: "Tu es {un descendant|une descendante} du Dieu des Flammes. Ton pouvoir est le feu pur. S'il s'agit de l'un des flux les plus communs d'Arthera, sa simplicité n'a d'égale que sa dangerosité mortelle. Entre la chaleur domestique et l'incendie dévastateur qui consume tout sur son passage, sauras-tu dompter la flamme sans te brûler les ailes ?"
	},
	{
		dragons: ["Goliath", "Drii"],
		name: "{Créateur|Créatrice} de Magma",
		names: ["Gori", "Dryath", "Liry"],
		description: "Tu es {un descendant|une descendante} de la Terre et des Flammes. Ton pouvoir est de générer du magma en fusion. Une fournaise souterraine aussi destructrice pour les lignes ennemies que périlleuse pour ton propre équilibre. Quand la roche en pleurs s'abat sur tes opposants, reste-t-il seulement quelqu'un pour contester ta puissance ?"
	},
	{
		dragons: ["Guizamark", "Drii"],
		name: "{Créateur|Créatrice} de Sang",
		names: ["Zari", "Mari", "Giri"],
		description: "Tu es {un descendant|une descendante} du Dieu de la Vie et du Dieu des Flammes. Ton pouvoir est de créer et manipuler le sang. Un flux étrange, proche de l'eau en apparence, mais bien plus troublant à affronter. Si tu apprends à jouer avec chaque élément qui le compose, tu deviendras vite {un combattant redouté|une combattante redoutée} dans toutes les arènes d'Arthera."
	},
	{
		dragons: ["Lada", "Drii"],
		name: "{Créateur|Créatrice} de Chaleur",
		names: ["Lari", "Dari", "Rida", "Rila"],
		description: "Tu es {un descendant|une descendante} du Dieu du Vent et du Dieu des Flammes. Ton pouvoir est d'augmenter la chaleur autour de toi à ta guise. Un flux discret en apparence, mais redoutable : tu peux transformer l'air d'un champ de bataille en fournaise pour tes ennemis, ou simplement devenir {le plus grand cuisinier qu'Arthera ait jamais connu|la plus grande cuisinière qu'Arthera ait jamais connue}."
	},
	{
		dragons: ["Pestia", "Drii"],
		name: "{Créateur|Créatrice} d'Éclairs",
		names: ["Drya", "Rya", "Tiry"],
		description: "Tu es {un descendant|une descendante} de la Déesse de la Lumière et du Dieu des Flammes. Ton pouvoir est de faire jaillir des éclairs. Tu frappes plus vite que l'œil ne peut suivre, mais une telle puissance a un prix : le moindre faux pas et le contrecoup de ton propre flux risque de te foudroyer sur place."
	},
	{
		dragons: ["Pura", "Drii"],
		name: "{Créateur|Créatrice} de Flammes Ardentes",
		names: ["Rira", "Dura", "Lyra"],
		description: "Tu es {un descendant|une descendante} du Dieu de la Force et du Dieu des Flammes. Ton pouvoir génère des flammes bien plus brûlantes que le feu ordinaire. Très gourmand en énergie et dangereux pour ton propre corps, ce flux demande un contrôle de fer. On raconte que les meilleurs maîtres arrivent à pousser leurs flammes jusqu'au bleu azur, capables de tout faire fondre en quelques secondes."
	},
	{
		dragons: ["Shizari", "Drii"],
		name: "{Créateur|Créatrice} de Flammes Colorées",
		names: ["Shiri", "Zari", "Lily"],
		description: "Tu es {un descendant|une descendante} du Dieu de la Mort et du Dieu des Flammes. Ton pouvoir te permet de créer des flammes colorées. Vertes, violettes ou pâles, elles changent de température et dégagent des fumées toxiques selon leur teinte. Les curieux y verront un joli spectacle, mais sur le terrain, tu pourras étouffer tes ennemis sans même les toucher."
	},
	{
		dragons: ["Goliath", "Goliath"],
		name: "{Créateur|Créatrice} de Terre",
		names: ["Goliath"],
		description: "Tu es {un descendant|une descendante} du Dieu de la Terre. Ton pouvoir est de créer de la terre et des roches. Beaucoup le jugent banal parce qu'il est répandu, mais tout dépend de ton imagination. D'un simple mur pour bloquer une flèche à des blocs de pierre capables d'écraser une escouade. Qu'ils n'oublient jamais qu'un Dieu a porté ce pouvoir."
	},
	{
		dragons: ["Guizamark", "Goliath"],
		name: "{Créateur|Créatrice} de Coquillages",
		names: ["Goli", "Zayath", "Zalia", "Mali"],
		description: "Tu es {un descendant|une descendante} du Dieu de la Vie et du Dieu de la Terre. Ton pouvoir est de créer des coquillages. Un flux rare et étrange qui te permet de t'enfermer dans une coquille presque impossible à briser, ou de façonner des lames aussi tranchantes que du verre. Sous-estimé au premier regard, délicieux au corps à corps."
	},
	{
		dragons: ["Lada", "Goliath"],
		name: "{Créateur|Créatrice} de Sable",
		names: ["Dali", "Gola", "Dago"],
		description: "Tu es {un descendant|une descendante} du Dieu du Vent et du Dieu de la Terre. Ton pouvoir est de créer du sable. Bien qu'il soit assez courant, ce flux peut vite tourner au cauchemar pour tes adversaires. Aveugler une troupe entière ou lever une tempête en plein combat : pour eux, tu seras {un vrai démon|une vraie démone} du désert."
	},
	{
		dragons: ["Pestia", "Goliath"],
		name: "{Créateur|Créatrice} de Cristaux",
		names: ["Gotia", "Ai", "Talia"],
		description: "Tu es {un descendant|une descendante} de la Déesse de la Lumière et du Dieu de la Terre. Ton pouvoir est de faire pousser des cristaux. On dit souvent que le diamant est la matière la plus dure au monde : entre boucliers transparents, pièges coupants et armes de luxe, tu as de quoi escroquer autant que de découper tes cibles."
	},
	{
		dragons: ["Pura", "Goliath"],
		name: "{Créateur|Créatrice} de Fer",
		names: ["Gora", "Pulia", "Raliath", "Ralia"],
		description: "Tu es {un descendant|une descendante} du Dieu de la Force et du Dieu de la Terre. Ton pouvoir est de créer du fer. En un clin d'œil, tu peux te couvrir d'une armure solide ou forger une épée à ta mesure sans jamais passer par une forge. Avec un peu d'imagination, tu ne manqueras jamais d'armes ni de défenses."
	},
	{
		dragons: ["Shizari", "Goliath"],
		name: "{Créateur|Créatrice} de Sel",
		names: ["Zayath", "Zalia", "Shigo", "Goshi"],
		description: "Tu es {un descendant|une descendante} du Dieu de la Mort et du Dieu de la Terre. Ton pouvoir est de créer du sel. Un grain blanc qui paraît inoffensif, mais qui assèche la terre et vide les corps de leur eau. Pendant que d'autres sortent les lames ou le feu, tu peux rendre un champ stérile ou épuiser tes ennemis sans verser une goutte de sang."
	},
	{
		dragons: ["Guizamark", "Guizamark"],
		name: "{Donneur|Donneuse} de Vie",
		names: ["Guizamark"],
		description: "Tu es {un descendant|une descendante} du Dieu de la Vie. Ton pouvoir est le Don de Vie. Extrêmement rare, il te permet d'animer des objets pendant un temps pour leur donner des ordres, tout en offrant à ton corps une récupération hors norme. Une simple statue ou une épée posée au sol peut soudain devenir ton garde du corps."
	},
	{
		dragons: ["Lada", "Guizamark"],
		name: "{Créateur|Créatrice} d'Ailes",
		names: ["Daza", "Mala", "Guida", "Guila"],
		description: "Tu es {un descendant|une descendante} du Dieu du Vent et du Dieu de la Vie. Ton pouvoir est de créer des ailes de toutes tailles et de toutes formes. Ce flux très rare attire toutes les convoitises, car on raconte qu'avec assez d'entraînement, il permet de s'envoler pour de bon. Sur Arthera, obtenir l'avantage des airs change toutes les règles du jeu."
	},
	{
		dragons: ["Pestia", "Guizamark"],
		name: "{Créateur|Créatrice} d'Yeux",
		names: ["Giya", "Zaya", "Maya"],
		description: "Tu es {un descendant|une descendante} de la Déesse de la Lumière et du Dieu de la Vie. Ton pouvoir est de créer des yeux. Un flux aussi rare que dérangeant : inutile pour frapper un ennemi, mais redoutable pour l'espionnage. Ceux qui le maîtrisent arrivent à voir à travers chaque œil qu'ils ont caché dans un recoin. Aucun secret ne reste bien gardé très longtemps avec toi..."
	},
	{
		dragons: ["Pura", "Guizamark"],
		name: "{Créateur|Créatrice} de Fibres Musculaires",
		names: ["Zara", "Gira", "Mara"],
		description: "Tu es {un descendant|une descendante} du Dieu de la Force et du Dieu de la Vie. Ton pouvoir est de créer des fibres musculaires. Un don un peu étrange au premier abord, mais qui te permet de renforcer ton corps ou de réparer un muscle déchiré en plein effort. Avec un peu d'astuce, ta puissance physique dépassera vite ce que les autres croient possible."
	},
	{
		dragons: ["Shizari", "Guizamark"],
		name: "{Immortel|Immortelle}",
		names: ["Za", "Shiza", "Mashi", "Shigi"],
		description: "Tu es {un descendant|une descendante} du Dieu de la Mort et du Dieu de la Vie. Ton pouvoir est l'Immortalité. Un flux légendaire qui n'avait jamais existé jusqu'à toi : ton corps refuse de mourir, peu importe les blessures ou le temps qui passe, et finit toujours par reprendre sa forme normale. Une bénédiction pour certains, un enfer si tu veux mon avis."
	},
	{
		dragons: ["Lada", "Lada"],
		name: "{Créateur|Créatrice} de Vent",
		names: ["Lada", "Dala"],
		description: "Tu es {un descendant|une descendante} du Dieu du Vent. Ton pouvoir est de créer du vent. C'est l'un des flux les plus répandus, mais il serait stupide de le prendre à la légère. Ce qui n'est au début qu'une simple brise peut devenir un véritable ouragan avec de l'entraînement. Prendras-tu ton envol en utilisant ce don de Lada ?"
	},
	{
		dragons: ["Pestia", "Lada"],
		name: "{Créateur|Créatrice} de Typhon",
		names: ["Lydia", "Daya", "Pelia"],
		description: "Tu es {un descendant|une descendante} de la Déesse de la Lumière et du Dieu du Vent. Ton pouvoir est de déclencher des typhons. Un flux d'une puissance brute capable de ravager une zone entière en quelques instants. Le plus dur ne sera pas de vaincre tes ennemis, mais de garder le contrôle pour ne pas emporter tes propres alliés avec eux."
	},
	{
		dragons: ["Pura", "Lada"],
		name: "{Créateur|Créatrice} de Tornade",
		names: ["Dara", "Lara", "Pula"],
		description: "Tu es {un descendant|une descendante} du Dieu de la Force et du Dieu du Vent. Ton pouvoir est de créer des tornades. D'un simple geste, tu peux arracher des toits et balayer une troupe entière sur ton passage. C'est un flux spectaculaire et brutal, mais il vide ton énergie à toute vitesse si tu ne sais pas te retenir."
	},
	{
		dragons: ["Shizari", "Lada"],
		name: "{Créateur|Créatrice} de Gaz",
		names: ["Laza", "Shila", "Shida", "Lashi"],
		description: "Tu es {un descendant|une descendante} du Dieu de la Mort et du Dieu du Vent. Ton pouvoir est de créer et contrôler les gaz. Toxiques, étouffants ou explosifs, ils sont souvent invisibles jusqu'à ce qu'il soit trop tard. Si tu prends le temps d'apprendre leurs effets, tu deviendras {un adversaire|une adversaire} impossible à attraper."
	},
	{
		dragons: ["Pestia", "Pestia"],
		name: "{Créateur|Créatrice} de Lumière",
		names: ["Pestia", "Tia"],
		description: "Tu es {un descendant|une descendante} de la Déesse de la Lumière et de l'Espace. Ton pouvoir est de créer de la lumière. Éclairs aveuglants, fausses silhouettes ou signaux visibles à des lieues : ce flux brille autant par sa souplesse que par son prestige. À toi de trouver ton propre style pour éblouir tes adversaires au sens propre comme au figuré."
	},
	{
		dragons: ["Pura", "Pestia"],
		name: "{Créateur|Créatrice} de Gravité",
		names: ["Tiara", "Pera", "Ratia"],
		description: "Tu es {un descendant|une descendante} de la Déesse de la Lumière et de l'Espace et du Dieu de la Force. Ton pouvoir te permet de modifier la gravité. Ceux qui pensent que tu ne sais que faire flotter des cailloux déchantent vite quand leur armure pèse soudain dix fois son poids. Un flux rare et redoutable, mais la moindre erreur de calcul te laissera saluer le Dieu de la Mort."
	},
	{
		dragons: ["Shizari", "Pestia"],
		name: "{Créateur|Créatrice} d'Acide",
		names: ["Zaya", "Shiya", "Rya"],
		description: "Tu es {un descendant|une descendante} du Dieu de la Mort et de la Déesse de la Lumière. Ton pouvoir est de créer de l'acide. D'une grande rareté et tout aussi dangereux, ce liquide ronge le métal comme la pierre en quelques secondes. Tout le monde le voit comme un outil de destruction pure, mais entre tes mains, il peut aussi servir à nettoyer et repartir à zéro."
	},
	{
		dragons: ["Pura", "Pura"],
		name: "{Créateur|Créatrice} de Force Pure",
		names: ["Pura"],
		description: "Tu es {un descendant|une descendante} du Dieu de la Force. Ton pouvoir est la Force Pure. Pas d'artifices ni d'effets compliqués : chaque coup que tu portes frappe avec une puissance démesurée. C'est direct et redoutable, à condition que ton corps soit assez solide pour encaisser le choc de tes propres attaques."
	},
	{
		dragons: ["Shizari", "Pura"],
		name: "{Créateur|Créatrice} de Putréfaction",
		names: ["Zara", "Shira", "Shipu", "Zaria"],
		description: "Tu es {un descendant|une descendante} du Dieu de la Mort et du Dieu de la Force. Ton pouvoir est la Putréfaction. Tu peux faire naître de la chair et des muscles en décomposition, humains ou animaux, avec les odeurs et les maladies qui les accompagnent. Un flux répugnant qui retourne l'estomac des plus braves avant même le début du duel."
	},
	{
		dragons: ["Shizari", "Shizari"],
		name: "{Annihilateur|Annihilatrice} de Vie",
		names: ["Shiza", "Shy", "Shizari"],
		description: "Tu es {un descendant|une descendante} du Dieu de la Mort. Ton pouvoir est d'annihiler la vie. Un simple contact de ta main suffit à faire pourrir et dépérir le corps de celui que tu touches. Les gens te fuiront et te craindront à cause de ce don, mais sur le terrain, presque personne n'osera croiser ta route."
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
	Pura: "Sois {fort|forte}, et rien de grave ne t'arrivera...",
	Shizari: "Je les ai tous découverts...",
	Yinva: "Suis-moi, le monde que tu connais est si petit...",
	Chaos: "Qui es-tu ?.."
};
