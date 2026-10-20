/**
 * Schéma de la base PostgreSQL qui remplace le Content Lake Sanity.
 *
 * Les identifiants des documents Sanity sont conservés tels quels comme clés
 * primaires : les URL publiques (`/annuaire/<id>`) et les liens déjà partagés
 * restent valides. Chaque table issue de Sanity garde le document d'origine
 * dans `legacy` (sans le hash du mot de passe) pour pouvoir vérifier l'import.
 */
import { sql } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

/** Référence d'image stockée dans les documents (profil, couverture, article…) */
export interface ImageRef {
  mediaId?: string
  url: string
  alt?: string
  width?: number
  height?: number
  /** Point focal (0–1), repris du « hotspot » Sanity */
  focalX?: number
  focalY?: number
  blurDataUrl?: string
}

export interface Education {
  _key?: string
  school: string
  degree: string
  field?: string
  location?: string
  startYear: number
  endYear?: number
  description?: string
}

export interface Experience {
  _key?: string
  company: string
  position: string
  location?: string
  startDate: string
  endDate?: string
  current?: boolean
  description?: string
}

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}

export const USER_TYPES = ['lyceen', 'bts', 'prepa', 'alumni', 'staff'] as const
export const ACCOUNT_STATUSES = ['active', 'pending', 'suspended', 'inactive'] as const
export const ROLES = ['member', 'admin'] as const

export type UserType = (typeof USER_TYPES)[number]
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number]
export type Role = (typeof ROLES)[number]

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    /** Hash bcrypt (`$2a$`/`$2b$`) migré tel quel depuis Sanity ; null pour les comptes OAuth ou invités */
    passwordHash: text('password_hash'),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    userType: text('user_type').$type<UserType>().notNull(),
    role: text('role').$type<Role>().notNull().default('member'),
    accountStatus: text('account_status').$type<AccountStatus>().notNull().default('pending'),
    oauthProvider: text('oauth_provider'),
    oauthId: text('oauth_id'),
    linkedInProfileRaw: text('linkedin_profile_raw'),
    googleProfileRaw: text('google_profile_raw'),
    profileImage: jsonb('profile_image').$type<ImageRef>(),
    coverImage: jsonb('cover_image').$type<ImageRef>(),
    promotionYear: integer('promotion_year'),
    city: text('city'),
    subjects: text('subjects').array().notNull().default(sql`'{}'::text[]`),
    currentStudies: text('current_studies'),
    linkedIn: text('linkedin'),
    bio: text('bio'),
    description: text('description'),
    education: jsonb('education').$type<Education[]>().notNull().default([]),
    experience: jsonb('experience').$type<Experience[]>().notNull().default([]),
    roleAssociation: text('role_association').array().notNull().default(sql`'{}'::text[]`),
    staffCategory: text('staff_category'),
    staffDetails: text('staff_details'),
    isVisibleInDirectory: boolean('is_visible_in_directory').notNull().default(true),
    profileReminderSentAt: timestamp('profile_reminder_sent_at', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    legacy: jsonb('legacy').$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('users_email_unique').on(t.email),
    index('users_directory_idx').on(t.isVisibleInDirectory, t.userType),
    index('users_status_idx').on(t.accountStatus),
  ]
)

export const TOKEN_PURPOSES = ['reset', 'invite'] as const

/** Jetons de réinitialisation et d'invitation : seul le SHA-256 du jeton est stocké */
export const authTokens = pgTable(
  'auth_tokens',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull(),
    tokenHash: text('token_hash').notNull(),
    purpose: text('purpose').$type<(typeof TOKEN_PURPOSES)[number]>().notNull().default('reset'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    legacy: jsonb('legacy').$type<Record<string, unknown>>(),
  },
  (t) => [uniqueIndex('auth_tokens_hash_unique').on(t.tokenHash), index('auth_tokens_email_idx').on(t.email)]
)

export const media = pgTable(
  'media',
  {
    id: text('id').primaryKey(),
    url: text('url').notNull(),
    storageKey: text('storage_key').notNull(),
    filename: text('filename'),
    mimeType: text('mime_type').notNull(),
    size: integer('size').notNull(),
    width: integer('width'),
    height: integer('height'),
    alt: text('alt'),
    blurDataUrl: text('blur_data_url'),
    sanityAssetId: text('sanity_asset_id'),
    uploadedBy: text('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
    legacy: jsonb('legacy').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('media_sanity_asset_unique').on(t.sanityAssetId), index('media_created_idx').on(t.createdAt)]
)

export const CONTENT_STATUSES = ['draft', 'published', 'archived'] as const
export type ContentStatus = (typeof CONTENT_STATUSES)[number]

export const ANNOUNCEMENT_TYPES = ['job_offer', 'internship', 'opportunity', 'event', 'school_supplies', 'other'] as const
export type AnnouncementType = (typeof ANNOUNCEMENT_TYPES)[number]

export const announcements = pgTable(
  'announcements',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    type: text('type').$type<AnnouncementType>().notNull(),
    eventDate: timestamp('event_date', { withTimezone: true }),
    company: text('company'),
    location: text('location'),
    /** Texte brut, paragraphes séparés par une ligne vide */
    description: text('description').notNull(),
    contactEmail: text('contact_email'),
    contactPhone: text('contact_phone'),
    externalLink: text('external_link'),
    authorId: text('author_id').references(() => users.id, { onDelete: 'cascade' }),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    status: text('status').$type<ContentStatus>().notNull().default('published'),
    legacy: jsonb('legacy').$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('announcements_slug_unique').on(t.slug),
    index('announcements_listing_idx').on(t.status, t.publishedAt),
    index('announcements_author_idx').on(t.authorId),
  ]
)

