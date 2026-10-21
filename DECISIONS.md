# DECISIONS — Choix faits pendant la refonte

Chaque décision indique le contexte, le choix retenu et pourquoi. Les décisions
marquées **(réversible)** se changent sans migration de données.

> Voir aussi : [MAP.md](MAP.md) (état d'origine), [PARITY.md](PARITY.md)
> (checklist), [DESIGN.md](DESIGN.md) (identité), [REPORT.md](REPORT.md)
> (chiffres, mise en production).

---

## 1. Stack

**Conservée** : Next.js 16 (App Router), React 19, TypeScript strict,
Tailwind 4, NextAuth v5, bcryptjs, nodemailer, Sentry, hébergement Vercel.
Aucun blocage technique ne justifiait d'en changer.

Ajouts, chacun pour un besoin précis :

| Paquet | Pourquoi |
|---|---|
| `drizzle-orm` + `postgres` | Accès à la nouvelle base (voir §2) |
| `@electric-sql/pglite` | PostgreSQL embarqué pour le développement et les tests, sans Docker |
| `@vercel/blob` | Stockage des images (voir §3) |
| `sharp` | Ré-encodage des images téléversées |
| `@tiptap/*` | Éditeur de texte riche sur place, chargé seulement pour les administrateurs |
| `sanitize-html` | Liste blanche du HTML enregistré |

Retirés : `sanity`, `next-sanity`, `@sanity/*`, `@portabletext/*` et le
Studio embarqué (`/studio`).

## 2. Base de données : PostgreSQL + Drizzle

**Choix** : PostgreSQL (recommandé : **Neon** via la Marketplace Vercel, qui
injecte `DATABASE_URL`), ORM **Drizzle**, migrations SQL versionnées
(`db/migrations`).

**Pourquoi**
- Les données sont relationnelles : comptes, auteurs d'annonces et de
  témoignages, abonnements, rôles. Les contraintes (e-mail unique, clés
  étrangères, suppression en cascade) garantissent l'intégrité que Sanity ne
  garantissait pas : par exemple, une annonce pouvait pointer vers un compte
  supprimé.
- JSONB pour les contenus éditables (textes des pages, brouillons,
  historique) : souple comme Sanity, mais validé par Zod à l'écriture.
- Portable : n'importe quel PostgreSQL convient (Neon, Supabase, Scaleway,
  auto-hébergé). Aucune dépendance à un fournisseur dans le code.
- Drizzle plutôt que Prisma : pas de moteur binaire, SQL lisible, démarrage à
  froid léger sur Vercel, et compatible avec PGlite.

**Écartés** : MongoDB (proche du modèle Sanity, mais sans contraintes),
SQLite/Turso (viable, mais JSONB et les outils PostgreSQL sont plus solides),
Supabase « complet » (auth et stockage en double avec l'existant).

**Développement et tests** : `DATABASE_URL=pglite:./.data/pglite`, un vrai
PostgreSQL compilé en WebAssembly. Les migrations s'appliquent au premier
accès. Un fichier verrou empêche deux processus d'ouvrir la même base locale.
Les tests utilisent `pglite:memory`, une base neuve par fichier.

**Production** : `next build` n'ouvre aucune connexion (initialisation
paresseuse). Sans `DATABASE_URL` en production, l'application refuse de
démarrer plutôt que d'écrire dans une base locale éphémère.

## 3. Images : Vercel Blob

- Production : **Vercel Blob public** (`BLOB_READ_WRITE_TOKEN`). En local et
  en test : fichiers dans `MEDIA_DIR`, servis par `/media/...`.
