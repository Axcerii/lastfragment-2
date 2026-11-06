# Check-up de sécurité — Last Fragment 2

Audit du 22 octobre 2026 sur `refonte-v2-table-de-jeu`, avant le lancement.
Vérifié sur un build de production (`node build`) et sur une pile Docker complète et isolée
(base neuve, image construite depuis ce dépôt).

> Un premier check-up (commit `e078837`, branche `claude/security-checkup-7mfoak`) n'avait
> **jamais été fusionné**. Ses correctifs sont repris ici et complétés.

Légende : ✅ fait et testé · 🚀 à faire lors de la mise en production · ➖ choix assumé.

## 1. Docker

| Point | État |
| --- | --- |
| Utilisateur non-root | ✅ `USER node` ; le code appartient à root, `node` ne peut pas le modifier |
| Image minimale | ✅ `node:22-trixie-slim` sans npm/npx/yarn (Alpine écarté : binaires Prisma et bcrypt) |
| Limites CPU / RAM | ✅ site 1 CPU / 768 Mo / 200 processus, base 1 CPU / 1 Go (réglables dans `.env`) |
| Scan de vulnérabilités | ✅ Docker Scout : 20 failles « High » → **1** (zlib Debian, pas de correctif publié) |
| Réseaux fermés | ✅ base sur un réseau `internal` : aucun port, pas d'accès Internet ; site publié sur `127.0.0.1` seulement |
| Lecture seule | ✅ `read_only` + `/tmp` en mémoire ; seul le volume d'uploads s'écrit. Plus `cap_drop: ALL` et `no-new-privileges` |

## 2. Base de données

| Point | État |
| --- | --- |
| Pas d'exposition | ✅ aucun port en production. En local, `docker-compose.dev.yml` l'ouvre sur `127.0.0.1` (activé par `COMPOSE_FILE` dans le `.env`) |
| Requêtes préparées | ✅ tout passe par Prisma ; aucun `$queryRaw` / `$executeRaw` dans le site |
| Moindre privilège | ✅ le site utilise `lastfragment_app` : `SELECT, INSERT, UPDATE, DELETE` seulement (`DROP` et `ALTER` refusés, testé). Le schéma est mis à jour par le service `migrate`, qui s'arrête ensuite : le conteneur du site ne connaît aucun compte privilégié |
| Hachage | ✅ bcrypt coût 12, anciens hash remis à niveau à la connexion |

## 3. Temps réel (la table utilise des Server-Sent Events, pas des WebSockets)

