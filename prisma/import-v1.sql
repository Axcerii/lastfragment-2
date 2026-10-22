-- Last Fragment 2 : import des données de la V1
--
-- Source : dump de la prod V1 (alwaysdata, 21/10/2026), dossier descriptions et images de la V1.
-- Contenu :
--   101 personnages et leurs stats, 18 monstres et leurs stats,
--   117 objets (catalogue générique, dont 32 armures avec leurs bonus),
--   50 compétences, 62 compétences de badges, 43 aliments.
-- Non repris : comptes joueurs, argent, inventaires, passifs, sacs de nourriture, état du monde,
--   quiz, et les champs abandonnés (âge, sexe, ethnie, thème musical, groupe, race des monstres,
--   prix saisonniers, qualité et quantité des aliments).
--
-- Prérequis : le schéma de la branche refonte-v2 (colonnes dead, censored, quote, icon…),
--   appliqué par le conteneur au démarrage (prisma db push).
--   Les images V1 sont dans static/uploads/personnages/v1 et static/uploads/monsters/v1 :
--   elles partent avec le build, comme les portraits V2 déjà présents.
--
-- Exécution, depuis le dossier lastfragment2 (bash comme PowerShell), après une sauvegarde de la base :
--   docker compose cp prisma/import-v1.sql db:/tmp/import-v1.sql
--   docker compose exec db sh -c 'mysql --default-character-set=utf8mb4 -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < /tmp/import-v1.sql'
--   La dernière ligne affiche le nombre total de lignes de chaque table.
--
-- Tout passe dans une seule transaction : en cas d’erreur, rien n’est enregistré.
-- Un personnage, monstre, objet, compétence ou aliment dont le nom existe déjà (ou une paire de badges
-- déjà définie) est laissé tel quel : relancer le script ne crée pas de doublons.

SET NAMES utf8mb4;
SET SESSION sql_mode = REPLACE(@@SESSION.sql_mode, 'NO_BACKSLASH_ESCAPES', '');
START TRANSACTION;

-- Ce qui existe déjà avant l’import
DROP TEMPORARY TABLE IF EXISTS `lf_v1_characters`, `lf_v1_monsters`, `lf_v1_items`, `lf_v1_skills`, `lf_v1_badges`, `lf_v1_foods`;
CREATE TEMPORARY TABLE `lf_v1_characters` AS SELECT `name` FROM `characters`;
CREATE TEMPORARY TABLE `lf_v1_monsters` AS SELECT `name` FROM `monsters`;
CREATE TEMPORARY TABLE `lf_v1_items` AS SELECT `name` FROM `items`;
CREATE TEMPORARY TABLE `lf_v1_skills` AS SELECT `name` FROM `skills`;
CREATE TEMPORARY TABLE `lf_v1_badges` AS SELECT `badges` FROM `badges`;
CREATE TEMPORARY TABLE `lf_v1_foods` AS SELECT `name` FROM `foods`;

-- ─── Personnages (101) ─────────────────────────────────────────────────────────

-- Gora : stats de la table joueurs (Gora)
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Gora');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Gora', 'Guerrier d''Argile', 'Création Acier', 'Goliath-Pura', 'Humain', 'Mudan', '/uploads/personnages/1766017384539-Gora-v2.png', 'Joueur, Classe Promo, Belinda, R6', 1, 0, 0, NULL,
  'Gora est un jeune enfant guilleret vivant dans le centre-Ouest de la région Mûdoise. Il vit avec ses parents dans un petit cabanon de ferme accompagné de ses trois sœurs ainsi que d’une vache. Il est le benjamin de la famille et le premier homme sur qui son père fonde beaucoup d’espoir. Toute la famille étant héritier directe du dragons des Eaux Calamiteuses, pour lui il voyait déjà son fils rejoindre les Archélémentalistes. Malheureusement, le pouvoir de son fils s’éveilla très tôt et n’avais rien à voir avec le Dragon des Océans, son fils était un héritier de Goliath, il était un créateur de bout de métal. Il abandonne bien vite ses idéaux, qu’à cela ne tienne, son fils héritera de la rizière, et vivra sa vie comme son paternel.\nUn innocent jour, comme à son habitude, la sœur aînée de Gora, Nika, fera un petit tour à Augeaime pour y vendre du riz, accompagnée d’une mercenaire. Un court voyage de quelques semaines, tout au plus. Le riz étant une denrée peu commune à la capitale des technologies, cela était parfait pour les affaires.\nAu retour du voyage, Nika était accompagnée d’une personne supplémentaire. Un homme, tout à fait curieux de rencontrer Gora. Ce dernier avait mis un petit morceau de métal généré par son flux dans le chariot de sa sœur avant son départ et cette personne jugea la remarquable qualité de cet éclat. Et il fit une offre très alléchante à ses parents, il prendrait leur enfant et se chargerait de son bien-être en plus d’une somme conséquente. Après de longues hésitations, pour le bien de leurs enfants et pour la somme conséquente ils finissent par accepter. Une erreur peut-être car là est bien la dernière fois qu’ils virent Gora.\n\nCe dernier arrivera à Augeaime en compagnie de cet individu. Il fut immédiatement vendu à un noble par cet homme en vantant les qualités de l’acier créé par le bambin. Les bonnes manières furent inculquées à l’enfant de manière peu conventionnelle. Gora en ressortira changé à jamais. Lui si guilleret était désormais d’un calme céleste, ne montrant aucune émotion, et quelque peu addict au vin et à l’hydromel. Le voici à 16 ans, en désaccord avec la morale qui lui est gravée, il décide de laisser ses cheveux naturels prendre le dessus, il était peu aimé de sa famille noble, mais son réalisait son travail toujours sans rien dire, ce qui lui vaudra d’avoir quelques libertés supplémentaires.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1530, 1630, 1040, 58, 67, 54, 49, 51, 51, 37, 34, 36, 47 FROM DUAL WHERE @ok;

-- Shuri : stats de la table joueurs (Shuri)
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Shuri');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Shuri', 'Guerrière d''Argile', 'Flammes dévoreuses de flux', 'Drii-Shizari', 'Éternelle', 'Mudan', '/uploads/personnages/v1/Shuri3.jpg', 'Joueur, Classe Promo, R7, Boobs, Éternelle', 0, 0, 0, NULL,
  'Je m''appelle Shuri et je suis une enfant éternelle qui vivait au sein d''une famille et d''amis aimants. Ma mère est forgeronne, et mon père revend les armes conçues par cette dernière. Ensemble, ils dirigent un commerce prospère appelé Oju-no-shiri, situé au cœur de l''archipel de la capitale Mûdoise. J''ai passé la majeure partie de mon temps entourée de mes amis, Suji et Yino, qui sont également des éternels. J''apprécie le combat, l''expérimentation, les ragots, l''argent et les voyages.\n\nUn jour, mon potentiel en matière de flux a été remarqué par l''école des archélémentalistes, ce qui a conduit à mon transfert vers le royaume d''Augeaime. J''ai été adoptée par une famille de nobles en compagnie de Gira, et par la suite, j''ai été envoyée à l''école pour parfaire mon éducation.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1365, 1095, 1000, 64, 50, 36, 50, 50, 47, 51, 53, 32, 38 FROM DUAL WHERE @ok;

-- Gira : stats de la table joueurs (Gira)
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Gira');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Gira', 'Guerrière d''Argile', 'Création de chair', 'Drii-Guizamark', 'Humain', 'Augeaime', '/uploads/personnages/v1/Gira.jpg', 'Joueur, Classe Promo, Bimbo, Champs, R7', 1, 0, 0, NULL,
  'À l’âge de 3 ans, Gira fit la découverte de cette sensation, cette essence qui créa tous ces changements dans sa vie, le flux. Elle vivait dans une famille pauvre, ensevelie sous les dettes. Leur fille possédait un pouvoir si particulier, attirant alors les regards, attisant la curiosité de certain, la nouvelle se repandit rapidement dans le village. Les parents de Gira rencontrèrent un soir, rentrant vers leur longère, un homme, vêtu d’un long manteau châtaigne, d’un chapeau rabattu devant son visage et de grandes bottes noires. Un air mystérieux émanait de lui. Ce soir-là, les parents de Gira commirent l’irréversible, ils avaient besoin d’argent, l’homme leur en proposait, malheureusement pas assez pour rembourser leurs dettes mais suffisamment pour espérer un nouveau départ. Toutefois, en échange de cet argent, ils allaient devoir se séparer de leur enfant, leur enfant au flux si spécial qui faisait vivre bien des rumeurs dans le village. Ainsi, Gira fut retirée à ses parents.\nAprès avoir été achetée, Gira fut confiée à une famille aisée, pouvant subvenir à tous ses besoins sans difficulté, travaillant tous les deux en tant que vendeur de fiole de flux. L’homme que les parents de Gira rencontrèrent ce soir-là était un envoyé de l’État. Son flux qui avait été nommé de « Création de chair » fut considéré comme à haut potentiel, il était donc primordial pour Gira de pouvoir évoluer sans difficulté, et par la suite devenir une figure publique de puissance aux côtés de l’État. Un parcours alors strict et exigeant l’attendait.\nDurant sa jeunesse ingénue, Gira fut soumise à des cours de bonnes manières. Pour le gouvernement il était crucial que leur futur symbole soit parfait aux yeux des citoyens. Ainsi, pendant 3 longues années Gira ne put réellement vivre, elle se levait quand elle devait, mangeait quand elle en avait le droit et en quantité qui lui était autorisée.\nUn jour, Gira vu une nouvelle personne faire son arrivée à la demeure de ses parents adoptifs, une fille nommée Shuri, possédant un flux nommé « Flammes Dévoreuses de flux ». Privé depuis son arrivée de tout type de relation, Gira identifia alors très vite Shuri comme sa sœur, malgré l’approche froide qu’elle pouvait adopter à son égard.\nÀ l’âge de 6 ans, Gira fut envoyée dans une école militaire, accompagnée de sa sœur, lieu en lequel elle allait enfin pouvoir développer et comprendre son flux. Elle avait enfin la possibilité d’avoir des amis, des discussions, partager ses sentiments. Malheureusement, les premières années furent, pour Gira, extrêmement difficile. N’ayant jamais eu l’opportunité de forger de relation avec d’autres enfants auparavant, elle préféra rester seule, loin de l’inconnu que cela engendrait en elle. Rester avec sa sœur était alors pour elle la solution de facilité. Ainsi, Gira passa la majorité de son temps aux cotés de Shuri.\nLes entrainements de l’école étaient sévères, visant à faire ressortir les capacités maximales de chacun. Gira, face à son flux particulièrement complexe commit quelques accidents, non grave, mais suffisant pour créer des rumeurs sur elle. À cause de cela elle fut souvent moquée et pointée du doigt, surnommer par divers mots dénigrants, ne faisant alors que renforcer son sentiment de rancœur envers les humains. Heureusement pour elle, sa sœur était toujours là pour elle, prête à la défendre dans n’importe quelle situation.\n\nEntrant alors dans la préadolescence, Gira décida de donner une seconde chance aux hommes, de s’ouvrir plus ouvertement à ce monde qu’elle avait pendant longtemps rejeté. Elle fit la rencontre d’une fille nommée Arua avec qui elle s’entendit particulièrement bien. Au début, Gira fut surprise que Arua ne la rejetait pas comme beaucoup d’autres, mais elle essaya de sortir ces pensées noires, après tout elle avait enfin une amie. Amie avec qui elle allait passer de nombreuses années. Cela faisait plaisir à Shiru de voir sa sœur enfin avoir une amie avec qui elle pouvait passer du temps.\n\nArua et Gira passèrent tout leur temps ensemble. Les soirs elles travaillèrent pour les entrainements futurs. Arua était une élève brillante, faisant partie des meilleurs, elle avait réussi à développer son flux de « Création d’eau » à une vitesse impressionnante. Pendant de nombreux mois, elle donna des cours particuliers tous les soirs à Gira dans un parc situé au sud-est de l’école, à l’abri des regards. Grâce à cela Gira acquit un niveau dépassant celui d’Arua, et ce plaça comme une des meilleurs élèves de l’école. Les rumeurs sur elle ne firent qu’alors d’augmenter, notamment à cause de la nature de son flux. Pour certain elle était la fille des enfers, pour d’autres une tueuse macabre à ses heures perdues. Pour réussir à ignorer tout ça, Gira s’enferma dans sa relation avec Arua et commença à développer des sentiments pour elle. Ce n’est que quelques semaines plus tard qu’elle décida de lui en parler, Arua lui avoua elle aussi vouloir plus qu’une amitié. Ainsi ce qui était deux amies devint une relation amoureuse. Toutefois, cette relation resta cachée, deux filles entretenant une liaison auraient été mal perçu. C’est donc à la fois dans la peur et l’excitation qu’Arua et Gira continuèrent d’aller dans leur parc “secret” pour se voir .\n\nMaintenant adolescente, Gira, 15 ans, voyait son parcours scolaire bientôt toucher à sa fin. La dixième année sonne le glas de l''école. Toutefois, Arua va être envoyée dans une autre région, loin d’Augeaime. Gira fait alors face de nouveau à la solitude, arrachée à la personne qu’elle aime, elle va devoir faire face au futur qui l’attend accompagnée de sa sœur, Shiru.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1590, 1185, 720, 62, 32, 29, 62, 60, 30, 25, 49, 33, 53 FROM DUAL WHERE @ok;

-- Zayath : stats de la table joueurs (Zayath)
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Zayath');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Zayath', 'Gardien de Pierre', 'Création d''être tellurique', 'Goliath-Guizamark', 'Humain', 'Saxifra', '/uploads/personnages/1766018455830-New-Zayath.png', 'Joueur, Classe Promo, R6', 1, 0, 0, NULL,
  'Zayath est né dans une petite bourgade au nord du royaume Augeaime dans une famille d’immigrés nordique. Une vie difficile se présentait à eux, les récoltes étaient compliquées et le racisme tout autant. Malgré ce mode de vie agaçant, il arrivait à subvenir aux besoins de l’enfant. Voulant être des citoyens exemplaires, ils recensent leur enfant à l’État Augeois, indiquant ainsi son flux peu commun de don de vie à la matière terrestre. À peine deux petits mois après avoir envoyé les papiers, un soldat vient toquer à la porte de nos amis. Il proposait d’emmener le jeune Zayath être éduqué dans la capitale par une noble famille Augeoise. Évidemment, une somme conséquente attendait ses parents. L’amour porté par sa mère força le refus de cette généreuse offre. Le soldat insista lourdement mais finit par s’en aller après les hurlements de la dame. La nuit qui suivit, Zayath disparu de sa chambre et nul ne sait ce qu’il est advenu de lui.\nSauf nous, pour sûr, il avait été emmené de force dans une famille noble, réputée pour leur arme. Ils devaient avoir une idée en tête en utilisant le flux du jeune homme. Là-bas, une éducation stricte des bonnes manières lui fut donnée par sa gouvernante. Une femme peureuse, terrifiée par les parents adoptifs du petit, qui essaiera de ne tisser aucun lien avec ce dernier. Ledit enfant sera plongé dans des émotions chaotiques tout au long de son éducation. Il reste souvent seul à jouer avec Dada, un Golem qu’il recrée toujours de la même façon en usant de ses pouvoirs.\nLe voilà désormais à 16 ans, avec les quelques amis qu’il a réussi à se faire, prêt pour sortir de l’école militaire.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1430, 1320, 1050, 60, 57, 39, 57, 57, 48, 70, 31, 53, 43 FROM DUAL WHERE @ok;

-- Nimha
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Nimha');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Nimha', 'Chevalier Dragon', 'Création de flammes', 'Drii', 'Humain', 'Augeaime', '/uploads/personnages/v1/Nimha.jpg', 'Professeur, R2', 0, 0, 0, NULL,
  'Nimha est une des chevaliers dragons d’Augeaime. Vous l’avez déjà vu à plusieurs reprises à l’école durant certains enseignements aux combats avec flux. Elle est respectée dans tout le pays comme étant l’une des plus grandes combattantes de la capitale. C’est une pyromancienne de renom.\n\nElle est très sévère et stricte lors de l’apprentissage mais semble beaucoup plus relaxée en dehors de l’école ou du travail.\n\nSuite à la guerre contre Irisia, elle a perdu son bras droit, ce qui lui a valu d''être le bouc émissaire de l''attaque du 8è Lanos, la voilà à la retraite forcée. Vous n''avez plus de nouvelle d''elle depuis ce moment là.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 2200, 2520, 1540, 82, 65, 72, 81, 78, 64, 75, 69, 65, 72 FROM DUAL WHERE @ok;

-- Dali
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Dali');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Dali', 'Chevalier Dragon', 'Création de Terre', 'Aqua-Goliath', 'Humain', 'Augeaime', '/uploads/personnages/v1/Dhali.jpg', 'Professeur, R2', 0, 0, 0, NULL,
  'Dali est un des chevaliers dragons d’Augeaime. Vous le connaissez de réputation, il a déjà accompagné Nimha lors de cours spéciaux. C’est un géomancien de la garde royal. Il semble beaucoup moins stricte que Nimha mais beaucoup d''anciens élèves disent qu’il est plus sévère que sa collègue.\n\nUne fois entré dans la vie active, vous avez pu voir Dali à l''action en tant que supérieur. C''est un tir-au-flanc professionnel qui n''hésite pas à reléguer son travail à ses subordonnées de façon abusive et irrespectueuse. Cependant dès qu''il y a quelque chose de grave ou d''important, Dali répond toujours à l''appelle. Il ne semble pas respecté dans le royaume et est un peu vu comme un charlatan, cependant chez les soldats, on reconnait sa puissance.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Phillia
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Phillia');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Phillia', 'Gardienne de Pierre', 'Limaille de Fer', 'Goliath-Lada-Pura', 'Humain', 'Augeaime', '/uploads/personnages/1766018200137-Phillia.png', 'Classe Promo, R5', 0, 0, 0, NULL,
  'Phillia est l’une de vos camarades de classe. Elle est plutôt populaire et confiante sur son propre flux, les professeurs l’adorent. Elle fait partie de l’élite de votre classe, dans une autre promotion, elle aurait pu être major. Elle s’entend très mal avec Leest, notamment dû au fait que cette dernière à les meilleurs résultats. Son flux est étrange, elle surnomme son flux “limaille de fer” mais vous n’y comprenez rien.\n\nPhillia est l''une des seules de votre promotion avec Destra et Leest à être monté R5. Elle est même devenu votre supérieur pour la guerre interne contre Sugawara.\n\nElle semble s''être assagie depuis votre adoubement, mais elle semble avoir créer une réel relation de haine avec Kanna, surtout depuis sa "victoire" à l''arène, durant la délégation. Mais, malgré cela, elle sait faire la part des choses en tant que responsable de votre groupe. Vous ne l''appréciez pas plus que cela mais vous respectez sa capacité à diriger des troupes.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1700, 1000, 840, 71, 26, 35, 52, 58, 40, 28, 47, 53, 54 FROM DUAL WHERE @ok;

-- Xianos
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Xianos');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Xianos', 'Guerrière d''Argile', 'Air venimeux', 'Lada-Shizari', 'Humain', 'Augeaime', '/uploads/personnages/1766018337986-Xianos.png', 'Classe Promo, Noble, Apollyon, R7', 0, 0, 0, NULL,
  'Xianos est l’une de vos camarades de classe. Elle est assez extravagante et possède toujours le sourire. Elle n''excelle ni en combat ni en classe mais est fondamentalement gentille, trop gentille. Beaucoup de personnes abusent de cela. À cause de son flux, elle finit souvent malade, les cours sont beaucoup plus ennuyeux sans ses interventions incessantes. Sa joie de vivre malgré les conditions dans l’enceinte du quartier scolaire semble indiquer qu’elle est une enfant légitime, mais elle n’a jamais parlé de sa famille donc vous n’en avez aucune idée.\n\nVous savez qu’elle pratique des instruments de musique car elle a déjà été sanctionnée pour utilisation d’instrument dans le réfectoire.\n\nAujourd''hui Xianos suis des entraînements avec Kanna dans le but de devenir une meilleur soldate. Elle fait de son mieux malgré le fait qu''elle soit plutôt faible. Tout le monde dans la promotion l''apprécie.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1320, 1200, 840, 63, 39, 32, 56, 62, 29, 61, 36, 37, 30 FROM DUAL WHERE @ok;

