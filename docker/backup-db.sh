#!/usr/bin/env bash
# Sauvegarde de la base MySQL de Last Fragment 2, à lancer par cron sur le serveur de production.
#
#   docker/backup-db.sh            sauvegarde maintenant
#
# Exemple de crontab (crontab -e, avec un compte qui a le droit d'utiliser Docker) :
#
#   17 3 * * * /srv/lastfragment2/docker/backup-db.sh >> /var/log/lastfragment2-sauvegarde.log 2>&1
#
# Le dump est fait DANS le conteneur de la base, avec les identifiants qu'il connaît déjà : aucun mot
# de passe sur la ligne de commande de la machine, aucun port à ouvrir. `--single-transaction` copie
# un instantané cohérent sans bloquer le site.
#
# Rotation (réglable par variables d'environnement, voir plus bas) :
#   quotidien/  une sauvegarde par passage, les KEEP_DAILY plus récentes      (14 par défaut)
#   hebdo/      la première sauvegarde réussie de chaque semaine, KEEP_WEEKLY (8 par défaut)
#   mensuel/    la première sauvegarde réussie de chaque mois, KEEP_MONTHLY   (12 par défaut)
# Les copies hebdo et mensuelles sont des liens physiques : elles ne prennent pas de place en plus.
#
# Variables facultatives (à mettre devant la commande dans la crontab) :
#   BACKUP_DIR    dossier des sauvegardes (défaut : <projet>/backups/db). Idéalement un autre disque,
#                 puis une copie hors du serveur (rclone, rsync…) : une sauvegarde sur la même machine
#                 ne protège pas d'une panne ou d'une perte du serveur.
#   KEEP_DAILY, KEEP_WEEKLY, KEEP_MONTHLY   nombre de sauvegardes gardées
#   DB_SERVICE    service Compose de la base (défaut : db)
#
# Code de sortie non nul en cas d'échec : cron prévient par mail si MAILTO est réglé.
# Restauration et vérification : docker/restore-db.sh.

set -Eeuo pipefail
umask 077

# cron fournit un PATH minimal.
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups/db}"
KEEP_DAILY="${KEEP_DAILY:-14}"
KEEP_WEEKLY="${KEEP_WEEKLY:-8}"
KEEP_MONTHLY="${KEEP_MONTHLY:-12}"
DB_SERVICE="${DB_SERVICE:-db}"
PREFIX="lastfragment"

log() { printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }
fail() {
	log "ÉCHEC : $*" >&2
	exit 1
}

for name in KEEP_DAILY KEEP_WEEKLY KEEP_MONTHLY; do
	[[ "${!name}" =~ ^[0-9]{1,4}$ ]] || fail "$name doit être un nombre entier (reçu : « ${!name} »)."
done
[[ "$KEEP_DAILY" -ge 1 ]] || fail "KEEP_DAILY doit valoir au moins 1."

command -v docker >/dev/null || fail "docker est introuvable."
cd "$PROJECT_DIR"
[[ -f docker-compose.yml ]] || fail "docker-compose.yml absent de $PROJECT_DIR."

mkdir -p "$BACKUP_DIR/quotidien" "$BACKUP_DIR/hebdo" "$BACKUP_DIR/mensuel"

# Une seule sauvegarde à la fois (un passage lent ne doit pas croiser le suivant).
exec 9>"$BACKUP_DIR/.verrou"
if command -v flock >/dev/null; then
	flock -n 9 || fail "une sauvegarde est déjà en cours."
fi

[[ -n "$(docker compose ps --status running -q "$DB_SERVICE" 2>/dev/null)" ]] ||
	fail "le conteneur « $DB_SERVICE » ne tourne pas (docker compose ps)."

stamp="$(date '+%Y-%m-%d_%H%M%S')"
file="$BACKUP_DIR/quotidien/$PREFIX-$stamp.sql.gz"
partial="$BACKUP_DIR/quotidien/.$PREFIX-$stamp.partiel"
trap 'rm -f "$partial"' EXIT

log "Sauvegarde de la base vers $file"
started=$SECONDS

# Variables lues dans le conteneur (apostrophes simples : rien n'est remplacé sur la machine).
# MYSQL_PWD plutôt que -p : le mot de passe n'apparaît pas dans la liste des processus.
# --no-tablespaces : évite d'exiger le droit PROCESS ; les déclencheurs sont inclus par défaut.
docker compose exec -T "$DB_SERVICE" sh -c '
	MYSQL_PWD="$MYSQL_PASSWORD" exec mysqldump \
		--user="$MYSQL_USER" \
		--single-transaction --quick \
		--no-tablespaces --hex-blob \
		--default-character-set=utf8mb4 \
		--set-gtid-purged=OFF \
		"$MYSQL_DATABASE"
' | gzip -9 >"$partial" || fail "mysqldump a échoué (voir le message ci-dessus)."

# Vérifications avant de considérer la sauvegarde comme bonne : archive lisible, dump terminé.
gzip -t "$partial" || fail "l'archive est corrompue."
gzip -dc "$partial" | tail -n 1 | grep -q '^-- Dump completed' ||
	fail "le dump est incomplet (pas de ligne « Dump completed »)."
# grep -c lit tout (grep -q s'arrêterait au premier résultat, et pipefail prendrait la fin de gzip pour une erreur).
tables="$(gzip -dc "$partial" | grep -c '^CREATE TABLE' || true)"
[[ "$tables" -gt 0 ]] || fail "le dump ne contient aucune table."

mv "$partial" "$file"
if command -v sha256sum >/dev/null; then
	(cd "$(dirname "$file")" && sha256sum "$(basename "$file")" >"$(basename "$file").sha256")
fi

size="$(du -h "$file" | cut -f1)"
log "Sauvegarde terminée : $tables tables, $size en $((SECONDS - started)) s."

# ─── Copies hebdomadaire et mensuelle ─────────────────────────────────────

keep_copy() {
	local target="$1"
	[[ -e "$target" ]] && return 0
	ln "$file" "$target" 2>/dev/null || cp -p "$file" "$target"
	log "Copie gardée : $target"
}

keep_copy "$BACKUP_DIR/hebdo/$PREFIX-$(date '+%G-S%V').sql.gz"
keep_copy "$BACKUP_DIR/mensuel/$PREFIX-$(date '+%Y-%m').sql.gz"

# ─── Rotation : garde les N plus récentes de chaque dossier ───────────────
# Les noms commencent par la date : l'ordre alphabétique est l'ordre chronologique.

prune() {
	local dir="$1" keep="$2" old
	while IFS= read -r old; do
		[[ -n "$old" ]] || continue
		rm -f -- "$old" "$old.sha256"
		log "Supprimée (rotation) : $old"
	done < <(find "$dir" -maxdepth 1 -type f -name "$PREFIX-*.sql.gz" | sort -r | tail -n +"$((keep + 1))")
}

prune "$BACKUP_DIR/quotidien" "$KEEP_DAILY"
prune "$BACKUP_DIR/hebdo" "$KEEP_WEEKLY"
prune "$BACKUP_DIR/mensuel" "$KEEP_MONTHLY"

log "Espace occupé par les sauvegardes : $(du -sh "$BACKUP_DIR" | cut -f1)."
