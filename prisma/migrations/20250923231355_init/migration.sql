-- CreateTable
CREATE TABLE `players` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `login` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` BIGINT NOT NULL,
    `team` BIGINT NOT NULL,
    `character_id` BIGINT UNSIGNED NULL,

    UNIQUE INDEX `players_login_key`(`login`),
    INDEX `players_character_id_index`(`character_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `characters` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `visibility` SMALLINT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `flux` VARCHAR(255) NULL,
    `dragon` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NULL,
    `theme` VARCHAR(255) NULL,
    `race` ENUM('Humain', 'Géant', 'Éternelle', 'Inconnu', 'Dragon', 'Ange') NOT NULL,
    `country` ENUM('Augeaime', 'Inconnu', 'Irisia', 'Amari', 'Mudan', 'Edenia', 'Céleste', 'Saxifra') NOT NULL,
    `image` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `category` VARCHAR(255) NOT NULL,
    `current` SMALLINT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `monsters` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `visibility` SMALLINT NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `dragon` VARCHAR(255) NOT NULL,
    `size` VARCHAR(255) NOT NULL,
    `weight` VARCHAR(255) NOT NULL,
    `dangerosity` BIGINT NOT NULL,
    `image` VARCHAR(255) NOT NULL,
    `effect` TEXT NOT NULL,
    `description` TEXT NOT NULL,
    `current` SMALLINT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `statistics` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `character_id` BIGINT UNSIGNED NOT NULL,
    `qdf` BIGINT NOT NULL,
    `pv` BIGINT NOT NULL,
    `endurance` BIGINT NOT NULL,
    `strength` BIGINT NOT NULL,
    `maitrise` BIGINT NOT NULL,
    `defense` BIGINT NOT NULL,
    `vitesse` BIGINT NOT NULL,
    `accuracy` BIGINT NOT NULL,
    `perception` BIGINT NOT NULL,
    `furtivite` BIGINT NOT NULL,
    `charisme` BIGINT NOT NULL,
    `eloquence` BIGINT NOT NULL,
    `intelligence` BIGINT NOT NULL,

    INDEX `statistics_character_id_index`(`character_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `category` ENUM('Casque', 'Torse', 'Gantelets', 'Jambières', 'Outil', 'Arme', 'Fiole', 'Nourriture', 'Munitions', 'Important', 'Autre', 'Matériaux', 'Animal', 'Sac') NOT NULL,
    `rarity` BIGINT NOT NULL,
    `weight` BIGINT NOT NULL,
    `description` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `items_in_player` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `item_id` BIGINT UNSIGNED NOT NULL,
    `player_id` BIGINT UNSIGNED NOT NULL,
    `localisation` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `armors` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `statistics` VARCHAR(255) NOT NULL,
    `values` VARCHAR(255) NOT NULL,
    `item_id` BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `armors_in_player` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `item_in_player_id` BIGINT UNSIGNED NOT NULL,
    `armor_id` BIGINT UNSIGNED NOT NULL,
    `statistics` VARCHAR(255) NOT NULL,
    `values` VARCHAR(255) NOT NULL,
    `description_add` BIGINT NOT NULL,
    `notes` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `foods` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `weight` BIGINT NOT NULL,
    `type` ENUM('viandes', 'boissons', 'fruits', 'rations') NOT NULL,
    `price` BIGINT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `foods_in_bags` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `item_in_player_id` BIGINT UNSIGNED NOT NULL,
    `food_id` BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `badges` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `badges` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `badges_fusions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `badge_1` ENUM('Artrish', 'Yinva', 'Guizamark', 'Shizari', 'Pestia', 'Chronos', 'Aqua', 'Goliath', 'Drii', 'Lada', 'Pura') NOT NULL,
    `badge_2` ENUM('Artrish', 'Yinva', 'Guizamark', 'Shizari', 'Pestia', 'Chronos', 'Aqua', 'Goliath', 'Drii', 'Lada', 'Pura') NOT NULL,
    `player_id` BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `skills` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `statistics` ENUM('PV', 'QDF', 'Endurance', 'Maîtrise', 'Force', 'Défense', 'Vitesse', 'Précision', 'Perception', 'Furtivité', 'Charisme', 'Éloquence', 'Intelligence') NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `level` BIGINT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `passives` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `character_id` BIGINT UNSIGNED NOT NULL,
    `statistics` VARCHAR(255) NOT NULL,
    `maths` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `players` ADD CONSTRAINT `players_character_id_fkey` FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `statistics` ADD CONSTRAINT `statistics_character_id_fkey` FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `items_in_player` ADD CONSTRAINT `items_in_player_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `items_in_player` ADD CONSTRAINT `items_in_player_player_id_fkey` FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `armors` ADD CONSTRAINT `armors_item_id_fkey` FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `armors_in_player` ADD CONSTRAINT `armors_in_player_item_in_player_id_fkey` FOREIGN KEY (`item_in_player_id`) REFERENCES `items_in_player`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `armors_in_player` ADD CONSTRAINT `armors_in_player_armor_id_fkey` FOREIGN KEY (`armor_id`) REFERENCES `armors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `foods_in_bags` ADD CONSTRAINT `foods_in_bags_item_in_player_id_fkey` FOREIGN KEY (`item_in_player_id`) REFERENCES `items_in_player`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `foods_in_bags` ADD CONSTRAINT `foods_in_bags_food_id_fkey` FOREIGN KEY (`food_id`) REFERENCES `foods`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `badges_fusions` ADD CONSTRAINT `badges_fusions_player_id_fkey` FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `passives` ADD CONSTRAINT `passives_character_id_fkey` FOREIGN KEY (`character_id`) REFERENCES `characters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