-- Lyra
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Lyra');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Lyra', 'Guerrière d''Argile', 'Création Rocheuse', 'Goliath', 'Humain', 'Augeaime', '/uploads/personnages/1766018032001-Lyra.png', 'Classe Promo, R7', 0, 0, 0, NULL,
  'Lyra est une de vos camarades de classe. Son excentricité est la première chose que quiconque peut remarquer à la simple manière avec laquelle elle se vêt. Elle excelle dans les cours de maniement d’armes et fait régulièrement des joutes avec Adam. Elle s’entend assez bien avec tout le monde, vous la croisez souvent à l’extérieur de sa résidence en dehors des cours.\n\nElle est toujours la première au réfectoire, c’est la seule à pouvoir battre Destra à la course lors des jours de viande.\n\nLyra avait achetée une maison dans les bois de Valiath pour y commencer une entreprise de chasse, malheureusement l''incendie de cette zone lui a fait perdre sa maison. Elle semble avoir été trainée dans une affaire louche, mais vous n''avez pas plus d''informations que cela.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1000, 1200, 1180, 42, 59, 48, 58, 44, 63, 40, 35, 22, 30 FROM DUAL WHERE @ok;

-- Adam
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Adam');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Adam', 'Gardien de Pierre / Adam au chevalier noir ?', 'Création des flots', 'Aqua', 'Humain', 'Augeaime', '/uploads/personnages/1758761239499-Adam-Détouré.png', 'Classe Promo, R6', 1, 0, 0, NULL,
  'Adam est un de vos camarades de classe. Il est d’un calme draconique et très discret. Cependant lorsqu’il prend la parole, sa voix grave est capable de calmer quiconque, y compris une engueulade entre Leest et Phillia. Il est respecté de par sa carrure et ses compétences à l’épée. Il est capable de tenir tête à Leest et Destra et est considéré comme étant le troisième meilleur manieur d’armes de la promotion.\n\nAvec le temps, Adam s''est très vite développé en tant que missionnaire solitaire. Il semble avoir une affection particulière pour le Nord d''Augeaime dans lequel il voyage beaucoup et aide la population locale. Il finira par obtenir le titre de "Chevalier Noir" là-bas, malgré sa peur irrationnelle pour les animaux de l''ordre des équidés.\n\nIl vous aidera grandement durant plusieurs missions, que ce soit pour l''enquête pour meurtre commanditée par Dali ou des chasses aux monstres dans le Nord Augeois.\n\nRécemment, Adam a énormément changer son comportement sans raison apparente, en plus de cela un pouvoir étrange semble s''être développé chez lui. Cela vous effraie un peu, d''autant plus qu''il semble plus fort que jamais.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1400, 1530, 920, 60, 62, 65, 28, 42, 52, 22, 45, 40, 42 FROM DUAL WHERE @ok;

-- Kanna
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Kanna');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Kanna', 'Guerrière d''Argile', 'Création de Vent', 'Lada', 'Humain', 'Augeaime', '/uploads/personnages/1766017525111-Kanna.png', 'Classe Promo, R6', 0, 0, 0, NULL,
  'Kanna est une de vos camarades de classe. Elle est toujours très sérieuse et termine souvent en colère quand la classe n’est pas silencieuse. Elle est deuxième de la classe juste derrière Leest. Malgré cela, tout le monde l’apprécie car elle est toujours prête à aider quiconque à besoin de son aide. Son avenir est quelque peu préoccupant au vu de ses nombreuses absences en cours de combat. Si on omet les jours de viande, elle est la première en vitesse de la classe. Les classes non-militaires se moquent d’elle en disant qu’elle sera la plus fuyarde des soldates.\n\nElle est toujours perdue quelque part dans la bibliothèque de l’école.\n\nAprès un début difficile en tant que soldate, elle s''est faite entrainée avec Xianos par Dali pour rattraper son niveau. Elle est devenue une combattante réfléchie et une experte en balistique. Kanna vous tirera d''affaire plusieurs fois et vous tiendra compagnie à de nombreuses reprises.\n\nElle a humilié Phillia à l''arène en la battant à plate couture sans prendre le moindre coup, ce qui a intensifié le tension entre elles. Grâce à son grand nombre de mission réussit et son leadership, elle montera rang 6 rapidement, ce qui fait d''elle la soldate de votre promotion ayant la plus grande ascension.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1310, 1080, 920, 52, 30, 28, 66, 60, 45, 58, 26, 36, 50 FROM DUAL WHERE @ok;

-- Hada
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Hada');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Hada', 'Professeur de combat', 'Création de glace', 'Aqua-Lada', 'Humain', 'Augeaime', '/uploads/personnages/v1/Hada.jpg', 'Professeur, Mort', 0, 1, 0, NULL,
  'Hada est notre professeur attitré de combat. Cela va faire dix ans qu’il nous enseigne des dizaines de méthodes de combat différentes. Que ce soit avec ou sans flux, avec ou sans armes. Ses cours étaient particulièrement durs lorsque l’on était jeune, mais avec le temps, on s’y est fait. Il n’est clairement pas très sérieux en tant qu’instituteur, mais est un excellent combattant, ce qui fait de lui malgré tout un bon entraîneur. Il est très sévère dès qu’il s’agit de nos blessures, mais globalement il est le premier à nous encourager à faire des bêtises, voire à participer avec nous pour uriner sur les plantes du professeur Fahe.\nIl donne des cours supplémentaire à certains élèves, notamment Destra, certain y voit du favoritisme, d’autre comprennent qu’il fait cela car il les prépare à leur avenir qui somme toute, est bien plus noir que blanc.\nVous savez qu’il est célibataire, et pour cela il cache son âge, ce qui fait de ce nombre l’un des plus grands mystères de votre promotion.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Liva
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Liva');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Liva', 'Ex-Chevalier', 'Invocation Sanguine', 'Aqua-Shizari-Yinva', 'Humain', 'Augeaime', '/uploads/personnages/v1/Liva.jpg', 'Classe Promo, Mort, R7', 0, 1, 0, NULL,
  'Liva est une de vos camarades de classe. Elle est peu populaire dans la classe mais elle arrive toujours a se fourrer avec d''autres élèves des classes non-militaires dans un coin un peu sombre de l’établissement. Elle fait un peu le pont entre eux et nous, ce qui fait qu’elle fait partie du groupe qui enquiquine Destra.\n\nÀ cause de son flux, elle possède énormément de traces d’automutilation sur le corps, spécialement sur ses bras. Toujours à cause de son flux, elle mange énormément pour essayer de prendre du poids pour être plus efficace mais elle finit toujours par retapisser le pot d’urgence. Ses notes en combat sont réellement pitoyables.\n\nLiva est la seule de vos camarades à être décédée durant un combat contre un primé d''ATEL du côté de chez Madelon. Elle s''est attaqué à plus fort qu''elle et en a payé le prix fort. Destra a récupéré sa dépouille et l''a ramené à Augeaime.\n\nVous avez appris par la suite qu''elle avait été abandonnée par sa famille adoptive à cause de son affiliation à Yinva.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1350, 1300, 900, 56, 32, 36, 57, 67, 38, 51, 44, 28, 41 FROM DUAL WHERE @ok;

-- Lato
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Lato');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Lato', 'Guerrier d''Argile', 'Création tornadique', 'Lada', 'Humain', 'Augeaime', '/uploads/personnages/1766017646636-Lato.png', 'Classe Promo, R7', 0, 0, 0, NULL,
  'Lato est un de vos camarades de classe. Il est peu populaire au même titre que ses notes. Il se met toujours au fond de la salle et est un adepte de l’occultisme et du psychisme. Il essaie de produire de la magie sans utiliser de flux. Il s’est déjà fait attraper dehors durant le couvre-feu nocturne en train de faire des cercles d’invocations astrales, dans le parc. Ses parents ont été forcés de lui faire une teinture sombre car il finissait toujours par essayer d’avoir les cheveux roses. Il voue un véritable culte pour la Diablesse.\n\nIl pense que Kanna est une envoyée de la Diablesse à cause de la couleur de ses yeux. Elle s’enferme à la bibliothèque pour l’éviter, ce dernier ayant perdu les droits d’accès car il cherchait constamment des livres sur son idole.\n\nLes vœux prononcés par Lato durant son adoubement vous ont fortement marqués. Il a dit qu''il voulait "Traquer et tuer La Diablesse" chose qu''il semble prendre très au sérieux car une fois ses fournitures achetées, il se rendra directement à Urive, ville dans laquelle se trouve un groupe qui traque sa némésis. Vous l''avez par ailleurs croisé lors d''une de vos missions là-bas, durant la protection de Shiwa, une prêtresse d''Elle.\n\nIl a créé une affaire parallèle à sa chasse, il vend des informations en provenance des bas-fonds Augeois. Il vous a déjà donné plusieurs informations plus qu''intéressante, ayant servit à vos quêtes. Mais ne pensez pas qu''il soit vil, il reste malgré tout un soldat fidèle.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1500, 1200, 700, 70, 34, 40, 42, 62, 39, 48, 25, 53, 40 FROM DUAL WHERE @ok;

-- Axra
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Axra');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Axra', 'Bourreau', 'Force Pure', 'Pura', 'Humain', 'Augeaime', '/uploads/personnages/1766016606189-Axra.png', 'Classe Promo, R7', 0, 0, 0, NULL,
  'Axra est un de vos camarades de classe. Il est très populaire, aussi bien côté militaire que bourge. Il est extrêmement sociable et quelque peu excentrique. Il est increvable et possède toujours de l’énergie à revendre. Il sèche beaucoup pour corrompre des bourges et faire les 400 coups avec eux, par ailleurs il traine souvent dans les classes inférieures car selon lui “La jeunesse est plus facile à corrompre”.\n\nMalgré ses retards et absence , il finit toujours avec d’assez bons résultats, ce qui a tendance à enquiquiner Phillia et monsieur Fahe, même si au fond il s’entend assez bien avec eux. Cependant, il ne peut pas blairer Destra, les deux sont trop ressemblant pour pouvoir ne serait-ce qu’avoir une conversation sans qu’Axra explose.\n\nFinalement Axra deviendra soldat mais n''est pas un missionnaire, il occupe son temps en étant bourreau le matin et combattant à l''arène l''après-midi. Grâce à son caractère et ses talents de showman, il devint assez vite populaire et prisé, que ce soit pour des exécutions ou des combats épiques. Son melon à grandit à mesure que sa popularité augmentait, il devint rapidement intenable. Cependant, Katia, une Titan l''a pris sous son aile pour l''entraîner et le forcer à faire quelques missions pour le royaume. Son entraînement a été douloureux et difficile, ce qui l''as rapidement changé, aussi bien physiquement que mentalement. Il essaiera de fuir Katia après cela pour éviter de devoir re effectuer une préparation aussi tortueuse à nouveau. Malgré tout, une relation de respect s''est formé entre les deux.\n\nDepuis la mutation de Katia à Edenia, Axra a repris ses activités habituelles. Il semble aussi être devenu un peu plus humble et ce malgré le fait qu''il soit devenu assez fort pour jouer dans la même cour que Leest et Destra.\n\nIl vous a régulièrement aidé pour des missions, généralement pour obtenir des informations du côté sombre d''Augeaime qu''il côtoie de temps à autre.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1350, 1380, 1110, 58, 70, 47, 52, 42, 30, 40, 51, 35, 35 FROM DUAL WHERE @ok;

-- Esra
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Esra');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Esra', 'Gerrier darjile', 'Création électrique', 'Pestia-Drii', 'Humain', 'Augeaime', '/uploads/personnages/1766017195330-Esra.png', 'Classe Promo, Noble, Abruti, R7', 0, 0, 0, NULL,
  'Esra est un de vos camarades de classe. Il est fils de bourge, l’enfant légitime de la famille qu’il représente. Il est arrivé en plein milieu du cursus car ses parents ne le jugeaient pas capable de poursuivre l’affaire familiale. D’un naturel souriant, il se donne toujours a fond, pour tout. Cela fait de lui un combattant redoutable avec un flux à ne surtout pas sous-estimer, mais niveau stratégie et théorie, il est le dernier de la classe. Hada dit toujours qu’il sera un excellent subalterne mais prie pour qu’il ne parte jamais en mission de lui-même.\n\nIl s’est déjà perdu en venant en cours.\n\nDepuis son adoubement, Esra est devenu l''une des figures de la nouvelle génération à l''arène avec Axra. Il est un peu moins populaire mais semble être très investit dans son travail. Il vous arrive parfois de le voir dans la taverne anxieux pour son prochain match.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1700, 1250, 700, 67, 58, 40, 49, 50, 27, 32, 53, 34, 35 FROM DUAL WHERE @ok;

-- Fahe
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Fahe');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Fahe', 'Professeur de Théorie', 'Création illusoire', 'Pestia', 'Humain', 'Augeaime', '/uploads/personnages/v1/Fahe.jpg', 'Professeur, Mort', 0, 1, 0, NULL,
  'Fahe est notre professeur attitré de théorie. Durant les dix ans où nous avons étudié avec lui, il nous a tout appris, comment lire, comment écrire, savoir compter qu’est-ce que le flux ou encore notre histoire. Cependant il est clair que la majorité d’entre nous n’étaient pas très attentifs durant ses cours. À part Phillia et Leest, nous n’étions intéressés que par les cours de combat. Il reste quand même une personne à qui nous devons beaucoup, il a toujours été bienveillant avec nous et ne nous a jamais réellement gronder, cela explique en partie pourquoi nous ne l’écoutions pas.\nMonsieur Hada n''arrête pas de nous répéter de ne pas le sous-estimé, qu’il est un puissant magicien.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Leest
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Leest');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Leest', 'Écuyère de Chevalier Dragon', 'Création de Fer', 'Goliath-Pura', 'Humain', 'Augeaime', '/uploads/personnages/1766017817525-Leest.png', 'Classe Promo, Steelah, R5', 0, 0, 0, NULL,
  'Leest est une de vos camarades de classe. Elle est la major de promotion en étant première dans tous les domaines sauf dans les cours liés aux combats où elle termine toujours à la deuxième place, juste derrière Destra. Son comportement est plutôt détestable et globalement, elle ne s’entend avec personne. Elle joue beaucoup la Madame je-sais-tout et est très violente dans ses propos, sans hésiter à rabaisser les autres. Malgré cela elle s’entend très bien avec Destra, vu le temps qu’ils passent ensemble, il est plus que légitime de dire qu’ils sont en couple. Elle est la petite chouchoute du professeur Fahe, elle est la meilleure élève qu’il n’aurait jamais eu. Beaucoup des filles de l’établissement la détestent, il n’est pas impossible que ce soit à cause du fait qu’elle traîne avec Destra, mais certains parlent de comportement déplacé.\n\nElle est terrifiante lorsqu’elle est en colère et est une très mauvaise perdante, globalement, vous vous porterez mieux sans elle. Inutile de vous dire que Phillia l''exècre.\n\nLeest s''est adoucie après son passage en tant que soldate. Vous ne l''avez pas énormément vu, elle semble très occupé.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1950, 1600, 900, 64, 67, 60, 50, 55, 50, 27, 34, 42, 56 FROM DUAL WHERE @ok;

-- Destra
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Destra');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Destra', 'Ecuyer de Chevalier Dragon', 'Destruction', 'Artrish', 'Humain', 'Augeaime', '/uploads/personnages/1766016975079-Destra.png', 'Classe Promo, Carmin, R5', 0, 0, 0, NULL,
  'Destra est un de vos camarades de classe. Il représente la famille la plus riche d’Augeaime, beaucoup de personnes essaient de s’attirer ses grâces à cause de cela, il préfère rester seule pour éviter d’être manipulé par des gens attirés par son argent.\n\nSon flux est tout bonnement exceptionnel, il est classifié comme étant unique, beaucoup de personnes attendent énormément de lui. Pour se préparer à la vie de soldat, il s’entraîne régulièrement avec Hada, même en dehors des cours. Il est premier de la classe en combat, personne dans la classe ne rivalise avec lui, pas même Leest qui pourtant donne tout dans chacun de leur combat. Grâce à cela, les deux ont tissé une forte amitié, voire carrément plus.\n\nComme convenu Destra est devenu un soldat ayant un potentiel monstrueux. Il s''est fait entraîné par Nimha puis par le héro Jiferci-Lapegi. Il a effectué quelques missions pour le royaume et est très vite passé R5. Il a récemment "échoué" la mission du hameau des prés verts, ce qu''il lui a fortement affecté sa santé mental. Depuis il se défoule en capturant et tuant des brigands de chemin.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1500, 1620, 1000, 52, 57, 67, 48, 50, 55, 30, 44, 25, 34 FROM DUAL WHERE @ok;

-- Art. Drino II
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Art. Drino II');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Art. Drino II', 'Roi d''Augeaime', 'Flammes', 'Drii', 'Humain', 'Augeaime', '/uploads/personnages/v1/Driino.jpg', 'Roi, R1', 0, 0, 0, NULL,
  'Roi d’Augeaime depuis la mort de son père portant le même nom. Art a été greffé à son patronyme pour représenter la grandeur en utilisant le même caractère que pour Artrish. Il est un roi stricte qui a réussi à régir son peuple à l’aide d’une vision très carré du monde. Il est respecté autant qu’il est craint. Vous ne l’avez jamais vu directement, mais vous connaissez beaucoup de choses sur lui. Un jour viendra où vous le rencontrerez, le jour de votre adoubement.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Shiwa
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Shiwa');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Shiwa', 'Prêtresse de la Diablesse', 'Prédiction Funeste', 'Shizari', 'Humain', 'Augeaime', '/uploads/personnages/v1/Shiwa.jpg', 'Mort', 0, 1, 0, NULL,
  'Shiwa était une prêtresse de la Diablesse qui logeait dans un hameau proche de Urive. Elle aurait vécu une partie de sa vie avec, mais elle a décidé de ne jamais la trahir. Elle emportera énormément de secrets dans sa tombe. Elle mourra durant une mission où vous l''escortiez suite à une crise de panique. Le peuple était heureux à l''idée de la savoir morte.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Riness
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Riness');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Riness', 'Mairesse de Urive', 'Inconnu', 'Aucun', 'Humain', 'Augeaime', '/uploads/personnages/v1/Riness.jpg', 'Noble', 0, 0, 0, NULL,
  'Riness est la mairesse d''Urive. Elle semble aussi être rattachée à la garde Augeoise. Elle semble très au courant de ce qui se trame dans sa ville et semble vouloir tout contrôler. Vous n''avez pas plus d''informations la concernant, si ce n''est qu''elle n''apprécie pas l''église de la Diablesse.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Ria
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Ria');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Ria', NULL, 'Ébullition', 'Aqua-Drii', 'Humain', 'Augeaime', '/uploads/personnages/v1/Ria.jpg', 'Mort, ATEL', 0, 1, 0, NULL,
  'Ria est un brigand que vous avez affronté sur un bateau en voulant rentrer à Augeaime depuis Urive lorsque vous escortiez Shiwa. Vous l''avez tué puis jeté son corps à l''eau. Vous ne savez pas à quelle groupe de Brigand d''ATEL il appartient.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1140, 1770, 760, 56, 42, 46, 38, 48, 25, 26, 33, 25, 47 FROM DUAL WHERE @ok;

