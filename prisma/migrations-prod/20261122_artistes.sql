-- Lien vers l'artiste de l'illustration d'un personnage ou d'un monstre (Twitter/X, Instagram,
-- site…), affiché sur la fiche quand il est renseigné.
--
-- Migration sans perte : deux colonnes ajoutées, nullables, sans valeur à remplir.
-- Aucune colonne renommée, modifiée ou supprimée ; les données existantes ne changent pas
-- (les fiches déjà en base ont simplement NULL dans `artist`, donc rien ne s'affiche).
--
-- Trois façons de l'appliquer (une seule suffit) :
--   1. Redéployer : le service Docker `migrate` lance `prisma db push`, qui ajoute exactement
--      ces deux colonnes (il refuse de lui-même tout changement qui perdrait des données).
--   2. Sur une base locale (DATABASE_URL du .env) : `npx prisma db push`, même garantie.
--   3. À la main, après une sauvegarde : exécuter ce fichier avec un compte MySQL qui a le droit ALTER.
--      Ne pas le relancer une seconde fois (MySQL refuserait d'ajouter une colonne déjà présente,
--      sans rien casser).
--
-- Pour vérifier avant ou après :
--   SHOW COLUMNS FROM `characters` LIKE 'artist';
--   SHOW COLUMNS FROM `monsters` LIKE 'artist';

ALTER TABLE `characters` ADD COLUMN `artist` VARCHAR(255) NULL;

ALTER TABLE `monsters` ADD COLUMN `artist` VARCHAR(255) NULL;
