#!/bin/sh
# Démarrage du conteneur : met la base au niveau du schéma, crée le compte MJ, puis lance le site.
set -e

# `db push` n'applique que les changements sans perte de données ; il s'arrête sinon,
# et le conteneur avec lui, plutôt que de supprimer quoi que ce soit.
echo "[démarrage] Mise à jour du schéma de la base…"
npx prisma db push --skip-generate

node prisma/ensure-admin.mjs

echo "[démarrage] Lancement du site sur le port ${PORT:-3000}"
exec node build
