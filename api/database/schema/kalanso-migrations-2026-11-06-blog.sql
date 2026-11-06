-- ============================================================
-- Kalanso — Mise en ligne du blog (2026-11-06) — PARTIE A
-- Structure uniquement, rejouable sans dommage (IF NOT EXISTS /
-- colonnes et clé étrangère ajoutées seulement si absentes).
--
-- À exécuter via phpMyAdmin sur la base LWS AVANT le clic
-- « Déployer » du code du blog.
--
-- Si vous voulez aussi les 11 articles rédigés en local,
-- exécutez ENSUITE kalanso-migrations-2026-11-06-blog-seed.sql
-- (et déposez kalanso-blog-images.zip dans storage/app/public).
-- ============================================================

SET NAMES utf8mb4;

-- Table des articles du blog
CREATE TABLE IF NOT EXISTS `blog_posts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(220) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Vie académique',
  `author` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Institut Bernard Kouchner',
  `summary` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `reading_time` smallint unsigned NOT NULL DEFAULT 3,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `published_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `blog_posts_slug_unique` (`slug`),
  KEY `blog_posts_published_at_index` (`published_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Colonne photos.blog_post_id (image à la une d'un article)
SET @col := (SELECT COUNT(*) FROM information_schema.columns
              WHERE table_schema = DATABASE() AND table_name = 'photos' AND column_name = 'blog_post_id');
SET @sql := IF(@col = 0,
  'ALTER TABLE `photos` ADD COLUMN `blog_post_id` bigint unsigned NULL AFTER `school_id`',
  'DO 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Clé étrangère photos.blog_post_id → blog_posts.id
SET @fk := (SELECT COUNT(*) FROM information_schema.table_constraints
              WHERE table_schema = DATABASE() AND table_name = 'photos'
                AND constraint_name = 'photos_blog_post_id_foreign');
SET @sql := IF(@fk = 0,
  'ALTER TABLE `photos` ADD CONSTRAINT `photos_blog_post_id_foreign` FOREIGN KEY (`blog_post_id`) REFERENCES `blog_posts` (`id`) ON DELETE CASCADE',
  'DO 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