-- Pore
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Pore');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Pore', 'Membre du groupe Judy', 'Inconnu', 'Aucun', 'Inconnu', 'Inconnu', '/uploads/personnages/v1/Pore2.jpg', 'ATEL, Judy', 0, 0, 0, NULL,
  'Une femme assez étrange, elle appartient au clan Judy des Marionnettistes. Elle semble puissante.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Mugi
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Mugi');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Mugi', 'Esclave', 'Aucun', 'Aucun', 'Humain', 'Saxifra', '/uploads/personnages/v1/Mugi.jpg', 'Traître', 0, 1, 0, NULL,
  'Un esclave saxifranc offert par des marchands à Gira & Shuri. Il était vendu en tant que sans flux, humain de Saxifranc. Son passé semble assez violent, il dit avoir été attaqué par des Géants, capturé puis vendu. Il augmente le loyer de tout le monde de 110 PO mais permet d''effectuer des tâches pendant votre absence comme payer le loyer, s''occuper des animaux, nettoyer la maison, recevoir le courrier etc...\n\nVous aviez commencez à tisser une amitié avec lui, malheureusement il semblerait que Gira aie décidée de s''en débarrasser une bonne fois pour toute. Vous n''avez pas le motif lié à ce meurtre, Sera pense qu''il s''agit juste d''un crime réalisé pour le plaisir de tuer.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Vazalia
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Vazalia');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Vazalia', 'Ex-Titan', 'Inconnu', 'Yinva', 'Inconnu', 'Mudan', '/uploads/personnages/v1/Vazalia.jpg', 'ATEL, Sugawara', 0, 1, 0, NULL,
  'Une femme très impressionnante, d''après Axra et Adam elle serait une désertrice d''Augeaime. Elle était gradé Titan (R3). Son flux semble être lié aux métaux, mais impossible de savoir quoi exactement...'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 2400, 2400, 1200, 75, 75, 60, 78, 77, 72, 42, 65, 68, 70 FROM DUAL WHERE @ok;

-- Nojina
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Nojina');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Nojina', 'Chef de Sugawara', 'Inconnu', 'Aucun', 'Inconnu', 'Inconnu', '/uploads/personnages/v1/Nojina.jpg', 'ATEL, Sugawara', 0, 0, 0, NULL,
  'Nojina, la cheffe récemment désignée du groupe Sugawara, demeure une énigme enveloppée de mystère. Les informations la concernant sont si rares et insaisissables qu''aucune prime n''a jamais été associée à son nom, un fait inhabituel qui ne fait qu''ajouter à son aura mystérieuse. Cependant, une chose est certaine : elle commande un respect profond et une crainte palpable parmi les habitants de la région de Sugawara. Sa capacité à être unanimement acceptée comme leader, malgré le voile de secret qui l''entoure, témoigne de son pouvoir et de sa dangerosité potentielle.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1380, 2000, 1240, 52, 62, 40, 55, 67, 75, 43, 73, 72, 68 FROM DUAL WHERE @ok;

-- Oryo
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Oryo');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Oryo', 'Ponte de Sugawara', 'Inconnu', 'Aucun', 'Inconnu', 'Inconnu', '/uploads/personnages/v1/Oryo.jpg', 'ATEL, Sugawara', 0, 0, 0, NULL,
  'Oryo est un ponte du groupe Sugawara. Il semble respecté de par son ancien poste en tant que fondateur de Sugawara. Il finira par perdre son titre de chef et l’a laissé à l’actuelle mystérieuse dirigeante du groupe. Sa prime de capture actuelle est exorbitante, dépassant les 50.000 ſ.\n\nIl est l''un des membres que vous avez vu assiéger l''arène durant l''attaque du 8è Lanos.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1500, 2100, 1160, 63, 79, 100, 64, 77, 69, 46, 57, 63, 71 FROM DUAL WHERE @ok;

-- Vagui
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Vagui');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Vagui', 'L''Écorce Sanglante', 'Invocation Boisée', 'Aqua-Goliath-Yinva', 'Humain', 'Augeaime', '/uploads/personnages/v1/Vagui.jpg', 'R3, Noble, Carmin', 0, 0, 0, NULL,
  'Il est celui qui gère la Morgue à Augeaime. Il est le seul Titan à être resté à la capitale après la guerre. Vous avez appris qu''il était l''un des ami de Sonila. Très réservé, bien qu''un peu effrayant au premier abord, Vagui est une personne calme et sage. Il semble se faire très vite un avis sur une personne. Il fait parti de la famille de Carmin.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Katia
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Katia');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Katia', 'La Géante Humaine', 'Liquide Gris', 'Aqua-Goliath', 'Humain', 'Augeaime', '/uploads/personnages/v1/Katia.jpg', 'R3, Noble', 0, 0, 0, NULL,
  'Il semblerait que Katia soit une personne énergique et très sociable. Elle possède une grande vitalité et est très appréciée par ses collègues. Son sourire est radieux et contagieux. Elle est fière d''avoir une prime posée par les brigands de 18 000 ſ.\n\nKatia a été la tutrice de Axra pendant quelques mois et l''a entraînée jusqu''à ce que ce dernier ne soit plus capable de marcher. Vous aussi avez eu le droit de faire quelques entraînements avec elle ainsi que tisser quelques liens. Peu de temps après cela, elle a été mutée à Edenia pour un programme de recherche géré par La Momie. Vous apprendrez en même temps le fait qu''elle est une Demi-Géante, née d''une Géante Irisienne. Vous n''avez plus de nouvelle d''elle depuis.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1800, 2370, 1500, 62, 80, 68, 70, 65, 36, 30, 64, 58, 68 FROM DUAL WHERE @ok;

-- Sonila
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Sonila');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Sonila', 'L''Antique Stratège', 'Ambre', 'Chronos-Goliath', 'Humain', 'Augeaime', '/uploads/personnages/v1/Sonila.jpg', 'R3, Professeur', 0, 0, 0, NULL,
  'Il s''agit d''une des titans d''Augeaime. Elle est très amicale et semble plutôt forte. Cependant quelque de louche émane d''elle. Sonila aurait été chasseuse de primes avant la guerre opposant Irisia et Augeaime.\n\nElle a été votre tutrice durant plusieurs mois, elle vous a appris à vous préparer avant chaque mission, petite comme grande. Elle a tissé une forte amitié avec vous au delà de votre statut maître-élève. Elle est désormais retourné dans sa ville, Eraf, et vous a demandé de la rejoindre que lorsque vous serez prêt à traverser le chemin sans passer par le fleuve, elle voit cela comme une épreuve finale pour votre tutorat. Vous n''avez pas eu de nouvelle d''elle depuis.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 2340, 1620, 1060, 71, 50, 44, 78, 66, 69, 74, 36, 63, 76 FROM DUAL WHERE @ok;

-- Valaria
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Valaria');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Valaria', 'Femme Mystérieuse', 'Inconnu', 'Guizamark', 'Humain', 'Augeaime', '/uploads/personnages/v1/Valaria.jpg', '', 0, 0, 0, NULL,
  'Valaria semble être une femme ayant un grand impact sur la capitale d’Augeaime. Elle est respectée par tous et semble être connue de tous. Cependant elle n’est ni une soldate de renom, ni même une noble et ne semble pas liée à la bourgeoisie. L’aura qui l’entoure est mystérieuse mais bienveillante. Elle possède de nombreuses faveurs provenant de la noblesse et surtout du Roi Art Driinos.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 2250, 1600, 1200, 72, 54, 63, 48, 78, 67, 68, 82, 70, 72 FROM DUAL WHERE @ok;

-- Blanche
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Blanche');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Blanche', 'Bourgeoise', 'Inconnu', 'Aucun', 'Humain', 'Augeaime', '/uploads/personnages/v1/Blanche.jpg', 'Parent, Noble', 0, 0, 0, NULL,
  'Blanche est l''épouse de Joestar, l''entrepreneur renommé et célèbre pour ses Fioles. Issue d''une famille bourgeoise, elle a été mariée à l''un des héritiers prestigieux d''Augeaime. Sa beauté est saisissante, défiant les marques du temps. Toutefois, en matière d''affaires, elle est loin d''être douée, tombant régulièrement dans les pièges des arnaques orchestrées par d''autres marchands. Malgré sa réputation de naïveté parmi les vendeurs, ceux-ci se retiennent d''abuser de sa crédulité. Derrière cette façade d''innocence se dissimule un aspect terrifiant.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Joestar
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Joestar');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Joestar', 'Bourgeois', 'Inconnu', 'Aucun', 'Humain', 'Augeaime', '/uploads/personnages/v1/Joestar.jpg', 'Parent, Noble', 0, 0, 0, NULL,
  'Joestar, l''aîné de sa famille, a repris les rênes de l''entreprise familiale “Fioles Joestar” avec brio. Malgré une apparence froide, son charisme indéniable et ses talents innés d''entrepreneur et de vendeur lui ont valu un grand respect. Suite au décès de son père, il a su non seulement perpétuer, mais aussi prospérer l''affaire familiale, gagnant ainsi l''admiration du monde bourgeois. C''est cette réputation qui a attiré l''attention de la famille de Blanche, désireuse de le lier à leur fille. Joestar est également le père adoptif de Shuri et Gira.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Marie
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Marie');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Marie', 'Bourgeoise', 'Inconnu', 'Aucun', 'Humain', 'Augeaime', '/uploads/personnages/v1/Marie.jpg', 'Parent, Noble', 0, 0, 0, NULL,
  'Marie, l''héritière déterminée de l''entreprise Forges Levy, se distingue par son approche rigoureuse et intransigeante des affaires. Animée par une ambition sans limite, elle tend à prioriser son travail au détriment de sa vie personnelle, y compris sa famille et ses proches. Cette dévotion excessive à sa carrière lui a valu une réputation controversée dans les cercles bourgeois. Les rumeurs et les critiques abondent, alimentées par son comportement impitoyable et son succès indéniable.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Levy
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Levy');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Levy', 'Bourgeois', 'Inconnu', 'Aucun', 'Humain', 'Augeaime', '/uploads/personnages/v1/Levy.jpg', 'Parent, Noble', 0, 0, 0, NULL,
  'Levy, l''époux de Marie, est l''homme derrière le nom prestigieux des Forges Levy, acquis suite à leur mariage. Son statut dans la haute société est compliqué : malgré son rôle crucial dans l''entreprise, il est souvent perçu de manière négative par la bourgeoisie. Son origine mystérieuse et son absence de lignée notable le placent en marge, et certains le considèrent injustement comme un simple assistant de sa femme. Comme Marie, il est l''objet de rumeurs et de spéculations, notamment concernant sa fertilité. Il est le père adoptif de Zayath.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Refer
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Refer');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Refer', 'Bourgeois', 'Effroi', 'Shizari', 'Humain', 'Augeaime', '/uploads/personnages/v1/Refer.jpg', 'Parent, Noble', 0, 0, 0, NULL,
  'Refer, devenu un magnat incontesté dans le domaine des denrées alimentaires, est redouté et respecté dans les hautes sphères de la bourgeoisie et de la noblesse. Parti de rien, cet homme d''origine modeste a tracé son chemin depuis ses humbles débuts de paysan possédant quelques lopins de terre. Au fil des décennies, par son intellect aiguisé et un charisme indéniable, il a su bâtir un empire, s''approchant du monopole sur le marché alimentaire. Sa présence inspire autant la terreur que l''admiration. Malgré son absence de lignée noble, il a posé les fondations solides d''une dynastie qui promet de perdurer et de prospérer.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Azaya
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Azaya');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Azaya', 'Bourgeoise', 'Création Fleurie', 'Aqua-Guizamark', 'Humain', 'Augeaime', '/uploads/personnages/v1/Azaya.jpg', 'Parent, Noble', 0, 0, 0, NULL,
  'Azaya, bien qu''épouse de Refer, mérite d''être reconnue pour ses propres mérites. Benjamine d''une famille bourgeoise sans héritage notable, elle a choisi de forger sa propre destinée en fondant une florissante entreprise d''herboristerie. Son tempérament, d''une froideur calculée, reflète une aura similaire à celle de son mari. Leur mariage, loin d''être un arrangement, semble fondé sur une compréhension mutuelle profonde. Fait surprenant, Azaya a volontairement choisi d''adopter un enfant soldat, prenant sous son aile autoritaire le jeune Gora, dont elle devient une mère exigeante.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Leaf
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Leaf');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Leaf', 'Égérie du Chaos', 'Fils de Métal', 'Goliath-Pura', 'Inconnu', 'Inconnu', '/uploads/personnages/v1/Leaf.jpg', 'ATEL, Guignol', 0, 0, 0, NULL,
  'Pour les soldats, ignorer l''existence de Leaf relève de l''impossible. Surnommé ''l’égérie du chaos'', son ascension au sein des Guignols est aussi fulgurante qu''effrayante, marquée par une série de massacres de ses supérieurs qui l''a mené jusqu''au sommet. La liste de ses crimes est aussi vaste que sa prime est élevée, reflétant l''ampleur de sa brutalité. Leaf est l''architecte de l''aura de décadence qui enveloppe son groupe, une présence si redoutable que son nom seul sème la terreur. Priez pour ne jamais croiser son chemin.\n\nLeaf est le monstre à l''origine du massacre du hameau des prés verts.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Shiya
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Shiya');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Shiya', 'Ponte des Guignols', 'Inconnu', 'Aucun', 'Inconnu', 'Inconnu', '/uploads/personnages/v1/Shiya.jpg', 'ATEL, Guignol', 0, 0, 0, NULL,
  'Shiya est une ponte du groupe Guignol. Vous avez fini par la croiser lors d''une de vos missions à Nini, elle gardait l''entrée d''une crypte. Elle semble prendre un malin plaisir à faire souffrir autrui sans les tuer. Elle est si intimidante que vous vous êtes sentis obligé de lui obéir lorsqu''elle est arrivée devant vous.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 2300, 1850, 1020, 80, 46, 38, 71, 84, 62, 73, 54, 63, 51 FROM DUAL WHERE @ok;

-- Elhanan
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Elhanan');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Elhanan', 'Ponte des Guignols', 'Inconnu', 'Aucun', 'Inconnu', 'Inconnu', '/uploads/personnages/v1/Elhanan2.jpg', 'ATEL, Guignol', 0, 0, 0, NULL,
  'Elhanan est le second ponte du groupe Guignol. Il est le seul à votre connaissance possédant une prime uniquement pour sa capture. Au vu de sa prime exorbitante, il vaudrait mieux que vous passiez votre chemin si vous le croisez.\n\nElhanan est l''un des brigands ayant attaqué et kidnappé La fille de La Momie durant l''attaque du 8è Lanos. Il semblait être l''instigateur de l''attaque.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 3500, 2280, 1160, 17, 44, 60, 80, 73, 71, 52, 55, 53, 71 FROM DUAL WHERE @ok;

-- Riza
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Riza');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Riza', 'Chef de Grand Oiseau', 'Création de plumes enflammées', 'Aucun', 'Inconnu', 'Inconnu', '/uploads/personnages/v1/Riza.jpg', 'ATEL, Grand Oiseau', 0, 0, 0, NULL,
  'Riza est le chef de Grand Oiseau, il est l''un des instigateurs de l''attaque du 8è Lanos. Sonila vous a précisé qu''il est un éternelle. Son flux lui permet de créer des plumes de feu qui semble être apte à brûler spontanément le corps des personnes qu''elles touchent. Il peut aussi s''en servir pour lui créer d''amples ailes lui permettant de s''envoler.\n\nSa prime indique qu''il a commit des crimes immoraux.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Lula
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Lula');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Lula', 'Inconnu', 'Inconnu', 'Aucun', 'Inconnu', 'Inconnu', '/uploads/personnages/v1/Lula.jpg', 'ATEL, Madelon', 0, 0, 0, NULL,
  'Lula est une des pontes de Madelon. Assez peu est su à son sujet si ce n''est qu''elle collaborait avec Varo.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Varo
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Varo');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Varo', 'Ponte de Madelon', 'Miroir', 'Goliath', 'Humain', 'Augeaime', '/uploads/personnages/v1/Varo.jpg', 'ATEL, Madelon', 0, 1, 0, NULL,
  'Varo était un ponte de Madelon. Il était spécialisé dans la triche et les trucages à l''arène, il semble aussi avoir connu quelque soucis avec le casino. Ayant un bon instinct, il a gravit les échelons de cette partie d''ATEL mais reste affreusement narcissique et égoïste, ne pensant qu''à lui, il aurait pu tout dévoiler si Leaf n''était pas venu pour tout arrêter. Vous l''avez tué lors d''une de vos missions, il avait une prime de 15 000PO pour sa mort.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Anori
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Anori');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Anori', NULL, 'Création Cométaire', 'Aqua-Chronos', 'Humain', 'Mudan', '/uploads/personnages/v1/Anori.jpg', '', 0, 0, 0, NULL,
  'Issue d’une famille noble du sud de Mudan, elle n’a connu que l’entraînement et combat, suite à la mort de son père elle se retrouve obligée de reprendre les affaire de la famille chose qu’elle ne supporte pas.elle fuit donc son pays afin de fuire ses responsabilités et se retrouve à Augeaime ou elle postule à l''orphelinat.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1600, 900, 840, 62, 31, 24, 42, 58, 51, 36, 33, 27, 49 FROM DUAL WHERE @ok;

-- La Momie
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'La Momie');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'La Momie', 'La Momie', 'Inconnu', 'Aucun', 'Éternelle', 'Edenia', '/uploads/personnages/v1/Momie.jpg', 'Éternelle', 0, 0, 0, NULL,
  'La Momie est une noble en provenance du Royaume d''Édenia. Elle est l''une des "Rescapées", ce qui explique la présence sur tout son corps de bandages. Elle dira qu''elle fut laissée pour morte après une expérience d''immolation complète. Elle possède aussi une fille qu''elle a recueillit après l''avoir retrouvée dans des ruines, une jeune fille humaine, qui malheureusement s''est faite kidnappée durant l''attaque du 8è Lanos.\n\nC''est elle qui a fait la proposition à Katia pour qu''elle surveille le programme de protection des demi-géant mis en place par Edenia.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 12500, 7250, 1640, 120, 35, 89, 88, 97, 95, 115, 12, 90, 100 FROM DUAL WHERE @ok;

-- Nary
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Nary');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Nary', 'La Merveille Belliqueuse', 'Création de Mirage', 'Chronos-Pestia', 'Humain', 'Saxifra', '/uploads/personnages/v1/Nary.jpg', '', 0, 0, 0, NULL,
  'Nary est une combattante de l''arène. Elle semble être d''un narcissisme profond et adore avoir l''attention de tout le monde sur elle. Elle est respectée et est la figure la plus acclamée en combat, bien qu''elle ne soit pas la plus forte. Elle se met toujours en scène lors de ses combats, que ce soit par l''utilisation de son flux pour réaliser des effets spéciaux ou bien en s''imposant elle même des handicaps en combat. Son fan club est énorme.\n\nVous ne la connaissez pas plus que cela, cependant au vu de son physique, elle est sans doute Saxifranche.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1800, 1700, 1080, 66, 75, 58, 68, 60, 42, 32, 71, 68, 59 FROM DUAL WHERE @ok;

-- Daal
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Daal');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Daal', 'Archélémentalist', 'Vent', 'Lada', 'Humain', 'Mudan', '/uploads/personnages/v1/Daal.jpg', 'Archélémentaliste', 0, 0, 0, NULL,
  'Daal est un apprenti archélémentaliste de l''école du même nom géré par le dragon Lada dans le Sud de Mûdan. Il possède un caractère très amicale, de plus il semble être extrêmement talentueux pour son âge. Vous n''en savez pas beaucoup plus sur lui.\nIl a affronté Zayath dans un combat serré qu''il a fini par perdre sur un assassinat maîtrisé de la part de son adversaire.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1500, 1200, 800, 65, 52, 48, 32, 55, 42, 25, 35, 40, 35 FROM DUAL WHERE @ok;

