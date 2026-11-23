-- Jeu de cartes : artiste des cartes, boutique (points, offres, échanges conclus) et boosters
-- spéciaux gardés par les joueurs.
--
-- Migration sans perte : trois colonnes ajoutées avec une valeur par défaut (ou nullables) et
-- trois tables nouvelles. Aucune colonne renommée, modifiée ou supprimée ; les données existantes
-- ne changent pas :
--   - `card_templates.artist` reste NULL, rien ne s'affiche tant qu'il n'est pas renseigné ;
--   - `card_sets.special` vaut 0 : toutes les séries restent des boosters ordinaires ;
--   - `card_wallets.points` vaut 0 pour chaque joueur.
--
-- Trois façons de l'appliquer (une seule suffit) :
--   1. Redéployer : le service Docker `migrate` lance `prisma db push`, qui crée exactement ces
--      colonnes et ces tables (il refuse de lui-même tout changement qui perdrait des données).
--   2. Sur une base locale (DATABASE_URL du .env) : `npx prisma db push`, même garantie.
--   3. À la main, après une sauvegarde : exécuter ce fichier avec un compte MySQL qui a les droits
--      ALTER, CREATE et REFERENCES. Ne pas le relancer une seconde fois (MySQL refuserait d'ajouter
--      une colonne ou une table déjà présente, sans rien casser).
--
-- Pour vérifier avant ou après :
--   SHOW COLUMNS FROM `card_templates` LIKE 'artist';
--   SHOW COLUMNS FROM `card_sets` LIKE 'special';
--   SHOW COLUMNS FROM `card_wallets` LIKE 'points';
--   SHOW TABLES LIKE 'card_%';

ALTER TABLE `card_sets` ADD COLUMN `special` BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE `card_templates` ADD COLUMN `artist` VARCHAR(255) NULL;

ALTER TABLE `card_wallets` ADD COLUMN `points` INTEGER NOT NULL DEFAULT 0;

CREATE TABLE `card_held_boosters` (
    `player_id` INTEGER NOT NULL,
    `set_id` INTEGER NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,

    INDEX `card_held_boosters_set_id_idx`(`set_id`),
    PRIMARY KEY (`player_id`, `set_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `card_shop_offers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(80) NOT NULL,
    `description` VARCHAR(300) NULL,
    `price` JSON NOT NULL,
    `reward` JSON NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT false,
    `starts_at` DATETIME(3) NULL,
    `ends_at` DATETIME(3) NULL,
    `per_player` INTEGER NULL,
    `stock` INTEGER NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `card_shop_purchases` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `offer_id` INTEGER NOT NULL,
    `player_id` INTEGER NOT NULL,
    `detail` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `card_shop_purchases_offer_id_player_id_idx`(`offer_id`, `player_id`),
    INDEX `card_shop_purchases_player_id_idx`(`player_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `card_held_boosters` ADD CONSTRAINT `card_held_boosters_player_id_fkey` FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `card_held_boosters` ADD CONSTRAINT `card_held_boosters_set_id_fkey` FOREIGN KEY (`set_id`) REFERENCES `card_sets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `card_shop_purchases` ADD CONSTRAINT `card_shop_purchases_offer_id_fkey` FOREIGN KEY (`offer_id`) REFERENCES `card_shop_offers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `card_shop_purchases` ADD CONSTRAINT `card_shop_purchases_player_id_fkey` FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
