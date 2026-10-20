/**
 * Contenus éditables sur place par les administrateurs.
 *
 * Chaque clé correspond à une page (ou aux réglages du site). Le schéma Zod
 * valide toute écriture côté serveur ; `defaults` reprend les textes qui
 * étaient codés en dur dans les pages avant la refonte (seed initial).
 *
 * Conventions :
 * - champ `*Html` : texte riche, assaini côté serveur (lib/richtext.ts) ;
 * - listes : tableaux d'objets avec un `id` stable (réordonnables) ;
 * - `{count}` dans un texte est remplacé à l'affichage par un nombre réel.
 */
import { z } from 'zod'
import { sanitizeRichText } from '@/lib/richtext'

export const ICON_NAMES = [
  'users', 'briefcase', 'newspaper', 'compass', 'graduation-cap', 'map-pin', 'heart-handshake', 'sparkles',
  'calendar', 'mail', 'megaphone', 'book-open', 'landmark', 'target', 'handshake', 'lightbulb', 'message-circle',
  'rocket', 'globe', 'pen-line',
] as const
export type IconName = (typeof ICON_NAMES)[number]

const text = (max = 400) => z.string().trim().max(max)
const longText = (max = 4000) => z.string().max(max)
const richHtml = z.string().max(60_000).transform((value) => sanitizeRichText(value))
const url = z
  .string()
  .trim()
  .max(500)
  .refine((value) => value === '' || /^(https?:\/\/|mailto:|tel:|\/)/.test(value), 'Lien invalide (https://, mailto:, tel: ou /chemin)')
const link = z.object({ label: text(80), href: url })
const id = z.string().min(1).max(40)
export const imageSchema = z
  .object({
    mediaId: z.string().max(80).optional(),
    url: z.string().max(1000).refine((value) => /^(\/|https:\/\/)/.test(value), 'URL d’image invalide'),
    alt: text(300).optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    focalX: z.number().min(0).max(1).optional(),
    focalY: z.number().min(0).max(1).optional(),
    blurDataUrl: z.string().max(4000).optional(),
  })
  .nullable()
const icon = z.enum(ICON_NAMES)
const card = z.object({ id, icon, title: text(120), text: longText(600) })

const schemas = {
  site: z.object({
    name: text(80),
    tagline: text(160),
    description: text(300),
    contactEmail: z.string().trim().email().max(200),
    address: longText(300),
    socials: z.array(z.object({ id, label: text(40), url })).max(8),
    joinTitle: text(120),
    joinText: longText(300),
    creditLabel: text(120),
    creditUrl: url,
    creditEmail: z.string().trim().max(200),
  }),
  home: z.object({
    hero: z.object({
      eyebrow: text(120),
      title: text(120),
      accent: text(120),
      lead: longText(400),
      image: imageSchema,
      primary: link,
      secondary: link,
      note: text(120),
    }),
    features: z.object({
      title: text(120),
      lead: longText(300),
      items: z.array(card.extend({ bullets: longText(400) })).max(6),
    }),
    join: z.object({ title: text(120), text: longText(500), cta: link, loginPrompt: text(120) }),
  }),
  about: z.object({
    hero: z.object({ title: text(120), lead: longText(400), image: imageSchema }),
    story: z.object({ title: text(120), bodyHtml: richHtml }),
    school: z.object({ title: text(120), bodyHtml: richHtml, image: imageSchema }),
    mission: z.object({ title: text(120), items: z.array(card).max(6), bodyHtml: richHtml }),
    board: z.object({ title: text(120), lead: longText(300) }),
    services: z.object({ title: text(120), items: z.array(card).max(8) }),
    join: z.object({ title: text(120), text: longText(600), cta: link }),
    contact: z.object({ title: text(120) }),
  }),
  campaign: z.object({
    title: text(120),
    tagline: text(200),
    benefits: z.array(card).max(6),
    badge: text(80),
    ctaTitle: text(120),
    ctaText: longText(500),
    ctaNote: text(120),
    ctaPrompt: text(160),
    cta: link,
  }),
  legal: z.object({ title: text(120), lead: longText(300), bodyHtml: richHtml }),
  memberHome: z.object({
    title: text(120),
    accent: text(120),
    titleLyceen: text(120),
    accentLyceen: text(120),
    lead: longText(300),
  }),
  section: z.object({ title: text(120), lead: longText(300) }),
  blog: z.object({
    title: text(120),
    lead: longText(300),
    newsletterTitle: text(120),
    newsletterText: longText(300),
    newsletterCta: link,
  }),
}

