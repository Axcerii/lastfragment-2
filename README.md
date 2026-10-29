# Last Fragment 2

Site compagnon du jeu de rôle Last Fragment : personnages, bestiaire, fiches de jeu des joueurs et outils du MJ.
SvelteKit 2, Svelte 5 (runes), Prisma et MySQL.

## Démarrer

```sh
npm install
cp .env.example .env      # puis renseigner DATABASE_URL et JWT_SECRET
npx prisma db push        # crée ou met à jour les tables
npm run dev
```

`npm run seed:dev` ajoute deux comptes de test (un MJ, un joueur avec une fiche complète) ; leurs identifiants sont en tête de `prisma/seed-dev.mjs`. `node prisma/seed-dev.mjs --clean` les retire.

`npm run seed:combat` prépare de quoi tester les combats : quatre compétences pour chacune des 13 stats, trois joueurs aux profils opposés (tank, mage, éclaireur) équipés et avec passifs, des monstres, un PNJ, et une partie de table de jeu déjà en combat avec l'ordre de passage. Identifiants en tête de `prisma/seed-combat.mjs` ; `node prisma/seed-combat.mjs --clean` retire tout.

## Déployer avec Docker

```sh
cp .env.example .env      # remplir JWT_SECRET, ADMIN_*, MYSQL_*, ORIGIN
docker compose up -d --build
docker compose logs -f app
```

Le site répond sur `http://localhost:3010` (réglable avec `APP_PORT`). Au démarrage, le conteneur met la base au niveau du schéma Prisma, crée le compte MJ décrit par `ADMIN_LOGIN` / `ADMIN_PASSWORD` s'il n'existe pas, puis lance le site.

- La base MySQL et les images envoyées vivent dans deux volumes (`lastfragment2_db_data`, `lastfragment2_uploads`) : `docker compose down` les conserve, `docker compose down -v` les supprime.
- La base n'est pas exposée sur la machine. Pour une sauvegarde : `docker compose exec db sh -c 'mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' > sauvegarde.sql`.
- Derrière un reverse proxy en HTTPS, mettre l'adresse publique dans `ORIGIN` (`https://…`) : c'est elle qui autorise les formulaires et qui réserve le cookie de session au HTTPS.
- Après une modification du code : `docker compose up -d --build`.

## Automatisations avec n8n (facultatif)

n8n tourne dans son propre conteneur (`docker-compose.n8n.yml`). Il n'a pas accès à la base : il lit le site par les routes `/integrations/…`, qui exigent l'en-tête `Authorization: Bearer <INTEGRATION_TOKEN>` et n'existent pas sans ce jeton.

**Mise en route**

1. Dans `.env` : renseigner `INTEGRATION_TOKEN` et `N8N_ENCRYPTION_KEY`, et ajouter le fichier à Compose : `COMPOSE_FILE=docker-compose.yml:docker-compose.n8n.yml` (avec `COMPOSE_PATH_SEPARATOR=:`).
2. `docker compose up -d --build`, puis ouvrir `http://localhost:5678` et créer le compte propriétaire de n8n.
3. *Credentials → Create credential → Header Auth*, nommé **Last Fragment** : nom `Authorization`, valeur `Bearer <INTEGRATION_TOKEN>`.

Les adresses et jetons vivent dans les identifiants (credentials) de n8n, chiffrés par `N8N_ENCRYPTION_KEY` : ils n'apparaissent ni dans les workflows ni dans leurs exports. Les expressions n'ont pas accès aux variables d'environnement (`$env`), réglage par défaut de n8n.

**Lastdle du jour sur Discord** (`n8n/lastdle-discord.json`)

Chaque nuit à 00:01 (heure de Paris), annonce l'énigme du jour et la réponse de la veille, avec le nombre de joueurs qui l'ont trouvée et le meilleur d'entre eux (le MJ est hors classement). La réponse du jour n'est jamais envoyée.

1. Sur Discord : *Paramètres du salon → Intégrations → Webhooks → Nouveau webhook*, copier l'URL.
2. Dans n8n : *Credentials → Create credential → Discord Webhook*, nommé **Discord Lastdle**, y coller l'URL.
3. *Workflows → Import from File*, choisir `n8n/lastdle-discord.json`, puis choisir l'identifiant de *Lire le Lastdle du jour* (**Last Fragment**) et celui d'*Envoyer sur Discord* (**Discord Lastdle**) : un export ne transporte pas les identifiants.
4. *Execute workflow* pour un essai, puis activer le workflow.

Pour tester l'annonce d'un jour passé : `/integrations/lastdle?date=2026-10-25` (les jours à venir sont refusés). Les portraits n'apparaissent dans Discord que si `ORIGIN` est une adresse publique.

## Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run check` | Vérification des types et des composants |
| `npm test` | Tests des règles de jeu |
| `npm run build` | Build de production |

## Organisation

| Dossier | Contenu |
|---|---|
| `src/lib/game/` | Règles de jeu pures : stats, puissance, bonus d'armure et de passifs, inventaire. Testées. |
| `src/lib/server/` | Accès à la base, sessions, chargement et actions de la fiche de jeu, uploads. |
| `src/lib/server/table/` | Table de jeu : vues filtrées par joueur (`state.ts`), diffusion temps réel (`hub.ts`), actions (`actions.ts`). |
| `src/lib/table/` | Types partagés et client navigateur de la table de jeu. |
| `src/lib/server/admin/` | Back-office générique : `resources.ts` décrit chaque table, `crud.ts` fait le reste. |
| `src/lib/components/` | Composants : `ui/` (briques de base), `game/`, `sheet/` (fiche de jeu), `admin/`, `layout/`. |
| `src/routes/` | Pages. Tout ce qui est sous `/admin` est réservé au MJ par `hooks.server.ts`. |

La table de jeu (`/outils/table`) garde les connexions en mémoire : le site doit tourner en une seule instance (c'est le cas avec Docker). Derrière nginx, le flux `/outils/table/*/events` ne doit pas être mis en tampon (l'en-tête `X-Accel-Buffering: no` est déjà envoyé).

Pour ajouter une table au back-office, il suffit de la décrire dans `src/lib/server/admin/resources.ts`.

Un compte devient MJ quand son rôle vaut 10 (réglable dans Espace MJ → Joueurs). Un nouveau compte n'a pas de personnage : c'est le MJ qui l'associe.

L'inventaire des fonctionnalités et l'avancement sont dans [FONCTIONNALITES.md](FONCTIONNALITES.md).
