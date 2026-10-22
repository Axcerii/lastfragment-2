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

## Points connus, non corrigés (faible risque)

- **Brouillard côté navigateur** : l'image de fond de la scène est envoyée entière, un joueur
  curieux peut l'ouvrir. Le nom de la scène montrée est aussi envoyé aux joueurs.
- **Dés tirés avec `Math.random`** : non cryptographique, prédiction théorique seulement.
- **Verrouillage de compte** : 10 échecs bloquent le compte 15 min, y compris pour son
  propriétaire (compromis assumé contre la force brute).
- Pas de page « changer mon mot de passe » côté joueur ; pas de journal des actions MJ.
