# PARITY — Checklist exhaustive des fonctionnalités existantes

Chaque ligne décrit une fonctionnalité présente sur `main` (site **et** Studio Sanity). Elle est cochée
une fois **vérifiée sur la branche `rebuild` lancée en local** ; la preuve suit le tiret long.
`E2E` = test Playwright (`tests/e2e`, build de production, membres fictifs), `U` = test Vitest,
`M` = vérification dans le navigateur ou par requête sur la base migrée (vraies données, en local).
Les écarts assumés sont signalés par ⚠️ et justifiés dans [REPORT.md](REPORT.md) § Écarts.

**Bilan : 116 fonctionnalités vérifiées sur 125 ; 9 écarts signalés (⚠️), dont 6 dépendent de services
externes non disponibles en local (OAuth Google/LinkedIn, Sentry, Google Drive).**

## A. Comptes et authentification

- [x] A1. Inscription par e-mail : prénom, nom, e-mail, type de membre (lycéen, BTS, prépa, ancien, personnel), mot de passe ×2 — E2E `auth.spec` (inscription complète)
- [x] A2. Politique de mot de passe : 12 caractères min., majuscule, minuscule, chiffre, caractère spécial `@$!%*?&` — U `validations.test`, `register-tokens.test` · E2E (règles affichées pendant la saisie)
- [x] A3. Refus d'un e-mail déjà utilisé ; message spécifique si une demande est déjà en attente — U `register-tokens.test`
- [x] A4. Compte créé au statut « en attente » ; e-mail de notification à l'administrateur (`ADMIN_EMAIL`) — U `register-tokens.test` (notification de l’administrateur)
- [x] A5. Page « validation en cours » après inscription — E2E `auth.spec`
- [x] A6. Connexion e-mail + mot de passe (e-mail insensible à la casse) avec les **hash existants** — U `credentials.test`, `migration/import.test` (hash `$2b$10$` d’origine) · M (base migrée : 62 hash identiques)
- [x] A7. Message d'erreur unique pour compte inconnu / mot de passe faux (pas d'énumération) — U `credentials.test` · E2E `auth.spec`
- [x] A8. Message dédié pour un compte OAuth sans mot de passe — U `credentials.test`
- [x] A9. Message dédié pour un compte en attente de validation (après mot de passe correct) — U `credentials.test` · E2E `auth.spec`
- [x] A10. Limitation des tentatives de connexion / inscription (5 par minute et par IP) — U `credentials.test` (connexion), `register-tokens.test` (inscription)
- [ ] A11. Connexion Google (OAuth) ; rattachement automatique à un compte existant par e-mail — ⚠️ lecture du code ; à tester en préproduction avec les identifiants Google (REPORT § Écarts)
- [ ] A12. Connexion LinkedIn (OIDC) si configurée — ⚠️ lecture du code ; à tester en préproduction avec les identifiants LinkedIn
- [ ] A13. Première connexion OAuth : choix du type de membre, création du compte en attente, notification admin — ⚠️ lecture du code ; dépend d’une vraie connexion OAuth
- [x] A14. Compte non actif connecté via OAuth → page « validation en cours » — U `proxy.test` · lecture du code (`lib/auth.ts`)
- [x] A15. Mot de passe oublié : e-mail avec lien valable 1 h, réponse identique si le compte n'existe pas, anciens liens invalidés — E2E `auth.spec` (lien reçu, réponse identique) · U `register-tokens.test` (anciens liens invalidés)
- [x] A16. Réinitialisation par jeton (usage unique, expiration) — E2E `auth.spec` (lien à usage unique) · U `register-tokens.test`
- [x] A17. Changement de mot de passe (ancien mot de passe requis) dans les paramètres — E2E `parcours.spec`
- [x] A18. Déconnexion depuis le menu utilisateur (desktop et mobile) — E2E `parcours.spec` (menu utilisateur) · lecture du code (menu mobile)
- [x] A19. Suppression de son compte (confirmation en tapant « SUPPRIMER ») : supprime aussi ses annonces et son abonnement, puis déconnecte — E2E `parcours.spec` (annonces et fiche disparues, connexion refusée)
- [x] A20. Redirection vers `/connexion` des pages membres pour un visiteur ; vers `/validation-en-cours` pour un compte en attente — U `proxy.test` · E2E `visitor.spec`, `auth.spec`
- [x] A21. Journalisation des connexions (credentials et OAuth) — lecture du code (`lib/auth.ts`, journal visible dans /admin/statistiques) · M