export const TESTIMONIAL_TYPES = ['studies', 'company', 'career', 'international', 'mentoring', 'project'] as const
export type TestimonialType = (typeof TESTIMONIAL_TYPES)[number]

export const testimonials = pgTable(
  'testimonials',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    type: text('type').$type<TestimonialType>().notNull(),
    authorId: text('author_id').references(() => users.id, { onDelete: 'cascade' }),
    excerpt: text('excerpt').notNull(),
    featuredImage: jsonb('featured_image').$type<ImageRef>(),
    /** Réponses aux questions propres au type (`studies_why`, `company_name`…) */
    answers: jsonb('answers').$type<Record<string, string>>().notNull().default({}),
    tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
    rating: integer('rating'),
    status: text('status').$type<ContentStatus>().notNull().default('published'),
    likes: integer('likes').notNull().default(0),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    legacy: jsonb('legacy').$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('testimonials_slug_unique').on(t.slug),
    index('testimonials_listing_idx').on(t.status, t.publishedAt),
    index('testimonials_author_idx').on(t.authorId),
  ]
)

export const POST_VISIBILITIES = ['public', 'members'] as const
export type PostVisibility = (typeof POST_VISIBILITIES)[number]

/** Contenu éditable d'un article (version publiée en colonnes, brouillon dans `draft`) */
export interface PostContent {
  title: string
  slug: string
  excerpt?: string
  bodyHtml: string
  mainImage?: ImageRef | null
  visibility: PostVisibility
  publishedAt: string
}

export const posts = pgTable(
  'posts',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    status: text('status').$type<ContentStatus>().notNull().default('draft'),
    visibility: text('visibility').$type<PostVisibility>().notNull().default('public'),
    title: text('title').notNull(),
    excerpt: text('excerpt'),
    bodyHtml: text('body_html').notNull().default(''),
    mainImage: jsonb('main_image').$type<ImageRef>(),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
    /** Modifications en attente : null quand la version publiée est à jour */
    draft: jsonb('draft').$type<PostContent>(),
    updatedBy: text('updated_by').references(() => users.id, { onDelete: 'set null' }),
    legacy: jsonb('legacy').$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (t) => [uniqueIndex('posts_slug_unique').on(t.slug), index('posts_listing_idx').on(t.status, t.publishedAt)]
)

export const newsletterSubscriptions = pgTable(
  'newsletter_subscriptions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    generalNewsletter: boolean('general_newsletter').notNull().default(false),
    announcementsNewsletter: boolean('announcements_newsletter').notNull().default(false),
    subscribedAt: timestamp('subscribed_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    legacy: jsonb('legacy').$type<Record<string, unknown>>(),
  },
  (t) => [uniqueIndex('newsletter_user_unique').on(t.userId)]
)

export const activityLogs = pgTable(
  'activity_logs',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    resource: text('resource'),
    resourceId: text('resource_id'),
    details: text('details'),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('activity_created_idx').on(t.createdAt), index('activity_action_idx').on(t.action, t.createdAt)]
)

/**
 * Textes et images des pages (accueil, à propos, pages légales…) éditables sur
 * place. Les visiteurs ne lisent que `published` ; `draft` contient le travail
 * en cours des administrateurs.
 */
export const contentEntries = pgTable('content_entries', {
  key: text('key').primaryKey(),
  published: jsonb('published').$type<Record<string, unknown>>(),
  draft: jsonb('draft').$type<Record<string, unknown>>(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  publishedBy: text('published_by').references(() => users.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: text('updated_by').references(() => users.id, { onDelete: 'set null' }),
})

export const VERSION_ACTIONS = ['save', 'publish', 'unpublish', 'restore', 'delete', 'create'] as const
export type VersionAction = (typeof VERSION_ACTIONS)[number]

/** Historique des versions des contenus éditables (pages et articles) */
export const contentVersions = pgTable(
  'content_versions',
  {
    id: text('id').primaryKey(),
    entityType: text('entity_type').$type<'content' | 'post'>().notNull(),
    entityId: text('entity_id').notNull(),
    action: text('action').$type<VersionAction>().notNull(),
    snapshot: jsonb('snapshot').$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: text('created_by').references(() => users.id, { onDelete: 'set null' }),
  },
  (t) => [index('content_versions_entity_idx').on(t.entityType, t.entityId, t.createdAt)]
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Announcement = typeof announcements.$inferSelect
export type Testimonial = typeof testimonials.$inferSelect
export type Post = typeof posts.$inferSelect
export type Media = typeof media.$inferSelect
export type ActivityLog = typeof activityLogs.$inferSelect
export type ContentEntry = typeof contentEntries.$inferSelect
export type ContentVersion = typeof contentVersions.$inferSelect