-- Sana
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Sana');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Sana', 'Noble Irisienne', 'Aucun', 'Aucun', 'Géant', 'Irisia', '/uploads/personnages/v1/Sana.jpg', 'Géant', 0, 0, 0, NULL,
  'Sana est l''une des géantes ayant participé aux combats de la délégation. Elle n''est pas une combattante du tout, c''est une bourgeoise étant venue pour représenter sa famille lors de la réunion. Elle semble être très douce et gentille, elle a participé pour récolter des fonds pour l''Orphelinat d''Augeaime avec Anori. Elle a légèrement été blessée durant le combat contre Gora et Shuri.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 2500, 800, 0, 72, 68, 62, 40, 35, 21, 62, 47, 53 FROM DUAL WHERE @ok;

-- Rizame
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Rizame');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Rizame', 'Roi d''Irisia', 'Inconnu', 'Aucun', 'Humain', 'Irisia', '/uploads/personnages/v1/Rizame.jpg', 'Roi', 0, 0, 0, NULL,
  'Rizame est l''actuel Roi d''Irisia, il est imposant et semble savoir se combattre. Il vous effraie un petit peu. Vous n''avez pas plus d''information le concernant.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Darana
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Darana');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Darana', 'La Chasseuse de Prime Noire', 'Papier', 'Guizamark-Lada', 'Humain', 'Irisia', '/uploads/personnages/v1/Darana.jpg', 'Folle', 0, 0, 0, NULL,
  'Darana est une combattante très puissante et très sanguine provenant d''Irysia. Vous avez entendu des rumeurs comme quoi elle serait une chasseuse de tête qui chasse les personnalités les plus recherchés de son royaume, aussi appelées "Primes Noires". Durant son court séjour à Augeaime elle a écrasé Epza dans un combat d''arène sans flux, perdu contre les jumeaux Goliath dans un combat de rue et fait un match nul contre Dali suite à l''attaque du 8è Lanos. Son sang chaud mêlé à sa personnalité violente fait qu''elle est parfois surnommée "La Folle".'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Oga
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Oga');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Oga', 'Le Chasseur de Monstre Géant', 'Aucun', 'Aucun', 'Géant', 'Irisia', '/uploads/personnages/v1/Oga.jpg', 'Géant', 0, 0, 0, NULL,
  'Oga est un des combattants géants d''Irisia à être intervenu durant la délégation. Il est semble assez puissant, à cela s''ajoute sa réputation de chasseur de monstres. Vous l''avez vu affronter l''un des jumeaux Goliath durant un combat de rue. Il semble maîtriser des arts martiaux que vous ne connaissez pas.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Liya
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Liya');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Liya', 'Sœur de Zayath', 'Création Sableuse', 'Goliath-Lada', 'Humain', 'Augeaime', '/uploads/personnages/v1/Liya.jpg', 'Noble', 0, 0, 0, NULL,
  'Liya est la sœur de Zayath. Elle est l''héritière de Marie et travaille en tant que forgeronne directement pour sa mère. Elle est brutale et crue, mais elle reste humaine et étonnamment attentionnée. Elle est spécialisée dans la forge utilisant des matériaux de monstres, que ce soit des armes ou des armures.\n\nAccessoirement, un mariage forcé est en préparation entre Liya et Gora.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Lianos
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Lianos');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Lianos', NULL, 'Inconnu', 'Aucun', 'Humain', 'Irisia', '/uploads/personnages/v1/Lianos.jpg', '', 0, 0, 0, NULL,
  'Lianos est une humaine Irisienne qui semble travailler en tant que garde du corps. Elle a été engagée durant la délégation par Sana pour la protéger. Elle semble être très prudente, elle a essayé à plusieurs reprise de retenir Sana de participer aux festivités de combat du Royaume. Au vu de son physique, il est plus que probable qu''elle soit une puissante utilisatrice de flux.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Liaciry
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Liaciry');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Liaciry', 'L''Humain le plus fort de Saxifra', 'Inconnu', 'Aucun', 'Humain', 'Saxifra', '/uploads/personnages/v1/Liaciry.jpg', 'Froid', 1, 0, 0, NULL,
  'Liaciry est l''un des membres de la garde rapprochée d''Edrahil. Il est très froid de nature et très réaliste dans sa manière de penser, ce qui fait de lui un humain qui semble antipathique. Il est effroyablement puissant, suffisamment pour vaincre Requin, se faire obéir par les jumeaux Goliath et surtout obtenir la confiance du Roi Saxifranc.\n\nIl aurait aidé le groupe de Shuri durant une quête à Olivert.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Edrahil
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Edrahil');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Edrahil', 'Roi de Saxifra', 'Aucun', 'Aucun', 'Géant', 'Saxifra', '/uploads/personnages/v1/Edrahil.jpg', 'Roi, Géant', 1, 0, 0, NULL,
  'Edrahil est le roi de Saxifra, il descend de la lignée d''Edrahil 1er, le bras droit de Goliath quand ce dernier était encore de ce monde. Il est étonnamment grand, même pour un géant, faisant facilement 3m30. Il fait respecter l''ordre dans son pays par la force et y est vu par les humains comme un tyran et pour les géants comme un héro. Il semble mépriser les humains du plus profond de son être. Ses gardes disent qu''ils viennent par courtoisie car Edrahil n''a besoin de personne pour se protéger, indiquant donc qu''il est sans doute très fort au combat.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Goliath
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Goliath');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Goliath', 'Aîné', 'Aucun', 'Aucun', 'Géant', 'Saxifra', '/uploads/personnages/v1/Goliath.jpg', 'Abruti, Géant', 1, 0, 0, NULL,
  'Les frères jumeaux Goliath sont des géants Saxifrancs faisant partie de la garde rapprochée d''Edrahil. Ils sont aussi stupide qu''ils sont forts. Rien ne semble les différencier, que ce soit physiquement ou mentalement, les deux s''appellent mutuellement "Petit Frère" car ils se considèrent chacun comme étant des aînés. Lors de la délégation, vous les avez vu affronter et ratatiner Oga et Darana dans un combat de rue.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Goliath
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Goliath');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Goliath', 'Aîné', 'Aucun', 'Aucun', 'Géant', 'Saxifra', '/uploads/personnages/v1/Goliath.jpg', 'Abruti, Géant', 1, 0, 0, NULL,
  'Les frères jumeaux Goliath sont des géants Saxifrancs faisant partie de la garde rapprochée d''Edrahil. Ils sont aussi stupide qu''ils sont forts. Rien ne semble les différencier, que ce soit physiquement ou mentalement, les deux s''appellent mutuellement "Petit Frère" car ils se considèrent chacun comme étant des aînés. Lors de la délégation, vous les avez vu affronter et ratatiner Oga et Darana dans un combat de rue.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Niwha
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Niwha');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Niwha', 'Archélémentaliste', 'Création d''Eau / de Glace', 'Aqua-Lada', 'Humain', 'Mudan', '/uploads/personnages/v1/Niwha.jpg', 'Archélémentaliste', 0, 0, 0, NULL,
  'Niwha est l''une des apprentis archélémentalistes les plus prisées de sa génération. Elle a vaincu Leest lors de la délégation en l''humiliant presque, cependant elle s''est très vite fait rattrapée quand Destra à humilier son frère Wanih le combat d''après. Elle semble posséder un gigantesque égo mêlé à un talent certain en combat.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Wanih
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Wanih');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Wanih', 'Archélémentaliste', 'Création d''Eau / de Glace', 'Aucun', 'Humain', 'Mudan', '/uploads/personnages/v1/Wanih.jpg', 'Archélémentaliste', 0, 0, 0, NULL,
  'Wanih est l''un des plus puissant membre de l''école des Archélémentalistes. Il est tout l''inverse de sa sœur Niwha, calme, réservé et humble. Il s''est fait humilier par Destra durant l''un des combats de la délégation car sa sœur à fait de même avec Leest au combat précédent.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Pestia
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Pestia');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Pestia', 'Impératrice de la Lumière', 'Lumière Divine', 'Pestia', 'Dragon', 'Céleste', '/uploads/personnages/v1/Pestia2.jpg', 'Dragon, Dieu', 0, 0, 0, NULL,
  'Pestia est l''actuelle Impératrice de Mûdan. Elle s''est déplacée durant la délégation pour assister à la réunion de paix entre Augeaime et Irisia, à laquelle s''est ajoutée Edenia. Pour avoir d''autre information la concernant, elle possède une page dans l''histoire en tant que dragon.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Jiferci-Lapegi
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Jiferci-Lapegi');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Jiferci-Lapegi', 'L''Œil d''Artrish', 'Création Angélique', 'Guizamark-Lada', 'Humain', 'Augeaime', '/uploads/personnages/v1/Jiferci-Lapegi.jpg', 'Noble, R3', 0, 1, 0, NULL,
  'Jiferci-Lapegi est un ancien commandant des forces de l''armée Augeoise. Il est reputé comme étant un stratège hors-pair. Malheureusement le temps à fait son œuvre, désormais Jiferci est un combattant à la retraite. Il est extrêmement respecté dans l''enceinte d''Augeaime et redouté par les pays voisins. Son flux lui permet de garder un œil sur tout le royaume d''Augeaime, il sert d''éclaireur et de roi de la surveillance. Vous ne savez pas comment fonctionne exactement son pouvoir.\n\nIl prend toujours son bain le Wanos et est toujours de bon conseil. Il semble être détesté par Sonila pour des raisons que vous ignorez.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Lily
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Lily');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Lily', 'La Titan Ardente', 'Création de Flammes', 'Drii', 'Humain', 'Augeaime', '/uploads/personnages/v1/Lily.jpg', 'Noble, R3', 0, 0, 0, NULL,
  'Lily est une titan d''Augeaime. Elle exerce en tant que scientifique qui étudie intensément le flux, elle est la patronne directe de Kuza. Vous n''avez pas d''information concernant comment elle combat ou de ses exploits de guerre. Elle semble assez gentille bien qu''opportuniste. Elle est ami avec Jiferci-Lapegi et pour une raison que vous ignorez, Sonila ne l''a pas dans son cœur.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Émeraude
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Émeraude');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Émeraude', 'La Brise du Rosier', 'Création de Vent', 'Lada', 'Humain', 'Augeaime', '/uploads/personnages/v1/Emeraude.jpg', 'R2', 0, 0, 0, NULL,
  'Émeraude est l''une des rang 2 du royaume d''Augeaime sous le titre de "Maître-Flux". Elle est une puissante élémentaliste de l''air. Elle utilise du maquillage ainsi qu''une écharpe pour cacher son identité. Vous ne connaissez pas son véritable nom. D''après Lato elle serait originaire d''Urive.\n\nElle vous a entraînée durant quelques leçons pour vous apprendre à mieux utiliser votre flux.\n\nAccessoirement, Kanna est une grande fan d''elle.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Requin
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Requin');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Requin', 'Le Trident d''Aqua', 'Création d''Eau', 'Aqua', 'Humain', 'Augeaime', '/uploads/personnages/v1/Requin.jpg', 'R2', 0, 0, 0, NULL,
  'Requin est l''un des Rang 2 d''Augeaime, il est gradé en tant que "Maître-Flux". C''est un combattant assez jeune, il a environ 25 ans de ce que Jiferci-Lapegi vous dit de lui, et est l''hydromancien le plus fort du pays. Son flux est assez étrange car il semble y avoir plus que de l''eau quand il en génère, mais vous ne saurez dire quoi exactement.\n\nIl a perdu le combat de clôture de la délégation contre Liaciry, un combat intense et plutôt serré.\n\nRequin est son nom d''anonymat mais vous ne connaissez pas son vrai prénom. Vous savez aussi qu''il a la fâcheuse habitude d''arriver en retard, Écarlate et Émeraude s''en plaignent beaucoup.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Taka
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Taka');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Taka', 'Fils de Refer', 'Créateur de Cristaux', 'Goliath-Pestia', 'Humain', 'Augeaime', '/uploads/personnages/v1/Taka.jpg', 'R4, Noble', 0, 1, 0, NULL,
  'Taka est le frère de Gora. Vous n''avez pas plus d''information le concernant. Vous savez juste qu''il est décédé, tué chez lui.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Aliya
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Aliya');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Aliya', 'Fille de Carmin', 'Invocation Armée', 'Yinva', 'Humain', 'Augeaime', '/uploads/personnages/v1/Aliya.jpg', 'R5, Carmin', 0, 0, 0, NULL,
  'Aliya est une rang 5 de la capitale Augeoise. Elle est brute et insultante en plus d''être une tire au flanc. On ne dirait pas comme cela, mais elle est la l''une des filles de Carmin. C''est elle qui a remplacé Sonila lorsque celle-ci était prise pour une affaire extérieur durant son tutorat.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Lira
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Lira');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Lira', 'Cheffe des Chevaliers des Flammes', 'Création Chaleureuse', 'Drii-Lada', 'Humain', 'Augeaime', '/uploads/personnages/v1/Lira.jpg', 'R4, Noble', 0, 0, 0, NULL,
  'Lira est une chevalière des flammes. Elle est la responsable de tous les rang 4, bien qu''il semblerait qu''elle soit la plus faible. Son attitude engagée et enjouée la rend très agréable à vivre. Elle est apprécié par tous les soldats que vous connaissez. Elle fut pendant une courte période la tuteur d''Adam et Phillia pour les aider dans les "interactions humaines".'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Sero
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Sero');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Sero', 'Fils de Carmin', 'Invocation Armée', 'Yinva', 'Humain', 'Augeaime', '/uploads/personnages/v1/Sero.jpg', 'Carmin, R4', 0, 0, 0, NULL,
  'Sero est un chevalier des flammes, il fait de parti de la famille de Carmin.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Epza
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Epza');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Epza', 'Chevalière des Flammes', 'Création Vénimeuse', 'Aqua-Shizari', 'Humain', 'Augeaime', '/uploads/personnages/v1/Epza.jpg', 'R4, Abruti', 0, 0, 0, NULL,
  ''
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Kuza
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Kuza');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Kuza', 'Scientifique d''Augeaime', 'Inconnu', 'Aucun', 'Humain', 'Augeaime', '/uploads/personnages/v1/Kuza.jpg', '', 0, 0, 0, NULL,
  'Kuza est l''un des associés de Lily. Il possède une forte personnalité et des idées bien tranchées qu''il ne remet jamais en cause. À cela s''ajoute une mauvaise hygiène et un manque de politesse écœurant, cependant, malgré tout cela, Lily continue de travailler avec lui, indiquant qu''il est sans aucun doute un excellent scientifique. Il serait spécialisé dans le flux.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Hélio
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Hélio');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Hélio', 'Scientifique d''Edenia', 'Inconnu', 'Aucun', 'Humain', 'Edenia', '/uploads/personnages/v1/Helio.jpg', '', 0, 0, 0, NULL,
  'Hélio est un scientifique et représentant d''Edenia. Vous ne savez pas grand chose de plus sur lui.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- La Juge
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'La Juge');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'La Juge', 'Garde du Corps d''Edenia', 'Inconnu', 'Aucun', 'Éternelle', 'Edenia', '/uploads/personnages/v1/Juge.jpg', 'Éternelle', 0, 0, 0, NULL,
  'La Juge était l''Éternelle qui était chargé de protéger La Momie et Hélio durant la délégation. Elle semble s''identifier comme étant une femme. Elle est d''un calme olympien qui a tendance à donner des frissons. Elle semblait prendre son rôle à cœur. Vous n''avez pas plus d''informations la concernant.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Rig
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Rig');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Rig', 'Chevalier des Flammes', 'Inconnu', 'Aucun', 'Humain', 'Mudan', '/uploads/personnages/v1/Rig.jpg', 'R4', 0, 0, 0, NULL,
  'Rig est un chevalier des flammes. Il a hérité du devoir de Nimha lorsqu''elle est parti à la retraite forcée. Il semble être indulgent et sûr de lui, il fait de bon choix et n''hésite pas à aller de l''avant. Vous n''avez pas plus d''information sur lui.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Shishi
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Shishi');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Shishi', 'Colporteuse de Rumeur', 'Lumière', 'Pestia', 'Humain', 'Augeaime', '/uploads/personnages/v1/Shishi.jpg', 'Journaliste', 0, 0, 0, NULL,
  'Shishi est l''une des personnes responsable de l''imprimerie à Augeaime. En plus de cela elle est la cheffe de la toute nouvelle guilde des "Chercheurs d''Informations". Elle semble savoir beaucoup de chose sur Augeaime et le monde qui l''entoure.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Toda
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Toda');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Toda', 'Garde du Corps de Mudan', 'Inconnu', 'Aucun', 'Humain', 'Mudan', '/uploads/personnages/v1/Toda.jpg', 'Archélémentaliste', 0, 0, 0, NULL,
  'Toda est un combattant légendaire, diplômé de l''école des Archélémentalistes. Il est reconnu à travers le monde entier comme étant l''un des plus grand guerrier Mudois. Il est en possession d''un des attributs de Lada.\n\nDali semble le respecter comme un vieux camarade.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Zaw
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Zaw');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Zaw', 'Servante de Pestia', 'Création de Bras', 'Guizamark', 'Éternelle', 'Mudan', '/uploads/personnages/v1/Zaw.jpg', 'Éternelle', 0, 0, 0, NULL,
  'Zaw est une éternelle qui était la servante de Pestia durant la délégation. Cette jeune éternelle a été accusée d''avoir aidé ATEL durant l''attaque du 8è Lanos. Elle devait se faire exécuter par Axra, mais cette dernière à fini par s''évader. Elle est actuellement recherchée pour une légère prime de 1000PO.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Wakutia
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Wakutia');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Wakutia', 'Imprimeuse', 'Création Lumineuse', 'Pestia', 'Humain', 'Augeaime', '/uploads/personnages/v1/Wakutia.jpg', '', 0, 0, 0, NULL,
  'Wakutia est la gérante de l''imprimerie d''Augeaime et la patronne de Shishi. Elle laisse les activités de la guilde de cette dernière avoir lieu dans ses locaux pour encourager sa jeune employée dans sa prise d''initiative.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Kaito
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Kaito');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 0, 'Kaito', 'Mercenaire', 'Création de Chaleur', 'Drii-Lada', 'Humain', 'Augeaime', '/uploads/personnages/v1/Killian.jpg', 'Invité', 0, 0, 0, NULL,
  ''
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1000, 1520, 980, 45, 52, 55, 32, 41, 45, 28, 51, 40, 42 FROM DUAL WHERE @ok;

