#!/bin/bash
# KidneyVision AI - Data and Database Backup Script
BACKUP_DIR="/home/azureuser/backups"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/kidneyvision_$TIMESTAMP.tar.gz"

echo "Creating backup of SQLite database and public uploads..."
tar -czf "$BACKUP_FILE" -C /home/azureuser/kidneyVision/backend-laravel database storage 2>/dev/null

# Keep only the last 7 daily archives
find "$BACKUP_DIR" -name "kidneyvision_*.tar.gz" -type f -mtime +7 -delete

echo "Backup created successfully: $BACKUP_FILE"
ls -lh "$BACKUP_DIR"
