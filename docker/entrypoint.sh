#!/bin/sh
# Démarrage du conteneur, en deux rôles :
#   entrypoint.sh migrate   met la base au niveau du schéma, crée les comptes, puis s'arrête
#                           (service `migrate`, seul à détenir les comptes MySQL privilégiés) ;
#   entrypoint.sh           lance le site (service `app`, compte MySQL limité aux données).
set -e

if [ "$1" = "migrate" ]; then
	# `db push` n'applique que les changements sans perte de données ; il s'arrête sinon,
	# et le démarrage avec lui, plutôt que de supprimer quoi que ce soit.
	echo "[démarrage] Mise à jour du schéma de la base…"
	node node_modules/prisma/build/index.js db push --skip-generate

	node prisma/ensure-db-user.mjs
	node prisma/ensure-admin.mjs
	exit 0
fi

echo "[démarrage] Lancement du site sur le port ${PORT:-3000}"
exec node build
