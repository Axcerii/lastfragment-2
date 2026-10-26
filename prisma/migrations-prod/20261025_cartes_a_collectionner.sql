-- Cartes à collectionner : séries, paquets, modèles, exemplaires, historique, réserves de
-- boosters, ouvertures, échanges, réglages (dont la chance de God Pack) et boosters
-- supplémentaires des cartes génériques.
--
-- Migration sans perte : uniquement des tables ajoutées et leurs clés étrangères vers `players`.
-- Aucune table ni colonne existante n'est renommée, modifiée ou supprimée.
-- Le jeu reste caché aux joueurs tant que le MJ ne l'a pas rendu public (card_settings.public = 0).
--
-- Deux façons de l'appliquer en prod (une seule suffit) :
--   1. Redéployer : le service Docker `migrate` lance `prisma db push`, qui crée exactement ces
--      tables (il refuse de lui-même tout changement qui perdrait des données).
--   2. À la main, après une sauvegarde : exécuter ce fichier avec un compte MySQL qui a le droit
--      CREATE / ALTER / REFERENCES.
--
-- Pour vérifier avant ou après :
--   SHOW TABLES LIKE 'card%';
--   SHOW COLUMNS FROM `card_settings` LIKE 'god_pack';

-- CreateTable
CREATE TABLE `card_sets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(80) NOT NULL,
    `code` VARCHAR(8) NOT NULL,
    `description` VARCHAR(400) NULL,
    `logo` VARCHAR(255) NULL,
    `banner` VARCHAR(255) NULL,
    `color` VARCHAR(7) NOT NULL DEFAULT '#e5b8cc',
    `active` BOOLEAN NOT NULL DEFAULT false,
    `starts_at` DATETIME(3) NULL,
    `ends_at` DATETIME(3) NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `card_packs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `set_id` INTEGER NULL,
    `name` VARCHAR(60) NOT NULL,
    `image` VARCHAR(255) NULL,
    `show_text` BOOLEAN NOT NULL DEFAULT false,
    `color` VARCHAR(7) NOT NULL DEFAULT '#e5b8cc',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `card_packs_set_id_idx`(`set_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `card_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `set_id` INTEGER NULL,
    `number` INTEGER NULL,
    `type` VARCHAR(20) NOT NULL,
    `rarity` TINYINT NOT NULL,
    `name` VARCHAR(60) NOT NULL,
    `status` VARCHAR(12) NOT NULL DEFAULT 'brouillon',
    `in_all` BOOLEAN NOT NULL DEFAULT true,
    `weight` INTEGER NOT NULL DEFAULT 10,
    `max_prints` INTEGER NULL,
    `printed` INTEGER NOT NULL DEFAULT 0,
    `face` JSON NOT NULL,
    `source_kind` VARCHAR(12) NULL,
    `source_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `card_templates_status_idx`(`status`),
    UNIQUE INDEX `card_templates_set_id_number_key`(`set_id`, `number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cards` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `template_id` INTEGER NOT NULL,
    `owner_id` INTEGER NULL,
    `serial` INTEGER NOT NULL,
    `wear` DOUBLE NOT NULL,
    `origin` VARCHAR(10) NOT NULL,
    `pinned` BOOLEAN NOT NULL DEFAULT false,
    `obtained_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cards_owner_id_idx`(`owner_id`),
    UNIQUE INDEX `cards_template_id_serial_key`(`template_id`, `serial`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `card_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `card_id` INTEGER NOT NULL,
    `kind` VARCHAR(10) NOT NULL,
    `from_id` INTEGER NULL,
    `to_id` INTEGER NULL,
    `trade_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `card_events_card_id_idx`(`card_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `card_wallets` (
    `player_id` INTEGER NOT NULL,
    `stock` INTEGER NOT NULL,
    `since` DATETIME(3) NOT NULL,
    `opened` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`player_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `card_openings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `player_id` INTEGER NOT NULL,
    `set_id` INTEGER NULL,
    `pack_id` INTEGER NULL,
    `card_ids` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `seen_at` DATETIME(3) NULL,

    INDEX `card_openings_player_id_id_idx`(`player_id`, `id`),
    INDEX `card_openings_player_id_seen_at_idx`(`player_id`, `seen_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `card_trades` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `from_id` INTEGER NOT NULL,
    `to_id` INTEGER NOT NULL,
    `status` VARCHAR(10) NOT NULL DEFAULT 'attente',
    `message` VARCHAR(200) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolved_at` DATETIME(3) NULL,

    INDEX `card_trades_to_id_status_idx`(`to_id`, `status`),
    INDEX `card_trades_from_id_status_idx`(`from_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `card_trade_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `trade_id` INTEGER NOT NULL,
    `card_id` INTEGER NOT NULL,
    `offered` BOOLEAN NOT NULL,

    INDEX `card_trade_items_card_id_idx`(`card_id`),
    UNIQUE INDEX `card_trade_items_trade_id_card_id_key`(`trade_id`, `card_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `card_settings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `public` BOOLEAN NOT NULL DEFAULT false,
    `booster_minutes` INTEGER NOT NULL DEFAULT 480,
    `booster_max` INTEGER NOT NULL DEFAULT 3,
    `starter_boosters` INTEGER NOT NULL DEFAULT 1,
    `cards_per_booster` INTEGER NOT NULL DEFAULT 5,
    `guaranteed` INTEGER NOT NULL DEFAULT 3,
    `god_pack` DOUBLE NOT NULL DEFAULT 0,
    `rates` JSON NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `card_packs` ADD CONSTRAINT `card_packs_set_id_fkey` FOREIGN KEY (`set_id`) REFERENCES `card_sets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `card_templates` ADD CONSTRAINT `card_templates_set_id_fkey` FOREIGN KEY (`set_id`) REFERENCES `card_sets`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cards` ADD CONSTRAINT `cards_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `card_templates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cards` ADD CONSTRAINT `cards_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `players`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `card_events` ADD CONSTRAINT `card_events_card_id_fkey` FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `card_events` ADD CONSTRAINT `card_events_from_id_fkey` FOREIGN KEY (`from_id`) REFERENCES `players`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `card_events` ADD CONSTRAINT `card_events_to_id_fkey` FOREIGN KEY (`to_id`) REFERENCES `players`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `card_wallets` ADD CONSTRAINT `card_wallets_player_id_fkey` FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `card_openings` ADD CONSTRAINT `card_openings_player_id_fkey` FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `card_openings` ADD CONSTRAINT `card_openings_set_id_fkey` FOREIGN KEY (`set_id`) REFERENCES `card_sets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `card_openings` ADD CONSTRAINT `card_openings_pack_id_fkey` FOREIGN KEY (`pack_id`) REFERENCES `card_packs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `card_trades` ADD CONSTRAINT `card_trades_from_id_fkey` FOREIGN KEY (`from_id`) REFERENCES `players`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `card_trades` ADD CONSTRAINT `card_trades_to_id_fkey` FOREIGN KEY (`to_id`) REFERENCES `players`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `card_trade_items` ADD CONSTRAINT `card_trade_items_trade_id_fkey` FOREIGN KEY (`trade_id`) REFERENCES `card_trades`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `card_trade_items` ADD CONSTRAINT `card_trade_items_card_id_fkey` FOREIGN KEY (`card_id`) REFERENCES `cards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;


-- Boosters supplémentaires d'un modèle (cartes génériques qui tombent aussi d'autres séries)
-- CreateTable
CREATE TABLE `card_template_boosters` (
    `template_id` INTEGER NOT NULL,
    `set_id` INTEGER NOT NULL,

    INDEX `card_template_boosters_set_id_idx`(`set_id`),
    PRIMARY KEY (`template_id`, `set_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `card_template_boosters` ADD CONSTRAINT `card_template_boosters_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `card_templates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `card_template_boosters` ADD CONSTRAINT `card_template_boosters_set_id_fkey` FOREIGN KEY (`set_id`) REFERENCES `card_sets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

