# PARITY — Checklist exhaustive des fonctionnalités existantes

Chaque ligne décrit une fonctionnalité présente sur `main` (site **et** Studio Sanity). Elle est cochée
une fois **vérifiée sur la branche `rebuild` lancée en local** (voir la colonne « Vérifié par » et
[REPORT.md](REPORT.md)). `E2E` = test Playwright, `U` = test Vitest, `M` = vérification manuelle dans
le navigateur. Les écarts assumés sont signalés par ⚠️ et justifiés dans REPORT.md § Écarts.

## A. Comptes et authentification

- [ ] A1. Inscription par e-mail : prénom, nom, e-mail, type de membre (lycéen, BTS, prépa, ancien, personnel), mot de passe ×2
- [ ] A2. Politique de mot de passe : 12 caractères min., majuscule, minuscule, chiffre, caractère spécial `@$!%*?&`
- [ ] A3. Refus d'un e-mail déjà utilisé ; message spécifique si une demande est déjà en attente
- [ ] A4. Compte créé au statut « en attente » ; e-mail de notification à l'administrateur (`ADMIN_EMAIL`)
- [ ] A5. Page « validation en cours » après inscription
- [ ] A6. Connexion e-mail + mot de passe (e-mail insensible à la casse) avec les **hash existants**
- [ ] A7. Message d'erreur unique pour compte inconnu / mot de passe faux (pas d'énumération)
- [ ] A8. Message dédié pour un compte OAuth sans mot de passe
- [ ] A9. Message dédié pour un compte en attente de validation (après mot de passe correct)
- [ ] A10. Limitation des tentatives de connexion / inscription (5 par minute et par IP)
- [ ] A11. Connexion Google (OAuth) ; rattachement automatique à un compte existant par e-mail
- [ ] A12. Connexion LinkedIn (OIDC) si configurée
- [ ] A13. Première connexion OAuth : choix du type de membre, création du compte en attente, notification admin
- [ ] A14. Compte non actif connecté via OAuth → page « validation en cours »
- [ ] A15. Mot de passe oublié : e-mail avec lien valable 1 h, réponse identique si le compte n'existe pas, anciens liens invalidés
- [ ] A16. Réinitialisation par jeton (usage unique, expiration)
- [ ] A17. Changement de mot de passe (ancien mot de passe requis) dans les paramètres
- [ ] A18. Déconnexion depuis le menu utilisateur (desktop et mobile)
- [ ] A19. Suppression de son compte (confirmation en tapant « SUPPRIMER ») : supprime aussi ses annonces et son abonnement, puis déconnecte
- [ ] A20. Redirection vers `/connexion` des pages membres pour un visiteur ; vers `/validation-en-cours` pour un compte en attente
- [ ] A21. Journalisation des connexions (credentials et OAuth)

## B. Pages publiques

- [ ] B1. Accueil visiteur : présentation, espace membres, appel à adhérer, lien de connexion ; redirection vers `/accueil` si connecté
- [ ] B2. À propos : histoire, lycée, mission (3 piliers), **bureau** (membres actifs ayant un rôle, triés par rôle, photo ou initiales, poste actuel), services, adhésion, contact (e-mail, adresse), réseaux (LinkedIn, Instagram)
- [ ] B3. Mentions légales
- [ ] B4. Politique de confidentialité
- [ ] B5. Page de campagne `/alumni` (avantages, inscription, réseaux, contact)
- [ ] B6. Page de destination `/qrcode` (avantages, inscription, réseaux, contact)
- [ ] B7. Pages 404 et erreur avec retour à l'accueil
- [ ] B8. Pied de page : navigation, liens légaux, adhésion, contact, réseaux sociaux, crédit du développeur

## C. Espace membre — accueil

- [ ] C1. Salutation par le prénom ; titre adapté aux lycéens
- [ ] C2. Prochain événement en bannière (date, compte à rebours, heure de Paris, lieu) + autres événements à venir
- [ ] C3. Recherche dans l'annuaire depuis l'accueil (envoie vers `/annuaire?q=`)
- [ ] C4. Matières populaires (5) et grille « Explorer par matière » avec nombre de profils
- [ ] C5. « Où sont-ils passés ? » : villes du parcours avec nombre de membres
- [ ] C6. Raccourcis : annuaire, mon profil, poster une annonce, écrire un témoignage
- [ ] C7. Rappel de profil incomplet (ville, matières, poste/études, promo)
- [ ] C8. Nouveaux membres (profils présentables, badge « Nouveau » < 30 jours, « Vous » pour soi)
- [ ] C9. Fil « Dans la communauté » : 3 annonces, 3 témoignages populaires, 3 articles

## D. Annuaire (fonctionnalité clé)