-- Bael
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Bael');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Bael', 'Écarlate / Maître d''Armes', 'Invocation Armée', 'Yinva', 'Humain', 'Augeaime', '/uploads/personnages/v1/Bael.jpg', 'R2, Carmin, Écarlate', 0, 0, 0, NULL,
  'Bael est le plus grand utilisateur de flux qu''Augeaime n''a jamais connu. Il est le fils ainé de la grande famille de Carmin, la famille noble la plus respecté du pays. Il est arrogant, sûr de lui et incroyablement têtu et irréfléchi. Malgré tout cela il est extrêmement respecté par l''intégralité des habitants du royaume. Sa simple présence à la capitale rassure tout le monde.\n\nIl semblerait que la maîtrise de son flux est atteint un seuil impressionnant, il semble sans limite. Il a été capable de vaincre Dali sans le moindre effort avec.\n\nVous savez qu''il est très croyant en Artrish et qu''il aime peindre.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Zapo
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Zapo');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Zapo', 'Le Diable', 'Inconnu', 'Aucun', 'Humain', 'Augeaime', '/uploads/personnages/v1/Zapo.jpg', 'ATEL, Madelon', 0, 0, 0, NULL,
  'Zapo est un étrange homme que vous avez croisé au hameau des près verts durant l''une de vos missions. Il semble avoir une prime sur sa tête. Il possède un caractère manipulateur, vil et fourbe. Il vous a tendu un piège qui à bien faillit vous coûter votre vie. Il dit appartenir à ATEL, chez Madelon mais semble détaché du reste du groupe. Il est plutôt célèbre car Destra semblait le connaître avant de l''avoir vu.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Puda
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Puda');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Puda', 'Médecin', 'Inconnu', 'Aucun', 'Humain', 'Augeaime', '/uploads/personnages/v1/Puda.jpg', 'ATEL, Madelon', 0, 0, 0, NULL,
  'Puda est une jeune fille qui a été recrutée par ATEL pour ses qualités de soigneuse, cependant, cette dernière n''est pas en adéquation avec la morale du groupe criminel et a essayé de s''échapper avec vous. Malheureusement vous n''avez pas réussit à lui faire quitter le Hameau des Près Verts en sécurité, Leaf est arrivé et a saboté vos plans. Depuis vous n''avez plus d''informations la concernant.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Alu
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Alu');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Alu', 'Brigande de Madelon', 'Inconnu', 'Aucun', 'Inconnu', 'Augeaime', '/uploads/personnages/v1/Alu.jpg', 'ATEL, Madelon', 0, 0, 0, NULL,
  'Alu est la ménestrel du groupe de brigand qui s''était établi dans le hameau des prés verts avant l''incident. Elle est la ravitailleuse qui vous a indiqué que Leaf arrivait dans le village. Sans elle, vous seriez sans doute actuellement mort. Vous l''avez laissée là-bas avec un cheval. Vous n''avez pas eu de nouvelle d''elle depuis, mais ne vous faites pas de faux espoir.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Jiza
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Jiza');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Jiza', 'Brigand Madelon', 'Explosion', 'Drii', 'Humain', 'Augeaime', '/uploads/personnages/v1/Jiza.jpg', 'ATEL, Madelon', 0, 0, 0, NULL,
  'Jiza est l''un des brigands présent au hameau des prés verts. Jiza était membre de la garde, il était plutôt arrogant. Shuri l''a affronté et battu. Vous l''avez laissé avec le reste des brigands lorsque Leaf est arrivé au hameau. Vous n''avez plus de nouvelle de lui depuis.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Lishi
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Lishi');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Lishi', 'Brigande de Madelon', 'Inconnu', 'Aucun', 'Humain', 'Augeaime', '/uploads/personnages/v1/Lishi.jpg', 'ATEL, Madelon', 0, 0, 0, NULL,
  'Lishi est un des brigands de Madelon qui était présent au hameau des prés verts. Il a affronté Gora et a perdu contre lui. Il est semble être plutôt calme autant qu''il est doué à l''épée. Il faisait parti des gardes présent, cependant vous n''avez plus de nouvelle de lui depuis le passage de Leaf.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Poto
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Poto');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Poto', 'Brigande de Madelon', 'Inconnu', 'Inconnu', 'Humain', 'Augeaime', '/uploads/personnages/v1/Poto.jpg', 'ATEL, Madelon', 0, 0, 0, NULL,
  'Poto est un des brigands de Madelon qui était au hameau des prés verts. Il faisait partie du groupe des travailleurs et il vous a aidé à réaliser votre plan en aidant Puda a réalisé une diversion pour vous, en échange de quoi vous deviez le libérer des brigands. Malheureusement suite à l''arrivé de Leaf au hameau, vous l''avez abandonné. Vous n''avez plus de nouvelle de lui depuis, cependant il ne faut pas vous faire de faux espoirs, il est probablement déjà décédé.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Sellu
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Sellu');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Sellu', 'Brigande de Madelon', 'Création de Sommeil', 'Artrish', 'Humain', 'Augeaime', '/uploads/personnages/v1/Sellu.jpg', 'ATEL, Madelon', 0, 1, 0, NULL,
  'Sellu est une des brigandes primées présente au hameau des prés verts. Elle semblait bien maitrisé certain art de Mûdan et a écrasé en combat singulier Zayath. Vous l''avez tuée, un soir, en lui tendant un piège car elle était suspicieuse et semblait en savoir trop concernant votre infiltration. Sa prime de mort s''élevait à 4000ſ, sa prime de capture vous est cependant inconnue.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Yinshi
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Yinshi');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Yinshi', 'Brigande de Madelon', 'Inconnu', 'Aucun', 'Humain', 'Irisia', '/uploads/personnages/v1/Yinshi.jpg', 'ATEL, Madelon', 0, 0, 0, NULL,
  'Yinshi est une des brigandes primées présente au hameau des prés verts. Elle était la cheffe de la garde et combattait très bien, elle a mit a mal Gora et Shuri a elle seule. D''un tempérament violent et impulsif, elle était respectée par les membres du groupe. Destra s''est servit de son caractère pour la provoquer et la blesser avant l''assaut final pour ne pas l''avoir entre vos pattes, il l''a blessera au genou. Il dira plus tard qu''il pense ne pas pouvoir la battre dans un combat avec flux. Yinshi rampait en essayant de fuir Leaf la dernière fois que vous l''avez vue, depuis vous n''avez plus de nouvelle d''elle. Sa prime de mort était équivalente à celle de Sellu.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Zarashi
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Zarashi');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Zarashi', 'Brigand Madelon', 'Inconnu', 'Aucun', 'Humain', 'Augeaime', '/uploads/personnages/v1/Zarashi.jpg', 'ATEL, Madelon', 0, 0, 0, NULL,
  'Zarashi est l''un des brigands primés au hameau des prés verts. Il était le garde du corps personnel de Varo et ne le lâchait pas d''une semelle. Il est assez puissant pour effrayer Zapo. Ce dernier l''a pareil manipulé pour qu''il aille s''occuper de Leaf avant qu''il n''arrive au village. Dès lors vous n''avez plus eu de nouvelle de lui. Sa prime vous est inconnue.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Gamma
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Gamma');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Gamma', 'Peintre', 'Inconnu', 'Aucun', 'Humain', 'Augeaime', '/uploads/personnages/v1/Gamma.jpg', '', 0, 0, 0, NULL,
  'Gamma est un peintre Augeois qui semble être ami avec Bael. Il a un sacré coup de pinceau et à peint pour des grands noms comme Émeraude, Bael, Carmin ou encore Art Drinos. Vous n''en savez pas plus sur lui.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Sera
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Sera');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Sera', 'Enquêtrice', 'Inconnu', 'Aucun', 'Humain', 'Augeaime', '/uploads/personnages/v1/Sera.jpg', '', 0, 0, 0, NULL,
  'Sera est une enquêtrice de renom à Augeaime. Elle possède une maison assez luxieuse dans la capital. Elle possède un caractère difficile à décrire et à décrypter. C''est elle qui s''occupe de l''enquête concernant l''attaque qui a eu lieu le 8è Lanos. Vous n''en savez pas plus sur elle.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Eadric
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Eadric');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 0, 'Eadric', 'Le Petit Forgeron', 'Inconnu', 'Goliath', 'Humain', 'Saxifra', NULL, 'Forgeron', 0, 0, 0, NULL,
  'Visionne moi. watch?v='
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Dario Bianchi : stats de la table joueurs (Oskara)
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Dario Bianchi');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Dario Bianchi', 'Vieux Briscard', 'Créateur de Vent', 'Lada', 'Humain', 'Augeaime', '/uploads/personnages/v1/Dario.jpg', 'Mercenaire', 1, 0, 0, NULL,
  ''
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1100, 2010, 1180, 50, 64, 69, 63, 50, 23, 16, 38, 16, 30 FROM DUAL WHERE @ok;

-- Aze
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Aze');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Aze', 'Mercenaire', 'Création de Glace', 'Aqua-Lada', 'Humain', 'Augeaime', '/uploads/personnages/v1/Aze.jpg', '', 0, 0, 1, 'Je sais ce que j''ai à faire, pas besoin de vous répéter.',
  'Aze est un mercenaire très calme et réfléchit qui appartient au groupe de mercenaires réputés Abysse. Il est très doux et semble beaucoup apprécié nous aider à développer nos compétences au sein du campement.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Naza
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Naza');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Naza', 'Éternelle d''ATEL', 'Création de balle sismique', 'Artrish-Pura', 'Éternelle', 'Mudan', '/uploads/personnages/v1/Naza.jpg', '', 0, 0, 1, 'Vous n''avez souffert que d''une ONCE de notre douleur.',
  'Naza est une éternelle Mudoise qui a été réduite en esclavage puis en combattante clandestine. Elle est dit être plutôt âgé et d''avoir une forte haine envers la noblesse Augeoise. Elle ne semble animée que par l''envie de se venger des horreurs qu''elle a vécu et par le fait d''avoir une coupe de cheveux impeccable. Elle est bavarde et possède de nombreux tics de langage.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Zara
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Zara');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Zara', 'Mercenaire', 'Création Herculéenne', 'Guizamark-Pura', 'Humain', 'Augeaime', '/uploads/personnages/v1/Zara.jpg', '', 0, 0, 1, 'Partez d''ici, vous ne ferez que me gêner !',
  'Zara est une mercenaire au caractère bien trempé qui fait partie de votre camp. Elle semble flemmarde et se repose énormément sur son flux pour tout et pour rien. Elle ne semble pas apprécier le fait d''être bloquer dans le camp à surveiller des "enfants". Malgré tout, elle semble posséder une sacré force aussi bien physique que magique.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Kakania
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Kakania');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Kakania', 'Membre d''ATEL', 'Création de ???', 'Aucun', 'Humain', 'Augeaime', '/uploads/personnages/v1/Kakania.jpg', '', 0, 0, 1, 'Un chapeau en place, un joli sourire, un plan bien ficelé, la victoire est à moi.',
  'Kakania est une femme spécialisée dans l''arnaque, vous ne connaissez pas grand-chose concernant son passé. Elle est devenue la cheftaine de votre groupe des suites d''un vote. Son flux est intrigant, tout autant est sa personnalité.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Vaku
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Vaku');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Vaku', 'Membre d''ATEL', 'Inconnu', 'Aucun', 'Humain', 'Augeaime', '/uploads/personnages/v1/Vaku.jpg', '', 0, 0, 1, 'Qui que vous soyez, fuyez, vous n''atteindrez pas votre but tant que je suis vivant.',
  'Vaku est un ancien membre des mercenaires Abysse pendant 12 ans. Il a été forcé ensuite de rejoindre les Guignols d''ATEL mais vous ne savez pas exactement pourquoi. Il a un caractère assez ronchon, il semblerait qu''il n''ait toujours pas accepté sa condition de brigand. Il semble être un solide combattant avec un certain charisme.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Agui
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Agui');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Agui', 'Mercenaire', 'Inconnu', 'Aucun', 'Inconnu', 'Augeaime', '/uploads/personnages/v1/Agui.jpg', '', 0, 0, 1, 'Lève une seule fois ton arme, et tu passeras de potentiel client à mangeur de racines.',
  'Agui est une des mercenaires du groupe Abysse. Elle semble sympathique mais n''interagit pas plus que cela avec vous. Vous ne connaissez ni son flux, ni son arme.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Titan
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Titan');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Titan', 'Le premier', 'Aucun', 'Aucun', 'Géant', 'Inconnu', NULL, '', 1, 0, 1, 'Aeteria... Tu as... Tant changé...',
  ''
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Eve
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_characters` WHERE `name` = 'Eve');
INSERT INTO `characters` (`visibility`, `name`, `title`, `flux`, `dragon`, `race`, `country`, `image`, `category`, `current`, `dead`, `censored`, `quote`, `description`)
SELECT 1, 'Eve', 'Fiancée d''Adam', 'Création de Balles Enflammées', 'Artrish-Drii', 'Humain', 'Augeaime', '/uploads/personnages/v1/Eve.jpg', 'Mariage', 1, 0, 1, 'On est fait pour être ensemble ! Je possède des preuves !',
  'Eve est une femme ayant un tempérament impulsif mais courageux. Elle n''hésitera jamais à s''interposer entre deux personnes lors d''un conflit. Cela risque de vous causer des problèmes durant vos péripéties.\n\nEve est la fiancée d''Adam, ses parents ont organisé un mariage arrangé entre ces deux là dans le but de créer une alliance entre leurs deux familles. Étant donné qu''Adam n''est pas un enfant légitime, il est fort à parier qu''Eve n''est pas la membre la plus importante de sa lignée.\n\nElle a décidé de partir à l''aventure pour accomplir son mariage qu''Adam essaie de délayer le plus possible.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`character_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1920, 750, 900, 65, 30, 29, 42, 63, 40, 32, 60, 36, 54 FROM DUAL WHERE @ok;


-- ─── Bestiaire (18) ────────────────────────────────────────────────────────────

-- Chapardeur
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_monsters` WHERE `name` = 'Chapardeur');
INSERT INTO `monsters` (`visibility`, `name`, `dragon`, `size`, `weight`, `dangerosity`, `image`, `current`, `effect`, `description`)
SELECT 1, 'Chapardeur', 'Yinva', '0.80m - 1.25m', '30kg-40kg', 2, '/uploads/monsters/v1/Chapardeur.jpg', 0, 'Monstre Faible',
  'Les chapardeurs sont des gobelins vivants dans les montagnes enneigées du Nord d’Augeaime ainsi qu’un peu partout dans le pays de Saxifra. Ces petits monstres copient le style de vie des humains par mimétisme. Pour se faire, ils volent des armes, des vêtements et tout objets que les humains chérissent. Ils sont facilement distinguables par leur masque en bois taillé esquissant un grand sourire. Le flux leur permet de manipuler les esprits et les émotions des humains proches d’eux. Ils s’en servent pour baisser leurs gardes, les voler et s’enfuir.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`monster_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1000, 1000, 500, 30, 40, 30, 40, 40, 30, 50, 25, 0, 20 FROM DUAL WHERE @ok;

-- Roi Chapardeur
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_monsters` WHERE `name` = 'Roi Chapardeur');
INSERT INTO `monsters` (`visibility`, `name`, `dragon`, `size`, `weight`, `dangerosity`, `image`, `current`, `effect`, `description`)
SELECT 1, 'Roi Chapardeur', 'Yinva', '2m', '100kg', 2, '/uploads/monsters/v1/Roi-Chapardeur.jpg', 0, 'Compétence Boss : Change l''humeur de tout le monde sur le terrain quand il joue.',
  'Le roi chapardeur est un grand gobelin qui protège le butin qui a été amassé par les chapardeurs. Bien que moins agile que ses congénères, il est beaucoup plus grand et puissant. À l’instar de ses comparses, il peut manipuler les esprits et les émotions des personnes autour de lui afin que ces derniers ouvrent leur garde et qu’il puisse les attaquer. Il arrive régulièrement que le roi mette en colère ses alliés et lui-même pour augmenter la force de frappe de sa petite armée. Ils vivent dans les cavernes des montagnes enneigées du Nord d’Augeaime ainsi que dans les grottes du royaume de Saxifra.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`monster_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1500, 3000, 1000, 50, 60, 40, 35, 40, 35, 10, 50, 0, 40 FROM DUAL WHERE @ok;

-- Roi des Montagnes
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_monsters` WHERE `name` = 'Roi des Montagnes');
INSERT INTO `monsters` (`visibility`, `name`, `dragon`, `size`, `weight`, `dangerosity`, `image`, `current`, `effect`, `description`)
SELECT 1, 'Roi des Montagnes', 'Guizamark', '2m20 (longueur)', '250kg', 4, '/uploads/monsters/v1/RoiDesMontagnes.jpg', 0, 'Inconnu',
  'Vous n''avez pas assez d''informations concernant ce monstre.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`monster_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 3000, 12000, 1200, 75, 50, 66, 65, 72, 68, 15, 78, 0, 34 FROM DUAL WHERE @ok;

-- Reniath
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_monsters` WHERE `name` = 'Reniath');
INSERT INTO `monsters` (`visibility`, `name`, `dragon`, `size`, `weight`, `dangerosity`, `image`, `current`, `effect`, `description`)
SELECT 1, 'Reniath', 'Goliath', '40 - 60cm', '15kg - 25kg', 2, '/uploads/monsters/v1/Reniath.jpg', 0, 'Prédateur Apex',
  'Les Reniaths est une espèce endémique à la région de Valiath. Il s’agit de monstre ayant des crocs et des griffes dans un métal lourd et ignifuge. Ils ne se baladent qu’en famille et représentent un véritable danger pour l’écosystème et les humains de la région. Ils sont considérés comme étant des “Prédateurs Apex” et sont chassés par les humains pour les empêcher de détruire la biodiversité de Valiath. Prenez garde si vous décidez d’en enfermer un, même des cages en acier ne résistent pas à leur équipement.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`monster_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 500, 800, 500, 30, 50, 35, 50, 50, 40, 50, 25, 0, 25 FROM DUAL WHERE @ok;

-- Linci
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_monsters` WHERE `name` = 'Linci');
INSERT INTO `monsters` (`visibility`, `name`, `dragon`, `size`, `weight`, `dangerosity`, `image`, `current`, `effect`, `description`)
SELECT 1, 'Linci', 'Yinva', '3m - 5m (longueur)', '10kg - 15kg', 2, '/uploads/monsters/v1/Linci.jpg', 0, 'Monstre Dangereux',
  'Le Linci est un monstre vivant entre le royaume d’Augeaime et de Saxifra. Il s’agit d’un serpent possédant de puissantes pattes avant avec un pelage lui permettant de facilement se camoufler dans la neige. Malgré leurs petites tailles, les Lincis ne doivent pas être sous-estimés. Ces derniers arrivent à hypnotiser même le plus sérieux des guerriers, le forçant à s’en prendre à son allié pour lequel il éprouve le plus de rancœur. Un choc assez puissant est généralement suffisant pour calmer l’individu hypnotisé.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`monster_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1000, 1000, 500, 40, 35, 40, 45, 40, 40, 55, 25, 0, 35 FROM DUAL WHERE @ok;

-- Troll Humain
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_monsters` WHERE `name` = 'Troll Humain');
INSERT INTO `monsters` (`visibility`, `name`, `dragon`, `size`, `weight`, `dangerosity`, `image`, `current`, `effect`, `description`)
SELECT 1, 'Troll Humain', 'Inconnu', '1m60 - 2m', '80kg - 120kg', 3, '/uploads/monsters/v1/TrollHumain.jpg', 0, 'Compétence Boss : Se régénère un certain montant de HP à chaque fois qu''il joue.',
  'Le Troll Humain est une race de troll endémique à Saxifra. Il s’agit d’une race assez faible pour les trolls, cela est dû à l’absence de flux chez eux. Pour compenser cela, ils ont appris à imiter le langage humain pour attirer ces derniers et les forcer à baisser leurs gardes. Ils imitent même les mimiques humaines. Mais ne les sous-estimez pas, il reste des trolls ayant une force physique hors du commun.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`monster_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 6000, 1200, 0, 65, 45, 50, 45, 55, 25, 15, 40, 40 FROM DUAL WHERE @ok;

-- Habitant de la Forêt
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_monsters` WHERE `name` = 'Habitant de la Forêt');
INSERT INTO `monsters` (`visibility`, `name`, `dragon`, `size`, `weight`, `dangerosity`, `image`, `current`, `effect`, `description`)
SELECT 1, 'Habitant de la Forêt', 'Guizamark', '0.8m - 1.2m', '15kg - 30kg', 2, '/uploads/monsters/v1/HabitantForet.jpg', 0, 'Monstre Faible',
  'Les habitants de la Forêt sont des petits monstres qui, comme leur nom l’indique, vivent dans les forêts aux quatre coins du monde. Bien que faibles individuellement, les habitants de la forêt se baladent en grand groupe ce qui les rend très dangereux, d’autant que leurs flux liés aux racines peut très vite retourner n''importe quelle situation.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`monster_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1000, 1000, 500, 60, 25, 30, 45, 45, 40, 40, 25, 0, 15 FROM DUAL WHERE @ok;

