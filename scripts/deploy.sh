#!/bin/bash

set -e

echo "🚀 Début du déploiement..."

# Variables
APP_DIR="/home/deployer/apps/association-vh"
APP_NAME="association-vh"

# Aller dans le dossier de l'app
cd $APP_DIR

# Sauvegarder les variables d'environnement
cp .env.production .env.production.bak

# Pull les dernières modifications
echo "📥 Git pull..."
git pull origin main

# Restaurer les variables d'environnement
mv .env.production.bak .env.production

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm ci --production=false

# Build
echo "🔨 Build de l'application..."
npm run build

# Nettoyer et installer uniquement les dépendances de production
echo "🧹 Nettoyage..."
rm -rf node_modules
npm ci --production

# Redémarrer l'application
echo "♻️ Redémarrage de l'application..."
pm2 reload $APP_NAME --update-env

# Vérifier le statut
echo "✅ Statut de l'application:"
pm2 status $APP_NAME

echo "🎉 Déploiement terminé avec succès!"