- [ ] D1. Liste des membres visibles (anciens, prépa, BTS, personnels ; lycéens exclus), profils remplis d'abord
- [ ] D2. Recherche plein texte tolérante (accents, casse, « st »/« saint », mots vides) sur nom, promo, poste, école, entreprise, ville, matières, parcours, bio
- [ ] D3. Suggestions groupées : matières, villes, écoles/entreprises, membres (navigation clavier ↑ ↓ Entrée Échap)
- [ ] D4. Filtre ville : « tout le parcours » ou « ville actuelle », suggestions de villes avec décompte, proposition d'élargir
- [ ] D5. Filtre matières multiples (cumul classé en premier)
- [ ] D6. Filtre promo (masqué pour le personnel) et filtre type de membre, avec décomptes
- [ ] D7. Tri : pertinence, nom, promo la plus récente
- [ ] D8. Filtres actifs en pastilles retirables, « Tout effacer »
- [ ] D9. Filtres conservés dans l'URL (partage, retour depuis une fiche) ; liens profonds `?matiere=`, `?ville=`, `?q=`
- [ ] D10. Explication de la correspondance quand elle n'est pas visible sur la carte (expérience, formation, bio)
- [ ] D11. Pagination « Afficher plus » par 24
- [ ] D12. Découverte par matière et par ville quand aucun filtre n'est actif
- [ ] D13. État vide avec conseils
- [ ] D14. Panneaux de filtre en menu déroulant (desktop) et en panneau bas (mobile)
- [ ] D15. Carte membre : photo ou initiales colorées, type, promo, poste/école, ville, matières (surlignées si filtrées)

## E. Fiche membre

- [ ] E1. Couverture, photo, nom, type, matières cliquables
- [ ] E2. Promo, poste/formation actuel, entreprise/école, ville actuelle, domaine, études actuelles, e-mail
- [ ] E3. LinkedIn (URL complétée en https), « Modifier mon profil » si c'est soi
- [ ] E4. À propos (bio), expériences (triées, période, lieu, description), formations (triées, lieu, domaine)
- [ ] E5. Témoignages publiés du membre ; états vides avec appel à compléter si c'est soi

## F. Profil

- [ ] F1. Photo de profil : choix, recadrage carré, suppression ; formats JPG/PNG/WEBP, 5 Mo max
- [ ] F2. Photo de couverture : choix, recadrage 3:1, suppression
- [ ] F3. Prénom, nom ; promo (année du bac, ou prévue) ; LinkedIn (anciens et personnels) ; classe actuelle (BTS, prépa)
- [ ] F4. Ville actuelle (hors personnel et lycéens)
- [ ] F5. Matières : 3 maximum
- [ ] F6. Personnel : catégorie (direction, enseignant, vie scolaire, administratif, autre) et détail du poste ; établissement et ville fixes
- [ ] F7. E-mail affiché non modifiable ; bio
- [ ] F8. Formations (anciens et personnels) : ajouter, modifier, supprimer ; école, diplôme, domaine, ville, années, description
- [ ] F9. Expériences (anciens et personnels) : ajouter, modifier, supprimer ; entreprise, poste, lieu, dates, poste actuel, description
- [ ] F10. Visibilité dans l'annuaire
- [ ] F11. Profil restreint pour les lycéens (nom, prénom, e-mail)
- [ ] F12. Barre « modifications non enregistrées » + alerte en quittant la page
- [ ] F13. Lien « Voir mon profil public »

## G. Paramètres

- [ ] G1. Nom et e-mail affichés
- [ ] G2. Changement de mot de passe (confirmation, règles)
- [ ] G3. Préférences : newsletter générale, notifications d'annonces
- [ ] G4. Suppression du compte (cf. A19)

## H. Annonces

- [ ] H1. Liste des annonces publiées non expirées, plus récentes d'abord
- [ ] H2. Recherche (titre, entreprise, lieu, auteur) et filtre par type (emploi, stage, opportunité, événement, vente de matériel)
- [ ] H3. Création : titre (100 car.), type, date d'événement (obligatoire pour un événement), entreprise, lieu, description, e-mail/téléphone/lien (au moins un), expiration
- [ ] H4. Publication immédiate et e-mail aux abonnés « notifications d'annonces »
- [ ] H5. Détail : type, date, événement (date, compte à rebours), entreprise, lieu, description, boutons de contact, auteur (lien vers sa fiche, poste actuel)
- [ ] H6. Mes annonces : publiées / brouillons, badge « Expirée », voir, modifier, supprimer avec confirmation
- [ ] H7. Modification par l'auteur seulement (tous les champs) ; suppression par l'auteur seulement
- [ ] H8. Limitation : 10 créations / 5 min

## I. Témoignages

