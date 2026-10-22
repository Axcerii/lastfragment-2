# Check-up de sécurité — Last Fragment 2

Audit du 22 octobre 2026 sur `refonte-v2-table-de-jeu` (copie de travail, avant le lancement).
Vérifié sur un build de production (`node build`) branché sur la base MySQL locale.

> Un premier check-up (commit `e078837`, branche `claude/security-checkup-7mfoak`) n'avait
> **jamais été fusionné** : le code en ligne n'avait ni limite de tentatives de connexion, ni CSP,
> ni en-têtes de sécurité. Ses correctifs sont réappliqués ici, complétés pour la table de jeu.

## Résumé

| Domaine | Constat | État |
| --- | --- | --- |
| Injection SQL | Tout passe par Prisma, aucun `$queryRaw` / `$executeRaw` | ✅ RAS |
| XSS | Aucun `{@html}` / `innerHTML` ; couleurs et URL de médias filtrées côté serveur | ✅ + CSP ajoutée |
| CSRF | SvelteKit refuse les formulaires d'une autre origine ; cookie `SameSite=strict` | ✅ testé (403) |
| Temps réel (SSE de la table) | Droits vérifiés à chaque action, vue filtrée par spectateur | ✅ + limites ajoutées |
| Force brute / énumération | Aucune limite | ✅ corrigé |
| Sessions JWT | Algo non imposé, pas de révocation | ✅ corrigé |
| En-têtes HTTP | Absents (clickjacking possible) | ✅ corrigé |
| Envois de fichiers | Fichier entier chargé en mémoire ; SVG anonymes acceptés | ✅ corrigé |
| Dépendances | 3 alertes, toutes dans la CLI `prisma` | ⚠️ sans impact visiteur |
| Configuration | `JWT_SECRET` du `.env` local : 12 caractères | ❌ **à changer avant la prod** |

## Corrections apportées

**Connexion et sessions** (`auth.ts`, `ratelimit.ts`, `auth/login`)
- 10 échecs par compte / 30 par IP sur 15 min, puis `429`. Inscriptions : 10 par IP.
- Login inconnu : calcul bcrypt factice, même temps de réponse qu'un mauvais mot de passe.
- bcrypt coût 12, remise à niveau automatique des anciens hash à la connexion.
- Mot de passe > 72 octets refusé (bcrypt le tronquait), login limité à 50 caractères.
- JWT : `HS256` imposé (un jeton `alg: none` est rejeté, testé), empreinte du mot de passe
  dans le jeton → changer un mot de passe ferme toutes les sessions de ce compte.
- Avertissement au démarrage si `JWT_SECRET` < 32 caractères.
- ⚠️ Les sessions actuelles n'ont pas l'empreinte : **tout le monde se reconnecte une fois**.

**En-têtes** (`hooks.server.ts`, `svelte.config.js`)
- CSP stricte (scripts du site uniquement, par nonce), `X-Frame-Options: DENY`, `nosniff`,
  `Referrer-Policy`, `Permissions-Policy`, HSTS en HTTPS. Vérifié sans violation sur
  accueil, personnages, profil, créateur, admin et table de jeu (flux SSE, médias).

**Table de jeu**
- `runAction` : un type d'action `constructor` / `toString` atteignait `Object.prototype`
  (sans effet dangereux, mais contournait le contrôle MJ) → refusé (`400`).
- Clé OBS comparée en temps constant ; identifiant de partie non numérique → `404` au lieu de `500`.
- 12 flux temps réel maximum par compte (sinon un joueur pouvait ouvrir des connexions à l'infini).

**Fichiers**
- `/uploads/...` lit les fichiers en flux : avant, chaque requête (y compris chaque morceau
  demandé par un lecteur audio) chargeait le fichier entier, jusqu'à 40 Mo, en mémoire.
  Route publique : quelques dizaines de requêtes suffisaient à saturer la RAM.
- SVG servis avec `sandbox` ; le créateur (ouvert aux visiteurs anonymes) refuse les SVG.
- Limiteur des brouillons : mémoire nettoyée (la table d'IP grossissait sans fin).

**Docker** : `ADDRESS_HEADER` / `XFF_DEPTH` transmis au conteneur (voir plus bas).

## À faire avant le lancement

1. **Nouveau `JWT_SECRET`** pour la production (qui le devine se connecte en MJ) :
   `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`
2. **HTTPS** et `ORIGIN=https://ton-domaine` exact, sinon cookie en clair et formulaires refusés.
3. **Derrière un proxy** (Nginx, Traefik, Cloudflare) : `ADDRESS_HEADER=X-Forwarded-For`
   (ou `CF-Connecting-IP`). Sans ça, toutes les limites par IP visent l'IP du proxy :
   5 brouillons / 10 min et 30 échecs de connexion **pour tout le site**.
4. Retirer l'exposition MySQL `127.0.0.1:${DB_PORT}` du `docker-compose.yml` en production
   si aucun outil SQL n'en a besoin.

## Points connus, non corrigés (faible risque)

- **Pas de limite de débit sur les actions de la table** (chat, dés, dessins) : un joueur
  connecté avec personnage peut remplir la base. Réservé aux joueurs validés par le MJ.
- **Brouillard côté navigateur** : l'image de fond de la scène est envoyée entière, un joueur
  curieux peut l'ouvrir. Le nom de la scène montrée est aussi envoyé aux joueurs.
- **Dés tirés avec `Math.random`** : non cryptographique, prédiction théorique seulement.
- **Verrouillage de compte** : 10 échecs bloquent le compte 15 min, y compris pour son
  propriétaire (compromis assumé contre la force brute).
- **Dépendances** : `deepmerge-ts` via la CLI `prisma` (utilisée seulement par `db push` au
  démarrage), corrigé par Prisma 7 (changement majeur). `cookie@0.6` via SvelteKit 2 :
  sans effet ici.
- Pas de page « changer mon mot de passe » côté joueur ; pas de journal des actions MJ.
