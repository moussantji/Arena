# Kalanso — Application mobile (Android)

Kalanso est l'application mobile de gestion scolaire de l'établissement :
parents, enseignants et direction y accèdent selon leur rôle.

## Périmètre Android (MVP)

| Rôle | Accès |
|---|---|
| **Parent** | Accueil (aperçu enfants), Bulletin par trimestre, Absences, Finances (factures, paiements, solde), Messagerie, Compte (mot de passe) |
| **Enseignant** | Accueil (cours du jour), Saisie des notes (devoirs/compositions par classe et matière), Appel des absences, Élèves (recherche + fiche), Messagerie, Compte |
| **Secrétariat** | Accueil, Élèves, Messagerie, Compte |
| **Comptabilité** | Accueil, Élèves, Finances (synthèse encaissée/en attente/retard), Messagerie, Compte |
| **Direction** | Accueil, Élèves, Comptes parents (créer, lier, réinitialiser, supprimer), Finances, Messagerie, Compte |

**Non inclus dans le MVP** : notifications push (messagerie à l'ouverture seulement),
téléchargement des bulletins/reçus PDF (disponibles sur le PC), connexion Google
(le client OAuth « Application de bureau » n'est pas compatible Android).

## Dépôts liés

- `api/` — API Laravel (Sanctum), endpoints `/api/parent/*` restreints aux
  enfants liés, messagerie cloisonnée par créateur pour les comptes parents.
- `app/` — application PC (Electron) : **les comptes parents se créent côté PC**
  (Paramètres → Utilisateurs → Comptes parents) ou depuis l'onglet Direction sur mobile.
- `DEPLOIEMENT-LWS.md` — procédures de déploiement (API au LWS).

## Développement

Prérequis : Node.js 24+, un téléphone Android avec **Expo Go** (ou un émulateur).

```bash
cd mobile
npm install
npx expo start          # puis scanner le QR code avec Expo Go
```

Le serveur de données est **figé sur la production** (`kalanso.mandenbaoubab.com`).
Pour un environnement de test, surcharger au build :

```bash
EXPO_PUBLIC_KALANSO_API_URL=https://mon-serveur.test/api npx expo start
```

Aucune adresse de serveur n'est affichée dans l'application.

### Vérifications

```bash
npm run typecheck                     # TypeScript strict
npx expo export --platform android    # bundle Metro de production (sans appareil)
```

## Build Play Store

La politique de confidentialité publique exigée par la fiche Play est en ligne :
**https://kalanso.mandenbaoubab.com/confidentialite**

1. La **clé d'upload** est générée et conservée hors du dépôt :
   `/home/pone/kalanso-clefs/kalanso-upload.keystore` (alias `kalanso`,
   mot de passe dans `MOTS-DE-PASSE.txt` — ne jamais committer ni partager).
   Lors de la création de l'app sur la Play Console, activer **Play App Signing** :
   Google ré-signe l'application ; cette clé sert uniquement de *clé de téléversement*.
   Emprunte SHA-256 : `6C:1D:50:F6:D9:FB:A7:49:93:C9:E4:8F:D7:2A:40:71:75:01:3C:F6:54:2A:B0:82:45:99:77:F4:F3:43:C8:42`
2. `npx expo prebuild --platform android`
3. `cd android && ./gradlew bundleRelease` → `app/build/outputs/bundle/release/app-release.aab`
   (configurer la signature release dans `android/app/build.gradle` avec le keystore ci-dessus).
4. Compte développeur Google Play (25 $, paiement unique) + fiche Play Console :
   politique de confidentialité = l'URL ci-dessus ; classification de contenu (IARC) ;
   captures d'écran téléphone ; icône 512×512 ; description courte/complète FR.
5. Uploader l'AAB sur la piste **Tests internes** d'abord.

`applicationId` : `com.kalanso.mobile` — `versionCode` : incrémenter à chaque release.

## Sécurité

- Jeton Sanctum stocké dans le **trousseau sécurisé** (expo-secure-store), jamais en clair.
- HTTPS uniquement ; 15 s de temporisation réseau ; messages d'erreur génériques (aucune
  donnée sensible ni adresse interne exposée).
- Un parent ne voit **que ses enfants** (vérification côté serveur, 404 sinon) ;
  les fils de messagerie d'un parent ne sont visibles que par lui et le personnel.
- Changement de mot de passe : révoque les autres sessions du compte.
- Comptes parents/enseignants refusés sur le PC (réservé direction/secrétariat/comptabilité).

## Structure

```
mobile/
  App.tsx                  — AuthProvider + navigateur
  src/
    api.ts                 — client HTTP (Bearer, timeout, erreurs FR)
    auth.tsx               — session (/me au démarrage)
    children.tsx           — enfants du parent (contexte partagé + sélecteur)
    RootNavigator.tsx      — pile racine + onglets par rôle + en-tête avatar
    theme.ts / ui.tsx      — design « Indigo Minuit » et composants
    format.ts / types.ts   — formatage FR et types API
    screens/               — écrans (connexion, accueil, notes, appel, finances…)
```