- [ ] I1. Liste des témoignages publiés ; recherche (titre, résumé, tags, auteur) ; filtre par type (6 types)
- [ ] I2. Création : type, titre (10–120), résumé (50–300), note 1–5, tags, questions propres au type
- [ ] I3. Détail : image, type, date, titre, résumé, note, likes, tags, auteur (promo, LinkedIn), réponses mises en forme, bio de l'auteur, appel « Partager mon expérience »
- [ ] I4. Mes témoignages : publiés / brouillons, voir, modifier, supprimer avec confirmation
- [ ] I5. Modification et suppression par l'auteur seulement

## J. Blog

- [ ] J1. Liste des articles : image (ou image de repli), date, titre, extrait
- [ ] J2. Recherche, filtre par année, tri (date ↑↓, titre ↑↓), pagination par 9
- [ ] J3. Article : image, titre, date, temps de lecture, extrait, corps riche (titres, citations, listes, gras, italique, liens internes/externes, images avec légende, images d'articles importés de WordPress)
- [ ] J4. Partage Facebook, X, LinkedIn ; retour au blog
- [ ] J5. Appel à s'abonner à la newsletter (lien vers les paramètres)

## K. Navigation et transverse

- [ ] K1. En-tête membre : accueil, blog, témoignages, annuaire, annonces, menu utilisateur (profil, paramètres, déconnexion, type de membre, photo)
- [ ] K2. En-tête visiteur : accueil, à propos, connexion
- [ ] K3. Menu mobile
- [ ] K4. Notifications toast (succès/erreur)
- [ ] K5. Journal des pages vues des membres (hors pages d'authentification) — alimente les statistiques
- [ ] K6. Web Vitals envoyés à Sentry / `/api/analytics/web-vitals`
- [ ] K7. Sentry (erreurs serveur et client) quand le DSN est configuré
- [ ] K8. Identifiant de corrélation et temps de réponse dans les en-têtes
- [ ] K9. `/api/health`
- [ ] K10. `lang="fr"`, favicon, métadonnées de pages

## L. Tâches planifiées et e-mails

- [ ] L1. Cron quotidien : export CSV des abonnés vers Google Drive (création ou mise à jour du fichier)
- [ ] L2. Cron quotidien : rappel unique à J+30 des profils vides (40 par passage, `?dryRun=1`, marquage après envoi réussi)
- [ ] L3. E-mail « compte validé » lors de l'activation d'un compte
- [ ] L4. E-mail de réinitialisation ; e-mail admin de nouvelle inscription (avec lien vers la fiche à valider)
- [ ] L5. E-mail de nouvelle annonce aux abonnés, avec lien de gestion des préférences
- [ ] L6. Modèles marketing (invitation alumni, invitation élèves, comptes migrés, création de compte) toujours exportés par `lib/emails`

## M. Ce qui se fait aujourd'hui dans le Studio Sanity

- [ ] M1. **Valider une inscription** (`pending` → `active`) avec envoi automatique de l'e-mail « compte validé »
- [ ] M2. Suspendre / désactiver un compte (`suspended`, `inactive`)
- [ ] M3. Modifier n'importe quel champ d'un membre (type, promo, ville, matières, bio, formations, expériences, photos, visibilité…)
- [ ] M4. Nommer les membres du **bureau** (`roleAssociation`, 10 rôles) → page À propos
- [ ] M5. Lister / rechercher / trier les membres (aperçu : nom, type, photo)
- [ ] M6. **Créer, modifier, publier, supprimer un article** : titre, slug, image principale (+ texte alternatif, point focal), date de publication, extrait, visibilité (public / membres), corps riche (H2, H3, citation ; gras, italique, souligné, barré, code ; liens avec cible)
- [ ] M7. Modérer les annonces : modifier, changer le statut (brouillon, publiée, archivée), fixer la date d'un événement, supprimer
- [ ] M8. Modérer les témoignages : modifier, changer le statut, ajouter une image de couverture, supprimer (likes en lecture seule)
- [ ] M9. Consulter / modifier les abonnements newsletter
- [ ] M10. Consulter les jetons de réinitialisation et le journal d'activité (tris par date)
- [ ] M11. Tableau de bord de fréquentation : membres, visiteurs uniques, pages vues, jour le plus actif, taux de retour, courbe 7/14/30 jours (hors compte du développeur)
- [ ] M12. Médiathèque : parcourir et réutiliser les images téléversées
- [ ] M13. Vision : requêtes GROQ ad hoc sur toutes les données
- [ ] M14. Gestion des accès au Studio (3 comptes Sanity : 2 administrateurs, 1 éditeur)
- [ ] M15. Export CSV des abonnés et synchro Drive à la demande (routes prévues pour un admin)
- [ ] M16. Compteurs globaux (membres, actifs, en attente, annonces, abonnés) — route `/api/stats`
