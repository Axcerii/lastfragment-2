# Don de flux (/flux) : note de reprise

Note laissée le 2026-11-04 pour reprendre le travail sur `/flux` dans une nouvelle session, **sans accès à la V1 PHP**. Tout ce qu'il fallait de la V1 est soit déjà porté dans le code, soit recopié ici (section « Reste à faire »).

Branche : `feat/flux-decouverte` (deux commits, poussée). Pas encore fusionnée.

## Le parcours, de bout en bout

1. **Constellation** : toucher les 11 dragons dans l'ordre de la Genèse. Le serveur vérifie chaque clic ; après un premier échec, des indices apparaissent un à un.
2. **Voyage** : à la réussite, les icônes des dragons volent jusqu'à leur symbole sur la carte du monde.
3. **Carte** : Augeaime et Vulcain sont donnés ; il faut deviner Saxifra, Irisia, Mudan, Edenia, Amari, chacun d'après une fleur.
4. **Portails** (une fois les 7 terres connues) : Humain, Géant, Éternelle. Un clic dévoile une phrase avec « Revenir en arrière » / « Franchir le portail ».
5. **Test de flux en 3D** : les 25 questions de la V1, présentées comme un fil lumineux qui se divise à chaque question (three.js).
6. **Résultat** : citation du dragon, flux, description, prénoms possibles (et une note pour les géants).

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
| `src/lib/flux/quiz.ts` | **Calcul V1** du flux (`scoreAnswers`) et affichage (`revealFlux`) |
| `src/lib/components/flux/` | `Constellation`, `WorldMap`, `Portals`, `FluxJourney` (3D), `FluxResult` |
| `static/flux/carte.webp` | Carte du monde (le symbole de Chronos y a été déplacé à la main) |
| `static/flux/vulcain-masque.webp` | Masque du territoire de Vulcain (motif de fond « Personnages ») |

Tests : `src/lib/flux/quiz.test.ts`, `src/lib/server/flux/discovery.test.ts`.

## Décisions du porteur du projet à respecter

- **Carte** : Saxifra au nord, Irisia au sud, Mudan à l'est, Augeaime au centre, Vulcain au milieu de ces quatre (l'ovale), Edenia (= Paradis) au nord-ouest, Amari au sud-ouest. La bande au sud d'Augeaime est un territoire neutre de montagnes, sans dragon.
- **Dragons sur la carte** : Artrish et Yinva hors des terres, Drii et Chronos à Augeaime (Chronos au sud-ouest), Lada et Pestia à Mudan, Goliath à Saxifra, Guizamark et Shizari à Edenia, Pura à Amari, Aqua dans l'océan entre Augeaime et Edenia.
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

## Reste à faire : le certificat complet (H2 de `FONCTIONNALITES.md`)

La V1 affichait, en plus du flux, des **stats tirées** et un **pentagone de potentiel**. Rien de cela n'est porté. Voici la logique V1 à reprendre, recopiée telle quelle.

### Comptage

Chaque réponse rapporte des lettres ; on compte les occurrences de chaque lettre A–Q sur tout le test (`counts`, avant pondération). Correspondance : A Aqua, B Artrish, C Chronos, D Drii, E Goliath, F Guizamark, G Lada, H Pestia, I Pura, J Shizari, K Yinva, L Innocence, M Émotions, N Chaos, O Sagesse, P Destruction, Q Conscience.

### Stats (13), à partir des comptes bruts

```
Maîtrise = C×5    Force = I×5        Défense = A×5      Vitesse = G×5
Précision = D×5   Perception = H×5   Furtivité = J×5    Charisme = B×5
Éloquence = K×5   Intelligence = G×5 QdF = F×5          Santé = J×5
Endurance = E×5
```

(Oui, Vitesse et Intelligence utilisent toutes deux G, Furtivité et Santé toutes deux J : c'est ainsi dans la V1.)

Puis chaque stat est bornée entre 20 et 60, et on ajuste au hasard (±1 sur une stat tirée au sort, sans sortir de 20–60) jusqu'à ce que la **puissance globale** soit entre 345 et 355.

Puissance d'une stat `n` (la somme des 13 donne la puissance globale) :

```
n ≤ 25        → n / 2
25 < n ≤ 50   → 12,5 + (n − 25)
50 < n ≤ 70   → 37,5 + (n − 50) × 2
70 < n ≤ 80   → 77,5 + (n − 70) × 4
n > 80        → 117,5 + (n − 80) × 8
```

À l'affichage, la V1 multipliait trois stats : QdF × 30, Santé × 30, Endurance × 20. Les stats défilaient au hasard pendant 8 s (toutes les 50 ms) avant de s'arrêter sur les vraies valeurs, avec une barre par stat.

Cas Chaos (toutes les réponses contiennent N) : stats fixes Maîtrise 78, Force 194, Défense 176, Vitesse 52, Précision 97, Perception 114, Furtivité 114, Charisme 105, Éloquence 118, Intelligence 101, QdF 7,5333…, Santé 4,2666…, Endurance 8,3 (sans bornes ni ajustement).

### Pentagone de potentiel (0–100 par axe)

```
Leader   = floor(100/60 × (Perception + Charisme + Éloquence + Intelligence) / 4)
Brute    = floor(100/60 × (Force + Endurance) / 2)
Tank     = floor(100/60 × (Santé + Défense) / 2)
Assassin = floor(100/60 × (Précision + Vitesse + Furtivité) / 3)
Mage     = floor(100/60 × (Maîtrise + QdF) / 2)
```

Sommets dans un SVG 100×100, centre (50, 50), rayon 50, dans l'ordre Leader, Brute, Tank, Assassin, Mage, en partant du haut : angle `72·i − 90` degrés, point = centre + (sommet − centre) × valeur / 100. Polygone rempli de la couleur du premier dragon (opacité 0,6), contour de la couleur du second.

### Couleurs V1 par dragon (certificat)

Aqua `#7E7E7E`, Chronos `#3F0913`, Drii `#674174`, Goliath `#5A4526`, Guizamark `#ADECCD`, Lada `#FFE741`, Pestia `#0F3A6A`, Pura `#9E813B`, Shizari `#000000`, Yinva `#C99597`, Chaos `#FF0000`. Le site V2 a ses propres variables `--Aqua`, `--Chronos`… dans `src/app.css` : préférer celles-là. `FluxResult.svelte` éclaircit Shizari (sinon invisible sur le fond).

### Autres détails V1 non repris

- Un drapeau « invocateur » était calculé (vrai si B ≤ K / 2) mais jamais affiché.
- La V1 n'enregistrait rien ; un ancien écran affichait le flux stocké dans la fiche du joueur (`joueurs.Flux`).

## Pièges rencontrés

- **three.js** : fond 3D en noir pur (`0x000000`). Un fond « presque noir » ressort gris à cause de la conversion sRGB de `OutputPass`. Les particules trop proches de la caméra blanchissent tout l'écran : elles sont écartées de l'axe et suivent la caméra.
- En regardant vers +z, les x positifs sont **à gauche** de l'écran (d'où `((n − 1) / 2 − k) * gap`).
- Après l'installation d'une dépendance, Vite répond « 504 Outdated Optimize Dep » : recharger complètement la page.
- Pour tester sans tout refaire : écrire dans `localStorage['flux_decouverte']` un objet `{ constellation: true, found: { … } }` (les descriptions viennent de `POST /flux/essai`).
- Dans le panneau navigateur masqué, les captures ont souvent un temps de retard : vérifier l'état par le DOM.
