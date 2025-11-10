# Guide de déploiement OVH - Association VH Besançon

## Prérequis

- Un serveur VPS OVH (recommandé: VPS Starter ou supérieur)
- Un nom de domaine (ex: association-vh-besancon.fr)
- Accès SSH au serveur
- Compte Sanity.io configuré

## Étape 1: Préparer le serveur

### 1.1 Connexion SSH initiale
```bash
ssh root@votre-ip-ovh
```

### 1.2 Créer un utilisateur non-root
```bash
# Créer un utilisateur
adduser deployer
usermod -aG sudo deployer

# Configurer SSH pour le nouvel utilisateur
mkdir -p /home/deployer/.ssh
cp ~/.ssh/authorized_keys /home/deployer/.ssh/
chown -R deployer:deployer /home/deployer/.ssh
chmod 700 /home/deployer/.ssh
chmod 600 /home/deployer/.ssh/authorized_keys
```

### 1.3 Sécuriser SSH
```bash
# Éditer la config SSH
nano /etc/ssh/sshd_config

# Modifier ces lignes:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes

# Redémarrer SSH
systemctl restart sshd
```

### 1.4 Configurer le firewall
```bash
# Installer UFW
apt update
apt install ufw

# Configurer les règles
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https

# Activer le firewall
ufw enable
ufw status
```

### 1.5 Installer Fail2ban
```bash
apt install fail2ban

# Créer une config personnalisée
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
nano /etc/fail2ban/jail.local

# Activer pour SSH
[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

systemctl enable fail2ban
systemctl start fail2ban
```

## Étape 2: Installer Node.js et les outils

### 2.1 Installer Node.js 20 LTS
```bash
# Utiliser le gestionnaire de versions NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Installer Node.js
nvm install 20
nvm use 20
nvm alias default 20

# Vérifier l'installation
node --version
npm --version
```

### 2.2 Installer PM2
```bash
npm install -g pm2

# Configurer PM2 pour démarrer au boot
pm2 startup systemd
# Suivre les instructions affichées
```

### 2.3 Installer Git
```bash
apt install git
```

## Étape 3: Configurer Nginx

### 3.1 Installer Nginx
```bash
apt install nginx
systemctl start nginx
systemctl enable nginx
```

### 3.2 Configurer le site
```bash
# Créer la configuration
nano /etc/nginx/sites-available/association-vh
```

Contenu du fichier:
```nginx
# Redirection HTTP vers HTTPS
server {
    listen 80;
    server_name association-vh-besancon.fr www.association-vh-besancon.fr;
    return 301 https://$server_name$request_uri;
}

# Configuration HTTPS
server {
    listen 443 ssl http2;
    server_name association-vh-besancon.fr www.association-vh-besancon.fr;

    # SSL (sera configuré avec Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/association-vh-besancon.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/association-vh-besancon.fr/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=20r/s;

    # Logs
    access_log /var/log/nginx/association-vh-access.log;
    error_log /var/log/nginx/association-vh-error.log;

    # Proxy vers Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Rate limiting pour auth
    location /api/auth {
        limit_req zone=auth burst=3 nodelay;
        proxy_pass http://localhost:3000;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Rate limiting pour API générale
    location /api/ {
        limit_req zone=api burst=40 nodelay;
        proxy_pass http://localhost:3000;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Optimisations
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Cache des assets statiques
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3.3 Activer le site
```bash
# Créer le lien symbolique
ln -s /etc/nginx/sites-available/association-vh /etc/nginx/sites-enabled/

# Désactiver le site par défaut
rm /etc/nginx/sites-enabled/default

# Tester la configuration (va échouer sans SSL pour l'instant)
nginx -t

# Pour l'instant, commenter les lignes SSL et utiliser uniquement HTTP
```

## Étape 4: Installer Let's Encrypt SSL

### 4.1 Installer Certbot
```bash
apt install certbot python3-certbot-nginx
```

### 4.2 Obtenir le certificat
```bash
# Arrêter Nginx temporairement
systemctl stop nginx

# Obtenir le certificat
certbot certonly --standalone -d association-vh-besancon.fr -d www.association-vh-besancon.fr

