#!/bin/bash

set -e

# Configuration
BACKUP_DIR="/home/deployer/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/home/deployer/apps/association-vh"

echo "📦 Début du backup: $DATE"

# Créer le dossier de backup
mkdir -p $BACKUP_DIR

# Backup des fichiers de configuration
echo "🔐 Backup des variables d'environnement..."
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C $APP_DIR .env.production

# Export Sanity (nécessite sanity-cli)
echo "📊 Export de la base Sanity..."
cd $APP_DIR
npx sanity dataset export production $BACKUP_DIR/sanity_$DATE.tar.gz

# Nettoyer les backups de plus de 30 jours
echo "🧹 Nettoyage des anciens backups..."
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "✅ Backup terminé: $DATE"
echo "📁 Fichiers sauvegardés dans: $BACKUP_DIR"
