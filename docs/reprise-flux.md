# Don de flux (/flux) : note de reprise

Note laissée le 2026-11-04 pour reprendre le travail sur `/flux` dans une nouvelle session, **sans accès à la V1 PHP**. Tout ce qu'il fallait de la V1 est soit déjà porté dans le code, soit recopié ici (section « Reste à faire »).

Branche : `feat/flux-decouverte`. Pas encore fusionnée. Suite du travail (plein écran, nouveau parcours 3D, certificat) sur `claude/happy-euler-3wvc0w`, partie de cette branche.

## Le parcours, de bout en bout

1. **Constellation** : toucher les 11 dragons dans l'ordre de la Genèse. Le serveur vérifie chaque clic ; après un premier échec, des indices apparaissent un à un.
2. **Voyage** : à la réussite, les icônes des dragons volent jusqu'à leur symbole sur la carte du monde.
3. **Carte**, plein écran (titre et boutons flottent par-dessus) : Augeaime et Vulcain sont donnés ; il faut deviner Saxifra, Irisia, Mudan, Edenia, Amari, chacun d'après une fleur. En paysage, la carte tient entière dans l'écran ; en portrait, elle garde de la hauteur et défile de côté, et la fiche d'un pays monte du bas de l'écran sur téléphone.
4. **Portails** (une fois les 7 terres connues) : Humain, Géant, Éternelle, le symbole du peuple en filigrane sur toute la porte. Un clic ouvre, par-dessus les portes, une phrase avec « Revenir en arrière » / « Franchir le portail ». Franchir : les deux battants pivotent vers l'intérieur, la lumière se découvre, puis le portail grandit jusqu'à remplir l'écran.
5. **Test de flux en 3D**, plein écran : la question apparaît seule au centre puis monte ; les réponses flottent en arc de part et d'autre d'un noyau de flux (le noyau tend un rayon vers la réponse survolée). La réponse choisie est aspirée par le noyau, puis on plonge à travers lui (étoiles en traînées) ; la question suivante naît pendant que la plongée ralentit (environ 1,8 s entre deux questions). Avancée : une barre de 25 segments (le dernier allumé jaillit), et le flux grandit à chaque réponse (plus d'étoiles, noyau plus grand et plus vif). Touches 1 à 6 pour répondre.
6. **Résultat (certificat)** : citation du dragon, flux, description, prénoms possibles (et une note pour les géants), puis les 13 stats qui défilent 4 s avant de se figer, le pentagone de potentiel et la puissance totale.

La page `/flux` est affichée sans le header du site (`src/routes/+layout.svelte`, comme l'accueil) ; un lien « Last Fragment » en haut à gauche ramène au site, sauf pendant le test.

Toute la progression reste dans le navigateur (`localStorage`, clé `flux_decouverte`) : **choix du porteur du projet, rien en base**. Seule la vérification des énigmes passe par le serveur.

## Où est quoi

| Fichier | Rôle |
|---|---|
| `src/routes/flux/+page.svelte` | Orchestration des étapes, lecture/écriture du localStorage, voyage des dragons, voile du portail |
| `src/routes/flux/essai/+server.ts` | `POST` qui vérifie une séquence de la constellation ou un nom de pays (limité à 90 requêtes/min par IP) |
| `src/lib/flux/discovery.ts` | Données publiques : positions des dragons (constellation et carte), pays, énigmes florales, type de progression |
| `src/lib/server/flux/discovery.ts` | Secrets : ordre des dragons, indices, noms acceptés et textes révélés des pays |
| `src/lib/flux/races.ts` | Les trois races : couleurs, symboles, phrases |
| `src/lib/flux/maze.ts` | Générateur des traits néon « labyrinthe » des portails |
| `src/lib/flux/quiz-data.ts` | **Données V1** : 25 questions (lettres par réponse), 45 flux (matrice dragon × dragon), citations |
| `src/lib/flux/quiz.ts` | **Calcul V1** du flux (`scoreAnswers`), des stats (`drawStats`), du pentagone (`potential`) et affichage (`revealFlux`) |
| `src/lib/components/flux/` | `Constellation`, `WorldMap`, `Portals`, `FluxJourney` (3D), `FluxResult` |
| `static/flux/carte.webp` | Carte du monde (le symbole de Chronos y a été déplacé à la main) |
| `static/flux/vulcain-masque.webp` | Masque du territoire de Vulcain (motif de fond « Personnages ») |

Tests : `src/lib/flux/quiz.test.ts`, `src/lib/server/flux/discovery.test.ts`.

## Décisions du porteur du projet à respecter

- **Carte** : Saxifra au nord, Irisia au sud, Mudan à l'est, Augeaime au centre, Vulcain au milieu de ces quatre (l'ovale), Edenia (= Paradis) au nord-ouest, Amari au sud-ouest. La bande au sud d'Augeaime est un territoire neutre de montagnes, sans dragon.
- **Dragons sur la carte** : Artrish et Yinva hors des terres, Drii et Chronos à Augeaime (Chronos au sud-ouest), Lada et Pestia à Mudan, Goliath à Saxifra (le point de Saxifra est sur la même terre que son symbole, au nord-ouest du continent central), Guizamark et Shizari à Edenia, Pura à Amari, Aqua dans l'océan entre Augeaime et Edenia.
- **Énigmes** : chaque terre à deviner porte le nom d'une fleur (Iris, Amaryllis, Saxifrage, Oiseau de paradis, Pivoine = mǔdān). Le nom de la fleur comme celui de la terre sont acceptés, avec des variantes (Irys, Irysia…). Les indices sont pensés pour des gens qui **ne connaissent pas** le monde.
- **Constellation** : chaque icône de dragon a autant de sommets que son rang dans la Genèse ; les indices poussent à compter.
- **Vulcain** n'est pas une nation : pas de symbole, rempli du motif de fond des pages Personnages.
- **Portails** : Humain bleu avec le logo du site (« Le Tout ») ; Géant blanc avec les symboles de Saxifra et Irisia ; Éternelle vert, à l'écart, avec Edenia et Mudan. Humain et Géant sont reliés par une lueur bleu clair (un demi-géant peut exister). Fond : motif Personnages + traits néon aléatoires.
- **Le test se lance pour toutes les races**, géants compris (ils n'ont pas de flux : le résultat le dit).
- Ajouter des bibliothèques est accepté quand c'est utile (three.js l'a été).

## À faire valider par le porteur du projet

- Les phrases des portails et la note des géants (`races.ts`) sont de Claude.
- Les textes révélés quand on trouve une terre sont minimaux (« Irisia, la terre du sud. Elle tient son nom de l'iris. »).
- Le nombre de sommets de Pestia (5), Chronos (6) et Aqua (7) a été déduit à l'œil pour les indices.
- La race ne change pas le calcul du flux, seulement la couleur et la note. À confirmer.
- Le défilement des stats du certificat dure 4 s au lieu des 8 s de la V1.

## Certificat (H2) : porté

Logique V1 reprise dans `quiz.ts`, testée dans `quiz.test.ts` :

- **Stats** : lettre × 5 (Maîtrise C, Force I, Défense A, Vitesse G, Précision D, Perception H, Furtivité J, Charisme B, Éloquence K, Intelligence G, QdF F, Santé J, Endurance E), bornées à 20–60, puis ±1 au hasard jusqu'à une puissance globale de 345–355. Le barème de puissance est celui du site (`statPower` dans `$lib/game/stats`, identique à la V1).
- Les stats sont **stockées à l'échelle du site** (QdF et Santé ×30, Endurance ×20), comme dans les fiches, et enregistrées avec le résultat dans le `localStorage` pour ne pas changer au rechargement. Un ancien résultat sans stats n'est plus reconnu : on revient à la carte.
- **Chaos** : stats fixes de la V1, sans bornes ni ajustement.
- **Pentagone** : Leader, Brute, Tank, Assassin, Mage, `floor(100/60 × moyenne)` ; rempli de la couleur du premier dragon (opacité 0,6), contour du second. Les valeurs du Chaos débordent du cadre (plafonnées à 160 %).
- Couleurs : les variables `--Aqua`, `--Chronos`… du site ; Shizari éclairci, Chaos rouge.
- Mise en scène : les stats défilent au hasard toutes les 50 ms pendant **4 s** (8 s dans la V1, raccourci), puis se figent ; le pentagone se déploie depuis son centre.

Non repris : le drapeau « invocateur » de la V1 (calculé, jamais affiché).

## Le parcours 3D (`FluxJourney.svelte`)

L'ancienne version (fil qui se divise) ramait : bloom en post-traitement, tubes recréés à chaque question, état Svelte modifié à chaque image. La nouvelle :

- n'a que deux objets 3D, animés **dans les shaders** : un champ d'étoiles (points + segments pour les traînées) et le noyau (un plan, bruit fractal) ; chaque image ne change que quelques uniformes ;
- pas de post-traitement, pas d'antialiasing, résolution plafonnée à 1,5 et abaissée à 0,75 si les 90 premières images sont lentes ;
- l'interface (question, réponses) est en HTML/CSS par-dessus le canvas : elle marche aussi sans WebGL.

## Pièges rencontrés

- **three.js** : le canvas est transparent, le fond est un dégradé CSS. Les étoiles trop proches de l'axe de la caméra blanchiraient l'écran : elles restent à 1,8 unité au moins de l'axe.
- Les réponses flottent en continu (animation CSS) : avec Playwright, cliquer avec `force: true`, ou utiliser les touches 1 à 6.
- Après l'installation d'une dépendance, Vite répond « 504 Outdated Optimize Dep » : recharger complètement la page.
- Pour tester sans tout refaire : écrire dans `localStorage['flux_decouverte']` un objet `{ constellation: true, found: { saxifra: '…', irisia: '…', mudan: '…', edenia: '…', amari: '…' }, race: 'humain' }` (les descriptions viennent de `POST /flux/essai`). Ajouter `result: { first, second, stats }` pour aller droit au certificat.
- Dans le panneau navigateur masqué, les captures ont souvent un temps de retard : vérifier l'état par le DOM.