/** Clé de contenu → schéma utilisé */
export const CONTENT_SCHEMAS = {
  site: schemas.site,
  home: schemas.home,
  about: schemas.about,
  alumni: schemas.campaign,
  qrcode: schemas.campaign,
  legal: schemas.legal,
  privacy: schemas.legal,
  'member-home': schemas.memberHome,
  directory: schemas.section,
  announcements: schemas.section,
  testimonials: schemas.section,
  blog: schemas.blog,
} as const

export type ContentKey = keyof typeof CONTENT_SCHEMAS
export type ContentOf<K extends ContentKey> = z.infer<(typeof CONTENT_SCHEMAS)[K]>
export type SiteContent = ContentOf<'site'>

export const CONTENT_KEYS = Object.keys(CONTENT_SCHEMAS) as ContentKey[]

export function isContentKey(value: string): value is ContentKey {
  return value in CONTENT_SCHEMAS
}

/** Page publique correspondant à chaque contenu (lien depuis l'administration) */
export const CONTENT_PAGES: Record<ContentKey, { label: string; path: string }> = {
  site: { label: 'Réglages du site (pied de page, contact)', path: '/' },
  home: { label: 'Accueil visiteurs', path: '/' },
  about: { label: 'À propos', path: '/a-propos' },
  alumni: { label: 'Campagne « Rejoins la communauté »', path: '/alumni' },
  qrcode: { label: 'Page du QR code', path: '/qrcode' },
  legal: { label: 'Mentions légales', path: '/mentions-legales' },
  privacy: { label: 'Politique de confidentialité', path: '/politique-confidentialite' },
  'member-home': { label: 'Accueil des membres', path: '/accueil' },
  directory: { label: 'Annuaire (en-tête)', path: '/annuaire' },
  announcements: { label: 'Annonces (en-tête)', path: '/annonces' },
  testimonials: { label: 'Témoignages (en-tête)', path: '/temoignages' },
  blog: { label: 'Blog (en-tête)', path: '/blog' },
}

const CONTACT = 'contact@vh-besancon-alumni.fr'

const campaignBase = {
  cta: { label: 'Créer mon compte', href: '/inscription' },
  ctaPrompt: 'Prêt à nous rejoindre ? Crée ton compte maintenant !',
}