| Point | État |
| --- | --- |
| Chiffrement | 🚀 HTTPS par Caddy ; le cookie passe en `Secure` dès que `ORIGIN` commence par `https://` |
| Authentification à l'ouverture | ✅ droits vérifiés avant d'ouvrir le flux (MJ, joueur avec personnage, ou clé OBS) |
| Détournement depuis un autre site | ✅ en-tête `Origin` vérifié sur le flux et sur toutes les requêtes POST/PATCH/DELETE (403, testé) ; cookie `SameSite=Strict` |
| Taille des messages | ✅ action limitée à 64 Ko, lue sans dépasser cette taille en mémoire (413, testé) |
| Limite de débit | ✅ 40 actions / 10 s par joueur (le MJ n'est pas limité) ; 12 flux ouverts max par compte |
| Validation des entrées | ✅ chaque champ est converti et borné (`int`, `text`, `statKey`, listes fermées…) ; types d'action limités à la liste déclarée. Pas de Zod, mais même effet |

## 4. Serveur Node

| Point | État |
| --- | --- |
| Audit des dépendances | ➖ 3 alertes `npm audit`, toutes dans la CLI `prisma` (utilisée par `migrate` seulement, sur notre propre schéma). Corrigé par Prisma 7, migration majeure à prévoir. Scout ne la signale plus dans l'image |
| En-têtes (équivalent `helmet`) | ✅ CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS en HTTPS ; pas de `X-Powered-By` |
| CORS strict | ✅ aucun en-tête CORS : rien n'est lisible depuis une autre origine (pas de `*`) |
| Limite de débit | ✅ connexion (10 échecs par compte, 30 par IP / 15 min), inscription (10 / IP), brouillons (5 / IP / 10 min). Pas de « mot de passe oublié » |
| Pas de fuite d'erreurs | ✅ `NODE_ENV=production` : le visiteur ne voit que « Internal Error », la trace reste dans les journaux (testé) |

## 5. Svelte

| Point | État |
| --- | --- |
| CSP | ✅ scripts du site seulement (nonce), sans violation sur toutes les pages testées |
| Cookies | ✅ `HttpOnly`, `SameSite=Strict`, `Secure` en HTTPS 🚀 |
| `{@html}` | ✅ aucun dans le projet |

## 6. Secrets et déploiement

| Point | État |
| --- | --- |
| Secrets hors du code | ✅ `.env` jamais versionné (vérifié dans tout l'historique). Seuls les comptes de test `dev_*` / `combat_*` figurent dans les scripts de seed, exclus de l'image Docker |
| Reverse proxy et TLS | 🚀 Caddy (certificats et redirection HTTP → HTTPS automatiques) |
| WAF / anti-DDoS | 🚀 Cloudflare en option |

## À faire lors de la mise en production

1. **Nouveaux secrets**, tous différents de ceux du poste local : `JWT_SECRET` (32 caractères
   minimum, celui du `.env` local n'en fait que 12), `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`,
   `MYSQL_APP_PASSWORD`, `ADMIN_PASSWORD`. Pour en générer un :
   `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`
2. **Ne pas copier** les lignes `COMPOSE_FILE` / `DB_PORT` du `.env` local.
3. `ORIGIN=https://le-domaine` exact.
4. **Caddy** : `ADDRESS_HEADER=X-Forwarded-For`, `XFF_DEPTH=1`. Sans ça, toutes les limites
   par IP visent l'IP de Caddy, donc tout le site à la fois.
5. **Avec Cloudflare** devant Caddy : n'accepter que les IP de Cloudflare, et
   `ADDRESS_HEADER=CF-Connecting-IP` ; sinon l'IP du visiteur peut être falsifiée.
6. Docker contourne le pare-feu `ufw` pour les ports publiés : le site n'écoute que sur
   `127.0.0.1`, il faut le garder ainsi.

## 7. Cartes à collectionner (25 octobre 2026)

| Point | État |
| --- | --- |
| Tirage | ✅ au serveur seulement, `crypto.randomInt` ; le navigateur ne reçoit les cartes qu'une fois créées et l'animation ne décide de rien. Le paquet choisi n'est qu'une apparence : il doit appartenir à la série ouverte (sinon refus, sans consommer de booster, testé) et n'entre pas dans le tirage |
| Ouverture interrompue | ✅ les cartes sont créées et attribuées dans la transaction, avant toute animation : page fermée, réseau coupé ou « Plus tard » ne font rien perdre. Le booster reste « pas vu » (`seen_at` vide) et se rejoue sans consommer de booster ; seul son propriétaire peut le marquer vu (testé) |
| Double ouverture | ✅ réserve mise à jour par « compare-and-set » dans la transaction qui crée les cartes : 3 ouvertures simultanées avec 2 boosters en réserve → 2 passent, la 3ᵉ est refusée (testé). Conflit ou interblocage MySQL : la transaction est rejouée |
| Tirage limité | ✅ le n° de série n'est incrémenté que sous la limite, ligne verrouillée jusqu'à la fin de la transaction ; contrainte unique (modèle, n° de série) en filet. Don de 5 exemplaires d'une carte limitée à 3 → 3 donnés, puis « épuisé » (testé) |
| Échanges | ✅ chaque carte ne change de mains que si elle appartient encore à celui qui la cède, tout ou rien ; proposer la carte d'un autre ou s'échanger à soi-même est refusé (testé) ; les propositions qui portaient sur une carte déplacée deviennent caduques |
| Perte de données | ✅ un modèle avec des exemplaires ne peut pas être supprimé (clé étrangère `Restrict`), seulement retiré des boosters ; une série non vide non plus ; un exemplaire retiré à un joueur reste dans la réserve du MJ avec son historique ; supprimer un compte rend ses cartes au MJ au lieu de les effacer |
| Entrées du créateur | ✅ chaque champ borné et nettoyé (caractères de contrôle et d'inversion de sens retirés), listes fermées vérifiées avec `Object.hasOwn` (« __proto__ » refusé, testé), couleurs `#rrggbb` seulement : rien d'autre n'entre dans un attribut `style` |
| Images | ✅ chemin résolu côté serveur et confiné aux dossiers d'uploads et d'emblèmes (`../../.env` refusé, testé) ; chaque image est réencodée en WebP par sharp (métadonnées retirées, SVG rastérisé, fichier piégé neutralisé), une à la fois pour ménager le processeur |
| Accès | ✅ toutes les pages et actions sous `/admin/cartes` réservées au MJ (403 testé depuis un compte joueur) ; `/cartes` réservé aux comptes connectés. Jeu caché (par défaut) : `/cartes` et ses actions répondent 404 à tous sauf au MJ, vérifié dans `hooks.server.ts` (les actions de formulaire ne passent pas par les `load`), liens et vitrines masqués (testé en visiteur et en joueur) |
| Limites de débit | ✅ ouverture 6 / 30 s, propositions 10 / 10 min, réponses 30 / min par joueur ; 15 propositions en attente et 12 cartes par côté au plus |

## 8. Check-up du 6 novembre 2026

Revue de tout ce qui a été ajouté depuis : Lastdle et son annonce n8n, versos secrets et gestion MJ
des cartes, énigmes de `/flux`, scripts de sauvegarde. Vérifié sur un build de production
(`node build`) avec une base MySQL neuve.

| Point | État |
| --- | --- |
| **sharp / libvips (corrigé)** | ✅ `npm audit` signalait 4 failles « High » dans sharp 0.34 (libvips, libheif, librsvg). Elles étaient atteignables sans compte : un visiteur propose un brouillon avec une image, elle rejoint la bibliothèque du créateur de cartes, qui en fait une miniature avec sharp dès que le MJ l'ouvre. Et sharp choisit son décodeur d'après le contenu, pas l'extension : un fichier HEIF nommé `.png` arrivait jusqu'à libheif. sharp passe en 0.35.5 |
| **Format réel des images (corrigé)** | ✅ toute image envoyée (brouillons, fiches, table, créateur de cartes) doit commencer par les octets de son format (JPEG, PNG, WebP, GIF, SVG), sinon elle est refusée avant d'être écrite. Une image déjà présente sur le disque est revérifiée avant chaque passage dans sharp. Testé : HEIF déguisé en PNG refusé à l'envoi, miniature d'un ancien fichier piégé refusée (404) sans appel à sharp |
| Intégrations n8n | ✅ `/integrations/*` : 404 sans `INTEGRATION_TOKEN` configuré (32 caractères minimum), 401 avec un mauvais jeton (comparaison en temps constant), jamais l'annonce d'un jour à venir (400, testé). n8n n'écoute que sur `127.0.0.1` et n'a pas accès au réseau de la base |
| Versos secrets | ✅ vidés côté serveur pour qui n'a jamais eu la carte, sur toutes les pages qui envoient des cartes (collection d'un autre joueur, vitrines, échanges, lien direct) ; tests automatiques en place |
| Actions des cartes | ✅ chaque action vérifie la connexion et la propriété de la carte (épingler la carte d'un autre : 403) ; déplacer ou retirer un exemplaire est réservé au MJ ; jeu caché : 404 pour les visiteurs et les joueurs (testé) |
| Énigmes `/flux` et Lastdle | ✅ réponses gardées au serveur (ordre de la Genèse, pays, personnage du jour, jeton AES-GCM du mode infini) ; corps limité à 1 Ko / 4 Ko, 90 et 60 requêtes / min par IP ; un seul booster par énigme du jour, même avec des requêtes simultanées (contrainte unique + mise à jour conditionnelle) |
| Sauvegardes | ✅ dump fait dans le conteneur de la base (aucun mot de passe sur la machine ni dans la liste des processus), fichiers en `umask 077`, dossier `backups/` exclu de git et de l'image Docker |
| Dépendances | ➖ il reste les 3 alertes connues de la CLI `prisma` (voir § 4) |
| Gyroscope des cartes | ✅ `Permissions-Policy` ne bloque que caméra, micro et géolocalisation ; l'orientation du téléphone n'est lue qu'après autorisation sur iOS et ne quitte jamais le navigateur |

## Points connus, non corrigés (faible risque)

- **Brouillard côté navigateur** : l'image de fond de la scène est envoyée entière, un joueur
  curieux peut l'ouvrir. Le nom de la scène montrée est aussi envoyé aux joueurs.
- **Dés tirés avec `Math.random`** : non cryptographique, prédiction théorique seulement.
- **Verrouillage de compte** : 10 échecs bloquent le compte 15 min, y compris pour son
  propriétaire (compromis assumé contre la force brute).
- Pas de page « changer mon mot de passe » côté joueur ; pas de journal des actions MJ.
- **Lastdle et booster** : sans compte, une requête peut comparer jusqu'à 200 personnages d'un coup,
  ce qui donne la réponse du jour immédiatement ; il suffit ensuite de la proposer connecté pour
  gagner le booster. C'est une triche sur le jeu, pas une faille : un joueur patient y arrive aussi
  essai par essai.
- **Images des brouillons gardées telles quelles** : elles ne sont pas réencodées (pour ne pas
  exposer sharp aux visiteurs anonymes), mais leur format est vérifié et elles sont servies avec
  `nosniff` et une CSP `sandbox`. Le volume reste borné par la limite de 5 envois / IP / 10 min.
- **`bun.lock` périmé** : il ne connaît ni `sharp` ni `three`. L'image Docker utilise
  `package-lock.json` ; à supprimer ou régénérer pour ne pas installer d'anciennes versions par erreur.