## B. Pages publiques

- [x] B1. Accueil visiteur : présentation, espace membres, appel à adhérer, lien de connexion ; redirection vers `/accueil` si connecté — E2E `visitor.spec` · U `proxy.test` (redirection)
- [x] B2. À propos : histoire, lycée, mission (3 piliers), **bureau** (membres actifs ayant un rôle, triés par rôle, photo ou initiales, poste actuel), services, adhésion, contact (e-mail, adresse), réseaux (LinkedIn, Instagram) — M (base migrée : bureau, mission, contact, réseaux) · E2E `moderation.spec` (bureau)
- [x] B3. Mentions légales — M
- [x] B4. Politique de confidentialité — M
- [x] B5. Page de campagne `/alumni` (avantages, inscription, réseaux, contact) — M · E2E `member.spec`
- [x] B6. Page de destination `/qrcode` (avantages, inscription, réseaux, contact) — M · E2E `visitor.spec`, `member.spec`
- [x] B7. Pages 404 et erreur avec retour à l'accueil — E2E `visitor.spec` (vrai 404)
- [x] B8. Pied de page : navigation, liens légaux, adhésion, contact, réseaux sociaux, crédit du développeur — E2E `visitor.spec` · M

## C. Espace membre — accueil

- [x] C1. Salutation par le prénom ; titre adapté aux lycéens — E2E `auth.spec` (« Bonjour Noé ») · lecture du code (titre lycéen)
- [x] C2. Prochain événement en bannière (date, compte à rebours, heure de Paris, lieu) + autres événements à venir — M (capture « après » sur les données de test : bannière, compte à rebours)
- [x] C3. Recherche dans l'annuaire depuis l'accueil (envoie vers `/annuaire?q=`) — lecture du code (formulaire `/annuaire?q=`) · M
- [x] C4. Matières populaires (5) et grille « Explorer par matière » avec nombre de profils — M (base migrée)
- [x] C5. « Où sont-ils passés ? » : villes du parcours avec nombre de membres — M (base migrée)
- [x] C6. Raccourcis : annuaire, mon profil, poster une annonce, écrire un témoignage — M
- [x] C7. Rappel de profil incomplet (ville, matières, poste/études, promo) — M · lecture du code
- [x] C8. Nouveaux membres (profils présentables, badge « Nouveau » < 30 jours, « Vous » pour soi) — M · lecture du code
- [x] C9. Fil « Dans la communauté » : 3 annonces, 3 témoignages populaires, 3 articles — M (base migrée)

## D. Annuaire (fonctionnalité clé)

- [x] D1. Liste des membres visibles (anciens, prépa, BTS, personnels ; lycéens exclus), profils remplis d'abord — E2E `parcours.spec` (lycéen absent) · M
- [x] D2. Recherche plein texte tolérante (accents, casse, « st »/« saint », mots vides) sur nom, promo, poste, école, entreprise, ville, matières, parcours, bio — U `directorySearch.test` · E2E `member.spec`
- [x] D3. Suggestions groupées : matières, villes, écoles/entreprises, membres (navigation clavier ↑ ↓ Entrée Échap) — E2E `parcours.spec` (flèche + Entrée)
- [x] D4. Filtre ville : « tout le parcours » ou « ville actuelle », suggestions de villes avec décompte, proposition d'élargir — lecture du code · M · U `directorySearch.test` (villes du parcours)
- [x] D5. Filtre matières multiples (cumul classé en premier) — U `directorySearch.test` · M
- [x] D6. Filtre promo (masqué pour le personnel) et filtre type de membre, avec décomptes — lecture du code · M
- [x] D7. Tri : pertinence, nom, promo la plus récente — lecture du code · M
- [x] D8. Filtres actifs en pastilles retirables, « Tout effacer » — lecture du code · M
- [x] D9. Filtres conservés dans l'URL (partage, retour depuis une fiche) ; liens profonds `?matiere=`, `?ville=`, `?q=` — E2E `member.spec` (`?ville=`, `?q=`), `parcours.spec`
- [x] D10. Explication de la correspondance quand elle n'est pas visible sur la carte (expérience, formation, bio) — U `directorySearch.test` (« dit où ») · lecture du code
- [x] D11. Pagination « Afficher plus » par 24 — lecture du code (`PAGE_SIZE = 24`) · M
- [x] D12. Découverte par matière et par ville quand aucun filtre n'est actif — M (base migrée)
- [x] D13. État vide avec conseils — E2E `moderation.spec` (« Aucun membre ne correspond »)
- [x] D14. Panneaux de filtre en menu déroulant (desktop) et en panneau bas (mobile) — lecture du code (`FilterMenu`) · M
- [x] D15. Carte membre : photo ou initiales colorées, type, promo, poste/école, ville, matières (surlignées si filtrées) — M