export const CONTENT_DEFAULTS: { [K in ContentKey]: ContentOf<K> } = {
  site: {
    name: 'VH Besançon Alumni',
    tagline: 'Le réseau des anciens du lycée Victor Hugo de Besançon',
    description: "Association des anciens élèves et personnels du Lycée Victor Hugo de Besançon",
    contactEmail: CONTACT,
    address: 'Lycée Victor Hugo\n1 rue Rembrandt\n25000 Besançon',
    socials: [
      { id: 'linkedin', label: 'LinkedIn', url: 'https://linkedin.com/company/vh-besancon-alumni/' },
      { id: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/vh_besancon_alumni/' },
    ],
    joinTitle: "L'association vit grâce à ses membres",
    joinText: 'Adhésion libre et gratuite.',
    creditLabel: 'Site développé et maintenu par Adam Taieb',
    creditUrl: 'https://ataieb-dev.fr',
    creditEmail: 'contact@ataieb-dev.fr',
  },
  home: {
    hero: {
      eyebrow: "Réseau d'alumni depuis 2022",
      title: 'VH Besançon',
      accent: 'Alumni',
      lead: "L'association qui connecte élèves actuels, anciens élèves et personnels du Lycée Victor Hugo de Besançon.",
      image: { url: '/images/lycee-victor-hugo.jpg', alt: 'Façade du lycée Victor Hugo de Besançon', width: 1600, height: 1067 },
      primary: { label: 'Créer mon compte', href: '/inscription' },
      secondary: { label: 'Se connecter', href: '/connexion' },
      note: 'Adhésion gratuite',
    },
    features: {
      title: "Découvrez l'espace membres",
      lead: 'Des outils pour développer votre réseau et trouver votre voie',
      items: [
        {
          id: 'annuaire',
          icon: 'users',
          title: 'Annuaire',
          text: 'Retrouvez vos camarades, développez votre réseau professionnel et échangez avec des anciens pour vous guider dans votre parcours.',
          bullets: 'Recherche par matière, ville, école ou métier\nProfils détaillés des parcours',
        },
        {
          id: 'annonces',
          icon: 'briefcase',
          title: "Forum d'annonces",
          text: "Partagez et consultez des offres d'emploi et opportunités professionnelles.",
          bullets: "Offres d'emploi\nStages et collaborations",
        },
        {
          id: 'actualites',
          icon: 'newspaper',
          title: 'Actualités',
          text: 'Restez informé avec notre blog et nos newsletters mensuelles.',
          bullets: 'Articles & événements\nNewsletters',
        },
      ],
    },
    join: {
      title: 'Rejoignez VH Besançon Alumni',
      text: "Accès complet à l'annuaire, aux annonces et aux newsletters. Association gérée bénévolement, adhésion libre et gratuite.",
      cta: { label: 'Adhérer gratuitement', href: '/inscription' },
      loginPrompt: 'Déjà membre ?',
    },
  },
  about: {
    hero: {
      title: 'À propos',
      lead: "L'association qui connecte élèves actuels, anciens élèves et personnels du Lycée Victor Hugo",
      image: { url: '/images/lvh-facade-640x360.jpg', alt: 'Le lycée Victor Hugo, quartier de Planoise', width: 640, height: 360 },
    },
    story: {
      title: 'Notre histoire',
      bodyHtml:
        "<p><strong>VH Besançon Alumni</strong> est une association loi 1901 fondée en <strong>2022</strong> à l'initiative de quatre anciennes élèves du Lycée Victor Hugo de Besançon. Animées par la volonté d'aider les élèves actuels dans leur orientation et de maintenir les liens entre tous ceux qui ont un lien avec notre établissement, elles ont créé ce réseau pour connecter anciens et actuels autour de valeurs communes.</p>\n<p>Aujourd'hui, l'association est composée de membres actifs au sein du bureau qui œuvrent quotidiennement pour animer la communauté, organiser des événements et développer de nouveaux services pour élèves actuels, anciens et personnels.</p>",
    },
    school: {
      title: 'Le Lycée Victor Hugo',
      bodyHtml:
        "<p>Le Lycée Victor Hugo de Besançon s'inscrit dans une longue tradition d'excellence éducative. Fondé à la <strong>fin du XVIe siècle</strong> par les Jésuites, l'établissement a traversé les siècles et les régimes, passant du Collège Saint Louis au Lycée Impérial, pour finalement prendre le nom de <strong>Victor Hugo en 1885</strong>, en hommage au poète français né à Besançon. Déménagé en 1980 dans le quartier de Planoise, le lycée continue aujourd'hui de former les générations futures tout en maintenant son héritage d'excellence et d'innovation.</p>",
      image: { url: '/images/lvh-facade-640x360.jpg', alt: 'Le lycée Victor Hugo, quartier de Planoise', width: 640, height: 360 },
    },
    mission: {
      title: 'Notre mission',
      items: [
        { id: 'connecter', icon: 'handshake', title: 'Connecter', text: 'Créer des liens durables entre anciens élèves et personnels' },
        { id: 'accompagner', icon: 'briefcase', title: 'Accompagner', text: 'Soutenir les parcours professionnels de chacun' },
        { id: 'partager', icon: 'target', title: 'Partager', text: 'Échanger opportunités et expériences' },
      ],
      bodyHtml:
        '<p>Que vous soyez <strong>ancien élève</strong>, <strong>personnel enseignant</strong> ou <strong>administratif</strong>, ou encore élève actuellement en cours de scolarité, nous vous offrons un espace pour rester connectés, partager des opportunités et vous entraider tout au long de votre parcours professionnel.</p>',
    },
    board: {
      title: 'Le bureau',
      lead: 'Une équipe passionnée et engagée pour faire vivre la communauté VH Besançon Alumni',
    },
    services: {
      title: 'Ce que nous proposons',
      items: [
        { id: 'annuaire', icon: 'users', title: 'Annuaire des membres', text: 'Retrouvez vos camarades, échangez avec des anciens pour découvrir des parcours inspirants et développez votre réseau professionnel au sein de la communauté VH.' },
        { id: 'annonces', icon: 'briefcase', title: "Forum d'annonces", text: "Partagez et consultez des offres d'emploi, de stage, des opportunités professionnelles et des événements au sein de notre communauté." },
        { id: 'actualites', icon: 'newspaper', title: 'Actualités', text: "Restez informé des dernières nouvelles de l'association, des événements à venir et des actualités de la communauté VH." },
        { id: 'newsletters', icon: 'mail', title: 'Newsletters', text: 'Recevez nos actualités et les nouvelles opportunités directement dans votre boîte mail selon vos préférences.' },
      ],
    },
    join: {
      title: 'Comment nous rejoindre',
      text: "VH Besançon Alumni est une association qui vit grâce à ses membres. L'adhésion est libre et gratuite, et nous permet de faire grandir la communauté. Elle vous donne accès à toutes les fonctionnalités : annuaire, forum d'annonces, newsletters…",
      cta: { label: 'Adhérer gratuitement', href: '/inscription' },
    },
    contact: { title: 'Nous contacter' },
  },
  alumni: {
    title: 'VH Besançon Alumni',
    tagline: 'Parce que tu as aussi galéré avec ton orientation',
    benefits: [
      { id: 'guider', icon: 'compass', title: 'Guide les élèves actuels', text: 'Aide-les dans leur orientation, propose des stages, partage ton expérience' },
      { id: 'retrouver', icon: 'users', title: 'Retrouve tes camarades', text: 'Reconnecte avec tes anciens et développe ton réseau professionnel' },
      { id: 'lien', icon: 'heart-handshake', title: 'Crée du lien', text: 'Événements entre anciens, rencontres avec les élèves, transmission' },
    ],
    badge: 'Adhésion 100% gratuite',
    ctaTitle: 'Aide la prochaine génération',
    ctaText: "Tu te souviens du stress du post-bac ? Des galères pour trouver un stage ? Aujourd'hui, tu peux aider ceux qui vivent la même chose.",
    ctaNote: 'Inscription en 2 minutes',
    ...campaignBase,
  },
  qrcode: {
    title: 'VH Besançon Alumni',
    tagline: 'Ton réseau pro commence maintenant',
    benefits: [
      { id: 'reseau', icon: 'globe', title: "Réseau d'alumni", text: 'Connecte-toi avec les anciens du lycée partout dans le monde' },
      { id: 'stages', icon: 'briefcase', title: 'Stages & jobs', text: 'Décroche ton stage ou ton premier emploi plus facilement' },
      { id: 'evenements', icon: 'calendar', title: 'Événements & rencontres', text: 'Soirées, conférences et rencontres avec des pros inspirants' },
    ],
    badge: 'Adhésion 100% gratuite',
    ctaTitle: "Rejoins l'asso dès aujourd'hui !",
    ctaText: "Tu es élève au Lycée Victor Hugo ? Adhère à l'association pour construire ton futur réseau.",
    ctaNote: 'Inscription en 2 minutes chrono',
    ...campaignBase,
  },
  legal: {
    title: 'Mentions légales',
    lead: 'Informations légales relatives au site vh-besancon-alumni.fr',
    bodyHtml: [
      '<h2>1. Éditeur du site</h2>',
      `<p><strong>Nom :</strong> Association VH Besançon Alumni<br><strong>Forme juridique :</strong> Association loi 1901<br><strong>Siège social :</strong> Lycée Victor Hugo, 1 rue Rembrandt, 25000 Besançon<br><strong>Email :</strong> <a href="mailto:${CONTACT}">${CONTACT}</a></p>`,
      '<h2>2. Directeur de publication</h2>',
      "<p><strong>Qualité :</strong> Présidente de l'association VH Besançon Alumni</p>",
      `<p>Pour connaître l'identité du directeur de publication, merci de nous contacter à <a href="mailto:${CONTACT}">${CONTACT}</a></p>`,
      '<h2>3. Hébergement</h2>',
      '<h3>Hébergement du site web et des fichiers</h3>',
      '<p><strong>Raison sociale :</strong> Vercel Inc.<br><strong>Adresse :</strong> 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis<br><strong>Site web :</strong> <a href="https://vercel.com">vercel.com</a></p>',
      '<h3>Hébergement des données</h3>',
      "<p>Base de données PostgreSQL hébergée par le prestataire choisi par l'association (voir la politique de confidentialité). Les données sont hébergées conformément au RGPD.</p>",
      '<h3>Nom de domaine</h3>',
      '<p><strong>Registrar :</strong> OVH<br><strong>Adresse :</strong> 2 rue Kellermann, 59100 Roubaix, France<br><strong>Site web :</strong> <a href="https://www.ovh.com">ovh.com</a></p>',
      '<h2>4. Propriété intellectuelle</h2>',
      "<p>L'ensemble du contenu de ce site (textes, images, vidéos, logos, etc.) est la propriété exclusive de l'Association VH Besançon Alumni, sauf mention contraire.</p>",
      '<p>Toute reproduction, distribution, modification ou exploitation du contenu sans autorisation préalable écrite est interdite et constitue une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle.</p>',
      '<p>Les photos de profil et contenus publiés par les membres restent leur propriété exclusive.</p>',
      '<h2>5. Limitation de responsabilité</h2>',
      "<p>L'association VH Besançon Alumni s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur ce site, mais ne peut en garantir l'exhaustivité, la précision ou l'actualité.</p>",
      "<p>L'association ne saurait être tenue responsable :</p>",
      "<ul><li>Des erreurs ou omissions dans le contenu du site</li><li>Des dommages directs ou indirects résultant de l'accès ou de l'utilisation du site</li><li>De l'interruption temporaire ou définitive du service</li><li>Des contenus publiés par les membres (sous réserve de signalement et modération)</li></ul>",
      '<h2>6. Protection des données personnelles</h2>',
      "<p>Conformément au Règlement Général sur la Protection des Données (RGPD - UE 2016/679) et à la loi Informatique et Libertés, vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données personnelles.</p>",
      '<p>Pour plus d\'informations, consultez notre <a href="/politique-confidentialite">Politique de confidentialité</a>.</p>',
      '<h2>7. Cookies</h2>',
      '<p>Ce site utilise uniquement des cookies strictement nécessaires au fonctionnement de la plateforme (cookies de session et de sécurité).</p>',
      "<p>Aucun cookie publicitaire ou de tracking tiers n'est utilisé.</p>",
      '<h2>8. Droit applicable et juridiction</h2>',
      '<p>Les présentes mentions légales sont régies par le droit français.</p>',
      "<p>En cas de litige, et à défaut de résolution amiable, les tribunaux français seront seuls compétents.</p>",
      '<h2>9. Contact</h2>',
      `<p>Pour toute question concernant ces mentions légales ou le site : <a href="mailto:${CONTACT}">${CONTACT}</a></p>`,
    ].join('\n'),
  },
  privacy: {
    title: 'Politique de confidentialité',
    lead: 'Comment nous protégeons vos données personnelles',
    bodyHtml: [
      '<h2>1. Responsable du traitement des données</h2>',
      `<p><strong>Association VH Besançon Alumni</strong><br>Adresse : Lycée Victor Hugo, 1 rue Rembrandt, 25000 Besançon<br>Email de contact : <a href="mailto:${CONTACT}">${CONTACT}</a></p>`,
      '<h2>2. Données personnelles collectées</h2>',
      "<p>Dans le cadre de l'utilisation de notre plateforme d'annuaire des anciens élèves, nous collectons les données suivantes :</p>",
      "<ul><li><strong>Informations d'identification :</strong> nom, prénom, email</li><li><strong>Informations de profil :</strong> photo (optionnelle), biographie, statut (étudiant, alumni, personnel)</li><li><strong>Données de connexion :</strong> mot de passe (hashé et sécurisé), date de dernière connexion</li><li><strong>Données techniques :</strong> adresse IP (logs temporaires pour la sécurité)</li></ul>",
      '<h2>3. Finalités du traitement</h2>',
      '<p>Vos données sont collectées et traitées pour les finalités suivantes :</p>',
      "<ul><li>Gestion de l'annuaire des anciens élèves de Victor Hugo Besançon</li><li>Faciliter les échanges et le networking entre membres</li><li>Envoi de newsletters et communications liées à l'association (avec votre consentement)</li><li>Gestion des comptes utilisateurs et authentification sécurisée</li><li>Statistiques anonymisées d'utilisation de la plateforme</li></ul>",
      '<h2>4. Base légale du traitement</h2>',
      '<p>Le traitement de vos données repose sur :</p>',
      "<ul><li><strong>Votre consentement :</strong> inscription volontaire à la plateforme</li><li><strong>L'intérêt légitime :</strong> maintien d'un réseau d'anciens élèves pour une association d'alumni</li><li><strong>L'exécution d'un contrat :</strong> fourniture des services de la plateforme</li></ul>",
      '<h2>5. Destinataires de vos données</h2>',
      '<p>Vos données sont accessibles à :</p>',
      "<ul><li><strong>Les administrateurs de l'association VH Besançon</strong> (pour la gestion de la plateforme)</li><li><strong>Les autres membres inscrits</strong> (uniquement les informations de profil public que vous choisissez de partager)</li><li><strong>Nos prestataires techniques :</strong> Vercel Inc. (hébergement du site web et des images) ; l'hébergeur de la base de données PostgreSQL retenu par l'association ; OVH (nom de domaine, France)</li></ul>",
      '<p>Le traitement est conforme au RGPD et encadré par les accords de traitement des données (DPA) de ces prestataires.</p>',
      '<h2>6. Durée de conservation</h2>',
      '<p>Vos données sont conservées :</p>',
      "<ul><li><strong>Données de compte :</strong> pendant toute la durée d'activité de votre compte + 3 ans après la dernière connexion</li><li><strong>Données de connexion (logs) :</strong> 12 mois maximum (pour la sécurité)</li><li><strong>Newsletters :</strong> jusqu'à votre désinscription ou suppression de compte</li></ul>",
      '<p>Vous pouvez demander la suppression de vos données à tout moment (voir section « Vos droits »).</p>',
      '<h2>7. Sécurité de vos données</h2>',
      '<p>Nous mettons en œuvre les mesures techniques et organisationnelles suivantes :</p>',
      '<ul><li>Chiffrement des mots de passe (algorithme bcrypt)</li><li>Connexion HTTPS obligatoire (certificat SSL)</li><li>Authentification sécurisée par JWT (JSON Web Tokens)</li><li>Limitation des tentatives de connexion (protection contre le brute force)</li><li>Protection contre les requêtes intersites (CSRF)</li><li>Sauvegardes régulières des données</li><li>Accès restreint aux administrateurs</li></ul>',
      '<h2>8. Cookies et traceurs</h2>',
      '<p>Notre site utilise uniquement des cookies strictement nécessaires au fonctionnement :</p>',
      '<ul><li><strong>Cookie de session (NextAuth) :</strong> maintien de votre connexion (durée : session)</li><li><strong>Cookie CSRF :</strong> protection contre les attaques (durée : session)</li></ul>',
      "<p>Nous n'utilisons <strong>aucun cookie publicitaire ou de tracking tiers</strong> (pas de Google Analytics, Facebook Pixel, etc.).</p>",
      '<h2>9. Vos droits (RGPD)</h2>',
      '<p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>',
      "<ul><li><strong>Droit d'accès :</strong> obtenir une copie de toutes vos données personnelles</li><li><strong>Droit de rectification :</strong> modifier vos données inexactes ou incomplètes</li><li><strong>Droit à l'effacement :</strong> supprimer définitivement votre compte et toutes vos données</li><li><strong>Droit à la portabilité :</strong> récupérer vos données dans un format structuré (JSON/CSV)</li><li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données (notamment newsletters)</li><li><strong>Droit à la limitation :</strong> limiter temporairement le traitement de vos données</li></ul>",
      `<p>Pour exercer vos droits, envoyez un email à <a href="mailto:${CONTACT}">${CONTACT}</a>. Nous nous engageons à répondre sous <strong>1 mois maximum</strong> (conformément au RGPD).</p>`,
      '<p><strong>Droit de réclamation :</strong> si vous estimez que vos droits ne sont pas respectés, vous pouvez déposer une réclamation auprès de la <strong>CNIL</strong> (Commission Nationale de l\'Informatique et des Libertés) : <a href="https://www.cnil.fr">www.cnil.fr</a></p>',
      '<h2>10. Modifications de cette politique</h2>',
      '<p>Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Toute modification sera publiée sur cette page avec mise à jour de la date indiquée. Nous vous encourageons à consulter régulièrement cette page.</p>',
      '<h2>Des questions sur vos données ?</h2>',
      `<p>Pour toute question concernant la protection de vos données personnelles : <a href="mailto:${CONTACT}">${CONTACT}</a></p>`,
    ].join('\n'),
  },
  'member-home': {
    title: 'Qui est passé par là',
    accent: 'avant toi ?',
    titleLyceen: 'Trouve un ancien qui a fait',
    accentLyceen: 'ce qui te tente',
    lead: '{count} membres du lycée Victor Hugo racontent leur parcours. Cherche une école, un métier, une ville ou une matière.',
  },
  directory: {
    title: 'Annuaire',
    lead: '{count} anciens élèves, prépas et personnels du lycée Victor Hugo : trouvez un parcours qui vous inspire',
  },
  announcements: {
    title: 'Annonces',
    lead: 'Stages, emplois, événements : les opportunités partagées par la communauté',
  },
  testimonials: {
    title: 'Témoignages',
    lead: 'Les parcours, expériences et conseils des anciens, racontés par eux-mêmes',
  },
  blog: {
    title: 'Le blog',
    lead: "Actualités de l'association, événements et portraits",
    newsletterTitle: 'Ne manquez aucun article',
    newsletterText: 'Abonnez-vous à notre newsletter pour recevoir nos derniers articles directement dans votre boîte mail.',
    newsletterCta: { label: "S'abonner à la newsletter", href: '/parametres#newsletter' },
  },
}

export function parseContent<K extends ContentKey>(key: K, value: unknown): ContentOf<K> {
  return CONTENT_SCHEMAS[key].parse(value) as ContentOf<K>
}