# Démarrer Nginx
systemctl start nginx
```

### 4.3 Auto-renouvellement
```bash
# Tester le renouvellement
certbot renew --dry-run

# Le renouvellement automatique est déjà configuré via systemd
systemctl list-timers | grep certbot
```

## Étape 5: Déployer l'application

### 5.1 Cloner le repository
```bash
# En tant qu'utilisateur deployer
su - deployer

# Créer le dossier de l'app
mkdir -p /home/deployer/apps
cd /home/deployer/apps

# Cloner le repo
git clone https://github.com/votre-username/mon-site.git association-vh
cd association-vh
```

### 5.2 Configurer les variables d'environnement
```bash
nano .env.production
```

Contenu du fichier:
```env
# Next.js
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://association-vh-besancon.fr

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=votre-project-id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=votre-token-production
SANITY_STUDIO_URL=https://studio.association-vh-besancon.fr

# Auth
NEXTAUTH_SECRET=votre-secret-genere-avec-openssl
NEXTAUTH_URL=https://association-vh-besancon.fr

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre-email@gmail.com
EMAIL_PASSWORD=votre-app-password
ADMIN_EMAIL=admin@association-vh-besancon.fr

# Google Drive (optionnel)
GOOGLE_DRIVE_CLIENT_EMAIL=
GOOGLE_DRIVE_PRIVATE_KEY=
GOOGLE_DRIVE_FOLDER_ID=
```

### 5.3 Installer les dépendances et build
```bash
# Installer les dépendances
npm ci --production=false

# Build l'application
npm run build

# Installer uniquement les dépendances de production
rm -rf node_modules
npm ci --production
```

### 5.4 Configurer PM2
```bash
# Créer le fichier ecosystem
nano ecosystem.config.js
```

Contenu:
```javascript
module.exports = {
  apps: [
    {
      name: 'association-vh',
      script: 'npm',
      args: 'start',
      cwd: '/home/deployer/apps/association-vh',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_file: '.env.production',
      error_file: '/home/deployer/logs/association-vh-error.log',
      out_file: '/home/deployer/logs/association-vh-out.log',
      time: true,
      autorestart: true,
      max_memory_restart: '1G',
      watch: false,
    },
  ],
}
```

### 5.5 Démarrer l'application
```bash
# Créer le dossier de logs
mkdir -p /home/deployer/logs

# Démarrer avec PM2
pm2 start ecosystem.config.js

# Sauvegarder la config PM2
pm2 save

# Vérifier le statut
pm2 status
pm2 logs association-vh
```

## Étape 6: Déployer le Studio Sanity séparément

### 6.1 Option 1: Sanity Cloud (Recommandé)
```bash
# Sur votre machine locale
cd sanity
npm install -g @sanity/cli
sanity deploy

# Suivre les instructions pour déployer sur Sanity Cloud
# Le studio sera accessible sur: https://votre-projet.sanity.studio
```

### 6.2 Option 2: Sous-domaine dédié
```bash
# Sur le serveur, créer un dossier séparé
cd /home/deployer/apps
mkdir studio
cd studio

# Copier uniquement les fichiers du studio
# (sanity.config.ts, schemaTypes, etc.)

# Installer et build
npm install
npm run build

# Configurer Nginx pour studio.association-vh-besancon.fr
# Puis démarrer avec PM2
```

## Étape 7: Configuration DNS (OVH)

### 7.1 Configurer les enregistrements DNS
Dans le manager OVH:

```
Type  | Nom    | Cible
------|--------|------------------
A     | @      | IP_SERVEUR_OVH
A     | www    | IP_SERVEUR_OVH
A     | studio | IP_SERVEUR_OVH (si hébergé sur le même serveur)
```

## Étape 8: Monitoring et maintenance

### 8.1 Configurer les logs rotatifs
```bash
sudo nano /etc/logrotate.d/association-vh
```

Contenu:
```
/home/deployer/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 deployer deployer
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 8.2 Monitoring avec PM2
```bash
# Installer le monitoring PM2 (optionnel)
pm2 install pm2-logrotate

# Configurer les alertes
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### 8.3 Backup automatique
Créer un script de backup:
```bash
nano /home/deployer/scripts/backup.sh
```

Contenu:
```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/home/deployer/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/home/deployer/apps/association-vh"

