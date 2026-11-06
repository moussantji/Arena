-- ============================================================
-- Kalanso — Migration blog (2026-11-06) — PARTIE B (OPTIONNEL)
-- Contenu éditorial : les 11 articles de l'institut rédigés et
-- publiés en local (dates réelles, IDs 1 à 11).
--
-- ⚠️ À N'EXÉCUTER QU'UNE SEULE FOIS, sur une base `blog_posts`
--    VIDE (sinon : doublons). Si vous souhaitez garder la base
--    telle quelle, sautez cette partie.
-- Ordres recommandés :
--   1. PARTIE A (kalanso-migrations-2026-11-06-blog.sql)
--   2. déposer kalanso-blog-images.zip dans storage/app/public
--      (décompression : le dossier blog_posts/ doit s'y trouver)
--   3. PARTIE B ci-dessous
-- Les images sont référencées sous blog_posts/<id>/une.<ext> —
-- sans elles, les articles s'affichent sans image (remplacées
-- par le visuel générique du site).
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.14-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: arena
-- ------------------------------------------------------
-- Server version	10.11.14-MariaDB-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `blog_posts`
--

LOCK TABLES `blog_posts` WRITE;
/*!40000 ALTER TABLE `blog_posts` DISABLE KEYS */;
INSERT INTO `blog_posts` VALUES
(1,'licence-professionnelle-kinesitherapie-rentree-novembre-2026','Licence professionnelle en kinésithérapie : rentrée le 23 novembre 2026','Formations','Institut Bernard Kouchner','L’Institut Privé de Formation Sanitaire Bernard Kouchner lance à Bamako une licence professionnelle en kinésithérapie. Les inscriptions sont ouvertes pour la rentrée du 23 novembre 2026.','[\"Apprendre \\u00e0 \\u00e9valuer un mouvement, accompagner une r\\u00e9\\u00e9ducation et aider un patient \\u00e0 retrouver son autonomie : c\\u2019est le m\\u00e9tier auquel pr\\u00e9pare la nouvelle licence professionnelle en kin\\u00e9sith\\u00e9rapie de l\\u2019IFS-BK.\",\"La formation dure trois ans, r\\u00e9partis sur six semestres. Elle associe cours, travaux pratiques et stages cliniques. Le programme aborde notamment l\\u2019anatomie et la physiologie, la biom\\u00e9canique, la r\\u00e9\\u00e9ducation en traumatologie et en orthop\\u00e9die, la neurologie et la kin\\u00e9sith\\u00e9rapie respiratoire.\",\"Les enseignements se d\\u00e9roulent au sein de l\\u2019Institut Priv\\u00e9 de Formation Sanitaire Bernard Kouchner, \\u00e9tablissement agr\\u00e9\\u00e9, et pr\\u00e9parent \\u00e0 une licence professionnelle reconnue.\",\"Les cours d\\u00e9butent le 23 novembre 2026. Les inscriptions se poursuivent : contactez l\\u2019\\u00e9quipe de l\\u2019Institut pour conna\\u00eetre les conditions d\\u2019admission et les pi\\u00e8ces \\u00e0 fournir.\"]',4,1,'2026-11-05 00:00:00','2026-11-06 20:17:29','2026-11-06 20:17:29'),
(2,'resultats-admission-bt-sante-2026','Résultats d’admission au BT-Santé 2026','Vie académique','La Direction des Études','22 candidats admis sur 23 au BT-Santé 2026, soit 95,65 % de réussite. Santé Publique et TLP affichent 100 % de réussite.','[\"Une belle performance pour l\\u2019IFS-BK : 22 candidats admis sur 23 au BT-Sant\\u00e9 2026, soit 95,65 % de r\\u00e9ussite. Sant\\u00e9 Publique et TLP affichent 100 % de r\\u00e9ussite.\",\"F\\u00e9licitations \\u00e0 toute la promotion, aux formateurs et aux \\u00e9quipes d\\u2019encadrement qui accompagnent les apprenants au quotidien.\"]',3,1,'2026-09-25 00:00:00','2026-11-06 20:17:29','2026-11-06 20:17:29'),
(3,'vacances-academiques-2026-formations-gratuites-bamako','Vacances Académiques 2026 : formez-vous gratuitement pendant les vacances','Vie académique','Institut Bernard Kouchner','Du 10 août au 22 septembre 2026, rejoignez gratuitement les Vacances Académiques de l’IPFS-BK à Bamako. Places limitées.','[\"Du 10 ao\\u00fbt au 22 septembre 2026, l\\u2019Institut ouvre gratuitement ses Vacances Acad\\u00e9miques : ateliers pratiques, initiation aux gestes de premiers secours, communication professionnelle et d\\u00e9couverte des m\\u00e9tiers de la sant\\u00e9.\",\"Les places sont limit\\u00e9es. L\\u2019inscription se fait aupr\\u00e8s de l\\u2019\\u00e9quipe d\\u2019accompagnement candidat.\"]',3,0,'2026-08-15 00:00:00','2026-11-06 20:17:29','2026-11-06 20:17:29'),
(4,'inscriptions-rentree-2026-2027-ecole-sante-bamako','Rentrée 2026-2027 : les inscriptions sont ouvertes à l’IPFS-BK','Vie académique','Institut Bernard Kouchner','Inscrivez-vous à l’IPFS-BK à Bamako : infirmier, sage-femme, kinésithérapie, biologie, nutrition et promotion médicale.','[\"Les inscriptions pour la rentr\\u00e9e acad\\u00e9mique 2026-2027 sont ouvertes. L\\u2019Institut accueille les candidats de niveau DEF, BAC et professionnels en formation continue.\",\"Le dossier comprend quatre photos d\\u2019identit\\u00e9 r\\u00e9centes, une demande timbr\\u00e9e adress\\u00e9e au Directeur de l\\u2019Institut, une copie de l\\u2019acte de naissance et une copie l\\u00e9galis\\u00e9e du dipl\\u00f4me requis.\",\"Les frais peuvent \\u00eatre r\\u00e9gl\\u00e9s par versement ou virement bancaire sur le compte BNDA 490001201401.\"]',4,0,'2026-08-15 00:00:00','2026-11-06 20:17:29','2026-11-06 20:17:29'),
(5,'sous-legide-de-la-bravoure-la-promotion-feu-general-sadio-camara','Sous l’égide de la bravoure : la Promotion « Feu Général Sadio Camara » prend son envol','Vie étudiante','Institut Privé de Formation Bernard Kouchner','Bamako, le 9 mai 2026 — l’IPFS-BK a célébré la sortie de sa 4ème promotion, qui porte désormais le nom de feu le Général de Corps d’Armée Sadio Camara.','[\"Bamako, le 9 Mai 2026 \\u2013 Le ciel de Bamako semblait porter samedi dernier le poids de la solennit\\u00e9 et de l\\u2019esp\\u00e9rance. Dans une \\u00e9motion palpable, l\\u2019Institut Priv\\u00e9 de Formation Sanitaire Bernard Kouchner (IPFS-BK) a c\\u00e9l\\u00e9br\\u00e9 la sortie de sa 4\\u00e8me promotion.\",\"Une promotion qui porte d\\u00e9sormais un nom synonyme de rigueur et de don de soi : celui de feu le G\\u00e9n\\u00e9ral de Corps d\\u2019Arm\\u00e9e Sadio Camara.\",\"La c\\u00e9r\\u00e9monie a r\\u00e9uni familles, formateurs, partenaires hospitaliers et autorit\\u00e9s, autour des dipl\\u00f4m\\u00e9s d\\u00e9sormais engag\\u00e9s sur le terrain.\"]',5,0,'2026-05-14 00:00:00','2026-11-06 20:17:29','2026-11-06 20:17:29'),
(6,'ligue-universitaire-de-bamako','L’Institut Bernard Kouchner remporte la première Ligue Universitaire de Bamako','Vie étudiante','Institut Bernard Kouchner','Une première édition mémorable : les étudiants de l’Institut Bernard Kouchner décrochent la coupe de la Ligue Universitaire de Bamako.','[\"Une premi\\u00e8re \\u00e9dition m\\u00e9morable : les \\u00e9tudiants de l\\u2019Institut Bernard Kouchner d\\u00e9crochent la coupe de la Ligue Universitaire de Bamako.\",\"Une victoire qui illustre l\\u2019esprit d\\u2019\\u00e9quipe et l\\u2019engagement des apprenants au-del\\u00e0 des salles de cours.\"]',2,0,'2025-08-26 00:00:00','2026-11-06 20:17:30','2026-11-06 20:17:30'),
(7,'club-toastmasters-communication-leadership','Lancement du Club Toastmasters de l’Institut Bernard Kouchner','Formations','Institut Bernard Kouchner','Un espace d’apprentissage consacré à l’éloquence, à la confiance en soi, au leadership et à la communication professionnelle.','[\"Le Club Toastmasters ouvre un espace d\\u2019apprentissage consacr\\u00e9 \\u00e0 l\\u2019\\u00e9loquence, \\u00e0 la confiance en soi, au leadership et \\u00e0 la communication professionnelle.\",\"Les s\\u00e9ances sont ouvertes aux \\u00e9tudiants de tous niveaux et aux professionnels de sant\\u00e9 souhaitant renforcer leur aisance \\u00e0 l\\u2019oral.\"]',3,0,'2023-08-21 00:00:00','2026-11-06 20:17:30','2026-11-06 20:17:30'),
(8,'programme-vacances-academiques','Programme de vacances académiques : apprendre autrement','Communiqués','Institut Bernard Kouchner','Un programme associant apprentissage, activités éducatives et moments de découverte pendant les vacances académiques.','[\"Un programme associant apprentissage, activit\\u00e9s \\u00e9ducatives et moments de d\\u00e9couverte pendant les vacances acad\\u00e9miques.\",\"Objectif : maintenir la curiosit\\u00e9, consolider les acquis et faire d\\u00e9couvrir les m\\u00e9tiers de la sant\\u00e9 autrement.\"]',2,0,'2023-07-24 00:00:00','2026-11-06 20:17:30','2026-11-06 20:17:30'),
(9,'delegue-medical-metier-formation','Délégué médical : un métier au carrefour de la santé et de la communication','Métiers de la santé','Institut Bernard Kouchner','Découvrez le rôle du délégué médical et les compétences développées par la formation de l’Institut Bernard Kouchner.','[\"Le d\\u00e9l\\u00e9gu\\u00e9 m\\u00e9dical fait le lien entre les laboratoires pharmaceutiques et les professionnels de sant\\u00e9 : information scientifique, promotion \\u00e9thique et \\u00e9coute du terrain.\",\"La formation de l\\u2019Institut d\\u00e9veloppe les comp\\u00e9tences en pharmacologie, communication, techniques de vente et \\u00e9thique professionnelle.\"]',4,0,'2022-10-14 00:00:00','2026-11-06 20:17:30','2026-11-06 20:17:30'),
(10,'resultats-academiques-2021-2022','Résultats académiques 2021–2022 de l’Institut Bernard Kouchner','Vie académique','Institut Bernard Kouchner','Archive de l’annonce consacrée aux résultats des différentes filières pour l’année académique 2021–2022.','[\"Archive de l\\u2019annonce consacr\\u00e9e aux r\\u00e9sultats des diff\\u00e9rentes fili\\u00e8res pour l\\u2019ann\\u00e9e acad\\u00e9mique 2021\\u20132022.\",\"Les r\\u00e9sultats par fili\\u00e8re sont consultables aupr\\u00e8s de la Direction des \\u00e9tudes.\"]',1,0,'2022-07-30 00:00:00','2026-11-06 20:17:30','2026-11-06 20:17:30'),
(11,'certification-premiere-promotion-delegues-medicaux-pharmaceutiques','Certification de la première promotion de délégués médicaux et pharmaceutiques','Vie académique','Institut Bernard Kouchner','Retour sur la certification de la première promotion de délégués médicaux et pharmaceutiques de l’Institut Bernard Kouchner.','[\"Retour sur la certification de la premi\\u00e8re promotion de d\\u00e9l\\u00e9gu\\u00e9s m\\u00e9dicaux et pharmaceutiques de l\\u2019Institut Bernard Kouchner.\",\"Une \\u00e9tape fondatrice pour la fili\\u00e8re promotion m\\u00e9dicale, aujourd\\u2019hui l\\u2019un des parcours phares de l\\u2019Institut.\"]',3,0,'2022-07-25 00:00:00','2026-11-06 20:17:30','2026-11-06 20:17:30');
/*!40000 ALTER TABLE `blog_posts` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-06 20:58:10

-- Images à la une (mêmes IDs que les articles)
/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.14-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: arena
-- ------------------------------------------------------
-- Server version	10.11.14-MariaDB-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Dumping data for table `photos`
--
-- WHERE:  blog_post_id IS NOT NULL

LOCK TABLES `photos` WRITE;
/*!40000 ALTER TABLE `photos` DISABLE KEYS */;
INSERT INTO `photos` VALUES
(1,'blog_posts/1/une.jpg',NULL,NULL,NULL,NULL,1,'2026-11-06 20:17:29','2026-11-06 20:17:29'),
(2,'blog_posts/2/une.jpg',NULL,NULL,NULL,NULL,2,'2026-11-06 20:17:29','2026-11-06 20:17:29'),
(3,'blog_posts/3/une.jpg',NULL,NULL,NULL,NULL,3,'2026-11-06 20:17:29','2026-11-06 20:17:29'),
(4,'blog_posts/4/une.jpg',NULL,NULL,NULL,NULL,4,'2026-11-06 20:17:29','2026-11-06 20:17:29'),
(5,'blog_posts/5/une.jpg',NULL,NULL,NULL,NULL,5,'2026-11-06 20:17:29','2026-11-06 20:17:29'),
(6,'blog_posts/6/une.jpg',NULL,NULL,NULL,NULL,6,'2026-11-06 20:17:30','2026-11-06 20:17:30'),
(7,'blog_posts/7/une.jpg',NULL,NULL,NULL,NULL,7,'2026-11-06 20:17:30','2026-11-06 20:17:30'),
(8,'blog_posts/8/une.jpg',NULL,NULL,NULL,NULL,8,'2026-11-06 20:17:30','2026-11-06 20:17:30'),
(9,'blog_posts/9/une.jpg',NULL,NULL,NULL,NULL,9,'2026-11-06 20:17:30','2026-11-06 20:17:30'),
(10,'blog_posts/10/une.jpg',NULL,NULL,NULL,NULL,10,'2026-11-06 20:17:30','2026-11-06 20:17:30'),
(11,'blog_posts/11/une.jpg',NULL,NULL,NULL,NULL,11,'2026-11-06 20:17:30','2026-11-06 20:17:30');
/*!40000 ALTER TABLE `photos` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-06 20:58:10

SET FOREIGN_KEY_CHECKS = 1;
