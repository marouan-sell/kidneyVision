#!/bin/sh
set -e

echo "=========================================================="
echo "   KidneyVision AI - Laravel Backend Entrypoint Initializer"
echo "=========================================================="

# 1. Ensure required storage and cache directories exist
mkdir -p /var/www/html/storage/app/public \
         /var/www/html/storage/framework/cache \
         /var/www/html/storage/framework/sessions \
         /var/www/html/storage/framework/views \
         /var/www/html/storage/logs \
         /var/www/html/bootstrap/cache \
         /var/www/html/database

# 2. SQLite auto-creation if using sqlite database connection
if [ "${DB_CONNECTION:-sqlite}" = "sqlite" ]; then
    DB_FILE="${DB_DATABASE:-/var/www/html/database/database.sqlite}"
    DB_DIR=$(dirname "$DB_FILE")
    mkdir -p "$DB_DIR"
    if [ ! -f "$DB_FILE" ]; then
        echo "[Entrypoint] Initializing fresh SQLite database at: $DB_FILE"
        touch "$DB_FILE"
    fi
fi

# 3. Create storage symlink for Grad-CAM heatmaps and PDF reports
echo "[Entrypoint] Linking public storage (/storage -> storage/app/public)..."
php artisan storage:link --force || true

# 4. Run database migrations safely
echo "[Entrypoint] Running database migrations..."
php artisan migrate --force || echo "[Entrypoint Warning] Database migration step completed with notice."

# 5. Fix permissions for storage, cache, and database
echo "[Entrypoint] Setting storage permissions..."
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database 2>/dev/null || true
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database 2>/dev/null || true

echo "=========================================================="
echo "   Laravel Backend Ready! Starting service: $@"
echo "=========================================================="

exec "$@"