-- Gourmours
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_monsters` WHERE `name` = 'Gourmours');
INSERT INTO `monsters` (`visibility`, `name`, `dragon`, `size`, `weight`, `dangerosity`, `image`, `current`, `effect`, `description`)
SELECT 1, 'Gourmours', 'Yinva', '1m80 - 2m20', '150kg - 250kg', 2, '/uploads/monsters/v1/Gourmours.jpg', 0, 'Compétence Boss : Il vit en symbiose avec les abeilles, il peut s''en servir pour vous attaquer ou se défendre.',
  'Les gourmours sont des ours ayant une légère couleur bleue ainsi que des renforts aux niveaux du crâne et des bras. Il s’agit d’une espèce d''ours qui vit en symbiose avec différentes races d’abeilles qui parcourent le monde d’Aeteria. En échange d’une partie de leur miel, le gourmours protège le territoire des abeilles, miel dont il se sert aussi bien pour se nourrir que pour combattre, avec son flux. Les gourmours se trouvent un peu partout dans les royaumes de Mûdan, d’Augeaime et d’Edenia.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`monster_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1500, 3000, 500, 40, 60, 50, 35, 40, 40, 15, 40, 0, 15 FROM DUAL WHERE @ok;

-- Terrours
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_monsters` WHERE `name` = 'Terrours');
INSERT INTO `monsters` (`visibility`, `name`, `dragon`, `size`, `weight`, `dangerosity`, `image`, `current`, `effect`, `description`)
SELECT 1, 'Terrours', 'Yinva', '2m40 - 3m00', '300kg - 450kg', 2, '/uploads/monsters/v1/Terrours.jpg', 0, 'Compétence Boss : À son tour, terrifie toutes ses proies sauf une.',
  'Les Terrours sont des grands ours noirs extrêmement forts physiquement. Ils sont beaucoup plus grands que des ours classiques, ils inspirent la terreur et la peur chez tous leurs adversaires. On pourrait penser qu’ils se servent de cela pour éviter le combat, mais eux s’en servent pour faciliter leur combat et briser la garde et le mental de leur proie. Cette espèce ne vit qu''aux alentours de la frontière entre Saxifra et le royaume d’Augeaime.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`monster_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1500, 3000, 1000, 50, 65, 55, 45, 40, 25, 5, 65, 0, 40 FROM DUAL WHERE @ok;

-- Loup Aveugle
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_monsters` WHERE `name` = 'Loup Aveugle');
INSERT INTO `monsters` (`visibility`, `name`, `dragon`, `size`, `weight`, `dangerosity`, `image`, `current`, `effect`, `description`)
SELECT 1, 'Loup Aveugle', 'Aucun', '1m40 - 1m70', '50kg - 80kg', 2, '/uploads/monsters/v1/LoupAveugle.jpg', 0, 'Monstre Faible',
  'Les Loups aveugles sont une espèce unique à Valiath. Aussi étonnant que cela puisse paraître, ils naissent avec leurs cécités et ne l''acquièrent pas à cause de l’âge ou de blessure. Cette particularité à affiner grandement les restes de leurs sens, ils sont par conséquent très réceptifs aux sons et aux odeurs. On raconte qu’ils évoluèrent ainsi pour vaincre les Tiours. Il ne semble pas posséder de flux, et comme tous les loups, ils se baladent en meute avec un alpha dans le groupe.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`monster_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 1500, 1000, 0, 55, 40, 40, 45, 60, 50, 35, 0, 40 FROM DUAL WHERE @ok;

-- Troll des Glaces
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_monsters` WHERE `name` = 'Troll des Glaces');
INSERT INTO `monsters` (`visibility`, `name`, `dragon`, `size`, `weight`, `dangerosity`, `image`, `current`, `effect`, `description`)
SELECT 1, 'Troll des Glaces', 'Aqua', '2m00 - 2m40', '120kg - 180kg', 4, '/uploads/monsters/v1/Troll-des-Glaces.jpg', 0, 'Compétence Boss : Se régénère un certain montant de HP à chaque fois qu''il joue.',
  'Le Troll des glaces est une race de Troll, l’une des plus menaçante est dangereuse. Ces monstres possèdent une force dépassant certains utilisateurs de la Force Pure en plus de posséder une santé et un flux dévastateur, souvent lié au froid. Ces derniers se baladent rarement seuls, cela renforce leur caractère à être la race de Troll la plus dangereuse. Leurs adversaires naturelles sont les géants. On en trouve dans toutes les régions enneigées, avec une surabondance à Saxifra.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`monster_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 1800, 10000, 1500, 40, 80, 55, 55, 65, 55, 15, 45, 0, 45 FROM DUAL WHERE @ok;

-- Zérisson
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_monsters` WHERE `name` = 'Zérisson');
INSERT INTO `monsters` (`visibility`, `name`, `dragon`, `size`, `weight`, `dangerosity`, `image`, `current`, `effect`, `description`)
SELECT 1, 'Zérisson', 'Goliath', '10cm - 30cm', '<1kg', 1, '/uploads/monsters/v1/Zerisson.jpg', 0, 'Animal de Compagnie',
  'Le Zérisson est un petit animal vivant dans la rivière de Valiath. Il s’agit d’un animal quasiment inoffensif pour les humains qui ressemble à un hérisson avec des coquillages sur le dos. Les couleurs des Zérisson varient selon chaque individu, certaines couleurs sont plus rares que d''autres. Les coquillages étant liés à leur flux, ces derniers disparaissent quelque temps après leur mort.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`monster_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 500, 300, 100, 30, 10, 50, 10, 40, 15, 30, 50, 0, 15 FROM DUAL WHERE @ok;

-- Liavre
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_monsters` WHERE `name` = 'Liavre');
INSERT INTO `monsters` (`visibility`, `name`, `dragon`, `size`, `weight`, `dangerosity`, `image`, `current`, `effect`, `description`)
SELECT 1, 'Liavre', 'Goliath', '40cm - 60cm', '3kg - 5kg', 1, '/uploads/monsters/v1/Liavre.jpg', 0, 'Gibier',
  'Le Liavre est une race de lièvre qui à développé le flux du magma. Il se sert de son pouvoir pour se défendre de ses prédateurs mais surtout pour créer un terrier confortable pour pouvoir y vivre et mettre bas des petits facilement.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`monster_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Gloutre
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_monsters` WHERE `name` = 'Gloutre');
INSERT INTO `monsters` (`visibility`, `name`, `dragon`, `size`, `weight`, `dangerosity`, `image`, `current`, `effect`, `description`)
SELECT 1, 'Gloutre', 'Goliath', '50cm - 70cm', '<5kg', 1, '/uploads/monsters/v1/Gloutre.jpg', 0, 'Animal Faible',
  'Les gloutres sont des loutres qui ont développé un flux de Terre. Elles ont dû s’habituer à vivre sur terre pour des raisons inconnues et sont devenues des animaux intégralement terrestres. Elles vivent dans les terriers des liavres, et n''hésitent pas à tuer ces derniers pour s’accaparer leur résidence. Il s’agit d’une espèce endémique à Valiath.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`monster_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Wasep
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_monsters` WHERE `name` = 'Wasep');
INSERT INTO `monsters` (`visibility`, `name`, `dragon`, `size`, `weight`, `dangerosity`, `image`, `current`, `effect`, `description`)
SELECT 1, 'Wasep', 'Pestia', '5m', '35kg', 4, '/uploads/monsters/v1/Wasep.jpg', 0, 'Compétence de Zone : Attire tous les animaux et monstres de la zone.',
  'La Wasep est une fleur qui pousse dans les régions enneigées d’Aeteria. Elle éclot une fois par an, aux alentours du solstice d''hiver. À son éclosion, elle émet une odeur imperceptible pour les humains mais qui attire moult monstres. Elle pousse de manière asynchrone et stocke des fruits en elle qui s’expose lorsqu’elle éclos. Chaque année de plus en plus de Wasep sont découvertes, les autorités essaient de les détruire avant l’éclosion.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`monster_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 FROM DUAL WHERE @ok;

-- Engeance Reniath
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_monsters` WHERE `name` = 'Engeance Reniath');
INSERT INTO `monsters` (`visibility`, `name`, `dragon`, `size`, `weight`, `dangerosity`, `image`, `current`, `effect`, `description`)
SELECT 1, 'Engeance Reniath', 'Shizari', '40 - 60cm', '10kg - 15kg', 3, '/uploads/monsters/v1/Engeance-Reniath.jpg', 0, 'Engeance de Shizari : Vole une partie de la QdF en cas d''attaque.',
  'Les engeances de reniaths sont des créatures fantômatiques noires avec des lueurs vertes qui pourraient s''apparenter à leur cœur. Elles ne semble pas affectées par les attaques physiques et peuvent traverser certains matériaux. Elles peuvent également voler du flux aux personnes qu''elles attaquent et l''utiliser contre elles. Il s''agit de créatures artificielles créées à partir de la haine et seraient liées à Shizari.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`monster_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 500, 1000, 500, 50, 30, 35, 50, 50, 40, 50, 25, 0, 25 FROM DUAL WHERE @ok;

-- Engeance Canine
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_monsters` WHERE `name` = 'Engeance Canine');
INSERT INTO `monsters` (`visibility`, `name`, `dragon`, `size`, `weight`, `dangerosity`, `image`, `current`, `effect`, `description`)
SELECT 1, 'Engeance Canine', 'Shizari', '1m80', '80kg', 3, '/uploads/monsters/v1/Engeance-Canine.jpg', 0, 'Compétence Boss : Absorbe le flux de ses cibles pour l''utiliser contre eux.',
  'Les engeances canines sont des créatures fantômatiques noires avec des lueurs vertes qui pourraient s''apparenter à leur cœur. De plus leur gueule est démesurée comparé à leur corps pouvant déchiqueter le buste d''un homme en un seul croc. Elles ne semble pas affectées par les attaques physiques et peuvent traverser certains matériaux. Comme pour les engeances reniaths, elles peuvent également voler du flux aux personnes qu''elles attaquent et l''utiliser contre elles. Il s''agit de créatures artificielles créées à partir de la haine et seraient liées à Shizari.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`monster_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 3000, 1000, 70, 40, 55, 44, 50, 25, 25, 60, 0, 25 FROM DUAL WHERE @ok;

