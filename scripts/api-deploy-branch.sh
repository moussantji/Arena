#!/usr/bin/env bash
# Reconstruit la branche deploy/lws : code courant + dépendances de l'API (vendor).
#
# Cette branche est celle que le déploiement Git de l'hébergeur récupère.
# Elle embarque api/vendor pour fonctionner sans Composer sur le serveur.
#
# Utilisation (depuis n'importe où dans le dépôt, sur une branche de travail
# avec un arbre propre) :
#   bash scripts/api-deploy-branch.sh
#   git push origin deploy/lws --force

set -euo pipefail

cd "$(dirname "$0")/.."

BRANCH='deploy/lws'
PREVIOUS="$(git branch --show-current)"

if [[ -z "$PREVIOUS" || "$PREVIOUS" == "$BRANCH" ]]; then
  echo "Placez-vous sur votre branche de travail (pas sur $BRANCH) avant de lancer ce script." >&2
  exit 1
fi

if ! git diff-index --quiet HEAD --; then
  echo "Des modifications non commitées existent : committez-les d'abord." >&2
  exit 1
fi

git branch -D "$BRANCH" 2>/dev/null || true
git checkout -b "$BRANCH"

# Les dépendances sont ajoutées en force : elles restent ignorées dans les
# branches de développement (voir api/.gitignore).
git add -f api/vendor
git commit -m "Déploiement : dépendances de l'API incluses (vendor)"

git checkout "$PREVIOUS"

# Le checkout retire api/vendor (non suivi sur la branche de travail) :
# on le restaure depuis la branche de déploiement pour le développement.
git restore --source="$BRANCH" --worktree -- api/vendor

echo ""
echo "Branche '$BRANCH' prête à partir du code de '$PREVIOUS'."
echo "Pour la publier : git push origin $BRANCH --force"
