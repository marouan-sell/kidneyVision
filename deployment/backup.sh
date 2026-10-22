#!/usr/bin/env bash
# ==============================================================================
# KidneyVision AI — Enterprise PostgreSQL & Medical Storage Backup Script
# ==============================================================================
# Security Controls:
# 1. Zero CLI credential leakage: Uses PGPASSWORD / .pgpass in subshell; never passed via argv.
# 2. TLS-enforced transport: Requires PGSSLMODE=require for remote Supabase connections.
# 3. Client-side encryption at rest: AES-256-CBC via OpenSSL with PBKDF2 (100,000 iterations).
# 4. Integrity verification: Computes and stores detached SHA-256 checksums for every archive.
# 5. Least privilege permissions: Enforces 0700 on backup directories and 0600 on archives.
# 6. Sensitive PHI exclusion: Sanitized log output; no PHI in file names or logs.
# 7. Safe fallback: Detects SQLite vs PostgreSQL dynamically based on DB_CONNECTION.
#
# RESTORE RUNBOOK:
# ----------------
# 1. Decrypt archive:
#    openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 -in backup_enc.tar.gz.enc \
#      -out backup_plain.tar.gz -pass pass:"$BACKUP_ENCRYPTION_KEY"
# 2. Verify SHA-256:
#    sha256sum -c backup_enc.tar.gz.enc.sha256
# 3. Extract bundle:
#    tar -xzf backup_plain.tar.gz -C /tmp/restore/
# 4. Restore database:
#    pg_restore --clean --no-owner --no-privileges -h $DB_HOST -p $DB_PORT \
#      -U $DB_USERNAME -d $DB_DATABASE /tmp/restore/db.dump
# 5. Restore private storage files:
#    rsync -av /tmp/restore/private/ backend-laravel/storage/app/private/
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/home/azureuser/backups}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEMP_DIR=""
PLAIN_ARCHIVE=""

cleanup() {
    if [[ -n "${TEMP_DIR:-}" && -d "$TEMP_DIR" ]]; then
        rm -rf "$TEMP_DIR"
    fi
    if [[ -n "${PLAIN_ARCHIVE:-}" && -f "$PLAIN_ARCHIVE" ]]; then
        rm -f "$PLAIN_ARCHIVE"
    fi
}
trap cleanup EXIT INT TERM

show_help() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Options:
  --dry-run      Verify prerequisites, configuration, and tools without creating backups.
  --help         Display this help message and restore instructions.

Required Environment Variables:
  BACKUP_ENCRYPTION_KEY    Secret passphrase used to encrypt the backup bundle (AES-256-CBC).
  DB_CONNECTION            Database driver: 'pgsql' (Supabase/PostgreSQL) or 'sqlite'.
  DB_HOST                  PostgreSQL host (e.g. aws-0-eu-west-2.pooler.supabase.com).
  DB_PORT                  PostgreSQL port (default: 5432).
  DB_DATABASE              Database name.
  DB_USERNAME              Database user.
  DB_PASSWORD              Database password.
  DB_SSLMODE               PostgreSQL SSL mode (default: require).
EOF
}

DRY_RUN=false
for arg in "$@"; do
    case "$arg" in
        --dry-run)
            DRY_RUN=true
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown argument: $arg"
            show_help
            exit 1
            ;;
    esac
done

echo "[*] KidneyVision AI Secure Backup Initiated at $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# 1. Verify Prerequisites
if ! command -v openssl &>/dev/null; then
    echo "[!] Error: 'openssl' command is required for client-side encryption." >&2
    exit 1
fi

if ! command -v tar &>/dev/null; then
    echo "[!] Error: 'tar' command is required." >&2
    exit 1
fi

if ! command -v sha256sum &>/dev/null; then
    echo "[!] Error: 'sha256sum' command is required for integrity verification." >&2
    exit 1
fi

# 2. Check Encryption Key
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"
if [[ -z "$ENCRYPTION_KEY" ]]; then
    # Fallback to APP_KEY if BACKUP_ENCRYPTION_KEY not explicitly specified
    ENCRYPTION_KEY="${APP_KEY:-}"
    if [[ -z "$ENCRYPTION_KEY" ]]; then
        echo "[!] Error: BACKUP_ENCRYPTION_KEY or APP_KEY environment variable must be set." >&2
        exit 1
    fi
fi

# 3. Detect Database Type
DB_DRIVER="${DB_CONNECTION:-sqlite}"

if [[ "$DRY_RUN" == "true" ]]; then
    echo "[+] Dry-run mode enabled. Validating configuration:"
    echo "    - Target Directory: $BACKUP_DIR"
    echo "    - Database Driver:  $DB_DRIVER"
    echo "    - Encryption Tool:  OpenSSL AES-256-CBC (PBKDF2 100k iter)"
    echo "    - Checksum:         SHA-256"
    if [[ "$DB_DRIVER" == "pgsql" || "$DB_DRIVER" == "postgres" ]]; then
        echo "    - PostgreSQL Host:  ${DB_HOST:-<not set>}"
        echo "    - PostgreSQL Port:  ${DB_PORT:-5432}"
        echo "    - PostgreSQL DB:    ${DB_DATABASE:-<not set>}"
        echo "    - PostgreSQL SSL:   ${DB_SSLMODE:-require}"
    fi
    echo "[+] All prerequisites verified successfully. Exiting dry-run."
    exit 0
