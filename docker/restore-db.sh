#!/usr/bin/env bash
# Restauration d'une sauvegarde faite par docker/backup-db.sh.
#
#   docker/restore-db.sh --verifier backups/db/quotidien/lastfragment-2026-11-04_031700.sql.gz
#       Charge la sauvegarde dans une base jetable, compte les lignes de quelques tables, puis
#       supprime cette base. Ne touche ni à la vraie base ni au site : à faire de temps en temps,
#       une sauvegarde jamais relue n'est pas une sauvegarde.
#
#   docker/restore-db.sh backups/db/quotidien/lastfragment-2026-11-04_031700.sql.gz
#       Remplace la vraie base par la sauvegarde. Demande de taper le nom de la base pour confirmer
#       (ou --oui, pour un script). Fait d'abord une sauvegarde de l'état actuel dans
#       backups/avant-restauration/, arrête le site pendant le chargement, puis le relance.
#
# Variables facultatives : DB_SERVICE (défaut : db), APP_SERVICE (défaut : app).

set -Eeuo pipefail
umask 077
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_SERVICE="${DB_SERVICE:-db}"
APP_SERVICE="${APP_SERVICE:-app}"
VERIFY_DB="lastfragment_verification"

log() { printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }
fail() {
	log "ÉCHEC : $*" >&2
	exit 1
}
usage() {
	sed -n '2,15p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
	exit 2
}

mode="restaurer"
confirmed=false
file=""
for arg in "$@"; do
	case "$arg" in
		--verifier) mode="verifier" ;;
		--oui) confirmed=true ;;
		-h | --help) usage ;;
		-*) fail "option inconnue : $arg" ;;
		*) [[ -z "$file" ]] && file="$arg" || fail "une seule sauvegarde à la fois." ;;
	esac
done
[[ -n "$file" ]] || usage
[[ -f "$file" ]] || fail "fichier introuvable : $file"
file="$(cd "$(dirname "$file")" && pwd)/$(basename "$file")"

cd "$PROJECT_DIR"
[[ -n "$(docker compose ps --status running -q "$DB_SERVICE" 2>/dev/null)" ]] ||
	fail "le conteneur « $DB_SERVICE » ne tourne pas."

log "Vérification de l'archive $file"
gzip -t "$file" || fail "l'archive est corrompue."
gzip -dc "$file" | tail -n 1 | grep -q '^-- Dump completed' || fail "le dump est incomplet."
if [[ -f "$file.sha256" ]] && command -v sha256sum >/dev/null; then
	(cd "$(dirname "$file")" && sha256sum -c --quiet "$(basename "$file").sha256") || fail "empreinte SHA-256 différente."
fi

# Exécute une commande SQL dans le conteneur de la base. $1 : compte (app ou root), $2 : base, entrée : SQL.
sql() {
	local account="$1" database="$2"
	if [[ "$account" == root ]]; then
		docker compose exec -T -e TARGET_DB="$database" "$DB_SERVICE" sh -c \
			'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql --user=root --default-character-set=utf8mb4 ${TARGET_DB:+"$TARGET_DB"}'
	else
		docker compose exec -T "$DB_SERVICE" sh -c \
			'MYSQL_PWD="$MYSQL_PASSWORD" exec mysql --user="$MYSQL_USER" --default-character-set=utf8mb4 "$MYSQL_DATABASE"'
	fi
}

# ─── Vérification dans une base jetable ──────────────────────────────────

if [[ "$mode" == verifier ]]; then
	cleanup() { echo "DROP DATABASE IF EXISTS \`$VERIFY_DB\`;" | sql root "" >/dev/null 2>&1 || true; }
	trap cleanup EXIT
	cleanup
	echo "CREATE DATABASE \`$VERIFY_DB\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" | sql root ""
	log "Chargement dans la base jetable « $VERIFY_DB »…"
	gzip -dc "$file" | sql root "$VERIFY_DB" || fail "la sauvegarde ne se charge pas."
	log "Contenu de la sauvegarde :"
	sql root "$VERIFY_DB" <<-'SQL'
		SELECT COUNT(*) AS tables FROM information_schema.tables WHERE table_schema = DATABASE();
		SELECT 'players' AS table_name, COUNT(*) AS lignes FROM players
		UNION ALL SELECT 'characters', COUNT(*) FROM characters
		UNION ALL SELECT 'cards', COUNT(*) FROM cards
		UNION ALL SELECT 'card_templates', COUNT(*) FROM card_templates;
	SQL
	log "Sauvegarde lisible. La base jetable est supprimée."
	exit 0
fi

# ─── Restauration de la vraie base ───────────────────────────────────────

database="$(docker compose exec -T "$DB_SERVICE" sh -c 'printf %s "$MYSQL_DATABASE"')"
if ! $confirmed; then
	[[ -t 0 ]] || fail "pas de terminal pour confirmer : ajoute --oui."
	echo "La base « $database » va être REMPLACÉE par $(basename "$file")."
	echo "Ce qui a été fait depuis cette sauvegarde sera perdu (une copie de l'état actuel est faite avant)."
	read -r -p "Tape le nom de la base pour confirmer : " answer
	[[ "$answer" == "$database" ]] || fail "confirmation refusée, rien n'a été modifié."
fi

log "Sauvegarde de l'état actuel avant restauration…"
BACKUP_DIR="$PROJECT_DIR/backups/avant-restauration" KEEP_DAILY=10 KEEP_WEEKLY=0 KEEP_MONTHLY=0 \
	"$PROJECT_DIR/docker/backup-db.sh" || fail "impossible de sauvegarder l'état actuel, restauration annulée."

log "Arrêt du site pendant le chargement."
docker compose stop "$APP_SERVICE"

log "Chargement de la sauvegarde dans « $database »…"
if ! gzip -dc "$file" | sql app ""; then
	log "ÉCHEC du chargement : le site reste arrêté. Pour revenir à l'état d'avant :" >&2
	log "  docker/restore-db.sh --oui \"\$(ls -1 backups/avant-restauration/quotidien/*.sql.gz | tail -n 1)\"" >&2
	exit 1
fi

log "Relance du site (le service de migration remet le schéma à niveau si besoin)."
docker compose up -d
log "Restauration terminée."