## E. Fiche membre

- [x] E1. Couverture, photo, nom, type, matières cliquables — E2E `member.spec` · M
- [x] E2. Promo, poste/formation actuel, entreprise/école, ville actuelle, domaine, études actuelles, e-mail — M
- [x] E3. LinkedIn (URL complétée en https), « Modifier mon profil » si c'est soi — M · lecture du code
- [x] E4. À propos (bio), expériences (triées, période, lieu, description), formations (triées, lieu, domaine) — E2E `member.spec` (expérience) · M
- [x] E5. Témoignages publiés du membre ; états vides avec appel à compléter si c'est soi — lecture du code · M

## F. Profil

- [x] F1. Photo de profil : choix, recadrage carré, suppression ; formats JPG/PNG/WEBP, 5 Mo max — lecture du code (`ImageCropDialog`, 5 Mo) · M
- [x] F2. Photo de couverture : choix, recadrage 3:1, suppression — lecture du code · M
- [x] F3. Prénom, nom ; promo (année du bac, ou prévue) ; LinkedIn (anciens et personnels) ; classe actuelle (BTS, prépa) — M
- [x] F4. Ville actuelle (hors personnel et lycéens) — E2E `member.spec`
- [x] F5. Matières : 3 maximum — U `validations.test` · lecture du code
- [x] F6. Personnel : catégorie (direction, enseignant, vie scolaire, administratif, autre) et détail du poste ; établissement et ville fixes — lecture du code · M
- [x] F7. E-mail affiché non modifiable ; bio — E2E `member.spec` (bio)
- [x] F8. Formations (anciens et personnels) : ajouter, modifier, supprimer ; école, diplôme, domaine, ville, années, description — lecture du code · M
- [x] F9. Expériences (anciens et personnels) : ajouter, modifier, supprimer ; entreprise, poste, lieu, dates, poste actuel, description — lecture du code · M
- [x] F10. Visibilité dans l'annuaire — lecture du code · U `member-permissions.test`
- [x] F11. Profil restreint pour les lycéens (nom, prénom, e-mail) — E2E `parcours.spec`
- [x] F12. Barre « modifications non enregistrées » + alerte en quittant la page — lecture du code (`beforeunload`) · M
- [x] F13. Lien « Voir mon profil public » — lecture du code

## G. Paramètres

- [x] G1. Nom et e-mail affichés — M
- [x] G2. Changement de mot de passe (confirmation, règles) — E2E `parcours.spec`
- [x] G3. Préférences : newsletter générale, notifications d'annonces — E2E `parcours.spec` (enregistré dès la bascule, conservé au rechargement)
- [x] G4. Suppression du compte (cf. A19) — E2E `parcours.spec`

## H. Annonces

