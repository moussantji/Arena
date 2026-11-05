-- =============================================================
-- Kalanso — migration serveur du 5 novembre 2026 (lot 3)
-- À exécuter via phpMyAdmin (onglet SQL) sur la base de
-- l'établissement, APRÈS le déploiement de deploy/lws.
-- Sans danger pour les données : crée la table de liaison
-- parent ↔ élève, aucune donnée existante n'est modifiée.
-- =============================================================

CREATE TABLE `parent_student` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `student_id` BIGINT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `parent_student_user_id_student_id_unique` (`user_id`, `student_id`),
  KEY `parent_student_student_id_index` (`student_id`),
  CONSTRAINT `parent_student_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `parent_student_student_id_foreign`
    FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
