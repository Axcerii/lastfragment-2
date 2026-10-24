-- Armes équipables (main gauche / main droite / deux mains) et bonus propres aux armes.
--
-- Migration sans perte : deux colonnes ajoutées, nullables, sans valeur à remplir.
-- Aucune colonne renommée, modifiée ou supprimée ; les données existantes ne changent pas
-- (les objets déjà en base ont simplement NULL dans les deux nouvelles colonnes).
--
-- Les jets saisis à la main n'ont besoin d'aucun changement de base : l'information est rangée
-- dans le JSON `table_logs.data` (clé `manual`).
--
-- Deux façons de l'appliquer en prod (une seule suffit) :
--   1. Redéployer : le service Docker `migrate` lance `prisma db push`, qui ajoute exactement
--      ces deux colonnes (il refuse de lui-même tout changement qui perdrait des données).
--   2. À la main, après une sauvegarde : exécuter ce fichier avec un compte MySQL qui a le droit ALTER.
--
-- Pour vérifier avant ou après :
--   SHOW COLUMNS FROM `items` LIKE 'weapon_bonus';
--   SHOW COLUMNS FROM `items_in_player` LIKE 'hand';

-- Bonus propres d'une arme, codes séparés par des virgules (ex. « ignore-defense:5 », valeur libre).
ALTER TABLE `items` ADD COLUMN `weapon_bonus` VARCHAR(255) NULL;

-- Main qui tient une arme équipée : 'gauche', 'droite' ou 'deux'. NULL pour tout le reste.
ALTER TABLE `items_in_player` ADD COLUMN `hand` VARCHAR(10) NULL;
