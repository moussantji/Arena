# Aperçus du site IPFS-BK

Captures haute fidélité des écrans principaux, générées par `site/scripts/preview.py`
(même palette, mêmes typographies Fraunces/Manrope, mêmes photographies et contenus
que le site React).

| Fichier | Écran |
|---|---|
| `01-accueil.jpg` | Accueil — hero, chiffres clés, engagement, programmes |
| `02-formations.jpg` | Catalogue des 14 formations avec filtres |
| `03-application-mobile.jpg` | Présentation de l'application mobile (écrans, QR, stores) |
| `04-personnel-pc.jpg` | **Version PC** affichée quand un membre du personnel est connecté |
| `05-connexion.jpg` | Connexion 3 profils (personnel / étudiant / parent) |
| `06-blog.jpg` | Blog / actualités |
| `07-mobile.jpg` | Accueil sur mobile (390 px) — menu hamburger, hero et chiffres en 2×2 |
| `08-tablette.jpg` | Accueil sur tablette (834 px) — grilles en 2 colonnes |

Pour régénérer : `cd site && pip install pymupdf fonttools brotli && python3 scripts/preview.py`
