# Kalanso Mobile — maquettes premium « Indigo Minuit réhaussée »

Sept maquettes haute fidélité de l'exemplaire **mobile** de Kalanso (gestion
d'école), conçues pour valider la direction artistique avant développement.

| Écran | Fichier | Contenu |
|---|---|---|
| 01 | `01-connexion.png` | Connexion : ciel aurore, emblème champagne, carte de verre, Google |
| 02 | `02-accueil.png` | Accueil Direction : KPI (élèves, présence, encaissé), agenda du jour, actions rapides |
| 03 | `03-eleves.png` | Élèves : recherche, filtres de niveau, liste avec statuts de présence |
| 04 | `04-fiche-eleve.png` | Fiche élève : héros, statistiques, onglets, barres de progression par matière |
| 05 | `05-finances.png` | Finances : carte encaissement + graphe, états, factures récentes |
| 06 | `06-notes.png` | Saisie des notes : classe / matière / devoir, saisie par élève, enregistrement |
| 07 | `07-emploi-du-temps.png` | Emploi du temps : semaine, frise horaire, cartes de cours colorées |

## Présentation

Ouvrir `index.html` (ou servir la galerie complète) :

```bash
node gallery/server.js 4173    # → http://localhost:4173/mobile-premium/
```

Cliquez sur une maquette pour l'agrandir (lightbox, touche Échap pour fermer).

## Système visuel

Identité PC **Indigo Minuit** conservée, version luxe :

| Rôle | Couleur |
|---|---|
| Fond profond | `#070B1F` |
| Surface | `#0B1030` |
| Accent indigo | `#5B7CFA` (dégradé vers `#7E9BFF`) |
| Champagne (signal luxe) | `#E0A86F` |
| Encre / texte | `#F0F2FF` |
| Texte atone | `#A7B6FF` |

- **Verre dépoli** : cartes translucides, filets lumineux 1 px, ombres douces.
- **Aurores** : halos dégradés indigo/champagne et particules discrètes sur fond marine.
- **Champagne parcimonieux** : actions fortes, chiffres clés, emblème — jamais plus de deux surfaces dorées par écran.
- **Typographie** : titres larges, secondaire atone, chiffres tabulaires pour les montants (FCFA).
- **Coquille système** : barre d'état 9:41, tab bar à 5 entrées (Accueil · Élèves · Notes · Finances · Plus), pile de détail sans tab bar.

## Suite

Ces maquettes servent de référence visuelle pour la refonte de `mobile/`
(Expo / React Native) : mêmes jetons dans `src/theme.ts`, mêmes composants dans
`src/ui.tsx`, mêmes écrans dans `src/screens/`.
