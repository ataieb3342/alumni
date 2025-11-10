# Audit de sécurité - Association VH Besançon

## Date de l'audit
Généré le: 2025-11-10

## Résumé
Ce document présente l'audit de sécurité de l'application et les recommandations pour sécuriser le déploiement.

## 1. Authentification et Autorisation

### ✅ Points positifs
- Mots de passe hashés avec bcryptjs (salt rounds: 10)
- Validation des comptes avant accès (statut `pending` → `active`)
- Vérification du statut du compte à la connexion
- Sessions gérées avec JWT via NextAuth.js
- Middleware pour protéger les routes sensibles

### ⚠️ Points à améliorer

#### 1.1 Rate Limiting
**Problème**: Pas de limitation du nombre de tentatives de connexion
**Impact**: Risque de brute force sur les mots de passe
**Recommandation**:
```bash
npm install express-rate-limit
```
Ajouter un rate limiter sur les endpoints d'authentification:
- `/api/auth/register`: 5 tentatives/heure/IP
- `/api/auth/*`: 10 tentatives/15 minutes/IP
- `/api/auth/forgot-password`: 3 tentatives/heure/email

#### 1.2 Politique de mot de passe
**Problème**: Exigences minimales faibles (6 caractères)
**Recommandation**:
- Minimum 12 caractères
- Au moins 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
- Vérifier contre une liste de mots de passe communs

#### 1.3 2FA (Authentification à deux facteurs)
**Recommandation**: Implémenter 2FA optionnel pour les admins
- Utiliser `@node-otp/core` pour TOTP
- Codes de récupération en cas de perte

## 2. Gestion des données sensibles

### ✅ Points positifs
- Mots de passe cachés dans Sanity Studio (`hidden: true`)
- Variables d'environnement pour les secrets
- Pas de logs de mots de passe en clair

### ⚠️ Points à améliorer

#### 2.1 Variables d'environnement
**Action requise**: Vérifier que `.env` est dans `.gitignore`
**Variables sensibles à configurer**:
```env
# Base de données et auth
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=
SANITY_API_TOKEN=
NEXTAUTH_SECRET= # Générer avec: openssl rand -base64 32
NEXTAUTH_URL=

# Email
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASSWORD=
ADMIN_EMAIL=

# Google Drive (optionnel)
GOOGLE_DRIVE_CLIENT_EMAIL=
GOOGLE_DRIVE_PRIVATE_KEY=
GOOGLE_DRIVE_FOLDER_ID=

# Autres
NEXT_PUBLIC_BASE_URL=
SANITY_STUDIO_URL=
```

#### 2.2 Rotation des secrets
**Recommandation**: Établir un calendrier de rotation
- `SANITY_API_TOKEN`: tous les 6 mois
- `EMAIL_PASSWORD`: tous les 3 mois
- `NEXTAUTH_SECRET`: tous les 12 mois

## 3. API et endpoints

### ⚠️ Points à sécuriser

#### 3.1 Validation des entrées
**Action requise**: Ajouter une validation stricte avec Zod
```bash
npm install zod
```

Exemple pour l'inscription:
```typescript
import { z } from 'zod'

const registerSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(12),
  userType: z.enum(['current_student', 'alumni', 'staff']),
})
```

#### 3.2 CORS
**Action requise**: Configurer CORS dans `next.config.ts`
```typescript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_BASE_URL },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
      ],
    },
  ]
}
```

#### 3.3 Protection CSRF
**Status**: NextAuth.js gère déjà le CSRF avec des tokens
**Vérification**: S'assurer que `sameSite: 'lax'` est configuré pour les cookies

## 4. Sanity Studio

### ⚠️ Déploiement séparé recommandé

#### 4.1 Studio accessible publiquement
**Problème actuel**: Le studio Sanity est accessible via `/studio`
**Risque**: Exposition de l'interface d'administration

**Recommandation**: Déployer le studio séparément
```bash
# Option 1: Sous-domaine dédié
studio.association-vh-besancon.fr

# Option 2: Sanity Cloud (recommandé)
# Déployer sur Sanity Cloud avec authentification
```

#### 4.2 Permissions Sanity
**Action requise**: Configurer les rôles dans Sanity
1. Aller dans Settings > API
2. Créer un token avec permissions restreintes:
   - `viewer`: lecture seule pour l'app
   - `editor`: lecture/écriture via API
   - `admin`: accès complet au studio

## 5. Protection XSS et injection

### ✅ Points positifs
- React échappe automatiquement les variables
- Pas d'utilisation de `dangerouslySetInnerHTML` non sanitisée

### ⚠️ Points à vérifier

