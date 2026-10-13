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
| `src/lib/server/admin/` | Back-office générique : `resources.ts` décrit chaque table, `crud.ts` fait le reste. |
| `src/lib/components/` | Composants : `ui/` (briques de base), `game/`, `sheet/` (fiche de jeu), `admin/`, `layout/`. |
| `src/routes/` | Pages. Tout ce qui est sous `/admin` est réservé au MJ par `hooks.server.ts`. |

Pour ajouter une table au back-office, il suffit de la décrire dans `src/lib/server/admin/resources.ts`.

Un compte devient MJ quand son rôle vaut 10 (réglable dans Espace MJ → Joueurs). Un nouveau compte n'a pas de personnage : c'est le MJ qui l'associe.

L'inventaire des fonctionnalités et l'avancement sont dans [FONCTIONNALITES.md](FONCTIONNALITES.md).