-- Engeance Humaine
SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_monsters` WHERE `name` = 'Engeance Humaine');
INSERT INTO `monsters` (`visibility`, `name`, `dragon`, `size`, `weight`, `dangerosity`, `image`, `current`, `effect`, `description`)
SELECT 1, 'Engeance Humaine', 'Shizari', '1m60-2m00', '40kg-80kg', 3, '/uploads/monsters/v1/Engeance-Humaine.jpg', 0, 'Mémoire d''Antan : Permet de générer certains objets.',
  'Les engeances humaines sont des créatures fantômatiques noires avec des lueurs vertes qui pourraient s''apparenter à leur cœur. Elles ne semble pas affectées par les attaque physiques et peuvent traverser certains matériaux. Elles peuvent également créées des objets à partir de leurs corps. Il s''agit de créatures artificielles créées à partir de la haine et seraient liées à Shizari.\nIl semblerait que les engeances humaines ne s''en prennent qu''aux personnes envers lesquelles elles ressentent de la haine.'
FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `statistics` (`monster_id`, `qdf`, `pv`, `endurance`, `maitrise`, `strength`, `defense`, `vitesse`, `accuracy`, `perception`, `furtivite`, `charisme`, `eloquence`, `intelligence`)
SELECT @id, 0, 1000, 500, 0, 40, 35, 45, 45, 60, 35, 25, 0, 35 FROM DUAL WHERE @ok;


-- ─── Objets (117) ──────────────────────────────────────────────────────────────

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Casque en cuir');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Casque en cuir', 'Casque', 1, 1, 'Casque en Cuir. Augmente la défense de 2.' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Casque en cuir', 'DEF', '+2', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Plastron en cuir');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Plastron en cuir', 'Torse', 1, 1, 'Plastron en Cuir. Augmente la défense de 5.' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Plastron en cuir', 'DEF', '+5', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Brassards en cuir');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Brassards en cuir', 'Gantelets', 1, 1, 'Brassards en Cuir. Augmentent la défense de 1.' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Brassards en cuir', 'DEF', '+1', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Bottes de cuir');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Bottes de cuir', 'Jambières', 1, 1, 'Bottes en Cuir. Augmentent la défense de 2.' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Bottes de cuir', 'DEF', '+2', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Heaume en Acier');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Heaume en Acier', 'Casque', 1, 1, 'Heaume en Acier. Résistant, estampillé du sceau des forges Augeoises, augmente la défense de 5, cependant, baisse la vitesse de 2 et la précision de 3.' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Heaume en Acier', 'DEF,VIT,ACC', '+5,-2,-3', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Plastron en Acier');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Plastron en Acier', 'Torse', 1, 2, 'Torse en Acier. Résistant, estampillé du sceau des forges Augeoises, augmente la défense de 12, cependant, baisse la vitesse de 3.' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Plastron en Acier', 'DEF,VIT', '+12,-3', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Gantelets en Acier');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Gantelets en Acier', 'Gantelets', 1, 1, 'Gantelets en Acier. Résistants, estampillés du sceau des forges Augeoises, augmentent la défense de 3, cependant, baisse la vitesse de 1.' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Gantelets en Acier', 'DEF,VIT', '+3,-1', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Jambières en Acier');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Jambières en Acier', 'Jambières', 1, 1, 'Jambières en Acier. Résistantes, estampillées du sceau des forges Augeoises, augmentent la défense de 5, cependant, baisse la vitesse de 1.' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Jambières en Acier', 'DEF,VIT', '+5,-1', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Heaume en Aucellum');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Heaume en Aucellum', 'Casque', 3, 1, 'Heaume en Aucellum. Résistant et léger, estampillé du sceau des forges Augeoises, augmente la défense de 5 et la vitesse de 1.' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Heaume en Aucellum', 'DEF,VIT', '+5,+1', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Plastron en Aucellum');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Plastron en Aucellum', 'Torse', 3, 2, 'Torse en Aucellum. Résistant et léger, estampillé du sceau des forges Augeoises, augmente la défense de 12 et la vitesse de 2.' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Plastron en Aucellum', 'DEF,VIT', '+12,+2', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Jambières en Aucellum');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Jambières en Aucellum', 'Jambières', 3, 1, 'Jambières en Aucellum. Résistantes et légeres, estampillées du sceau des forges Augeoises, augmentent la défense de 5 et la vitesse de 1.' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Jambières en Aucellum', 'DEF,VIT', '+5,+1', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Gantelets en Aucellum');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Gantelets en Aucellum', 'Gantelets', 3, 1, 'Gantelets en Aucellum. Résistants et légers, estampillés du sceau des forges Augeoises, augmentent la défense de 3 et la vitesse de 1.' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Gantelets en Aucellum', 'DEF,VIT', '+3,+1', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Heaume en Fabuliath');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Heaume en Fabuliath', 'Casque', 3, 1, 'Heaume en Fabuliath. Très résistant, estampillé du sceau des forges Augeoises. Augmente la défense de 8 et la maîtrise de flux de 2, cependant, baisse la vitesse de 2 et la précision de 3.' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Heaume en Fabuliath', 'DEF,VIT,MDF,ACC', '+8,-2,+2,-3', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Plastron en Fabuliath');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Plastron en Fabuliath', 'Torse', 3, 2, 'Torse en Fabuliath. Très résistant, estampillé du sceau des forges Augeoises. Augmente la défense de 15 et la maîtrise de flux de 3, cependant, baisse la vitesse de 5.' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Plastron en Fabuliath', 'DEF,VIT,MDF', '+15,-5,+3', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Gantelets en Fabuliath');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Gantelets en Fabuliath', 'Gantelets', 3, 1, 'Gantelets en Fabuliath. Très résistants, estampillés du sceau des forges Augeoises. Augmente la défense de 5 et la maîtrise de flux de 3, cependant, baisse la vitesse de 1.' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Gantelets en Fabuliath', 'DEF,VIT,MDF', '+5,-1,+3', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Jambières en Fabuliath');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Jambières en Fabuliath', 'Jambières', 3, 1, 'Jambières en Fabuliath. Très résistantes, estampillées du sceau des forges Augeoises. Augmente la défense de 8 et la maîtrise de flux de 2, cependant, baisse la vitesse de 2.' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Jambières en Fabuliath', 'DEF,VIT,MDF', '+8,-2,+2', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Heaume en Tungstène');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Heaume en Tungstène', 'Casque', 2, 1, 'Heaume en Tungstène. Résistant à la chaleur, estampillé du sceau des forges Augeoises, augmente la défense de 5, cependant, baisse la vitesse de 2 et la précision de 3.' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Heaume en Tungstène', 'DEF,VIT,ACC', '+8,-2,-3', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Plastron en Tungstène');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Plastron en Tungstène', 'Torse', 2, 2, 'Plastron en Tungstène. Résistant à la chaleur, estampillé du sceau des forges Augeoises, augmente la défense de 12, cependant, baisse la vitesse de 3.' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Plastron en Tungstène', 'DEF,VIT', '+15,-3', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Gantelets en Tungstène');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Gantelets en Tungstène', 'Gantelets', 2, 1, 'Gantelets en Tungstène. Résistants à la chaleur, estampillés du sceau des forges Augeoises, augmentent la défense de 3, cependant, baisse la vitesse de 1.' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Gantelets en Tungstène', 'DEF,VIT', '+5,-1', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Jambières en Tungstène');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Jambières en Tungstène', 'Jambières', 2, 1, 'Jambières en Tungstène. Résistantes à la chaleur, estampillées du sceau des forges Augeoises, augmentent la défense de 5, cependant, baisse la vitesse de 1.' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Jambières en Tungstène', 'DEF,VIT', '+8,-1', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Casque en cuir fourré');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Casque en cuir fourré', 'Casque', 1, 1, 'Casque en Cuir. Augmente la défense de 3, baisse la précision de 2 et tient chaud.' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Casque en cuir fourré', 'DEF,ACC', '+3,-2', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Plastron en cuir fourré');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Plastron en cuir fourré', 'Torse', 1, 1, 'Plastron en Cuir. Augmente la défense de 7, la vitesse baisse de 2 et tient chaud.' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Plastron en cuir fourré', 'DEF,VIT', '+7,-2', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Brassards en cuir fourrés');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Brassards en cuir fourrés', 'Gantelets', 1, 1, 'Brassards en Cuir. Augmentent la défense de 2, baisse la vitesse de 1 et tient chaud.' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Brassards en cuir fourrés', 'DEF,VIT', '+2,-1', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Bottes de cuir fourrées');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Bottes de cuir fourrées', 'Jambières', 1, 1, 'Bottes en Cuir. Augmentent la défense de 3, baisse la vitesse de 2 et tient chaud.' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Bottes de cuir fourrées', 'DEF,VIT', '+3,-2', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Sac à Dos');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Sac à Dos', 'Torse', 1, 1, 'Se porte à la place d''un torse, double le nombre d''emplacements maximums.' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Sac à Dos', 'VIT', '-5', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Anneau doré');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Anneau doré', 'Gantelets', 3, 0, 'Anneau en pierre précieuse et en or qui augmente le Charisme de 7 si l''individu ne possède pas de gants.\nIl est fait en forme de lierre en or incrusté d''Œil de Tigre.' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Anneau doré', 'CHA', '+7', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Tenue de Civil');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Tenue de Civil', 'Torse', 1, 2, 'Tenue absolument lambda, ne peut être porté avec une d''autres pièces d''armures' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Tenue de Civil', 'DEF', '-10', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Jambières en Iridium');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Jambières en Iridium', 'Jambières', 3, 1, 'Jambières en Iridium. Infatiguables, estampilléss du sceau des forges Augeoises. Augmentent la défense de 10, cependant, baisse la vitesse de 3.' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Jambières en Iridium', 'DEF,VIT', '+10,-3', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Costume de Tailleur Prestigieux Taille Unique');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Costume de Tailleur Prestigieux Taille Unique', 'Torse', 4, 2, '' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Costume de Tailleur Prestigieux Taille Unique', 'CHA,FOR', '+10,-25', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Heaume en Iridium');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Heaume en Iridium', 'Casque', 3, 1, 'Heaume en Iridium. Infatiguable, estampillé du sceau des forges Augeoises. Augmente la défense de 10, cependant, baisse la vitesse de 3 et la précision de 3.' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Heaume en Iridium', 'DEF,VIT,ACC', '+10,-3,-3', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Plastron en Iridium');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Plastron en Iridium', 'Torse', 3, 2, 'Torse en Iridium. Infatiguable, estampillé du sceau des forges Augeoises. Augmente la défense de 20, cependant, baisse la vitesse de 7.' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Plastron en Iridium', 'DEF,VIT', '+20,-7', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Gantelets en Iridium');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Gantelets en Iridium', 'Gantelets', 3, 1, 'Gantelets en Iridium. Infatiguables, estampillés du sceau des forges Augeoises. Augmentent la défense de 7, cependant, baisse la vitesse de 2.' FROM DUAL WHERE @ok;
SET @id := LAST_INSERT_ID();
INSERT INTO `armors` (`name`, `statistics`, `values`, `item_id`)
SELECT 'Gantelets en Iridium', 'DEF,VIT', '+7,-2', @id FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Épée en Acier');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Épée en Acier', 'Arme', 1, 1, 'Une épée en acier à une main. Résistante et estampillée du sceau des forges Augeoises. Si utilisée, donne un bonus de 7 de force.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Dague en Acier');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Dague en Acier', 'Arme', 1, 1, 'Une dague en acier à une main. Résistante et estampillée du sceau des forges Augeoises. Si utilisée, donne un bonus de 5 de force, l''attaque possède un bonus en cas de contre-attaque de 3.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Dague en Aucellum');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Dague en Aucellum', 'Arme', 3, 1, 'Augmente la force de 5 lors d''une attaque utilisant cette arme. De plus lors d''un jet de vitesse, la vitesse augmente 5. En supplément en cas de contre-attaque, augmente l''attaque de 3.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Lance en Acier');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Lance en Acier', 'Arme', 1, 2, 'Arme à deux mains possédant une forte allonge et de grand dégâts. Augmente l''attaque de 10. Peut-être lancée avec de la Force et de la Vitesse.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Hache en Acier');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Hache en Acier', 'Arme', 1, 1, 'Augmente la force de 5 lors d''une attaque utilisant cette arme. En supplément les jets de défense augmente de 3.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Hache de Bucheron en Fer');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Hache de Bucheron en Fer', 'Arme', 1, 2, 'Une hache en Fer, augmente l''attaque de 8 pts, cependant est fragile. Vous ne pouvez contre-attaquer avec.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Hache en Iridium');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Hache en Iridium', 'Arme', 3, 1, 'Augmente la force de 10 lors d''une attaque utilisant cette arme. En supplément les jets de défense augmente de 5.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Hallebarde en Iridium');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Hallebarde en Iridium', 'Arme', 3, 2, 'Augmente la force de 20 lors d''une attaque utilisant cette arme. En supplément les jets de défense augmente de 5. Vous ne pouvez pas esquiver avec cette arme.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Marteau de Guerre en Iridium pour Géant');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Marteau de Guerre en Iridium pour Géant', 'Arme', 3, 3, '' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Marteau Rustique en Bois');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Marteau Rustique en Bois', 'Arme', 1, 1, 'Marteau très abimé. Il semble fait en bois avec quelques morceaux de fer.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Maillet en bois de vie');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Maillet en bois de vie', 'Arme', 2, 1, 'Une masse en bois de vie. Augmente la force de 3 lors d''une attaque utilisant cette arme. En supplément ignore la défense de l''adversaire à hauteur de 5 DEF. Cette arme regénère les petits destructions automatiquement.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Chaînes en Fabuliath');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Chaînes en Fabuliath', 'Arme', 4, 1, '' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Rapière en Aucellum');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Rapière en Aucellum', 'Arme', 3, 1, 'Augmente la force de 5 lors d''une attaque utilisant cette arme. De plus lors d''un jet de vitesse, la vitesse augmente 5. En supplément, les jets d''ACC augmente de 5.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Rondache en Aucellum');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Rondache en Aucellum', 'Arme', 3, 1, 'Gros bouclier en Aucellum, protège une bonne partie du corps, est difficile à manier mais étonnamment légère.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Rondache en Tungstène');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Rondache en Tungstène', 'Arme', 2, 1, 'Grand bouclier circulaire en métal, parfait pour se défendre d''un grosse attaque de flamme. Faites cependant attention à son poids !' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Bocle en Acier');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Bocle en Acier', 'Arme', 1, 1, '' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Arbalète');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Arbalète', 'Arme', 1, 2, 'Arme utilisant des carreaux, infligeant des dégâts ignorant la défense si celui-ci touche. 100+(cap20*10).' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Arc en Bois');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Arc en Bois', 'Arme', 1, 2, 'Arme en bois permettant d''utilisé des flèches. Les dégâts sont proportionnels à la force de l''utilisateur.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Couteaux de Lancer en Acier');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Couteaux de Lancer en Acier', 'Arme', 1, 1, 'Couteau de lancer en Acier classique, permet d''effectuer des attaques à distance avec un jet de précision. Peuvent infliger un saignement.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Carquois');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Carquois', 'Munitions', 1, 0, 'Carquois en cuir pouvant accueillir une vingtaine de flèches.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Flèches en Acier');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Flèches en Acier', 'Munitions', 1, 0, '' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Flèches en Aucellum');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Flèches en Aucellum', 'Munitions', 3, 0, 'Flèches rapides et légères, augmente la précision de 10 lors de l''utilisation de ces flèches.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Flèches en bois');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Flèches en bois', 'Munitions', 1, 0, '' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Pointes de flèche');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Pointes de flèche', 'Munitions', 1, 0, 'Ce sont des pointes de flèches en métal. Il y a une encoche pour y fourrer un bâton.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Carreaux');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Carreaux', 'Munitions', 1, 0, '' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Carreaux en Acier');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Carreaux en Acier', 'Munitions', 1, 0, '' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Carreaux en Aucellum');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Carreaux en Aucellum', 'Munitions', 3, 0, 'Augmente la précision des tirs à l''arbalète de 10 points.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Fiole d''Huile');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Fiole d''Huile', 'Munitions', 1, 1, '' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Fiole vide');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Fiole vide', 'Fiole', 1, 1, 'Fiole contenant un flux à utiliser.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Fiole de Feu');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Fiole de Feu', 'Fiole', 2, 1, 'Fiole contenant un flux à utiliser.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Fiole de Feu Ardent');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Fiole de Feu Ardent', 'Fiole', 5, 1, 'Fiole contenant un flux à utiliser.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Fiole de Gaz');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Fiole de Gaz', 'Fiole', 2, 1, 'Fiole contenant un flux à utiliser.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Fiole d''Eau');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Fiole d''Eau', 'Fiole', 2, 1, 'Fiole contenant un flux à utiliser.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Fiole d''Éclairs');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Fiole d''Éclairs', 'Fiole', 3, 1, 'Fiole contenant un flux à utiliser.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Fiole de Brouillard');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Fiole de Brouillard', 'Fiole', 2, 1, 'Fiole contenant un flux à utiliser.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Fiole de Glace');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Fiole de Glace', 'Fiole', 3, 1, 'Fiole contenant un flux à utiliser.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Fiole de Lumière');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Fiole de Lumière', 'Fiole', 5, 1, 'Fiole contenant un flux à utiliser.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Fiole de Force Pure');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Fiole de Force Pure', 'Fiole', 1, 1, 'Fiole contenant un flux à utiliser.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Fiole de Torrent');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Fiole de Torrent', 'Fiole', 4, 1, 'Fiole contenant un flux à utiliser.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Fiole de Tempête');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Fiole de Tempête', 'Fiole', 4, 1, 'Fiole contenant un flux à utiliser.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Fiole de Farine');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Fiole de Farine', 'Fiole', 3, 1, 'Fiole contenant un flux à utiliser.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Fiole de Terre');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Fiole de Terre', 'Fiole', 3, 1, 'Fiole contenant un flux à utiliser.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Fiole de Somnifère');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Fiole de Somnifère', 'Fiole', 2, 1, 'Fiole contenant un flux à utiliser.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Fouet en cuir de porc');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Fouet en cuir de porc', 'Outil', 1, 1, 'Il s''agit d''un fouet en cuir, il frappe fort mais nécessite beaucoup d''espace et de maîtrise pour l''utiliser.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Outils de couture');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Outils de couture', 'Outil', 1, 0, '' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Matériel de Pêche');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Matériel de Pêche', 'Outil', 1, 1, '' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Couteau de Trappeur');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Couteau de Trappeur', 'Outil', 1, 0, '' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Set de campement + Couette');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Set de campement + Couette', 'Outil', 1, 1, 'Kit permettant de poser une tente et dormir, couvert. Une seule place !' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Boîte à Zérisson');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Boîte à Zérisson', 'Outil', 1, 1, 'Petite boîte en métal avec une grille amovible sur le dessus. Permet d''empêcher les Zérissons de creuser pour s''échapper. Coûte stupidement cher.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Gant pour Zérisson');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Gant pour Zérisson', 'Outil', 2, 1, 'Gant pour capturer les Zérissons en cuir dur avec plusieurs couche. Semble poisseux.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Corde de 2 mètres');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Corde de 2 mètres', 'Outil', 1, 1, '' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Corde de 5 mètres');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Corde de 5 mètres', 'Outil', 1, 1, '' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Corde de 10 mètres');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Corde de 10 mètres', 'Outil', 1, 1, '' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Silex et Fer');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Silex et Fer', 'Outil', 1, 0, 'Permet de faire des étincelles et du feu. Ou d''ouvrir un portail interdimensionnelle vers les enfers. Au choix.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Trousse de Soin');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Trousse de Soin', 'Outil', 1, 1, 'Petite trousse en cuir qui permet de transporter des bandages, un peu d''alcool, un rasoir et une petite lame.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Lanterne de Flux');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Lanterne de Flux', 'Outil', 2, 1, 'Lanterne de flux qui brille de mille éclats pendant un certain temps.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Raquettes à Neige');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Raquettes à Neige', 'Outil', 1, 1, 'Outil en bois pour marcher dans la neige sans s''enfoncer.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Outils pour tailler le bois');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Outils pour tailler le bois', 'Outil', 1, 1, '' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Chausses-trappes');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Chausses-trappes', 'Outil', 1, 0, '' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Cape en coton vert sombre');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Cape en coton vert sombre', 'Outil', 1, 1, 'Cape de camouflage vert foncé. Augmente la furtivité de 5 et cache l''identité.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Appâts');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Appâts', 'Matériaux', 1, 0, '' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Ficelle de couture');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Ficelle de couture', 'Matériaux', 1, 0, '' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Petit Bois');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Petit Bois', 'Matériaux', 1, 1, '' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Boule d''engeance');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Boule d''engeance', 'Matériaux', 1, 1, '' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Bouteille de vin');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Bouteille de vin', 'Nourriture', 1, 1, '' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Ration de nourriture (viande)');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Ration de nourriture (viande)', 'Nourriture', 1, 0, '' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Canasson');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Canasson', 'Animal', 1, 0, 'Galopin divisant par 2 le temps de trajet.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Sac de nourriture');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Sac de nourriture', 'Sac', 1, 1, 'Permet de transporter une dizaine d''ingrédients en prenant un emplacement d''inventaire. Bon appétit !' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Sac à Bandoulière');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Sac à Bandoulière', 'Sac', 1, -3, 'Un sac qui permet de transporter trois fioles de flux, parfait pour les apprentis alchimistes !' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Chariot');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Chariot', 'Important', 2, -3, 'Permet de transporter 3 emplacements supplémentaires sur un cheval.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Badge de la Guilde des Chasseurs');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Badge de la Guilde des Chasseurs', 'Autre', 1, 0, 'Badge approuvant votre appartenance à la guilde des chasseurs.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Vessie remplit d''alcool');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Vessie remplit d''alcool', 'Autre', 1, 0, 'Vessie remplit d''un alcool fort.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Vin empoisonné');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Vin empoisonné', 'Autre', 4, 1, 'Un fin cru mortel, parfait pour appâter les riches imprudents.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Boullier');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Boullier', 'Autre', 1, 1, 'Un objet pratique pour compter les choses.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Coque');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Coque', 'Autre', 1, 0, 'Protège les couilles.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Dés');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Dés', 'Autre', 1, 0, '' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Flûte');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Flûte', 'Autre', 1, 1, 'Une flute !' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Luth Super Léger');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Luth Super Léger', 'Autre', 2, 0, 'Objet permettant de jouer de la musique, il est super léger et ne prends pas de place.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Dictionnaire d''Artrish IV à Artrish I');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Dictionnaire d''Artrish IV à Artrish I', 'Autre', 2, 1, 'Livre avec les informations indiqués dans le titre. Demander au MJ des informations.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Livre sur l''Amélioration de son Flux');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Livre sur l''Amélioration de son Flux', 'Autre', 3, 1, 'Livre avec les informations indiqués dans le titre. Demander au MJ des informations.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Manteau en fourrure');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Manteau en fourrure', 'Autre', 1, 1, 'Il fait bon, il fait chaud, des cubes à perte de vue.' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Manteau en Lin');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Manteau en Lin', 'Autre', 1, 1, '' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Écharpe en Laine');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Écharpe en Laine', 'Autre', 3, 0, '' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Cape en Coton Noir');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Cape en Coton Noir', 'Autre', 1, 1, '' FROM DUAL WHERE @ok;

SET @ok := NOT EXISTS (SELECT 1 FROM `lf_v1_items` WHERE `name` = 'Fedora d''exception');
INSERT INTO `items` (`name`, `category`, `rarity`, `weight`, `description`)
SELECT 'Fedora d''exception', 'Autre', 1, 1, 'Chapeau de luxe, somptueux et élégant, si masculin et féminin à la fois. Il est de couleur noir et rouge.' FROM DUAL WHERE @ok;


-- ─── Compétences (50) ──────────────────────────────────────────────────────────

INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Précision', 30, 'Classe d''archerie', 'Vous pouvez utilisez des armes de précision.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Classe d''archerie');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Précision', 50, 'Visière invisible', 'Retire tous les malus de précision lié au port d''un casque.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Visière invisible');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Précision', 60, 'Gâchette', 'Une fois par combat, vous pouvez augmentez le jet de précision de 10. (Avant le jet)' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Gâchette');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Précision', 70, 'Longue Inspiration', 'Hors-Combat, les jets de précisions sont mis à 90. (sauf si vous avez plus de base)' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Longue Inspiration');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Précision', 80, 'Sniper', 'À moins que l''adversaire est une vitesse supérieur à 65, aucun jet d''esquive n''aura lieu (sauf cas exceptionnel).' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Sniper');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Charisme', 30, 'Super Seducer', 'Vous pouvez tenter de séduire avec votre charisme les personnages.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Super Seducer');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Charisme', 50, 'Gold Digging', 'Dans une boutique, vous pouvez tenter une fois de temps en temps de gratter un geste commercial.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Gold Digging');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Charisme', 60, 'Intimidation', 'Permet d''intimider les individus ayant un charisme inférieur au tien (avec un jet de dé).' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Intimidation');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Charisme', 70, 'Mimique', 'Permet de changer son attitude pour mieux entrer dans le moule de la zone et ne pas attirer l''attention.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Mimique');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Défense', 30, 'En garde !', 'Vous pouvez vous mettre en position défensive, cela permet de potentiellement réduire les dégâts reçus voire les bloquer si vous posséder un bouclier.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'En garde !');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Défense', 40, 'Formation Tortue, avec les petites pattes.', 'La maîtrise des boucliers augmentent, vous pouvez désormais bloquer intégralement certains coups !' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Formation Tortue, avec les petites pattes.');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Défense', 50, 'Sate sate sate...', 'Vous pouvez tenter désarmer votre adversaire en utilisant votre arme.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Sate sate sate...');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Défense', 60, 'Toujours prêt', 'Vous permet de vous mettre en position défensive même en dehors de votre tour.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Toujours prêt');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Défense', 70, 'Abdos d''Ours', 'Vous permet de bloquer l''arme d''un adversaire s''il la plante en vous.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Abdos d''Ours');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Défense', 80, 'Protège Talon', 'Vous ne recevez plus de dégâts supplémentaires sur vos points faibles' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Protège Talon');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Éloquence', 30, 'Le Mercator', 'Vous pouvez tenter de négocier le prix d''un objet. Rien n''empêche le prix de monter. Une fois les négociations fini, vous êtes obligés d''acheter l''objet.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Le Mercator');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Éloquence', 45, 'Corruption', 'Permet de donner de l''argent aux personnes pour obtenir de petit service (détourner le regard, acheter leur opinion etc...) la somme varie sur un jet de dé.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Corruption');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Éloquence', 60, 'Erwin Smith', 'En combat, vous pouvez utiliser votre action d''attaque pour faire un cri de guerre qui augmente la force de toutes les troupes alliés. Une fois par combat uniquement et sans jet de dé.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Erwin Smith');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Éloquence', 80, 'Fabien Olicard', 'Vous êtes capable de déceler le mensonge chez une personne ayant une éloquence inférieur à 60.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Fabien Olicard');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Endurance', 800, 'Réserve de graisse', 'Vous ne perdez plus toute votre Endurance après un entraînement, seulement 800.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Réserve de graisse');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Endurance', 1600, 'Monster', 'Vous pouvez effectuer deux entraînements par jour. Vous serez cependant complètement à sec.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Monster');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Force', 20, 'Votre inventaire est plein !', 'Tous les 20 points de force, vous gagnez un emplacement d''inventaire.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Votre inventaire est plein !');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Force', 25, 'Métaux Solides', 'Vous permet de manier des outils, des armes et des armures en Acier, Fer ou Cuivre.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Métaux Solides');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Force', 40, 'Métaux Lourd', 'Vous permet de manier des outils, des armes et des armures en Tungstène ou en Fabuliath.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Métaux Lourd');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Force', 50, 'Métal Indestructible', 'Vous permet de manier des outils, des armes et des armures en Iridium.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Métal Indestructible');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Force', 60, 'Comme un gant', 'Vous ne recevez plus aucun malus de vitesse lié au port d''armure lourde.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Comme un gant');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Force', 70, 'Ambidextre', 'Vous permet d''équipez certaines armes à deux mains, sur une seule main. Cependant vous ne pourrez pas porter deux armes à deux mains simultanément. De surcroit, elles ne prennent plus qu''une seule place d''inventaire.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Ambidextre');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Force', 80, 'Barbare… J''ai dit BARBARE !', 'Vous pouvez équipez n''importe quelle arme à deux mains sur une main. Oui, même une dans la menotte droite et une autre dans la gauche.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Barbare… J''ai dit BARBARE !');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Furtivité', 40, 'Je suis le traître', 'Vous pouvez tenter d''effectuer n''importe quelle action dans le dos de vos camarades en envoyant un message privé au MJ, cela ajoute un jet de furtivité EN PLUS du jet de l''action.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Je suis le traître');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Furtivité', 50, 'Douce main', 'Voler des objets à un individu est une chose que vous pouvez envisager. Un tel pouvoir implique de grandes responsabilités, faites attention. (Un jet de Précision peut-être demandé en fonction de l''objet et la manière de voler).' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Douce main');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Furtivité', 60, 'Pas Légers', 'S''il y a des pièges simples au sol, tu ne les enclenches pas en marchant dessus.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Pas Légers');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Intelligence', 25, 'Alphabétisation', 'Vous savez lire. C''est déjà un bon début.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Alphabétisation');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Intelligence', 40, 'Mémoire sélective', 'Vous pouvez tenter un jet de dés pour avoir une information que vous avez déjà eu. En cas de perte de mémoire...' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Mémoire sélective');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Intelligence', 60, '...---...', 'Vous pouvez un jet de dés pour avoir l''aide du MJ sur une situation.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = '...---...');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Intelligence', 80, 'Encyclopédie', 'Vous pouvez demander une information au MJ sans jet de dés, cependant certaines informations peuvent être refusées.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Encyclopédie');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Maîtrise', 30, 'Fioleur Fou', 'Vous pouvez enclencher des fioles de flux une fois que vous les avez brisées.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Fioleur Fou');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Maîtrise', 50, 'Radar Magique', 'Vous permet de lancer une détection de flux autour de vous, cela permet de détecter les fortes présences de flux qui ne sont pas camouflées. Un jet de perception sera cependant requis pour valider la réussite de la compétence.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Radar Magique');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Maîtrise', 60, 'Éveil', 'Cette compétence diffère entre chaque joueur, demander au MJ pour plus d''information.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Éveil');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Maîtrise', 80, 'Flux Brouillant', 'Créé des interférences avec son flux, ce qui permet d''empêcher que toutes personnes autour d''elle soit détectable.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Flux Brouillant');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Maîtrise', 90, 'Flux Pur', 'Permet d''utiliser le flux pur. Consomme énormément de flux et inflige d''énormes dégâts aussi bien à l''adversaire qu''à soi-même, utilisable qu''au Corps à Corps. (N''utilise aucun jet)' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Flux Pur');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Perception', 40, 'Geoguessr', 'Vous avez un excellent sens de l''orientation, vous n''avez pas besoin de répéter pour vous rendre au endroit que vous avez déjà visité.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Geoguessr');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Perception', 50, 'Chasseur Nocturne', 'Le nuit ne pose plus de malus aux jets de Perception.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Chasseur Nocturne');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Perception', 60, 'Lunette Naturelle', 'Augmente la précision sur les jets de dés d''armes à distances.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Lunette Naturelle');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Perception', 70, 'Instinct Primaire', 'Tu es capable de détecter le danger avant qu''il arrive.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Instinct Primaire');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Vitesse', 30, 'Roulade', 'Vous permet d''effectuer l''action Esquive en combat.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Roulade');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Vitesse', 40, 'Jump !', 'Vous pouvez franchir des obstacles simples sur le terrain (un buisson par exemple).' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Jump !');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Vitesse', 50, 'CS08', 'Vous permet d''utilisez les obstacles complexes en combat. (Grimper un arbre par exemple)' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'CS08');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Vitesse', 60, 'B-Hop', 'Vous pouvez effectuer deux actions de mouvement en combat.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'B-Hop');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Vitesse', 70, 'Usain Bolt', 'Vous galopez aussi vite qu''un cheval à pied. Vous divisez par deux le temps de vos voyages à pied.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'Usain Bolt');
INSERT INTO `skills` (`statistics`, `level`, `name`, `description`)
SELECT 'Vitesse', 80, 'D''une pierre deux coups', 'Si l''adversaire possède moins de 60 VIT, vous pouvez effectuer deux actions d''attaques.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_skills` WHERE `name` = 'D''une pierre deux coups');