- Chaque téléversement est ré-encodé en WebP par `sharp`, limité à 2400 px,
  **sans métadonnées EXIF** (la position GPS des photos n'est plus publiée),
  avec un aperçu flou pour le chargement.
- Les URL restent publiques, comme celles du CDN Sanity auparavant : le niveau
  d'exposition des photos ne change pas. Un stockage privé avec URL signées
  serait possible plus tard **(réversible)**.

## 4. Modèle de contenu, brouillons et historique

- Textes, images et listes de chaque page éditable : table `content_entries`
  (`published` + `draft`), un schéma Zod par page
  (`lib/content/definitions.ts`). Les visiteurs ne lisent **que** `published`.
- Articles du blog : table `posts`, dont les colonnes publiées sont lues par
  les visiteurs et la colonne `draft` (JSONB) contient les modifications en
  cours. Un nouvel article est un brouillon invisible (404 pour les visiteurs).
- Historique : chaque enregistrement et chaque publication crée une version
  (`content_versions`, 50 dernières conservées). Avant la première version,
  l'état publié est conservé comme « Version d'origine » : on peut toujours
  revenir au texte de départ, y compris pour les articles importés. « Restaurer » recopie une
  version **dans le brouillon** : rien n'est publié sans un clic sur
  « Publier ».
- Valeurs par défaut : les textes codés en dur des anciennes pages sont repris
  tels quels comme première version publiée. La mise en page reste donc
  identique tant que personne ne modifie rien.

## 5. Texte riche

- Le Portable Text des articles est converti en HTML à l'import, puis assaini
  par liste blanche à chaque écriture : titres H2 et H3, citation, listes,
  gras, italique, souligné, barré, code, liens, et images du site seulement.
  Les attributs `style` et `on*`, les scripts, les iframes et les liens
  `javascript:` sont retirés.
- Descriptions d'annonces : texte simple (paragraphes, lignes « - » ou « • »
  pour les listes), comme le formulaire d'origine le proposait aux membres.

## 6. Comptes et mots de passe

- Les **hash bcrypt d'origine sont recopiés tels quels** : tous les membres
  se connectent avec leur mot de passe actuel. `npm run migrate:verify`
  vérifie l'égalité octet par octet (empreintes comparées, jamais affichées).
- Les nouveaux hash utilisent bcrypt avec un coût de 12 (`BCRYPT_COST`). Un
  hash plus faible (coût 10 à l'origine) est **recalculé de façon
  transparente** à la connexion suivante. Les préfixes `$2y$` et `$2x$` sont
  acceptés.
- Le même message s'affiche pour un e-mail inconnu et pour un mot de passe
  faux, avec une vérification factice pour un temps de réponse identique : on
  ne peut plus tester si un e-mail est inscrit. Les statuts « en attente » et
  « suspendu » ne sont révélés qu'après un mot de passe correct.
- **Comptes du Studio Sanity** : leurs mots de passe **ne sont pas
  récupérables**, car le Studio s'authentifie chez Sanity (Google, GitHub ou
  e-mail Sanity) et Sanity n'expose aucun hash. Leurs e-mails et rôles sont
  migrés : chacun devient un administrateur sans mot de passe, invisible dans
  l'annuaire, à inviter depuis `/admin/utilisateurs` (« Envoyer une
  invitation »), avec un lien à usage unique valable 7 jours. Si l'e-mail
  correspond déjà à un compte du site, ce compte est simplement promu
  administrateur.
- Politique de mot de passe **inchangée** : 12 caractères, une majuscule, une
  minuscule, un chiffre et un caractère spécial parmi `@$!%*?&`. Elle est
  désormais affichée et vérifiée pendant la saisie.

## 7. Sessions, rôles et protections

- Session JWT (comme avant). Le jeton relit le compte en base toutes les
  5 minutes : un compte suspendu, supprimé ou rétrogradé perd ses droits sans
  devoir se déconnecter.
- **Toute écriture relit le compte en base** (`lib/api.ts`), sans se fier au
  rôle stocké dans le jeton. Un administrateur rétrogradé ne peut plus rien
  modifier, même avec un jeton encore valide. C'est testé dans
  `tests/api/admin-permissions.test.ts`.
- Rôle `admin` sur le compte, et non plus dans le Studio. Le dernier
  administrateur ne peut pas être rétrogradé, et un administrateur ne peut pas
  modifier son propre rôle. `ADMIN_EMAILS` permet de désigner les premiers
  administrateurs à l'import.
- **CSRF** : jeton en double soumission (cookie `csrf_token` SameSite=Strict
  et en-tête `x-csrf-token`), plus une vérification de l'en-tête
  Origin/Referer sur toutes les requêtes qui modifient des données.
- **Limitation de débit** en mémoire, par route et par IP (connexion :
  5 tentatives par minute). Sur Vercel, chaque instance a son propre
  compteur : la protection est réelle mais approximative. Upstash Redis (via
  la Marketplace) la rendrait globale **(réversible)**.