- [x] H1. Liste des annonces publiées non expirées, plus récentes d'abord — M · lecture du code
- [x] H2. Recherche (titre, entreprise, lieu, auteur) et filtre par type (emploi, stage, opportunité, événement, vente de matériel) — E2E `parcours.spec`
- [x] H3. Création : titre (100 car.), type, date d'événement (obligatoire pour un événement), entreprise, lieu, description, e-mail/téléphone/lien (au moins un), expiration — E2E `member.spec` (validation : moyen de contact obligatoire) · U `validations.test`
- [x] H4. Publication immédiate et e-mail aux abonnés « notifications d'annonces » — E2E `member.spec` · U `cron-notifications.test` (abonnés actifs seulement)
- [x] H5. Détail : type, date, événement (date, compte à rebours), entreprise, lieu, description, boutons de contact, auteur (lien vers sa fiche, poste actuel) — M
- [x] H6. Mes annonces : publiées / brouillons, badge « Expirée », voir, modifier, supprimer avec confirmation — E2E `member.spec`
- [x] H7. Modification par l'auteur seulement (tous les champs) ; suppression par l'auteur seulement — U `member-permissions.test` (appel direct refusé)
- [x] H8. Limitation : 10 créations / 5 min — lecture du code (`contentCreation` : 10 / 5 min) · U `rate-limit.test`

## I. Témoignages

- [x] I1. Liste des témoignages publiés ; recherche (titre, résumé, tags, auteur) ; filtre par type (6 types) — E2E `parcours.spec`, `member.spec`
- [x] I2. Création : type, titre (10–120), résumé (50–300), note 1–5, tags, questions propres au type — E2E `parcours.spec`
- [x] I3. Détail : image, type, date, titre, résumé, note, likes, tags, auteur (promo, LinkedIn), réponses mises en forme, bio de l'auteur, appel « Partager mon expérience » — M
- [x] I4. Mes témoignages : publiés / brouillons, voir, modifier, supprimer avec confirmation — E2E `parcours.spec`
- [x] I5. Modification et suppression par l'auteur seulement — U `member-permissions.test`

## J. Blog

