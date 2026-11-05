-- =============================================================
-- Kalanso — migrations serveur du 5 novembre 2026 (lot 2)
-- À exécuter via phpMyAdmin (LWS Panel → Bases de données →
-- phpMyAdmin → onglet SQL) sur la base de l'établissement.
-- Sans danger pour les données : ajoute une colonne, puis
-- désigne le tout premier compte comme créateur.
-- =============================================================

-- 1) Drapeau « créateur » sur les comptes.
ALTER TABLE `users`
  ADD COLUMN `is_creator` TINYINT(1) NOT NULL DEFAULT 0 AFTER `role`;

-- 2) Le premier compte créé devient le créateur de l'établissement.
SET @premier := (SELECT MIN(id) FROM `users`);
UPDATE `users` SET `is_creator` = 1 WHERE `id` = @premier;

-- Vérification (facultatif) : doit renvoyer une ligne avec is_creator = 1
SELECT `id`, `name`, `email`, `role`, `is_creator` FROM `users`;