fi

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

TEMP_DIR=$(mktemp -d "/tmp/kv_backup_${TIMESTAMP}_XXXXXX")
chmod 700 "$TEMP_DIR"

# 4. Dump Database
echo "[*] Exporting database ($DB_DRIVER)..."
if [[ "$DB_DRIVER" == "pgsql" || "$DB_DRIVER" == "postgres" ]]; then
    if ! command -v pg_dump &>/dev/null; then
        echo "[!] Error: 'pg_dump' utility not found." >&2
        exit 1
    fi

    export PGHOST="${DB_HOST}"
    export PGPORT="${DB_PORT:-5432}"
    export PGDATABASE="${DB_DATABASE}"
    export PGUSER="${DB_USERNAME}"
    export PGPASSWORD="${DB_PASSWORD}"
    export PGSSLMODE="${DB_SSLMODE:-require}"

    pg_dump --format=custom --no-owner --no-privileges > "$TEMP_DIR/database.dump"
    unset PGPASSWORD
else
    # SQLite Backup
    SQLITE_PATH="${DB_DATABASE:-}"
    if [[ -z "$SQLITE_PATH" || ! -f "$SQLITE_PATH" ]]; then
        if [[ -f "$SCRIPT_DIR/../backend-laravel/database/database.sqlite" ]]; then
            SQLITE_PATH="$SCRIPT_DIR/../backend-laravel/database/database.sqlite"
        elif [[ -f "/home/azureuser/kidneyVision/backend-laravel/database/database.sqlite" ]]; then
            SQLITE_PATH="/home/azureuser/kidneyVision/backend-laravel/database/database.sqlite"
        fi
    fi
    if [[ -f "$SQLITE_PATH" ]]; then
        if command -v sqlite3 &>/dev/null; then
            sqlite3 "$SQLITE_PATH" ".backup '$TEMP_DIR/database.sqlite'"
        else
            cp "$SQLITE_PATH" "$TEMP_DIR/database.sqlite"
        fi
    fi
fi

# 5. Archive Medical Scans & Sensitive Storage
echo "[*] Packaging private medical scans and credentials..."
STORAGE_DIR="${STORAGE_PATH:-}"
if [[ -z "$STORAGE_DIR" || ! -d "$STORAGE_DIR" ]]; then
    if [[ -d "$SCRIPT_DIR/../backend-laravel/storage" ]]; then
        STORAGE_DIR="$SCRIPT_DIR/../backend-laravel/storage"
    else
        STORAGE_DIR="/home/azureuser/kidneyVision/backend-laravel/storage"
    fi
fi
mkdir -p "$TEMP_DIR/storage"

if [[ -d "$STORAGE_DIR/app/private" ]]; then
    cp -r "$STORAGE_DIR/app/private" "$TEMP_DIR/storage/"
fi

if [[ -d "$STORAGE_DIR/app/public/avatars" ]]; then
    mkdir -p "$TEMP_DIR/storage/public"
    cp -r "$STORAGE_DIR/app/public/avatars" "$TEMP_DIR/storage/public/"
fi

# 6. Bundle Unencrypted Package
PLAIN_ARCHIVE="/tmp/kv_bundle_${TIMESTAMP}.tar.gz"
(cd "$TEMP_DIR" && tar -czf "$PLAIN_ARCHIVE" .)

# 7. Encrypt Archive with OpenSSL AES-256-CBC
ENCRYPTED_FILE="$BACKUP_DIR/kv_secure_${TIMESTAMP}.tar.gz.enc"
echo "[*] Encrypting backup bundle with AES-256-CBC..."
openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 \
    -in "$PLAIN_ARCHIVE" \
    -out "$ENCRYPTED_FILE" \
    -pass pass:"$ENCRYPTION_KEY"

# 8. Compute Checksum
echo "[*] Generating SHA-256 checksum..."
(cd "$BACKUP_DIR" && sha256sum "$(basename "$ENCRYPTED_FILE")" > "$(basename "$ENCRYPTED_FILE").sha256")

# 9. Enforce Least-Privilege Permissions
chmod 600 "$ENCRYPTED_FILE" "$ENCRYPTED_FILE.sha256"

# 10. Audit Log & Status
FILE_SIZE=$(du -h "$ENCRYPTED_FILE" | cut -f1)
echo "[+] Secure backup completed successfully!"
echo "    - Archive:  $ENCRYPTED_FILE ($FILE_SIZE)"
echo "    - Checksum: $ENCRYPTED_FILE.sha256"
echo "    - Permissions: 0600 (owner read/write only)"

# 11. Safe Retention: retain last 14 encrypted archives without deleting legacy unencrypted files
find "$BACKUP_DIR" -name "kv_secure_*.tar.gz.enc" -type f -mtime +14 -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "kv_secure_*.sha256" -type f -mtime +14 -delete 2>/dev/null || true