#### 5.1 Sanitization du contenu
**Pour les articles de blog et annonces**: Utiliser DOMPurify
```bash
npm install isomorphic-dompurify
```

#### 5.2 SQL Injection
**Status**: ✅ Protégé via les queries paramétrées de Sanity (GROQ)

## 6. HTTPS et certificats

### Action requise pour le déploiement OVH
1. **Certificat SSL**: Utiliser Let's Encrypt (gratuit)
2. **Redirection HTTP → HTTPS**: Configurer dans Nginx/Apache
3. **HSTS**: Ajouter le header
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## 7. Logging et monitoring

### ✅ Implémenté
- Logs d'activité dans Sanity (`activityLog`)
- Tracking des actions utilisateur

### ⚠️ À ajouter

#### 7.1 Alertes de sécurité
**Recommandation**: Configurer des alertes pour:
- Tentatives de connexion échouées répétées
- Accès non autorisés à l'API admin
- Modifications de comptes admin
- Exports de données

#### 7.2 Backup réguliers
**Action requise**:
- Configurer les exports Sanity automatiques
- Backup quotidien de la base de données
- Tests de restauration mensuels

## 8. Headers de sécurité

### À ajouter dans `next.config.ts`
```typescript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
      ],
    },
  ]
}
```

## 9. Dépendances et vulnérabilités

### Action immédiate
```bash
# Auditer les dépendances
npm audit

# Corriger les vulnérabilités automatiquement
npm audit fix

# Pour les vulnérabilités majeures
npm audit fix --force
```

### Maintenance continue
- Mettre à jour les dépendances mensuellement
- Utiliser Dependabot sur GitHub
- Scanner avec `snyk` ou `npm audit` dans le CI/CD

## 10. GDPR et confidentialité

### ⚠️ Exigences légales

#### 10.1 Consentement cookies
**Action requise**: Ajouter une bannière de consentement
```bash
npm install react-cookie-consent
```

#### 10.2 Politique de confidentialité
**Action requise**: Créer les pages:
- `/mentions-legales`
- `/politique-confidentialite`
- `/conditions-utilisation`

#### 10.3 Droit à l'oubli
**Action requise**: Créer un endpoint pour supprimer les données utilisateur
```typescript
DELETE /api/user/delete-account
```

## 11. Déploiement OVH

### Checklist de sécurité

#### 11.1 Serveur
- [ ] Firewall activé (UFW ou iptables)
- [ ] SSH configuré avec clés uniquement (pas de password)
- [ ] Fail2ban installé pour bloquer les attaques brute force
- [ ] Mises à jour automatiques activées
- [ ] Utilisateur non-root pour l'application

#### 11.2 Node.js
- [ ] Process manager (PM2) avec restart automatique
- [ ] Variables d'environnement sécurisées
- [ ] Logs rotatés automatiquement
- [ ] Health checks configurés

#### 11.3 Base de données
- [ ] Sanity : tokens API séparés par environnement
- [ ] Backups automatiques configurés
- [ ] Accès restreint par IP si possible

#### 11.4 Reverse Proxy (Nginx)
```nginx
# Configuration recommandée
server {
    listen 443 ssl http2;
    server_name association-vh-besancon.fr;

    ssl_certificate /etc/letsencrypt/live/association-vh-besancon.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/association-vh-besancon.fr/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
    }
}
```

## 12. Monitoring et alertes

### Recommandations d'outils
1. **Uptime monitoring**: UptimeRobot ou Pingdom
2. **Error tracking**: Sentry
3. **Performance**: New Relic ou DataDog
4. **Logs**: Loggly ou Papertrail

## Priorités

### 🔴 Critique (à faire avant mise en production)
1. Configurer toutes les variables d'environnement
2. Activer HTTPS avec certificat SSL
3. Configurer les headers de sécurité
4. Rate limiting sur les API d'authentification
5. Séparer le studio Sanity
6. Politique de confidentialité et mentions légales

### 🟡 Important (première semaine)
1. Validation stricte avec Zod
2. Améliorer la politique de mots de passe
3. Configurer les alertes de sécurité
4. Mettre en place les backups automatiques
5. Fail2ban sur le serveur

### 🟢 Recommandé (premier mois)
1. 2FA pour les admins
2. Monitoring avec Sentry
3. Tests de sécurité réguliers
4. Documentation de sécurité pour l'équipe

## Conclusion

L'application a une base solide avec NextAuth et Sanity, mais nécessite des améliorations importantes avant la mise en production. Les points critiques doivent être traités en priorité, notamment la configuration HTTPS, les headers de sécurité, et la séparation du studio Sanity.
