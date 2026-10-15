# Last Fragment 2 — État des lieux et fonctionnalités à préparer

Inventaire tiré de l'analyse de la V1 (`../lastfragment`, PHP/jQuery/MySQL), de l'état actuel de la V2 (ce dépôt, SvelteKit 2 + Svelte 5 + Prisma/MySQL) et du prototype `../quizV2/lastfragment_discovery`.

**Comment s'en servir :** coche `[x]` ce que tu veux dans la V2, barre ou supprime le reste, et ajoute tes idées dans la section 13. Chaque ligne a un identifiant (`B3`, `F2`…) pour qu'on puisse en parler rapidement.

Légende de la colonne **V2** : ✅ fait · 🟡 commencé / partiel · ❌ absent

---

## Avancement — branche `refonte-v2`

Les sections 0 à 13 ci-dessous gardent l'état des lieux d'origine et tes annotations. Cette section dit où en est la branche.

### Fait

| Domaine | Détail |
|---|---|
| Socle | S1 à S8, S11, S12. Routes `/api` et `/crud` supprimées ; `/admin` réservé au MJ dans `hooks.server.ts` ; rôle chargé une fois ; plus de secret JWT par défaut ; session de 30 jours ; tout en Svelte 5 ; chargements côté serveur. |
| Accueil et navigation | A1, A3, A4, A5. Déconnexion et lien MJ dans le header, page d'erreur, pages provisoires pour Outils et Don de flux. |
| Personnages et bestiaire | B2, B3, B5, B6, B7, B8, B9, B12, B13. Recherche par nom, titre et tags ; bascule bestiaire ; filtre arc actuel ; filtres mémorisés 10 min ; stats et réglages modifiables par le MJ depuis la fiche. |
| Censure | B11 revu selon ta note : un interrupteur « Censuré (teaser) » par personnage, pour tous les joueurs, avec une citation à la place de la description. Le contenu censuré n'est jamais envoyé au navigateur. |
| Comptes | C3, C5, C6, C8. Le MJ associe un compte à un personnage et ouvre la fiche de n'importe quel joueur. |
| Fiche de jeu | D1 à D9, D11. Jauges, stats à barre triple, armure à 4 emplacements, passifs activables, puissance, badges, compétences par paliers, argent, histoire affichée directement. |
| Vue de combat | Ton ajout de la section D : `/profil/combat`, plein écran, avec stats, armure, passifs, objets en main et dans le sac, argent. |
| Inventaire | E1 à E7. Conteneurs, cartes d'objets, transfert à deux panneaux, coffre commun, capacité et surcharge, conteneurs ouverts ou fermés par le MJ, contenu des sacs de nourriture. |
| MJ | G1, G2, G4, G5, G6. Back-office unique pour 12 tables (recherche, tri, interrupteurs modifiables dans le tableau, images, éditeur d'effets), distribution d'argent en masse, don et retrait d'objets depuis la fiche d'un joueur. |
| Règles | Annexe A portée dans `src/lib/game/`, avec tests (`npm test`). |
| Table de jeu (section 13, G7 à G10) | `/outils/table` : le MJ crée et ouvre une partie, les joueurs la rejoignent depuis Outils sans code (compte + personnage). Plateau à grille avec fond, zoom, jetons déplaçables (le joueur bouge le sien), brouillard de guerre peint à la souris, plusieurs scènes préparées à l'avance. Jetons issus des fiches (joueur avec armure et passifs, personnage, monstre) ou libres ; jauges PV/QdF/END propres à la partie. Jets de stat d100 seuls ou opposés, attaques Force/Maîtrise au d20 avec les formules V1 (dégâts et coût appliqués, annulables), dés libres (`2d6+3`, `/r` dans le chat), alertes de fatigue et de K.O. Ordre de passage indicatif, montrable aux joueurs. Stats ennemies cachées par défaut, révélables par jeton ; jets cachés du MJ. Musique synchronisée, ambiances superposées, effets sonores, image montrée en plein écran. Médiathèque partagée. Vue OBS sans interface par lien secret. Journal en fenêtre flottante déplaçable, lanceur de dés en haut à gauche, taille des cases réglable par scène (brouillard et jetons replacés), effets de scène : teintes, météo animée (pluie, orage, neige, vent, brume, braises), calques gif / webp / webm. Nom d'un jeton masquable (« ??? » pour les joueurs), taille d'un jeton changée en tirant son coin, dessin à main levée pour tous (gomme, annuler, effacer ses traits ; le MJ efface tout), raccourcis clavier (aide avec ?). Temps réel par Server-Sent Events. |
| Créateur (H3, H4) | `/outils/createur` : générateur de stats par fourchette de puissance (préréglages Facile à Boss), retouche manuelle, noms aléatoires. N'importe quel visiteur peut proposer un personnage ou un monstre ; la proposition va dans la table `drafts` et le MJ la valide (formulaire prérempli, informations manquantes à compléter) ou la refuse dans Espace MJ → Brouillons. |

### Choix faits en ton absence, à valider

- **Inscription (C2)** : laissée ouverte. Un nouveau compte est un simple joueur sans personnage, il ne voit rien de plus qu'un visiteur tant que tu ne l'as pas associé.
- **Badges (D6)** : les badges restent des dragons, comme dans ton schéma. Tu distribues des badges aux joueurs (Espace MJ → Badges des joueurs), tu crées une fusion de deux badges, et la fiche affiche la compétence définie pour cette paire. Créer une fusion marque un badge disponible de chaque type comme utilisé.
- **Passifs** : un effet est soit fixe (`+5`), soit un multiplicateur (`×1.1`), avec un effet optionnel quand le passif est désactivé. Cela couvre *Alcoolique* sans code spécial. *Introverti* (30 % d'éloquence transférés en furtivité) n'a pas d'équivalent exact : il se saisit comme ELO ×0.7 et FUR en valeur fixe.
- **Compétences (D7)** : débloquées automatiquement par la stat de base, comme en V1. La table `character_skills` de ton schéma n'est pas utilisée.
- **Conteneurs fermés (E6)** : gardé alors que « état du monde » (G3) est abandonné. Ce sont cinq interrupteurs dans l'Espace MJ.
- **Sac à dos** : la règle V1 est conservée, un objet nommé « Sac à dos » équipé au torse double la capacité de port.
- **Champs abandonnés** : `Character.theme` et `Player.team` restent en base mais n'ont plus de champ de formulaire.

### Reporté, selon tes notes

| Sujet | Sections |
|---|---|
| Outils publics et quiz | H1 à H5, K1, K2 |
| Easter eggs | J1 à J5 |
| Version mobile de l'accueil | A2 |

Abandonné : marché, entraînement, état du monde, histoires, thèmes par joueur, filtre par dragon, compte invité, groupes.

### Reste à décider ou à faire

- **S9 et S10 — faits** : déploiement Docker (`Dockerfile`, `docker-compose.yml`, `adapter-node`). Les images envoyées vont dans un volume et sont servies par `/uploads/…`. Voir le README.
- **Lien « Histoires »** : l'accueil l'affiche si `PUBLIC_LORE_URL` est renseigné dans `.env`. Il manque l'adresse du site de lore.
- **Migrations Prisma** : le schéma est appliqué avec `prisma db push`, comme avant. Le dossier `prisma/migrations` ne contient que la migration initiale et ne reflète plus la base.
- **Données V1** : rien n'a été importé (annexe B).

---

## 0. Résumé

| Domaine | V1 | V2 |
|---|---|---|
| Accueil | Menu 3 liens + image au survol | ✅ Fragments de verre animés (plus abouti que la V1) |
| Auth | Session PHP, mots de passe en clair | 🟡 JWT + bcrypt, mais aucun contrôle de rôle |
| Personnages / Bestiaire | Liste, filtres, fiches, censure | 🟡 Liste + fiche basique, filtres non branchés |
| Profil joueur | Très complet (stats, armure, passifs, badges, compétences, inventaire) | 🟡 Affiche seulement l'identité du personnage |
| Inventaire / transfert | Complet | ❌ (tables Prisma présentes) |
| Histoires (lore) | 23 pages statiques | ❌ (lien dans le header → 404) |
| Quiz « Don de flux » | Complet | ❌ (lien dans le header → 404) |
| Outils (randomizer, noms) | Complet | ❌ (lien dans le header → 404) |
| Outils MJ (combat, argent, état du monde) | Complet | ❌ |
| Back-office | CRUD générique | 🟡 13 CRUD générés, non protégés, liens cassés |
| Secrets / easter eggs | Nombreux | 🟡 Titre « Je te vois. » sur l'accueil |

---

## 1. Socle technique V2 à corriger avant d'ajouter des fonctionnalités

Ce ne sont pas des fonctionnalités mais elles bloquent ou fragilisent tout le reste.

- [ ] **S1 — Protéger `/api/*` et `/crud/*`.** Aujourd'hui aucune route n'est vérifiée : `POST /api/players` accepte un champ `role` sans être connecté, donc n'importe qui peut se créer un compte admin (rôle 10), et tous les `PUT`/`DELETE` sont ouverts. À centraliser dans `hooks.server.ts` (garde par préfixe de route + rôle).
- [ ] **S2 — Charger le rôle dans `locals.user`** une seule fois dans le hook (au lieu de re-décoder le JWT dans `characterslist` et `characters/details`). Définir les rôles en constantes (0 = joueur, 10 = MJ aujourd'hui).
- [ ] **S3 — Secret JWT** : supprimer le repli `'supersecretkey'`, exiger `JWT_SECRET` dans `.env`. Session d'1 h sans renouvellement : à rallonger ou rafraîchir.
- [ ] **S4 — Retirer `http://localhost:5173` codé en dur** dans `routes/personnages/+page.svelte` ; passer par une fonction `load`.
- [ ] **S5 — Chargement des données côté serveur** (`+page.server.ts` + Prisma direct) au lieu de `fetch` vers sa propre API depuis le navigateur. Les routes `/api` ne restent que si un vrai besoin client existe.
- [ ] **S6 — Uniformiser en Svelte 5 (runes).** `profil`, `personnages/[id]` et tous les `crud/*` sont en syntaxe Svelte 4 (`export let`, `$:`, `on:submit`).
- [ ] **S7 — Header** : retirer `data-sveltekit-reload` (recharge complète à chaque clic), gérer l'état `active` de `NavButton`, afficher/masquer proprement sur l'accueil (actuellement via `querySelectorAll('header').style.display` dans `onMount`).
- [ ] **S8 — Liens morts** : `/histoires`, `/flux`, `/outils` (header + accueil) ; `/characters/new`, `/crud/*/[id]`, `/crud/*/[id]/edit` (CRUD). Pas de page d'index `/crud`.
- [ ] **S9 — Uploads** : écrits dans `static/uploads` sans contrôle de type ni de taille, et `static/` n'est pas servi dynamiquement en production. Choisir un stockage (dossier hors build ou service externe).
- [ ] **S10 — Adapter de déploiement** (`adapter-auto` actuellement) à choisir selon l'hébergeur ; `node-fetch` est inutile (fetch natif).
- [ ] **S11 — Nettoyage** : `reproduce_issue.js`, `Bar.svelte` vide, `+page.svelte` racine vide, `console.log` du hook, `README.md` par défaut, modifications non commitées (schéma Prisma, types, ~20 routes API).
- [ ] **S12 — Composants de base à créer** (réutilisés partout ensuite) : `StatBar` (valeur + bonus armure + bonus passif), `Modal`/`Drawer`, `Tooltip`, `Tabs`/`RadioGroup`, `SearchInput`, `DragonIcon`, `RarityBadge`, `DataTable` (pour remplacer les 13 pages CRUD copiées-collées).

### Écarts du schéma Prisma par rapport à la V1

Champs/tables dont les fonctionnalités V1 dépendent et qui n'existent pas dans `schema.prisma` :

| Besoin V1 | État Prisma | Sert à |
|---|---|---|
| Âge, sexe du personnage | ❌ | Fiche ; « Mort/Morte » déclenche l'affichage grisé | C'est parfaitement normal, les personnages vieillissent avec le Temps donc l'âge est changeant et compliqué à maintenir, le sexe du personnages étaient une étape inutile qui causait plus de problème qu'autre chose.
| Groupe du personnage + citation | ❌ (`Player.team` existe) | Censure des fiches (B6) | Oui, parfaitement normal, cependant j'aimerai pouvoir garder cette aspect de bloquer certains personnages pour effectuer des teasers sans système de groupe.
| Lien/texte de lore du personnage | 🟡 `description` | Bloc « Afficher lore » | 
| Descendance multiple (`Yinva-Drii`) | 🟡 `dragon` en texte libre | Filtres par dragon | Le filtre par Dragon était inutile et servait juste de pretexte pour l'Easter Egg
| Stats des monstres | ❌ | Bestiaire vu MJ, simulateur de combat | Impératif d'avoir un bestiaire modifiable aisément et un simulateur de combat.
| Argent du joueur | ❌ | Profil, marché, distribution MJ |  Oublie le marché, c'est une fonctionnalité qui a causé plus de soucis qu'autre chose mais la Distribution MJ est indispensable.
| Tokens de badge | 🟡 `BadgeFusion` | Badges (D6) | J'ajoute manuellement les badges plutôt qu'un calcul random et mal fait
| Emplacements d'armure équipés | ❌ | Équiper/retirer (D3) | Impératif à avoir
| Emplacement de l'armure (casque/torse…) | 🟡 via `Item.category` | Sélecteur d'armure | Impératif
| Passif : nom, description, actif/inactif | ❌ (`statistics`, `maths` seulement) | Passifs (D4) | Impératif de pouvoir éditer ceci
| Maîtrise alternative | ❌ | Affichée sur la page Training V1 | Ancienne fonctionnalité, à supprimer
| État du monde (saison, marché ouvert, conteneurs ouverts, viande/poisson) | ❌ | Inventaire, marché, MJ (G3) | à supprimer, ancienne fonctionnalité
| Prix saisonniers, qualité, quantité des aliments | 🟡 `Food.price` unique | Marché (F1) | à supprimer, ancienne fonctionnalité
| Coffre commun | ❌ | Inventaire partagé (E3) | Impératif à avoir !
| Questions du quiz | ❌ | Don de flux (H1) | Impératif à avoir aussi mais il devra être refait donc on en reparlera plus tard
| Image de l'objet | ❌ | Inventaire | Il faudrait pouvoir placer des icones.

---

## 2. A — Accueil et navigation

| ID | Fonctionnalité | V1 | V2 |
|---|---|---|---|
| A1 | Page d'accueil à fragments de verre, image et fond qui changent au survol de chaque lien | Menu simple + texte machine à écrire | ✅ |
| A2 | Version mobile de l'accueil (les fragments sont masqués sous 600 px) | — | 🟡 |
| A3 | Header avec logo, liens, burger mobile | ✅ | 🟡 voir S7 |
| A4 | Liens MJ dans le header (back-office, profils joueurs) + déconnexion | ✅ | ❌ (route `/auth/logout` existe, pas de bouton) |
| A5 | Favicon, titres de page, page d'erreur 404 personnalisée | Favicon seul | ❌ |

- [ ] A1 · [ ] A2 · [ ] A3 · [ ] A4 · [ ] A5

---

## 3. B — Personnages et bestiaire (public)

| ID | Fonctionnalité | V1 | V2 |
|---|---|---|---|
| B1 | Grille de cartes personnages (image, pays, nom, titre, tags, extrait) | ✅ | ✅ `CharacterCard` |
| B2 | Recherche par nom **et** par tags | ✅ | ❌ champ présent, non branché | Recherche par Tag à ajouter
| B3 | Bascule Personnages / Bestiaire | ✅ | ❌ cases présentes, non branchées ; table `Monster` + CRUD prêts | Recherche du bestiaire à ajouter
| B4 | Filtre par dragon de descendance (11 dragons + « aucun », cumulables) | ✅ | ❌ | Inutile
| B5 | Filtre « arc actuel » (`current`) | ✅ | ❌ case présente, non branchée | Pratique, mais à voir comment setup ceci dans le backoffice
| B6 | Mémorisation des filtres pendant 10 min | ✅ localStorage | ❌ |  Pratique
| B7 | Visibilité : fiches cachées visibles du MJ uniquement | ✅ | ✅ | Impératif
| B8 | Personnage mort : image grisée + logo Shizari | ✅ (via âge = « Mort ») | 🟡 prop `mort` prête, jamais alimentée | Pratique à pouvoir modifier 
| B9 | Fiche personnage : identité, pays, dragon, description | ✅ | ✅ | Impératif
| B10 | Fiche : âge, sexe, thème musical, lore long dépliable, image en grand | ✅ | ❌ | âge sexe theme musical image en grand, inutile. Pareil, autant montrer toute la description complète.
| B11 | **Censure par groupe** : si le joueur n'est pas du même groupe que le personnage, les infos sont remplacées par « Censor » + une citation | ✅ | ❌ | Inutile, mais si possibilité de censurer un personnage pour tout le monde je suis preneur
| B12 | Stats et puissance totale visibles par le MJ sur la fiche | ✅ | ❌ | Oui, impératif et surtout que l'admin puisse éditer DEPUIS cet endroit est tout aussi important
| B13 | Fiche bestiaire : taille, poids, niveau de danger, effet, description, stats MJ | ✅ | ❌ | Impératif

- [ ] B2 · [ ] B3 · [ ] B4 · [ ] B5 · [ ] B6 · [ ] B8 · [ ] B10 · [ ] B11 · [ ] B12 · [ ] B13

---

## 4. C — Comptes

| ID | Fonctionnalité | V1 | V2 |
|---|---|---|---|
| C1 | Connexion | ✅ (mots de passe en clair) | ✅ bcrypt + JWT |
| C2 | Inscription libre | ❌ comptes créés par le MJ | ✅ — **à décider** : la garder, ou réserver la création au MJ ? |
| C3 | Déconnexion | ✅ | 🟡 route sans bouton | A faire
| C4 | Compte invité public (« Invité / Invitation ») | ✅ | ❌ | Inutile désormaris
| C5 | Lier un compte à un personnage | Implicite (joueur = personnage) | 🟡 `characterId`, réglable uniquement par CRUD | Oui, que l'admin
| C6 | Rôles joueur / MJ | ✅ `Droit` | 🟡 champ `role`, non appliqué (S1) | Appliquer le champ role pour les admins
| C7 | Groupes / équipes de joueurs | ✅ `Groupe` | 🟡 champ `team`, inutilisé | Inutile
| C8 | Le MJ consulte le profil de n'importe quel joueur | ✅ `admin_profil` | ❌ | Si possibilité de l'ajouter sans soucis, je suis preneur

- [ ] C2 · [ ] C3 · [ ] C4 · [ ] C5 · [ ] C6 · [ ] C7 · [ ] C8

---

## 5. D — Profil joueur (fiche de jeu)

C'est le cœur de la V1 (`Profil.php`, 1 280 lignes). La V2 n'affiche que l'identité.

| ID | Fonctionnalité | V1 | V2 |
|---|---|---|---|
| D1 | Jauges de consommables QDF / HP / END | ✅ | ❌ | Impéartif
| D2 | 10 stats (5 combat, 5 hors-combat) avec barre triple : base + bonus armure + bonus passifs, total en info-bulle | ✅ | ❌ (table `Statistic` prête) | Impératif
| D3 | Armure : 4 emplacements, équiper/retirer depuis l'inventaire ou un tiroir latéral, bonus appliqués aux stats | ✅ | ❌ | Impéartif (pas forcément un tiroir latéral mais un design responsive et adapté)
| D4 | Passifs : liste, description, activer/désactiver, effet sur les stats | ✅ | ❌ | Impératif
| D5 | Puissance totale + bonus des passifs | ✅ | ❌ | Impératif
| D6 | Badges : un badge à 50 et un à 70 par stat (bloqué / débloqué / utilisé), fusion de deux badges → compétence de badge | ✅ | ❌ (tables `Badge`, `BadgeFusion` prêtes) | Impératif mais je distribue les tokens plutôt qu'un truc automatique
| D7 | Compétences par stat : barre segmentée par paliers, verrouillées tant que la stat est insuffisante, description au survol | ✅ | ❌ (tables `Skill`, `CharacterSkill` prêtes) | Impératif
| D8 | Argent (arrondi en « k » pour les joueurs, exact pour le MJ) | ✅ | ❌ | Impératif
| D9 | Lore personnel dépliable | ✅ | ❌ | Montrer le lore directement
| D10 | Thème visuel par joueur (CSS, police, logo, curseur à traînée, musique au clic) | ✅ 5 thèmes | ❌ | Inutile
| D11 | Restauration de la position de défilement au retour sur la page | ✅ | ❌ | Impératif

Ajouter une fonctionnalité pour avoir une fiche en sur tout l'écran avec les informations des statistiques, des objets, de son argent pour avoir une vision d'ensemble en combat. 


- [ ] D1 · [ ] D2 · [ ] D3 · [ ] D4 · [ ] D5 · [ ] D6 · [ ] D7 · [ ] D8 · [ ] D9 · [ ] D10 · [ ] D11

---

## 6. E — Inventaire

| ID | Fonctionnalité | V1 | V2 |
|---|---|---|---|
| E1 | Objets par conteneur : Main (porté), Sac, Coffre, Cheval ; onglets, tri par poids | ✅ | ❌ (`ItemInPlayer.localisation` prêt) | Impératif
| E2 | Carte d'objet : icône de catégorie, couleur de rareté (Commun → Unique), pastilles de poids, fiche au survol | ✅ | ❌ | Impératif
| E3 | Page de transfert à deux panneaux : sélection multiple, envoi d'un conteneur à l'autre | ✅ | ❌ | Impératif
| E4 | Coffre commun partagé entre joueurs (l'objet change de propriétaire) | ✅ | ❌ | Impératif
| E5 | Capacité de port et alerte de surcharge ; l'armure équipée ne pèse rien | ✅ | ❌ | Impératif
| E6 | Conteneurs ouverts/fermés par le MJ (ex. pas d'accès au coffre en voyage) | ✅ | ❌ | Impératif
| E7 | Sacs de nourriture : contenu détaillé dans un tiroir | ✅ | ❌ (tables `Food`, `FoodInBag` prêtes) | Impératif

- [ ] E1 · [ ] E2 · [ ] E3 · [ ] E4 · [ ] E5 · [ ] E6 · [ ] E7

---

## 7. F — Marché et entraînement (inachevés en V1) A supprimer, inutile

| ID | Fonctionnalité | V1 | V2 |
|---|---|---|---|
| F1 | Marché de nourriture : prix par saison, viande/poisson selon disponibilité, panier persistant, contrôle de l'or et de la place dans les sacs | 🟡 JS + CSS + helpers présents, page supprimée, lien commenté | ❌ |
| F2 | Entraînement : mini-jeux par stat pour dépenser des tokens | 🟡 seul le mini-jeu Vitesse (clics en 5 s) existe, lien commenté | ❌ |

- [ ] F1 · [ ] F2

---

## 8. G — Outils du MJ

| ID | Fonctionnalité | V1 | V2 |
|---|---|---|---|
| G1 | Back-office CRUD de toutes les tables, avec recherche | ✅ générique | 🟡 13 CRUD, voir S1/S8/S12 | Avoir un CRUD détaillé, ergonomique qui peut tout éditer.
| G2 | Distribution d'argent en masse (+/− pour tous les joueurs en un envoi) | ✅ | ❌ | Impératif
| G3 | État du monde : saison, marché ouvert, conteneurs accessibles, viande/poisson | ✅ | ❌ | Inutile
| G4 | Voir l'inventaire d'un joueur | ✅ | 🟡 via CRUD `items-in-player` | Impératif
| G5 | Upload d'images | ✅ | 🟡 personnages et monstres seulement | Inutile, à mettre dans les CRUDs quand on veut gérer des choses avec des Images (Bestiaire, Players)
| G6 | Édition des descriptions d'objets/passifs/personnages | ✅ fichiers `.txt` | 🟡 champs `description` en base | Dans les CRUD

| G7 | **Simulateur de combat** : jusqu'à 24 cartes (joueur, personnage, monstre ou vierge), stats éditables, armure par carte | ✅ | ❌ | On va faire un truc à part !
| G8 | Combat — attaque Force/Maîtrise : d20, puissance, calcul des dégâts et du coût en END/QDF, application automatique | ✅ | ❌ |
| G9 | Combat — jet opposé d100 stat contre stat, réussite/échec/critique | ✅ | ❌ |
| G10 | Combat — journal des événements (fatigue, flux critique, K.O.) dans une fenêtre à capturer avec OBS, option « cacher les stats » | ✅ | ❌ |

- [ ] G1 · [ ] G2 · [ ] G3 · [ ] G4 · [ ] G5 · [ ] G6 · [ ] G7 · [ ] G8 · [ ] G9 · [ ] G10

---

## 9. H — Outils publics ON VERRA PLUS TARD, A LA TOUTE FIN

| ID | Fonctionnalité | V1 | V2 |
|---|---|---|---|
| H1 | **Quiz « Don de flux »** : questions une par une, barre de progression, double-clic pour valider | ✅ | ❌ |
| H2 | Certificat de flux : dragon de bénédiction, nom et description du flux (matrice dragon × dragon), prénoms possibles, stats tirées, pentagone de potentiel, mise en scène animée | ✅ | ❌ |
| H3 | Randomizer de monstres : stats aléatoires dans une fourchette de puissance, préréglages Easy/Normal/Hard/Boss, mode édition manuelle | ✅ | ❌ |
| H4 | Générateur de noms à partir de syllabes de dragons | ✅ | ❌ |
| H5 | Page d'index des outils | ✅ | ❌ |

- [ ] H1 · [ ] H2 · [ ] H3 · [ ] H4 · [ ] H5

---

## 10. I — Histoires (lore) Inutile, un site alternatif à été réalisé pour cela

| ID | Fonctionnalité | V1 | V2 |
|---|---|---|---|
| I1 | Index par catégories : Dragons (11), Légendes (3), Lieux (8), Races (4) | ✅ | ❌ |
| I2 | Aperçu de la page au survol d'un titre | ✅ (`<embed>`) | ❌ |
| I3 | Pages de lore avec silhouette et fond propres à chaque sujet | ✅ 23 fichiers, CSS dupliqué dans chacun | ❌ |
| I4 | Lore éditable par le MJ (en base ou en Markdown) plutôt qu'en dur | ❌ | ❌ |

À noter : en V1, 7 des 8 pages « Lieux » (Amari, Lucioles, Edenia, Irysia, Mudan, Saxifra, Vulcain) n'existent pas — liens morts ; seule Augeaime existe. Le dossier `Lores/` contient aussi 4 pages hors index (Chaos, Requin, Vierge, Indice) liées aux secrets.

- [ ] I1 · [ ] I2 · [ ] I3 · [ ] I4

---

## 11. J — Secrets et easter eggs On ajoutera des easetr egg plus tard

| ID | Fonctionnalité | V1 | V2 |
|---|---|---|---|
| J1 | Code des dragons : cocher les 11 filtres dans l'ordre ouvre la page secrète | ✅ | ❌ |
| J2 | Terminal secret : faux démarrage système, saisie de codes → pages/images cachées | ✅ 8 codes | ❌ |
| J3 | Pages secrètes (Liva, Rapport, Créativité, Nobody) | ✅ | ❌ |
| J4 | Recherches déclencheuses (« LE REQUIN », « EADRIC » + filtre Goliath) | ✅ | ❌ |
| J5 | Stats secrètes dans le randomizer (message codé en ASCII) et résultat « Chaos » du quiz | ✅ | ❌ |
| J6 | Titre « Je te vois. » au survol de « Ton don de flux » | — | ✅ |

En V1 les codes sont vérifiés côté serveur mais les pages secrètes restent accessibles par URL directe. À refaire avec une vraie vérification si tu veux les garder secrètes.

- [ ] J1 · [ ] J2 · [ ] J3 · [ ] J4 · [ ] J5

---

## 12. K — Prototype `quizV2/lastfragment_discovery` C'est le projet de quiz, mais on verra plus tard

Projet SvelteKit séparé (Svelte 5 + Tailwind 4, plus récent que ce dépôt) avec deux composants terminés :

| ID | Fonctionnalité |
|---|---|
| K1 | `DragonCode` : cliquer les 11 dragons dans le bon ordre, indices débloqués après un échec — version moderne de J1 |
| K2 | `WorldMapPuzzle` : carte du monde dont on débloque les pays en devinant leur nom |

**À décider :** l'intégrer ici (sous `/flux` ou `/decouverte` ?), le garder séparé, ou s'en servir pour remplacer le quiz V1 (H1). Attention, il utilise Tailwind alors que ce dépôt est en CSS scopé.

- [ ] K1 · [ ] K2

---

## 13. Tes ajouts

Fonctionnalités nouvelles que tu veux et qui ne sont ni dans la V1 ni ci-dessus :

- [ J'aimerai un système de gestion de JDR à la DaggerHeart ou je peux afficher un terrain comme sur Roll20, les joueurs peuvent se connecter via un code. Voir un fond, des images et des musiques stockés. Il pourront déplacé leur jeton à eux, je pourrais ajouter des jetons, changer le fond, les musiques, gérer tous les jetons en tant que MJ, lancer un combat, ils pourront jeter des dés, voir leur résultats, les comparatifs avec les jetons des ennemies etc... Mais je pense qu'on verra une fois le site de base réalisé pour développer ce dont on a besoin ici !] …
- [ ] …

---

## Annexe A — Règles de jeu codées dans la V1

À reprendre telles quelles dans un module `src/lib/game/` (testable), car elles sont aujourd'hui dupliquées dans 4 à 5 fichiers PHP/JS.

**Stats.** 13 stats : QDF, HP, END (consommables) · MDF, FOR, DEF, VIT, ACC (combat) · PER, FUR, CHA, ELO, INT (hors-combat). Échelle 0–100 ; QDF et HP valent ×30, END ×20.

**Puissance d'une stat** (coût par point, par tranche) :

| Tranche | 0–25 | 25–50 | 50–70 | 70–80 | 80+ |
|---|---|---|---|---|---|
| Coût par point | 0,5 | 1 | 2 | 4 | 8 |

Puissance totale = somme sur les 13 stats (QDF/30, HP/30, END/20 avant calcul), arrondie à l'entier inférieur. Maximum théorique à 100 partout : 3 607,5.

**Capacité de port.** `3 + ⌊FOR / 20⌋` emplacements, doublée si un « Sac à Dos » est équipé au torse. Coffre : 1 024. Cheval : 3. Une armure équipée pèse 0.

**Armure.** 4 emplacements (casque, torse, gantelets, jambières). Chaque pièce porte une liste de stats et de valeurs (`DEF,VIT` / `10,-5`). Un malus de VIT est ignoré si FOR ≥ 60 ; un malus d'ACC est ignoré si ACC ≥ 50.

**Passifs.** Multiplicateur par stat : bonus = `⌈(valeur − 1) × stat⌉` quand le passif est actif. Deux cas particuliers : *Introverti* (30 % d'ELO transférés en FUR) et *Alcoolique* (+5 % aux 5 stats de combat si actif, −10 % si inactif).

**Badges.** Un badge par stat à 50 et un autre à 70 (END : 1 000 et 1 400). Un token = paire de badges (`MDF:FOR`) consommée pour débloquer la compétence de badge correspondante.

**Compétences.** Paliers par stat ; débloquée si `stat ≥ palier`.

**Combat — attaque.**
- Jet d20. Bonus de puissance au jet : puissance 2 → +5 ; puissance n > 2 → +10 × (n − 2).
- Dégâts = `((attaque + (jet − 10)) × 10 − défense × 5) × multiplicateur`, minimum 10.
- Coût : Maîtrise → `puissance × 100` QDF ; Force → `(puissance − 1) × 100 + 50` END.

**Combat — jet opposé (d100).** Seuil = `50 − (stat exécutant − stat cible)`. 1–2 : échec critique ; 99–100 : réussite critique ; à ±10 du seuil : « de justesse » / « de peu ». Jet sans cible : réussi si `jet ≥ 100 − stat`. Stat opposée par défaut : ACC↔VIT, PER↔FUR, CHA→PER, MDF/DEF→FOR.

**Seuils d'alerte en combat.** END ou QDF sous 50 %, sous 20 %, à 0 ; HP à 0 = K.O.

**Quiz.** Chaque réponse rapporte des lettres (A–K = un dragon chacune, L–Q = entités spéciales). Pondération : élémentaires (Aqua, Drii, Goliath, Lada, Pura) ×2 ; Pestia ×1,8 ; rares (Chronos, Guizamark, Shizari) ×1,6 ; Artrish et Yinva ne donnent pas de flux. Les deux meilleurs dragons (le second seulement s'il est à 5 points ou moins du premier) désignent le flux dans la matrice. Stats = `lettre × 5`, bornées entre 20 et 60, puis ajustées au hasard jusqu'à une puissance totale de 345–355. Potentiel en pentagone : Leader, Brute, Tank, Assassin, Mage.

**Rareté.** 1 Commun · 2 Singulier · 3 Rare · 4 Légendaire · 5 Unique.

**Censure.** Joueur du groupe 1 : voit tout. Personnage du groupe 2 : public. Sinon la fiche est censurée si le groupe du joueur diffère de celui du personnage.

---

## Annexe B — Contenu à migrer depuis la V1

| Source | Volume | Destination probable |
|---|---|---|
| `sql/lastfragment_1.sql` | 14 tables (fiches, joueurs, bestiaire, objets, armures, passifs, compétences, badges, quiz, aliments…) | Script de seed Prisma |
| `description/*.txt` | ~330 textes (objets, passifs, personnages, monstres) | Champs `description` en base |
| `Lores/*.php` | 23 pages | Markdown ou table `lore` |
| `php/fluxDescriptions.php` | Matrice des flux + prénoms + citations + couleurs par dragon | Fichier de données TS |
| `Image/` (racine) | Portraits personnages et monstres | `uploads/` |
| `Image/Objets/Categorie/` | 17 icônes SVG de catégories d'objets | `static/` |
| `Image/Objets/Badges/` | 12 images de badges | `static/` |
| `Image/Lore/` | Silhouettes des dragons | `static/` |
| `css/spéciaux/`, `js/spéciaux/`, `Image/Background/` | 5 thèmes joueurs (Gira, Gora, Shuri, Zayath, Élhanan) | Si D10 retenu |

Les mots de passe de la V1 sont en clair dans le dump : ne pas les réimporter, recréer les comptes.

---

## Annexe C — Ordre de construction suggéré

1. **Socle** : S1 à S8, S12.
2. **Lecture publique** : B2–B5, B8, B10, B13, puis I1–I3.
3. **Fiche de jeu** : module de règles (annexe A), puis D1, D2, D5, D3, D4.
4. **Inventaire** : E1, E2, E5, puis E3, E4, E6.
5. **Progression** : D6, D7.
6. **MJ** : G1 propre, G2, G3, C8, puis G7–G10.
7. **Outils publics** : H3, H4, puis H1, H2 (ou K1/K2 à la place).
8. **Bonus** : D10, J1–J5, F1, F2.