- Validation Zod de tous les corps de requête. Les champs `userId` envoyés
  par le client sont ignorés : l'auteur est toujours le compte de la session.

## 8. Changements d'accès volontaires

| Page | Avant | Après | Raison |
|---|---|---|---|
| `/blog` et articles | membres seulement | articles « public » ouverts à tous ; articles « membres » réservés | Le champ « visibilité » existait dans Sanity sans effet : la route entière était protégée. Le choix des rédacteurs est désormais respecté. Les actualités servent aussi la vitrine et le référencement. **(réversible)** : passer un article en « membres ». |
| `/alumni`, `/qrcode` | redirigées vers la connexion | publiques | Ce sont les pages d'adhésion ouvertes par le QR code distribué au lycée. Un visiteur sans compte ne pouvait pas les lire. |
| `/media/...` | — | publique | Images servies en local, équivalent du CDN Sanity |
| Annuaire | comptes visibles, **quel que soit leur statut** | comptes **actifs** et visibles | Un compte en attente, refusé ou suspendu ne doit pas apparaître aux membres. |
| `/inscription`, `/connexion` pour un membre connecté | formulaire affiché | renvoi vers `/accueil`, ou la page demandée si elle est sur le site | Un membre n'a plus à s'inscrire. Tous les liens d'inscription et de connexion sont masqués une fois connecté : contenus éditables, pied de page, pages de campagne (remplacés par « Mon espace membre »). Testé dans `tests/e2e/member.spec.ts`. |

Une adresse inconnue en dehors des sections publiques renvoie un visiteur
vers la connexion, comme avant : le proxy ne sait pas si la page existe. Sous
une section publique (`/blog/...`) et pour un membre connecté, la réponse est
un vrai **404**. L'écran de chargement (squelette) n'est utilisé que par
l'administration. À la racine, il faisait répondre 200 aux pages
introuvables. Sur les pages membres, il doublait le DOM et retardait
l'affichage, alors que le serveur répond en moins de 100 ms (accueil membre
sur mobile : 76 → 88).

## 9. Corrections de comportement

- **Suppression de compte** : annonces, témoignages, abonnement et liens
  d'invitation ou de réinitialisation en cours sont supprimés avec le compte. Avant, les témoignages restaient
  attachés à un compte supprimé, et Sanity refusait la suppression si une
  référence forte existait.
- **Préférences de newsletter** : enregistrées dès qu'on coche, avec un retour
  visuel. Avant, il fallait trouver un bouton en bas de page.
- **Réinitialisation de mot de passe** : les jetons sont stockés hachés
  (SHA-256) et à usage unique. Avant, ils étaient en clair dans Sanity. Les
  jetons migrés, tous expirés, sont conservés pour l'historique.
- **Témoignages** : toutes les réponses restent modifiables après publication,
  alors que l'ancien formulaire de modification n'en reprenait qu'une partie.

## 10. Routes retirées

| Route | Raison |
|---|---|
| `/studio` | Remplacé par l'administration sur le site |
| `/api/webhooks/sanity-user-validation` | La validation se fait dans `/admin/utilisateurs` et envoie directement l'e-mail |
| `/api/auth/check-credentials` | Pré-contrôle avant connexion : remplacé par des erreurs typées du fournisseur d'identifiants, sans route supplémentaire à protéger |
| `/api/auth/notify-admin-oauth`, `/api/user/check-status`, `/api/stats` | Aucun appelant dans le code d'origine |
| `/api/newsletter/export`, `/api/newsletter/sync-drive` | Déplacées sous `/api/admin/newsletter/*` (réservées aux administrateurs) |

Les scripts npm qui pointaient vers `scripts/` (dossier retiré du dépôt dans
`e3392c5` et basé sur Sanity) sont supprimés du `package.json`. Les copies
locales non versionnées n'ont pas été touchées.

## 11. Migration des données

- Export **en lecture seule** (`npm run migrate:export`). Rien n'est modifié
  ni supprimé côté Sanity.
- Import **idempotent** (`npm run migrate:import`) : les identifiants Sanity
  sont conservés comme clés primaires et un nouvel import met à jour les mêmes
  lignes. Un rôle administrateur n'est jamais retiré, et un brouillon commencé
  sur le nouveau site n'est pas écrasé.
