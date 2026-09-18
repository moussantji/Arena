# Oculis · Application Desktop Electron

Application de gestion de clinique ophtalmologique (écran Réception & Pilotage) conçue avec la palette officielle **Saphir & Ambre**.

## Caractéristiques fidèles à la maquette
- **Thème Saphir & Ambre** : Bleu saphir (`#1E56D6`), accent or (`#C08A2D`), fond nuit (`#0C1A30`) et surfaces immaculées (`#FFFFFF`).
- **Frameless Window** : Barre de titre intégrée avec contrôles custom et pilule d'URL `app.oculis-clinique.fr/pilotage`.
- **Sidebar complète** : 10 rubriques de navigation spécialisées ophtalmo, logo clinique et profil utilisateur Claire Laurent.
- **Bannière Héro Réception** : Vraie photo de la clinique avec dégradé saphir de lisibilité.
- **4 KPI Cards** : RDV (24), En consult (2), CA du jour (2 840 €), No-show (1).
- **3 Colonnes de pilotage** :
  1. *Agenda du jour* : chronologie avec alertes retard.
  2. *File d'attente* : patients en temps réel avec badges d'examen et action de prise d'attente.
  3. *Dossier actif* : constantes ophtalmologiques (OD/OG, tension oculaire, OCT) et encaissement direct CPAM.

## Démarrage rapide

```bash
cd app-electron
npm install
npm start
```