-- ─── Compétences de badges (62) : badge de stat V1 -> badge du dragon de la stat ───

-- MDF Drii · FOR Pura · DEF Aqua · VIT Lada · ACC Chronos · END Goliath
-- PER Pestia · FUR Shizari · CHA Artrish · ELO Yinva · INT Guizamark
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Drii:Drii', 'Maîtrise + Maîtrise', 'Augmente la Maîtrise de 10%' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Drii:Drii', 'Drii:Drii'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Drii:Pura', 'Maîtrise + Force', 'Vous pouvez booster vos attaques avec votre flux et attaquer en même temps, en une seule action.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Drii:Pura', 'Pura:Drii'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Aqua:Drii', 'Maîtrise + Défense', 'Vous pouvez générer un bouclier de flux qui consommera du flux et qui réduira les dégâts liés aux flux.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Aqua:Drii', 'Drii:Aqua'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Drii:Lada', 'Maîtrise + Vitesse', 'Vous pouvez doubler votre consommation de flux pour remplacer un cast.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Drii:Lada', 'Lada:Drii'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Chronos:Drii', 'Maîtrise + Précision', 'Vous pouvez désormais mettre du flux en fiole.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Chronos:Drii', 'Drii:Chronos'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Drii:Goliath', 'Maîtrise + Endurance', 'Les attaques de MDF ne consomme désormais plus d''endurance.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Drii:Goliath', 'Goliath:Drii'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Drii:Pestia', 'Maîtrise + Perception', 'Vous pouvez obtenir la stats de MDF de l''individu scanné par une détection de flux.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Drii:Pestia', 'Pestia:Drii'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Drii:Shizari', 'Maîtrise + Furtivité', 'Vous pouvez effectuer un camouflage de flux, permettant de cacher votre véritable puissance.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Drii:Shizari', 'Shizari:Drii'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Artrish:Drii', 'Maîtrise + Charisme', 'Vous pouvez intimider un individu en utilisant votre flux.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Artrish:Drii', 'Drii:Artrish'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Drii:Yinva', 'Maîtrise + Éloquence', 'Vous êtes capable de manipuler un individu pour qu''il vous dévoile son flux.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Drii:Yinva', 'Yinva:Drii'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Drii:Guizamark', 'Maîtrise + Intelligence', 'Vous connaissez toutes les informations concernant les compétences de MDF, de plus vous récupérer un jeton MDF. (Les informations reçues doivent restées confidentielles)' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Drii:Guizamark', 'Guizamark:Drii'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Pura:Pura', 'Force + Force', 'Augmente la Force de 10%' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Pura:Pura', 'Pura:Pura'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Aqua:Pura', 'Force + Défense', 'Lors d''une situation de blocage ou de parade avec un bouclier, vous pouvez enchaîner sur une contre-attaque physique.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Aqua:Pura', 'Pura:Aqua'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Lada:Pura', 'Force + Vitesse', 'Lors d''une contre-attaque, vous taper avant votre adversaire, ce qui vous permets de potentiellement de nullifier l''attaque de la cible. Soyez réactif cependant.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Lada:Pura', 'Pura:Lada'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Chronos:Pura', 'Force + Précision', 'Grâce à votre dextérité, lorsque vous frapperez un adversaire vous saurez les dégâts que vous lui infligez.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Chronos:Pura', 'Pura:Chronos'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Goliath:Pura', 'Force + Endurance', 'Vous pouvez jauger votre endurance pour mettre des coups plus puissants.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Goliath:Pura', 'Pura:Goliath'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Pestia:Pura', 'Force + Perception', 'Vous pouvez déterminer la stats de FOR des individus observés, de plus vous êtes imbattable au jeu du regard.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Pestia:Pura', 'Pura:Pestia'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Pura:Shizari', 'Force + Furtivité', 'Les charges lourdes ne baisse pas votre furtivité.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Pura:Shizari', 'Shizari:Pura'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Artrish:Pura', 'Force + Charisme', 'Vous pouvez intimider un individu juste avec votre prestance.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Artrish:Pura', 'Pura:Artrish'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Pura:Yinva', 'Force + Éloquence', 'Vous pouvez crier tellement fort que vous pouvez effrayer vos adversaires pour les empêcher de vous attaquer pendant un tour. (Un cri par jour)' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Pura:Yinva', 'Yinva:Pura'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Guizamark:Pura', 'Force + Intelligence', 'Vous connaissez toutes les informations concernant les compétences de FOR, de plus vous récupérer un jeton FOR. (Les informations reçues doivent restées confidentielles)' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Guizamark:Pura', 'Pura:Guizamark'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Aqua:Aqua', 'Défense + Défense', 'Augmente la Défense de 10%' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Aqua:Aqua', 'Aqua:Aqua'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Aqua:Lada', 'Défense + Vitesse', 'Lorsque vous bloquez un coup avec votre bouclier alors que vous êtes en garde, vous ne consommerez pas votre action, mais de l''endurance à la place.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Aqua:Lada', 'Lada:Aqua'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Aqua:Chronos', 'Défense + Précision', 'Lorsque vous combattez un adversaire, vous pouvez déterminer sa DEF en le frappant et sa FOR en recevant des coups.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Aqua:Chronos', 'Chronos:Aqua'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Aqua:Goliath', 'Défense + Endurance', 'Vous pouvez consommer de l''endurance à la place de la santé lorsque vous recevez des coups mortels.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Aqua:Goliath', 'Goliath:Aqua'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Aqua:Pestia', 'Défense + Perception', 'Vous pouvez déterminer les points faibles des adversaires d''un simple coup d''oeil.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Aqua:Pestia', 'Pestia:Aqua'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Aqua:Shizari', 'Défense + Furtivité', 'Vous pouvez camoufler votre armure sous un manteau, dangereux dans les zones chaudes.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Aqua:Shizari', 'Shizari:Aqua'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Aqua:Artrish', 'Défense + Charisme', 'Les armures et armes d''apparat ne possèdent aucun malus lié au fait qu''il soit d''apparat.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Aqua:Artrish', 'Artrish:Aqua'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Aqua:Yinva', 'Défense + Éloquence', 'Vous n''avez plus besoin de jet d''Éloquence pour mentir éhontément à un PNJ.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Aqua:Yinva', 'Yinva:Aqua'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Aqua:Guizamark', 'Défense + Intelligence', 'Vous connaissez toutes les informations concernant les compétences de DEF, de plus vous récupérer un jeton DEF. (Les informations reçues doivent restées confidentielles)' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Aqua:Guizamark', 'Guizamark:Aqua'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Lada:Lada', 'Vitesse + Vitesse', 'Augmente la Vitesse de 10%' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Lada:Lada', 'Lada:Lada'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Chronos:Lada', 'Vitesse + Précision', 'Vous pouvez recharger et tirer avec votre arbalète dans le même tour désormais. De plus, si elle est déjà chargée, vous pouvez tirer en consommant de l''endurance plutôt que votre action.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Chronos:Lada', 'Lada:Chronos'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Goliath:Lada', 'Vitesse + Endurance', 'Les mouvements et les esquives ne consomment plus d''endurance.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Goliath:Lada', 'Lada:Goliath'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Lada:Pestia', 'Vitesse + Perception', 'Vous pouvez déterminer la stats de VIT de l''individu observé.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Lada:Pestia', 'Pestia:Lada'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Lada:Shizari', 'Vitesse + Furtivité', 'Vous êtes discret sur toutes les compétences de VIT.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Lada:Shizari', 'Shizari:Lada'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Artrish:Lada', 'Vitesse + Charisme', 'Votre première impression est meilleurs, et vous êtes meilleurs en drague.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Artrish:Lada', 'Lada:Artrish'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Lada:Yinva', 'Vitesse + Éloquence', 'Vous n''avez pas besoin d''expliquer quelques choses, vous pouvez juste dire "Je fais mon rapport de mission" et ce sera bon.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Lada:Yinva', 'Yinva:Lada'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Guizamark:Lada', 'Vitesse + Intelligence', 'Vous connaissez toutes les informations concernant les compétences de VIT, de plus vous récupérer un jeton VIT. (Les informations reçues doivent restées confidentielles)' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Guizamark:Lada', 'Lada:Guizamark'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Chronos:Chronos', 'Précision + Précision', 'Augmente la Précision de 10%' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Chronos:Chronos', 'Chronos:Chronos'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Chronos:Goliath', 'Précision + Endurance', 'Vous pouvez demander au MJ votre endurance en combat.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Chronos:Goliath', 'Goliath:Chronos'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Chronos:Pestia', 'Précision + Perception', 'Votre voyez d''absurdement loin.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Chronos:Pestia', 'Pestia:Chronos'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Chronos:Shizari', 'Précision + Furtivité', 'Les individus ne peuvent pas déterminer d''où vienne vos tirs réussis.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Chronos:Shizari', 'Shizari:Chronos'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Artrish:Chronos', 'Précision + Charisme', 'Vous êtes capable d''effectuer des feintes, en plus d''être meilleur en danse, en utilisant une feite vous pouvez esquiver ou attaquer de manière subtile.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Artrish:Chronos', 'Chronos:Artrish'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Chronos:Yinva', 'Précision + Éloquence', 'Vous pouvez stocker des munitions dans votre bouche et les recracher sur vos adversaires quand ils sont proche. Pensez à les retirer à la fin des combats, ça peut-être dangereux.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Chronos:Yinva', 'Yinva:Chronos'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Chronos:Guizamark', 'Précision + Intelligence', 'Vous connaissez toutes les informations concernant les compétences de ACC, de plus vous récupérer un jeton ACC. (Les informations reçues doivent restées confidentielles)' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Chronos:Guizamark', 'Guizamark:Chronos'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Goliath:Pestia', 'Endurance + Perception', 'Vous pouvez avoir accès aux points de vie d''un adversaire que vous voyez très bien (soit en étant très proche, soit grâce à une compétence).' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Goliath:Pestia', 'Pestia:Goliath'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Goliath:Shizari', 'Endurance + Furtivité', 'Vous pouvez vous maintenir en furtivité pendant un temps rallongé, sans consommer d''Endurance.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Goliath:Shizari', 'Shizari:Goliath'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Pestia:Pestia', 'Perception + Perception', 'Augmente la Perception de 15%' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Pestia:Pestia', 'Pestia:Pestia'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Pestia:Shizari', 'Perception + Furtivité', 'De part vos compétences de furtivité, vous connaissez les bonnes cachettes et repérer plus facilement les cachettes et les cachés.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Pestia:Shizari', 'Shizari:Pestia'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Artrish:Pestia', 'Perception + Charisme', 'Vous êtes capable de percevoir si les individus que vous côtoyer possède une attirance quelconque pour vous, où pour autrui.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Artrish:Pestia', 'Pestia:Artrish'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Pestia:Yinva', 'Perception + Éloquence', 'Vous pouvez insulter un individu sur un défaut de son physique, cela inflige des dégâts. La vérité blesse vraiment.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Pestia:Yinva', 'Yinva:Pestia'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Guizamark:Pestia', 'Perception + Intelligence', 'Vous connaissez toutes les informations concernant les compétences de PER, de plus vous récupérer un jeton PER. (Les informations reçues doivent restées confidentielles)' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Guizamark:Pestia', 'Pestia:Guizamark'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Shizari:Shizari', 'Furtivité + Furtivité', 'Augmente la Furtivité de 15%' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Shizari:Shizari', 'Shizari:Shizari'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Artrish:Shizari', 'Furtivité + Charisme', 'Vous devenez un prestidigitateur d''exeption, vous pouvez attirer l''attention du monde sur vous pour augmenter la furtivité de vos camarades.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Artrish:Shizari', 'Shizari:Artrish'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Shizari:Yinva', 'Furtivité + Éloquence', 'Vous pouvez parler en toute discrétion sans avoir besoin de faire de jet de furtivité.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Shizari:Yinva', 'Yinva:Shizari'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Guizamark:Shizari', 'Furtivité + Intelligence', 'Vous connaissez toutes les informations concernant les compétences de FUR, de plus vous récupérer un jeton FUR. (Les informations reçues doivent restées confidentielles)' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Guizamark:Shizari', 'Shizari:Guizamark'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Artrish:Artrish', 'Charisme + Charisme', 'Augmente le Charisme de 15%' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Artrish:Artrish', 'Artrish:Artrish'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Artrish:Yinva', 'Charisme + Éloquence', 'Vous êtes le commerçant ultime, pour tout achat effectué POUR VOUS, vous réduisez le prix de 10%.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Artrish:Yinva', 'Yinva:Artrish'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Artrish:Guizamark', 'Charisme + Intelligence', 'Vous connaissez toutes les informations concernant les compétences de CHA, de plus vous récupérer un jeton CHA. (Les informations reçues doivent restées confidentielles)' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Artrish:Guizamark', 'Guizamark:Artrish'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Yinva:Yinva', 'Éloquence + Éloquence', 'Augmente l''Éloquence de 15%' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Yinva:Yinva', 'Yinva:Yinva'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Guizamark:Yinva', 'Éloquence + Intelligence', 'Vous connaissez toutes les informations concernant les compétences de ELO, de plus vous récupérer un jeton ELO. (Les informations reçues doivent restées confidentielles)' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Guizamark:Yinva', 'Yinva:Guizamark'));
INSERT INTO `badges` (`badges`, `name`, `description`)
SELECT 'Guizamark:Guizamark', 'Intelligence + Intelligence', 'Augmente l''Intelligence de 15%' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_badges` WHERE `badges` IN ('Guizamark:Guizamark', 'Guizamark:Guizamark'));

-- ─── Aliments (43) ─────────────────────────────────────────────────────────────

INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Blé', 'rations', 1, 4 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Blé');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Maïs', 'rations', 1, 4 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Maïs');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Lentilles', 'rations', 1, 4 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Lentilles');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Haricots', 'rations', 1, 4 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Haricots');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Pain', 'rations', 1, 4 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Pain');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Riz', 'rations', 1, 8 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Riz');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Choux', 'fruits', 1, 4 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Choux');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Carottes', 'fruits', 1, 4 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Carottes');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Navets', 'fruits', 1, 5 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Navets');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Betteraves', 'fruits', 1, 4 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Betteraves');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Laitues', 'fruits', 1, 4 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Laitues');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Oignon', 'fruits', 1, 4 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Oignon');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Épinards', 'fruits', 1, 3 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Épinards');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Pomme', 'fruits', 1, 5 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Pomme');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Poire', 'fruits', 1, 8 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Poire');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Cerises', 'fruits', 1, 8 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Cerises');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Baies', 'fruits', 1, 4 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Baies');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Figue', 'fruits', 1, 8 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Figue');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Dattes', 'fruits', 1, 8 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Dattes');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Prune', 'fruits', 1, 8 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Prune');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Pomme Séchée', 'fruits', 1, 2 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Pomme Séchée');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Poire Séchée', 'fruits', 1, 4 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Poire Séchée');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Cerises Séchées', 'fruits', 1, 4 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Cerises Séchées');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Baies Séchées', 'fruits', 1, 2 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Baies Séchées');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Figue Séchée', 'fruits', 1, 4 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Figue Séchée');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Dattes Séchées', 'fruits', 1, 4 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Dattes Séchées');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Prune Séchée', 'fruits', 1, 4 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Prune Séchée');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Venaison', 'viandes', 1, 10 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Venaison');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Faisan', 'viandes', 1, 10 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Faisan');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Porc', 'viandes', 1, 10 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Porc');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Boeuf', 'viandes', 1, 10 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Boeuf');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Volaille', 'viandes', 1, 10 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Volaille');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Thon', 'viandes', 1, 10 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Thon');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Truite', 'viandes', 1, 10 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Truite');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Brochet', 'viandes', 1, 10 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Brochet');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Oeufs', 'viandes', 1, 10 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Oeufs');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Fromage', 'viandes', 1, 5 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Fromage');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Lait', 'boissons', 1, 2 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Lait');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Beurre', 'viandes', 1, 3 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Beurre');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Crème', 'viandes', 1, 3 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Crème');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Ration de nourriture', 'rations', 1, 8 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Ration de nourriture');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Soupe en Bouteille', 'rations', 1, 5 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Soupe en Bouteille');
INSERT INTO `foods` (`name`, `type`, `weight`, `price`)
SELECT 'Nourritures avariées', 'rations', 1, 10 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `lf_v1_foods` WHERE `name` = 'Nourritures avariées');

-- ─── Fin ───────────────────────────────────────────────────────────────────────

DROP TEMPORARY TABLE `lf_v1_characters`, `lf_v1_monsters`, `lf_v1_items`, `lf_v1_skills`, `lf_v1_badges`, `lf_v1_foods`;
COMMIT;

SELECT
  (SELECT COUNT(*) FROM `characters`) AS `personnages`,
  (SELECT COUNT(*) FROM `monsters`) AS `monstres`,
  (SELECT COUNT(*) FROM `items`) AS `objets`,
  (SELECT COUNT(*) FROM `armors`) AS `armures`,
  (SELECT COUNT(*) FROM `skills`) AS `competences`,
  (SELECT COUNT(*) FROM `badges`) AS `badges`,
  (SELECT COUNT(*) FROM `foods`) AS `aliments`;