# Créer le dossier de backup
mkdir -p $BACKUP_DIR

# Backup des fichiers
tar -czf $BACKUP_DIR/app_$DATE.tar.gz $APP_DIR/.env.production

# Export Sanity (nécessite sanity-cli)
cd $APP_DIR
npx sanity dataset export production $BACKUP_DIR/sanity_$DATE.tar.gz

# Nettoyer les backups de plus de 30 jours
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup terminé: $DATE"
```

Rendre le script exécutable et configurer le cron:
```bash
chmod +x /home/deployer/scripts/backup.sh

# Ajouter au crontab (tous les jours à 3h)
crontab -e

# Ajouter cette ligne:
0 3 * * * /home/deployer/scripts/backup.sh >> /home/deployer/logs/backup.log 2>&1
```

## Étape 9: Script de déploiement automatique

### 9.1 Créer le script de déploiement
```bash
nano /home/deployer/scripts/deploy.sh
```

Contenu:
```bash
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
```

Rendre le script exécutable:
```bash
chmod +x /home/deployer/scripts/deploy.sh
```

### 9.2 Utilisation
```bash
# Déployer manuellement
/home/deployer/scripts/deploy.sh

# Ou depuis votre machine locale via SSH
ssh deployer@votre-ip-ovh '/home/deployer/scripts/deploy.sh'
```

## Étape 10: Checklist finale

Avant la mise en production, vérifier:

### Serveur
- [ ] Firewall configuré (UFW)
- [ ] Fail2ban actif
- [ ] SSH sécurisé (pas de root, pas de password)
- [ ] Certificat SSL installé et valide
- [ ] Nginx configuré avec headers de sécurité
- [ ] PM2 configuré pour démarrer au boot

### Application
- [ ] Variables d'environnement configurées
- [ ] Build réussi
- [ ] Application accessible sur le domaine
- [ ] SSL fonctionne (pas d'erreurs de certificat)
- [ ] Redirections HTTP → HTTPS actives

### Base de données
- [ ] Sanity en mode production
- [ ] Tokens API configurés
- [ ] Backups automatiques configurés

### Sécurité
- [ ] Rate limiting actif sur les endpoints d'auth
- [ ] Headers de sécurité configurés
- [ ] Studio Sanity déployé séparément
- [ ] CORS configuré correctement
- [ ] Logs d'activité fonctionnels

### Monitoring
- [ ] PM2 monitoring actif
- [ ] Logs rotatifs configurés
- [ ] Backups automatiques configurés
- [ ] Script de déploiement testé

### Légal
- [ ] Politique de confidentialité publiée
- [ ] Mentions légales publiées
- [ ] Bannière de consentement cookies

## Commandes utiles

### PM2
```bash
# Voir les logs
pm2 logs association-vh

# Redémarrer
pm2 restart association-vh

# Voir les métriques
pm2 monit

# Voir les infos
pm2 info association-vh
```

### Nginx
```bash
# Tester la config
nginx -t

# Recharger la config
systemctl reload nginx

# Voir les logs
tail -f /var/log/nginx/association-vh-error.log
```

### SSL
```bash
# Renouveler manuellement
certbot renew

# Vérifier l'expiration
certbot certificates
```

## Troubleshooting

### L'application ne démarre pas
```bash
# Vérifier les logs PM2
pm2 logs association-vh --lines 100

# Vérifier les variables d'environnement
pm2 env association-vh

# Redémarrer
pm2 restart association-vh
```

### Erreur 502 Bad Gateway
```bash
# Vérifier que l'app tourne
pm2 status

# Vérifier les logs Nginx
tail -f /var/log/nginx/association-vh-error.log

# Vérifier que le port 3000 écoute
netstat -tulpn | grep 3000
```

### SSL ne fonctionne pas
```bash
# Vérifier le certificat
certbot certificates

# Tester le renouvellement
certbot renew --dry-run

# Vérifier la config Nginx
nginx -t
```

## Support

En cas de problème, vérifier:
1. Les logs PM2: `pm2 logs`
2. Les logs Nginx: `/var/log/nginx/`
3. Les logs système: `journalctl -xe`
4. L'état des services: `systemctl status nginx` et `pm2 status`