- Les brouillons Sanity (`drafts.*`) ne sont pas importés, car seuls les
  documents publiés étaient visibles. Les annonces, témoignages et abonnements
  dont l'auteur n'existe plus ne sont pas importés (`verify` les compte à
  part). Les journaux d'activité des comptes supprimés sont conservés, sans
  auteur.
- Les documents système Sanity (`system.*`) sont ignorés.

## 12. E-mails hors production

Les e-mails ne partent réellement qu'avec `NODE_ENV=production` et une vraie
base PostgreSQL. En développement, en test ou sur une base locale (qui peut
contenir les comptes migrés), ils sont seulement journalisés, par leur sujet,
sans destinataire. Pour les tests de bout en bout, ils sont déposés dans
`.data/e2e/outbox`. `EMAIL_TRANSPORT=smtp|log|outbox` force le mode.
Motif : `.env.local` contient les identifiants Gmail de l'association, et une
action de test (valider un compte, publier une annonce) aurait écrit à de
vrais membres.

## 13. Mesures envoyées par le navigateur

- Pages vues : journalisées par `/api/activity/log`, réservé aux membres et
  protégé contre le CSRF comme toute écriture.
- Web Vitals : `navigator.sendBeacon` ne peut pas joindre d'en-tête, donc
  la route est publique et sans CSRF. En contrepartie, le corps est validé
  (métrique connue, valeur bornée), le débit est limité et rien n'est écrit
  en base. Seul le **chemin** de la page est envoyé, jamais la recherche :
  `?q=` peut contenir le nom d'un membre.

- **Sentry côté navigateur** : la configuration est déplacée dans
  `instrumentation-client.ts`. Avec Turbopack (Next 16), l'ancien
  `sentry.client.config.ts` n'était plus chargé : les erreurs du navigateur
  ne remontaient pas. Session Replay n'est pas réactivé : il ne tournait
  donc déjà plus, il ajoutait environ 50 Ko sur chaque page, et il
  enregistrait des sessions de membres. Les erreurs et le suivi des
  performances (10 %) restent actifs.
- Le projet Vercel n'a **aucun DSN Sentry** : Sentry ne recevait donc
  rien en production. Le plugin de build Sentry (`withSentryConfig`)
  injectait pourtant environ 70 Ko de JavaScript dans chaque page. Il
  n'est désormais branché que si `NEXT_PUBLIC_SENTRY_DSN` ou `SENTRY_DSN`
  est défini. Il suffit de les ajouter pour réactiver Sentry, côté
  serveur comme côté navigateur.

## 14. Outils de développement

- `/api/dev-login` : connexion sans mot de passe aux comptes `@local.test`,
  pour vérifier les pages membres en local. Elle n'existe que si
  `NODE_ENV=development`, `ALLOW_DEV_LOGIN=1` **et** la base est PGlite.
  Ailleurs, elle répond 404.
- `npm run db:seed-local` : un administrateur et un membre locaux, avec des
  mots de passe tirés au hasard et écrits dans `.data/local-accounts.json`
  (non versionné).
- Tests de bout en bout sur un **build de production** avec des membres
  **fictifs** (`tools/e2e/seed.ts`), jamais sur la base migrée.

## 15. Captures d'écran et dépôt public

Le dépôt GitHub est **public**. Les captures « avant » des pages réservées
aux membres (annuaire, fiches, accueil membre, annonces, témoignages)
montrent de vraies personnes : noms, photos, e-mails.
- Les captures brutes ne sont **pas versionnées** et restent en local dans
  `.data/private-screenshots/`.
- Les captures « avant » versionnées des pages membres sont **floutées**
  (textes et photos illisibles, mise en page visible) : option
  `--blur-members` de `tools/perf/screenshots.mjs`.
- Les captures « après » des pages membres sont prises sur la base de test,
  peuplée de membres fictifs.

## 16. Fusion dans `main`

Pas de fusion : seule une **PR vers `main`** est ouverte. Fusionner
déclencherait un déploiement de production sans base PostgreSQL provisionnée,
sans stockage Blob ni données migrées, donc un site en panne. La bascule
suit les étapes de [REPORT.md](REPORT.md) § « Mise en production ».