- [x] J1. Liste des articles : image (ou image de repli), date, titre, extrait — E2E `visitor.spec` · M
- [x] J2. Recherche, filtre par année, tri (date ↑↓, titre ↑↓), pagination par 9 — E2E `parcours.spec` (recherche) · lecture du code (année, tri, 9 par page)
- [x] J3. Article : image, titre, date, temps de lecture, extrait, corps riche (titres, citations, listes, gras, italique, liens internes/externes, images avec légende, images d'articles importés de WordPress) — U `richtext.test` (titres, listes, liens, légendes) · M (articles importés de WordPress)
- [x] J4. Partage Facebook, X, LinkedIn ; retour au blog — lecture du code · M
- [x] J5. Appel à s'abonner à la newsletter (lien vers les paramètres) — M (page du blog)

## K. Navigation et transverse

- [x] K1. En-tête membre : accueil, blog, témoignages, annuaire, annonces, menu utilisateur (profil, paramètres, déconnexion, type de membre, photo) — E2E (menu utilisateur) · M
- [x] K2. En-tête visiteur : accueil, à propos, connexion — E2E `visitor.spec`
- [x] K3. Menu mobile — E2E `parcours.spec`, `member.spec` (menu mobile)
- [x] K4. Notifications toast (succès/erreur) — E2E (toasts de succès et d’erreur dans plusieurs parcours)
- [x] K5. Journal des pages vues des membres (hors pages d'authentification) — alimente les statistiques — E2E `member.spec` (journal de la page vue : 200)
- [ ] K6. Web Vitals envoyés à Sentry / `/api/analytics/web-vitals` — ⚠️ envoi validé et borné (U `member-permissions.test`) ; Sentry chargé à la demande, réception non testée sans DSN
- [ ] K7. Sentry (erreurs serveur et client) quand le DSN est configuré — ⚠️ configuration navigateur déplacée dans `instrumentation-client.ts` (l'ancienne n'était plus chargée avec Turbopack) ; non testée sans DSN
- [x] K8. Identifiant de corrélation et temps de réponse dans les en-têtes — lecture du code (`proxy.ts`) · M
- [x] K9. `/api/health` — M (`/api/health` → 200)
- [x] K10. `lang="fr"`, favicon, métadonnées de pages — lecture du code · M

## L. Tâches planifiées et e-mails

- [ ] L1. Cron quotidien : export CSV des abonnés vers Google Drive (création ou mise à jour du fichier) — ⚠️ code inchangé ; dépend des identifiants Google Drive (non utilisés en local)
- [x] L2. Cron quotidien : rappel unique à J+30 des profils vides (40 par passage, `?dryRun=1`, marquage après envoi réussi) — U `cron-notifications.test` (secret, essai à blanc, J+30, marquage, reprise après échec)
- [x] L3. E-mail « compte validé » lors de l'activation d'un compte — E2E `auth.spec` (« Votre compte a été validé ! »)
- [x] L4. E-mail de réinitialisation ; e-mail admin de nouvelle inscription (avec lien vers la fiche à valider) — E2E `auth.spec` (réinitialisation) · U `email.test` (e-mail admin vers l’administration du site)
- [x] L5. E-mail de nouvelle annonce aux abonnés, avec lien de gestion des préférences — U `email.test`, `cron-notifications.test`
- [x] L6. Modèles marketing (invitation alumni, invitation élèves, comptes migrés, création de compte) toujours exportés par `lib/emails` — lecture du code (`lib/emails/index.ts`)

## M. Ce qui se fait aujourd'hui dans le Studio Sanity

- [x] M1. **Valider une inscription** (`pending` → `active`) avec envoi automatique de l'e-mail « compte validé » — E2E `auth.spec` (validation depuis /admin/utilisateurs + e-mail)
- [x] M2. Suspendre / désactiver un compte (`suspended`, `inactive`) — E2E `moderation.spec` · U `admin-permissions.test`
- [x] M3. Modifier n'importe quel champ d'un membre (type, promo, ville, matières, bio, formations, expériences, photos, visibilité…) — E2E `moderation.spec`
- [x] M4. Nommer les membres du **bureau** (`roleAssociation`, 10 rôles) → page À propos — E2E `moderation.spec` (rôle de bureau → page À propos)
- [x] M5. Lister / rechercher / trier les membres (aperçu : nom, type, photo) — M · lecture du code (`UserFilters`)
- [x] M6. **Créer, modifier, publier, supprimer un article** : titre, slug, image principale (+ texte alternatif, point focal), date de publication, extrait, visibilité (public / membres), corps riche (H2, H3, citation ; gras, italique, souligné, barré, code ; liens avec cible) — E2E `admin.spec` (brouillon invisible, publication) · U `content.test`
- [x] M7. Modérer les annonces : modifier, changer le statut (brouillon, publiée, archivée), fixer la date d'un événement, supprimer — E2E `moderation.spec` (archivage puis republication)
- [x] M8. Modérer les témoignages : modifier, changer le statut, ajouter une image de couverture, supprimer (likes en lecture seule) — U `member-permissions.test` (image de couverture réservée aux administrateurs) · lecture du code
- [x] M9. Consulter / modifier les abonnements newsletter — U `admin-permissions.test` · lecture du code (fiche membre › Abonnements)
- [ ] M10. Consulter les jetons de réinitialisation et le journal d'activité (tris par date) — ⚠️ journal d’activité : oui (/admin/statistiques) ; jetons : non, ils sont désormais chiffrés (REPORT § Écarts)
- [x] M11. Tableau de bord de fréquentation : membres, visiteurs uniques, pages vues, jour le plus actif, taux de retour, courbe 7/14/30 jours (hors compte du développeur) — E2E `moderation.spec` · M
- [x] M12. Médiathèque : parcourir et réutiliser les images téléversées — E2E `admin.spec` (téléversement), `moderation.spec`
- [ ] M13. Vision : requêtes GROQ ad hoc sur toutes les données — ⚠️ pas d’équivalent : export CSV, statistiques, console SQL de Neon (REPORT § Écarts)
- [ ] M14. Gestion des accès au Studio (3 comptes Sanity : 2 administrateurs, 1 éditeur) — ⚠️ remplacé par les rôles du site (administrateur / membre) ; plus de rôle « éditeur » distinct (REPORT § Écarts)
- [x] M15. Export CSV des abonnés et synchro Drive à la demande (routes prévues pour un admin) — E2E `moderation.spec` (CSV téléchargé)
- [x] M16. Compteurs globaux (membres, actifs, en attente, annonces, abonnés) — route `/api/stats` — U `admin-permissions.test` (`/api/admin/stats`) · M (tableau de bord)
