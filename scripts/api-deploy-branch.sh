#!/usr/bin/env bash
# Met à jour la branche deploy/lws : code courant + dépendances de l'API (vendor).
#
# Cette branche est celle que le déploiement Git de l'hébergeur récupère.
# Elle embarque api/vendor pour fonctionner sans Composer sur le serveur.
#
# La branche est APPEND-ONLY : chaque déploiement ajoute un commit au-dessus
# du précédent. Ne jamais la supprimer, la recréer ni la forcer — l'hébergeur
# (clone local) ne peut récupérer les mises à jour que par fast-forward.
#
# Utilisation (depuis n'importe où dans le dépôt, sur une branche de travail
# avec un arbre propre) :
#   bash scripts/api-deploy-branch.sh
#   git push origin deploy/lws

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

# Construit le nouvel arbre SANS toucher au répertoire de travail :
# index temporaire = branche de travail + api/vendor (ajouté en force).
TMP_INDEX="$(git rev-parse --git-dir)/index-kalanso-deploy"
rm -f "$TMP_INDEX"
trap 'rm -f "$TMP_INDEX"' EXIT

GIT_INDEX_FILE="$TMP_INDEX" git read-tree "$PREVIOUS"
GIT_INDEX_FILE="$TMP_INDEX" git add -f api/vendor
NEW_TREE="$(GIT_INDEX_FILE="$TMP_INDEX" git write-tree)"
rm -f "$TMP_INDEX"
trap - EXIT

CURRENT_TREE="$(git rev-parse "$BRANCH^{tree}")"
if [[ "$NEW_TREE" == "$CURRENT_TREE" ]]; then
  echo "deploy/lws est déjà à jour (arbre identique). Rien à commiter."
  exit 0
fi

git update-ref "refs/heads/$BRANCH" \
  "$(git commit-tree "$NEW_TREE" -p "$(git rev-parse "$BRANCH")" \
      -m "Déploiement : code et dépendances de l'API ($(date +%Y-%m-%d), depuis $(git rev-parse --short "$PREVIOUS"))")"

echo "deploy/lws mis à jour (append-only, pas de force push)."
echo "Pour la publier : git push origin $BRANCH"
