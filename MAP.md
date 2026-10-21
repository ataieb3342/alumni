# MAP — Cartographie du site VH Besançon Alumni (état de `main`, commit `a739f37`)

> Produit en phase 1 de la refonte, **avant toute modification**. Décrit l'existant tel qu'il est ;
> les choix de la refonte sont dans [DECISIONS.md](DECISIONS.md), la checklist fonctionnelle dans
> [PARITY.md](PARITY.md).

## 1. Vue d'ensemble

| Élément | Valeur |
|---|---|
| Public | Lycéens, anciens élèves (alumni), élèves de prépa et de BTS, personnels du lycée Victor Hugo de Besançon |
| Fonction clé | **L'annuaire** : un lycéen y cherche des anciens par matière (« maths + bio ») ou par ville du parcours (« quelqu'un passé par Brest ») |
| Framework | Next.js 16.3 (App Router, Turbopack), React 19.2, TypeScript 5 strict |
| Style | Tailwind CSS 4 (classes utilitaires inline, aucun composant d'UI partagé), police Geist, icônes `lucide-react` + nombreux SVG inline dupliqués |
| Authentification | NextAuth v5 beta (`next-auth@5.0.0-beta.32`), sessions **JWT**, fournisseurs Credentials + Google + LinkedIn |
| Données | **Sanity** (Content Lake, projet unique, dataset unique) — sert à la fois de CMS **et de base de comptes** |
| Back-office | Sanity Studio embarqué sur `/studio` (structure par défaut, Vision, tableau de bord « visiteurs connectés ») |
| E-mails | Nodemailer via SMTP Gmail (`EMAIL_USER`/`EMAIL_PASSWORD`), réponses vers `contact@vh-besancon-alumni.fr` |
| Tâches planifiées | Vercel Cron : synchro Google Drive (2 h), rappels de profil vide (9 h) |
| Observabilité | Sentry (`@sentry/nextjs`), logger maison (`lib/logger.ts`), Web Vitals, journal d'activité stocké dans Sanity |
| Hébergement | Vercel (`vercel.json`, `.vercel/`), avec une configuration PM2 alternative (`ecosystem.config.js`) pour un VPS |
| Tests | Vitest (16 fichiers, 247 tests verts), Playwright (1 parcours en `test.skip`, job CI retiré) |
| Qualité au départ | `tsc --noEmit` : 0 erreur · ESLint : 0 erreur, 36 avertissements · `vitest --run` : 247/247 |

## 2. Volumétrie réelle (lecture seule du dataset de production, 2026-10-20)

| Type Sanity | Documents | Remarques |
|---|---:|---|
| `user` | 100 | 99 `active`, 1 `pending` · 88 alumni, 9 prépa, 2 personnels, 1 lycéen · 0 e-mail en double |
| `activityLog` | 1 674 | Une écriture par page vue d'un membre connecté + connexions |
| `post` | 20 | Articles de blog (dont imports WordPress avec images par URL) |
| `newsletterSubscription` | 33 | Préférences newsletter / notifications d'annonces |
| `passwordResetToken` | 17 | Jetons stockés **en clair** |
| `announcement` | 3 | |
| `testimonial` | 3 | |
| `sanity.imageAsset` | 69 | 28,3 Mo au total, aucun `sanity.fileAsset` |
| `system.group`, `system.retention` | 11 + 1 | Documents internes Sanity (droits du Studio) — non migrés |
| Brouillons Sanity (`drafts.*`) | 0 | |

## 3. Où vivent les comptes et comment les mots de passe sont stockés

**Les comptes du site sont des documents Sanity `_type == "user"`** (dataset de production). Il n'existe
aucune autre base. Le champ `password` est masqué dans le Studio (`hidden: true`) mais lisible par tout
jeton ayant accès au dataset.

| Point | Constat |
|---|---|
| Bibliothèque | `bcryptjs` 3 (implémentation JS pure de bcrypt) |
| Algorithme | **bcrypt** (Blowfish, variante `$2b$`) |
| Coût | **10** (`bcrypt.hash(password, 10)` dans `register`, `reset-password`, `change-password`) |
| Format | Chaîne modulaire de 60 caractères `$2b$10$` + 22 caractères de **sel** (base64 bcrypt, 128 bits, aléatoire par mot de passe, inclus dans le hash) + 31 caractères de condensat |
| Sel | Généré par `bcrypt.hash` (sel aléatoire par utilisateur, embarqué dans la chaîne) — pas de « pepper » |
| Répartition | 62 comptes avec hash `$2b$10$` · 38 sans mot de passe : 21 comptes OAuth (17 Google, 4 LinkedIn) et 17 comptes importés d'un ancien site (WordPress/HelloAsso) qui n'ont jamais défini de mot de passe et passent par « mot de passe oublié » |
| Vérification | `bcrypt.compare` dans `lib/auth.ts` (Credentials `authorize`), `/api/auth/check-credentials` et `/api/auth/change-password` |
| Normalisation | e-mail en minuscules à l'inscription et à la connexion |
| Politique | 12 caractères minimum + majuscule + minuscule + chiffre + caractère spécial parmi `@$!%*?&` |
| Statut | Connexion refusée si `accountStatus !== "active"` (`pending` à l'inscription, validation manuelle dans le Studio) |
| Rôles | **Aucun rôle d'administration côté site.** Trois routes vérifient `user.role === "admin"`, mais aucun document n'a ce rôle (1 seul document a `role: "member"`, hérité de l'ancien site) : ces routes sont inaccessibles |
| Comptes Studio | **3 comptes gérés par Sanity** (2 `administrator`, 1 `editor`) : authentification Sanity (Google/GitHub/e-mail Sanity). **Leurs mots de passe ne sont pas récupérables** ; on ne peut migrer que l'adresse e-mail et le rôle |
| Jetons de réinitialisation | Documents `passwordResetToken` : jeton hexadécimal de 64 caractères **en clair**, validité 1 h, marqués `used` |
| Sessions | JWT signé par `NEXTAUTH_SECRET`, cookie `authjs.session-token`, pas de table de sessions |

Champs hérités présents sur certains documents `user` et absents du schéma : `tenantId` (61, branche
`feature/multi-tenant-prep`), `_system` (96), et sur un seul document `username`, `nickname`,
`fullName`, `originalUserId`, `helloAssoMember`, `lastLogin`, `language`, `anneesLvh`, `domainesEtudes`,
`currentJob`, `company`, `role`, `description`.

## 4. Routes et pages

Légende rendu : **SSR-dyn** = rendu serveur à chaque requête (appel à `auth()` → cookies) ;
**CSR** = composant client.

### 4.1 Pages publiques (middleware : `publicRoutes`)

| Route | But | Données | Composants | Rendu |
|---|---|---|---|---|
| `/` | Accueil visiteur (redirige vers `/accueil` si connecté) : hero, présentation de l'espace membres, appel à l'adhésion | aucune (texte en dur) | `PublicHeader`, `HeroSection`, `Footer` | SSR-dyn |
| `/connexion` | Connexion e-mail/mot de passe + Google + LinkedIn ; messages `?registered`, `?pending`, `?message=account-created` | `/api/auth/check-credentials` puis `signIn('credentials')` | `PasswordInput`, `OAuthButtons` | CSR |
| `/inscription` | Création de compte (prénom, nom, e-mail, type de membre, mot de passe ×2) → statut `pending` | `/api/auth/register` | `PasswordInput`, `OAuthButtons` | CSR |
| `/mot-de-passe-oublie` | Demande de lien de réinitialisation | `/api/auth/forgot-password` | | CSR |
| `/reinitialiser-mot-de-passe?token=` | Nouveau mot de passe | `/api/auth/reset-password` | `PasswordInput` | CSR |
| `/validation-en-cours` | Message « compte en attente de validation » | | | SSR |
| `/a-propos` (+ tout `/a-propos/*`) | Histoire, lycée, mission, **bureau** (membres avec `roleAssociation`), services, adhésion, contact, réseaux | `user` actifs avec `roleAssociation` | `Header`/`PublicHeader`, `HeroSection` | SSR-dyn |
| `/politique-confidentialite`, `/mentions-legales` | Pages légales (texte en dur) | | | SSR-dyn |

### 4.2 Pages réservées aux membres connectés (redirection vers `/connexion` sinon)

| Route | But | Données (requêtes GROQ, `sanity/lib/queries.ts`) | Composants | Rendu |
|---|---|---|---|---|
| `/accueil` | Tableau de bord membre : prochain événement en bannière, recherche dans l'annuaire, raccourcis, rappel de profil incomplet, exploration par matière et par ville, nouveaux membres, fil communauté (annonces, témoignages, articles) | `directoryUsersQuery`, `recentMembersQuery`, `upcomingEventsQuery`, `recentPostsQuery`, `recentAnnouncementsQuery`, `popularTestimonialsQuery` | `Header`, `DirectoryCard`, `EventBanner`, `QuickLink`, `FeedCard` | SSR-dyn |
| `/annuaire` | **Annuaire** : recherche plein texte tolérante (accents, abréviations « st »), suggestions (matières, villes, écoles/entreprises, membres), filtres ville (actuelle / tout le parcours), matières (cumul), promo, type ; tri pertinence/nom/promo ; filtres dans l'URL ; « afficher plus » par 24 ; explications de correspondance ; invitation à compléter son profil | `directoryUsersQuery` (alumni, bts, prépa, personnel visibles) | `DirectoryList`, `DirectorySearchBox` (combobox ARIA), `FilterMenu` (menu / bottom sheet), `SubjectCheckboxes`, `DirectoryCard` ; logique dans `lib/directorySearch.ts` | SSR-dyn + CSR |
| `/annuaire/[id]` | Fiche membre : couverture, photo, type, matières (liens vers l'annuaire filtré), promo, poste/école, ville, domaine, études, e-mail, LinkedIn, bio, expériences et formations triées, témoignages publiés ; boutons « Modifier mon profil » si c'est soi | `userByIdQuery`, `userPublishedTestimonialsQuery` | `TestimonialCard` | SSR-dyn |
| `/profil` | Édition de son profil : photo et couverture (recadrage), prénom, nom, promo, LinkedIn ou classe actuelle, ville, matières (3 max), fonction (personnel), bio, formations, expériences, visibilité dans l'annuaire ; barre « modifications non enregistrées » + alerte `beforeunload` | profil par e-mail de session | `ProfileForm`, `ImageCropModal` (`react-easy-crop`), `SubjectCheckboxes` | SSR-dyn + CSR |
| `/parametres` | Infos du compte, changement de mot de passe, préférences newsletter, suppression du compte (saisie « SUPPRIMER ») | `newsletterSubscriptionQuery` | `SettingsForm`, `PasswordInput` | SSR-dyn + CSR |
| `/annonces` | Forum d'annonces : recherche (titre, entreprise, lieu, auteur), filtre par type, liens « Mes annonces » / « Publier » | `announcementsQuery` (publiées, non expirées) | `AnnouncementFilters`, `AnnouncementCard` | SSR-dyn + CSR |
| `/annonces/[slug]` | Détail : type, date, événement (date + compte à rebours), entreprise, lieu, description (Portable Text), contacts (e-mail, téléphone, lien), auteur | `announcementQuery` (**pas de filtre de statut ni d'expiration**) | `PortableText` | SSR-dyn |
| `/annonces/nouvelle` | Publier une annonce (titre, type, date d'événement, entreprise, lieu, description, contacts, expiration) | `/api/announcements/create` | `AnnouncementForm` | SSR-dyn + CSR |
| `/annonces/mes-annonces` | Liste de ses annonces (publiées / brouillons), voir, modifier, supprimer (modale) | `userAnnouncementsQuery` | `MyAnnouncementCard` | SSR-dyn |
| `/annonces/modifier/[slug]` | Modifier son annonce (auteur seulement) | `announcementQuery` | `EditAnnouncementForm` | SSR-dyn + CSR |
| `/temoignages` | Témoignages publiés : recherche (titre, résumé, tags, auteur), filtre par type | `testimonialsQuery` | `TestimonialFilters`, `TestimonialCard` | SSR-dyn + CSR |
| `/temoignages/[slug]` | Détail : image, type, titre, résumé, note, likes, tags, auteur, questions/réponses propres au type, bio de l'auteur | `testimonialQuery` (**pas de filtre de statut**) | | SSR-dyn |
| `/temoignages/nouveau` | Rédiger un témoignage (6 types, questions spécifiques à chacun) | `/api/testimonials/create` | `TestimonialForm` | SSR-dyn + CSR |
| `/temoignages/mes-temoignages` | Ses témoignages, voir/modifier/supprimer | `userTestimonialsQuery` | `MyTestimonialCard` | SSR-dyn |
| `/temoignages/modifier/[slug]` | Modifier son témoignage (**titre, type, résumé, note, tags seulement**) | `testimonialQuery` | `EditTestimonialForm` | SSR-dyn + CSR |
| `/blog` | Liste des articles : recherche, filtre par année, tri (date, titre), pagination par 9, image aléatoire de repli | `postsQuery` (**tous les articles, `visibility` ignorée**) | `BlogContent`, `BlogFilters`, `Pagination` | SSR-dyn + CSR |
| `/blog/[slug]` | Article : image, titre, date, temps de lecture, extrait, corps Portable Text (titres, citations, listes, liens, images Sanity **ou par URL**), partage Facebook/X/LinkedIn | `postQuery` | `PortableText` | SSR-dyn |
| `/choisir-type` | Choix du type de membre après une première connexion OAuth (crée le document `user` en `pending`, puis déconnecte) | `/api/auth/update-user-type` | | CSR |
| `/alumni` | Page de campagne e-mail « Rejoins la communauté » | | `AlumniContent` | SSR |
| `/qrcode` | Page de destination du QR code (salons) | | `QRCodeContent` | SSR |
| `/studio/[[...tool]]` | Sanity Studio embarqué (authentification Sanity propre) | | `NextStudio` | CSR |
| `not-found`, `error`, `loading` | Pages 404, erreur, chargement global | | `BackButton` | |

> `/alumni` et `/qrcode` sont présentées comme publiques dans le code mais **ne figurent pas dans
> `publicRoutes`** : un visiteur non connecté est renvoyé vers `/connexion` (bug).

### 4.3 Middleware (`middleware.ts`)

`auth()` de NextAuth enveloppe toutes les requêtes hors statiques :
1. `/api/auth/*`, `/api/webhooks/*`, `/api/cron/*` : passent sans contrôle (les autres API vérifient la session elles-mêmes).
2. Session avec identifiant `temp-…` (nouvel OAuth) → `/choisir-type`.
3. Session `pending` sur une page non publique → `/validation-en-cours`.
4. Pas de session sur une page non publique → `/connexion`.
5. Ajoute `x-correlation-id`, `x-response-time`, `x-user-id`.

## 5. API (route handlers)

| Route | Méthode | Garde | Rôle |
|---|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | — | NextAuth |
| `/api/auth/register` | POST | rate-limit 5/min | Crée un `user` `pending` (bcrypt 10), e-mail à l'admin |
| `/api/auth/check-credentials` | POST | rate-limit 5/min | Vérifie e-mail/mot de passe et statut, message unique contre l'énumération |
| `/api/auth/forgot-password` | POST | rate-limit 3/15 min | Crée un jeton (1 h), invalide les anciens, envoie l'e-mail ; réponse identique si compte inconnu |
| `/api/auth/reset-password` | POST | rate-limit 3/h | Vérifie le jeton, remplace le hash, marque le jeton utilisé |
| `/api/auth/change-password` | POST | session | Vérifie l'ancien mot de passe, enregistre le nouveau |
| `/api/auth/update-user-type` | POST | session | OAuth : crée le `user` `pending` ; sinon change `userType` |
| `/api/auth/notify-admin-oauth` | POST | session `isNewUser` | E-mail à l'admin |
| `/api/profile/update` | POST | session + propriétaire (id **et** e-mail) | Met à jour le profil (liste blanche Zod) |
| `/api/upload-image` | POST | session | Téléverse une image (≤ 5 Mo, `image/*`) dans les assets Sanity |
| `/api/announcements/create` | POST | session, `userId === session`, rate-limit 10/5 min | Crée une annonce publiée + notifie les abonnés |
| `/api/announcements/[id]` | PATCH/DELETE | session + auteur | Modifie (liste blanche) / supprime |
| `/api/testimonials/create` | POST | session, rate-limit | Crée un témoignage publié |
| `/api/testimonials/[id]` | PATCH/DELETE | session + auteur | Modifie / supprime |
| `/api/newsletter/subscribe` | GET/POST | session | Lit / modifie l'abonnement |
| `/api/user/preferences` | POST | session + propriétaire | Préférences newsletter |
| `/api/user/delete` | DELETE | session + propriétaire | Supprime le compte, ses annonces et son abonnement (pas ses témoignages ni ses journaux) |
| `/api/user/check-status` | POST | rate-limit | Renvoie le statut d'un e-mail (oracle d'existence) |
| `/api/activity/log` | POST | session | Écrit un `activityLog` (action libre) |
| `/api/analytics/web-vitals` | POST | — | Journalise une métrique |
| `/api/stats` | GET | `role === 'admin'` (inatteignable) | Compteurs |
| `/api/newsletter/export` | GET | `role === 'admin'` (inatteignable) | CSV des abonnements |
| `/api/newsletter/sync-drive` | POST | `role === 'admin'` (inatteignable) | CSV vers Google Drive |
| `/api/cron/sync-newsletters` | GET | `Bearer CRON_SECRET` | CSV des abonnements vers Google Drive |
| `/api/cron/profile-reminders` | GET | `Bearer CRON_SECRET` | Rappel unique à J+30 des profils vides (40 par passage, `?dryRun=1`) |
| `/api/webhooks/sanity-user-validation` | POST | signature HMAC Sanity + horodatage 5 min | E-mail « compte validé » quand `accountStatus` passe à `active` dans le Studio |
| `/api/health` | GET | — | Santé Sanity / e-mail |

## 6. Schémas Sanity et usage de chaque type de contenu

| Type | Champs | Écrit par | Lu par | Édité dans le Studio pour |
|---|---|---|---|---|
| `user` | prénom, nom, e-mail, `password` (caché), `oauthProvider`/`oauthId` (cachés), `linkedInProfile.raw`/`googleProfile.raw` (cachés), `userType` (lyceen, bts, prepa, alumni, staff), `profileImage` (hotspot), `promotionYear`, `city`, `subjects` (≤ 3, 16 valeurs), `currentStudies`, `linkedIn`, `bio`, `description`, `coverImage`, `education[]` (école, diplôme, domaine, ville, début, fin, description), `experience[]` (entreprise, poste, lieu, début, fin, actuel, description), `roleAssociation[]` (10 rôles du bureau), `staffCategory`, `staffDetails`, `isVisibleInDirectory`, `accountStatus` (active, pending, suspended, inactive), `profileReminderSentAt`, `createdAt` | inscription, OAuth, profil, cron | annuaire, fiche, accueil, à propos, auth | **valider les inscriptions**, suspendre, nommer le **bureau** (`roleAssociation`), corriger un profil, masquer de l'annuaire |
| `post` | titre, slug, `mainImage` (+ alt, hotspot), `publishedAt`, `excerpt`, `visibility` (public / membres), `body` (Portable Text : normal, h2, h3, citation ; gras, italique, souligné, barré, code ; liens `href` + `target`) | **Studio uniquement** | blog, accueil | **écrire, publier, supprimer les articles** |
| `announcement` | titre, slug, `type` (job_offer, internship, opportunity, event, school_supplies, other), `eventDate`, entreprise, lieu, description (Portable Text : normal, h3, h4, listes), contacts, `author` (réf.), `publishedAt`, `expiresAt`, `status` (draft, published, archived) | membres | annonces, accueil | modérer, archiver, dater un événement |
| `testimonial` | titre, slug, `type` (studies, company, career, international, mentoring, project), `author`, `excerpt`, `featuredImage`, 30 champs de questions selon le type, `tags`, `rating` (1–5), `status`, `likes` (lecture seule), `publishedAt`, `createdAt` | membres | témoignages, fiche, accueil | modérer, archiver, illustrer |
| `newsletterSubscription` | `user` (réf.), `generalNewsletter`, `announcementsNewsletter`, `subscribedAt`, `updatedAt` | paramètres | notifications d'annonces, exports | consulter les abonnés |
| `passwordResetToken` | e-mail, jeton, expiration, `used`, `createdAt` | mot de passe oublié | réinitialisation | — |
| `activityLog` | `user` (réf.), `action`, `resource`, `resourceId`, `details`, `ipAddress`, `userAgent`, `timestamp` | connexions, visites de pages | tableau de bord du Studio | **statistiques de fréquentation** (widget) |

Outils du Studio utilisés : **Structure** (listes par type, tris déclarés), **Vision** (requêtes GROQ),
**Dashboard** avec `ActivityStatsWidget` (membres, visiteurs uniques, pages vues, jour le plus actif,
taux de retour, courbe sur 7/14/30 jours, en excluant `contact@ataieb-dev.fr`), médiathèque des assets.

## 7. Modèles de données et relations

```
user 1──* announcement.author        user 1──* testimonial.author
user 1──0..1 newsletterSubscription  user 1──* activityLog.user
passwordResetToken.email ──> user.email (lien par valeur)
user.profileImage / coverImage, post.mainImage, testimonial.featuredImage ──> sanity.imageAsset
post.body[] (blocs image) ──> sanity.imageAsset ou URL externe (import WordPress)
```

Logique métier hors base, à conserver telle quelle : `lib/directorySearch.ts` (normalisation, index,
pertinence, villes extraites des noms d'écoles), `lib/subjects.ts` (16 matières, 3 max),
`lib/userUtils.ts` (activité la plus récente), `lib/eventDate.ts` (dates à l'heure de Paris),
`lib/inferSubjects.ts` (déduction des matières, script de rattrapage).

## 8. Intégrations

| Intégration | Usage | Variables |
|---|---|---|
| Sanity Content Lake + Studio | données, comptes, assets, back-office, webhook de validation | `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION`, `SANITY_API_TOKEN`, `SANITY_WEBHOOK_SECRET`, `SANITY_STUDIO_URL` |
| NextAuth | sessions JWT, OAuth | `NEXTAUTH_SECRET`, `NEXTAUTH_URL` |
| Google OAuth | connexion | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| LinkedIn OAuth (OIDC) | connexion (optionnelle) | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` |
| Gmail SMTP | e-mails transactionnels | `EMAIL_USER`, `EMAIL_PASSWORD`, `ADMIN_EMAIL` (destinataire des demandes d'inscription) ; `EMAIL_HOST`, `EMAIL_PORT` présents mais non lus |
| Google Drive | export CSV des abonnés | `CLIENT_ID`, `CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_DRIVE_FOLDER_ID` |
| Vercel Cron | 2 tâches | `CRON_SECRET` |
| Sentry | erreurs, traces, Web Vitals | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT` |
| URLs | liens d'e-mails, partage | `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_SITE_URL` (**non défini** : les liens de partage pointent vers `https://votre-site.com`) |

E-mails : demande d'inscription (admin, lien vers le Studio), compte validé, réinitialisation, rappel de
profil vide, notification de nouvelle annonce, et 4 modèles marketing utilisés par des scripts hors dépôt.

## 9. Flux utilisateur

1. **Inscription e-mail** : `/inscription` → `register` → `pending` + e-mail admin → `/validation-en-cours` → un administrateur passe le compte à `active` **dans le Studio** → webhook → e-mail « compte validé » → `/connexion`.
2. **Inscription OAuth** : bouton Google/LinkedIn → session `temp-<id>` → `/choisir-type` → création `pending` + e-mail admin → déconnexion → `/validation-en-cours` → même validation.
3. **Connexion** : `check-credentials` (message précis) puis `signIn('credentials')` → `/accueil`. OAuth : rattachement automatique par e-mail à un compte existant.
4. **Mot de passe oublié** : e-mail → lien 1 h → nouveau mot de passe.
5. **Lycéen cherchant un parcours** : `/accueil` → matière ou ville populaire, ou recherche → `/annuaire?matiere=…&ville=…` → fiche → e-mail / LinkedIn.
6. **Ancien qui complète son profil** : bandeau « Aide les lycéens à te trouver » → `/profil` → enregistrement.
7. **Annonce** : `/annonces/nouvelle` → publiée immédiatement → e-mail aux abonnés → visible jusqu'à expiration.
8. **Témoignage** : `/temoignages/nouveau` → publié immédiatement.
9. **Administration** : tout se fait dans le Studio Sanity (validation, bureau, articles, modération, statistiques).

## 10. Problèmes constatés

### UX / UI
- Identité générique de gabarit : dégradés bleu→violet partout, verre dépoli, émojis en guise d'icônes, boutons et rayons incohérents (`blue-600`, `blue-900`, dégradés ; `rounded-lg`/`xl`/`2xl`/`3xl`).
- Deux en-têtes différents (`Header`, `PublicHeader`) ; le menu visiteur affiche « Blog » et « Témoignages », qui renvoient vers `/connexion` (impasses).
- `/alumni` et `/qrcode` (campagnes) inaccessibles aux visiteurs ; lien Instagram du QR code cassé (`instagram.com/https://www.instagram.com/…`).
- L'accueil vante une « messagerie privée » qui n'existe pas.
- Le blog ignore `visibility` ; son état vide renvoie vers `/studio`.
- Détails d'annonces et de témoignages accessibles même en brouillon, archivés ou expirés ; libellé « Vente matos » absent de la fiche annonce ; un personnel apparaît comme « Étudiant » sur un témoignage.
- La modification d'un témoignage ne permet pas de retoucher ses réponses.
- Connexion en deux allers-retours (deux `bcrypt.compare`).
- Validation des formulaires uniquement à l'envoi ; règles de mot de passe sans retour en direct ; `alert()` en cas d'échec de suppression.
- Page de chargement plein écran animée à chaque navigation.

### Accessibilité
- Plusieurs `<h1>` par page (nom du site dans l'en-tête).
- Libellés non associés aux champs dans `ProfileForm`, `inscription` (pas de `htmlFor`/`id`).
- Menus utilisateur et mobile : pas d'`aria-expanded`, pas de piège à focus ni de fermeture par Échap ; le panneau mobile fermé reste focalisable (`translate-x-full`).
- Modales de suppression sans `role="dialog"`, sans gestion du focus.
- Contrastes insuffisants : `text-gray-400` sur blanc (≈ 2,5:1), texte blanc sur bannière ambre/orange, `text-blue-200` sur dégradé.
- Images décoratives et SVG sans `aria-hidden` dans plusieurs pages ; `<img>` brutes sans dimensions dans les témoignages.
- Points positifs à garder : combobox ARIA de l'annuaire, `FilterMenu` (Échap, retour du focus), `prefers-reduced-motion`, `:focus-visible`.

### Performance
- Chaque rendu appelle `auth()`, dont le callback `session` **interroge Sanity à chaque requête**.
- Une **écriture Sanity par page vue** (`PageVisitTracker` → `activityLog`).
- `/accueil` charge tout l'annuaire pour calculer des compteurs ; `useCdn: false` partout.
- Aucune page statique ni mise en cache ; image de fond aléatoire lue sur disque à chaque requête du blog.
- Rate-limit en mémoire, donc par instance (inefficace en serverless).

### Sécurité
- Pas de protection CSRF explicite sur les API JSON (seulement `SameSite=Lax` du cookie de session).
- Jetons de réinitialisation stockés en clair ; `/api/user/check-status` révèle l'existence d'un compte.
- `/api/activity/log` accepte n'importe quelle action ; `/api/newsletter/subscribe` et `/api/user/preferences` sans validation de schéma.
- Routes d'administration protégées par un rôle qui n'existe pas.
