-- ============================================================
--  Kalanso — Migrations du 5 novembre 2026 (traçabilité)
--  À appliquer sur la base EN LIGNE via phpMyAdmin
--  (LWS n'exécute pas les migrations automatiquement).
--
--  1) Crée le journal d'audit `audit_logs` (qui fait quoi, quand).
--  2) Ajoute `locked_at` à `terms` (verrouillage des notes
--     après délibération, par période).
--
--  Innocent : aucun DROP, aucune donnée touchée.
--  À jouer une seule fois.
-- ============================================================

CREATE TABLE `audit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `user_name` varchar(255) NOT NULL,
  `action` varchar(80) NOT NULL,
  `subject_type` varchar(80) DEFAULT NULL,
  `subject_id` varchar(64) DEFAULT NULL,
  `description` varchar(500) NOT NULL,
  `properties` json DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `audit_logs_subject_type_subject_id_index` (`subject_type`, `subject_id`),
  KEY `audit_logs_action_index` (`action`),
  KEY `audit_logs_created_at_index` (`created_at`),
  CONSTRAINT `audit_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `terms`
  ADD COLUMN `locked_at` timestamp NULL DEFAULT NULL AFTER `is_current`;
