/**
 * Transformation des documents Sanity exportés en lignes de la nouvelle base.
 * Fonctions pures (testées dans tests/migration/transform.test.ts).
 */
import type {
  AccountStatus,
  AnnouncementType,
  ContentStatus,
  Education,
  Experience,
  ImageRef,
  PostVisibility,
  Role,
  TestimonialType,
  UserType,
} from '@/db/schema'
import { ACCOUNT_STATUSES, ANNOUNCEMENT_TYPES, CONTENT_STATUSES, TESTIMONIAL_TYPES, USER_TYPES } from '@/db/schema'
import { portableTextToHtml, portableTextToPlainText } from '@/lib/richtext'
import { SUBJECT_VALUES } from '@/lib/subjects'
import { createHash } from 'node:crypto'

/** Nom de fichier stable d'une image externe (même calcul à l'export et à l'import) */
export function externalImageFileName(url: string): string {
  const pathname = new URL(url).pathname
  const ext = (pathname.match(/\.[a-z0-9]{2,5}$/i)?.[0] ?? '.jpg').toLowerCase()
  return `${createHash('sha256').update(url).digest('hex').slice(0, 24)}${ext}`
}

export interface SanityDoc {
  _id: string
  _type: string
  _createdAt?: string
  _updatedAt?: string
  _rev?: string
  [key: string]: unknown
}

export interface MediaLookup {
  /** Référence d'image complète pour un id d'asset Sanity (`image-…`) */
  image(assetRef: string | undefined, alt?: string, hotspot?: { x: number; y: number }): ImageRef | undefined
}

type Ref = { _ref?: string }
type SanityImage = { asset?: Ref; alt?: string; hotspot?: { x: number; y: number } }

const str = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() !== '' ? value : undefined
const date = (value: unknown): Date | undefined => {
  if (typeof value !== 'string') return undefined
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}
const oneOf = <T extends string>(values: readonly T[], value: unknown, fallback: T): T =>
  values.includes(value as T) ? (value as T) : fallback

/** Champs Sanity repris en colonnes : tout le reste part dans `legacy` */
function legacyOf(doc: SanityDoc, mapped: string[]): Record<string, unknown> {
  const legacy: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(doc)) {
    if (key === 'password') continue
    if (!mapped.includes(key)) legacy[key] = value
  }
  return legacy
}

function image(lookup: MediaLookup, value: unknown): ImageRef | undefined {
  const img = value as SanityImage | undefined
  return img?.asset?._ref ? lookup.image(img.asset._ref, img.alt, img.hotspot) : undefined
}

const USER_FIELDS = [
  'email', 'password', 'firstName', 'lastName', 'userType', 'accountStatus', 'oauthProvider', 'oauthId',
  'linkedInProfile', 'googleProfile', 'profileImage', 'coverImage', 'promotionYear', 'city', 'subjects',
  'currentStudies', 'linkedIn', 'bio', 'description', 'education', 'experience', 'roleAssociation',
  'staffCategory', 'staffDetails', 'isVisibleInDirectory', 'profileReminderSentAt', 'createdAt', 'role',
]

export function transformUser(doc: SanityDoc, lookup: MediaLookup, adminEmails: Set<string>) {
  const email = String(doc.email ?? '').trim().toLowerCase()
  const legacyRole = str(doc.role)
  const role: Role = adminEmails.has(email) || legacyRole === 'admin' ? 'admin' : 'member'
  const education = (Array.isArray(doc.education) ? doc.education : []) as (Education & { _type?: string })[]
  const experience = (Array.isArray(doc.experience) ? doc.experience : []) as (Experience & { _type?: string })[]
  return {
    id: doc._id,
    email,
    passwordHash: str(doc.password) ?? null,
    firstName: str(doc.firstName) ?? '',
    lastName: str(doc.lastName) ?? '',
    userType: oneOf<UserType>(USER_TYPES, doc.userType, 'alumni'),
    role,
    accountStatus: oneOf<AccountStatus>(ACCOUNT_STATUSES, doc.accountStatus, 'pending'),
    oauthProvider: str(doc.oauthProvider) ?? null,
    oauthId: str(doc.oauthId) ?? null,
    linkedInProfileRaw: str((doc.linkedInProfile as { raw?: string } | undefined)?.raw) ?? null,
    googleProfileRaw: str((doc.googleProfile as { raw?: string } | undefined)?.raw) ?? null,
    profileImage: image(lookup, doc.profileImage) ?? null,
    coverImage: image(lookup, doc.coverImage) ?? null,
    promotionYear: typeof doc.promotionYear === 'number' ? doc.promotionYear : null,
    city: str(doc.city) ?? null,
    subjects: (Array.isArray(doc.subjects) ? doc.subjects : []).filter((s): s is string =>
      (SUBJECT_VALUES as readonly string[]).includes(s as string)
    ),
    currentStudies: str(doc.currentStudies) ?? null,
    linkedIn: str(doc.linkedIn) ?? null,
    bio: str(doc.bio) ?? null,
    description: str(doc.description) ?? null,
    education: education.map(({ _type: _ignored, ...rest }) => rest),
    experience: experience.map(({ _type: _ignored, ...rest }) => rest),
    roleAssociation: (Array.isArray(doc.roleAssociation) ? doc.roleAssociation : []).filter(
      (value): value is string => typeof value === 'string'
    ),
    staffCategory: str(doc.staffCategory) ?? null,
    staffDetails: str(doc.staffDetails) ?? null,
    isVisibleInDirectory: doc.isVisibleInDirectory !== false,
    profileReminderSentAt: date(doc.profileReminderSentAt) ?? null,
    legacy: legacyOf(doc, USER_FIELDS),
    createdAt: date(doc.createdAt) ?? date(doc._createdAt) ?? new Date(),
    updatedAt: date(doc._updatedAt) ?? new Date(),
  }
}

const ANNOUNCEMENT_FIELDS = [
  'title', 'slug', 'type', 'eventDate', 'company', 'location', 'description', 'contactEmail', 'contactPhone',
  'externalLink', 'author', 'publishedAt', 'expiresAt', 'status',
]

export function transformAnnouncement(doc: SanityDoc) {
  return {
    id: doc._id,
    slug: (doc.slug as { current?: string } | undefined)?.current ?? doc._id,
    title: str(doc.title) ?? '(sans titre)',
    type: oneOf<AnnouncementType>(ANNOUNCEMENT_TYPES, doc.type, 'other'),
    eventDate: date(doc.eventDate) ?? null,
    company: str(doc.company) ?? null,
    location: str(doc.location) ?? null,
    description: portableTextToPlainText(doc.description as never),
    contactEmail: str(doc.contactEmail) ?? null,
    contactPhone: str(doc.contactPhone) ?? null,
    externalLink: str(doc.externalLink) ?? null,
    authorId: (doc.author as Ref | undefined)?._ref ?? null,
    publishedAt: date(doc.publishedAt) ?? date(doc._createdAt) ?? new Date(),
    expiresAt: date(doc.expiresAt) ?? null,
    status: oneOf<ContentStatus>(CONTENT_STATUSES, doc.status, 'published'),
    legacy: legacyOf(doc, ANNOUNCEMENT_FIELDS),
    createdAt: date(doc._createdAt) ?? new Date(),
    updatedAt: date(doc._updatedAt) ?? new Date(),
  }
}

export const TESTIMONIAL_ANSWER_PREFIXES = ['studies_', 'company_', 'career_', 'international_', 'mentoring_', 'project_']

export function transformTestimonial(doc: SanityDoc, lookup: MediaLookup) {
  const answers: Record<string, string> = {}
  for (const [key, value] of Object.entries(doc)) {
    if (TESTIMONIAL_ANSWER_PREFIXES.some((prefix) => key.startsWith(prefix)) && typeof value === 'string') {
      answers[key] = value
    }
  }
  return {
    id: doc._id,
    slug: (doc.slug as { current?: string } | undefined)?.current ?? doc._id,
    title: str(doc.title) ?? '(sans titre)',
    type: oneOf<TestimonialType>(TESTIMONIAL_TYPES, doc.type, 'studies'),
    authorId: (doc.author as Ref | undefined)?._ref ?? null,
    excerpt: str(doc.excerpt) ?? '',
    featuredImage: image(lookup, doc.featuredImage) ?? null,
    answers,
    tags: (Array.isArray(doc.tags) ? doc.tags : []).filter((t): t is string => typeof t === 'string'),
    rating: typeof doc.rating === 'number' ? doc.rating : null,
    status: oneOf<ContentStatus>(CONTENT_STATUSES, doc.status, 'draft'),
    likes: typeof doc.likes === 'number' ? doc.likes : 0,
    publishedAt: date(doc.publishedAt) ?? null,
    legacy: legacyOf(doc, ['title', 'slug', 'type', 'author', 'excerpt', 'featuredImage', 'tags', 'rating', 'status', 'likes', 'publishedAt', ...Object.keys(answers)]),
    createdAt: date(doc.createdAt) ?? date(doc._createdAt) ?? new Date(),
    updatedAt: date(doc._updatedAt) ?? new Date(),
  }
}

export function transformPost(doc: SanityDoc, lookup: MediaLookup, externalImage: (url: string) => string | undefined) {
  const bodyHtml = portableTextToHtml(doc.body as never, (block) => {
    if (block.asset?._ref) return lookup.image(block.asset._ref)?.url
    if (block.url) return externalImage(block.url) ?? block.url
    return undefined
  })
  const visibility: PostVisibility = doc.visibility === 'members_only' ? 'members' : 'public'
  return {
    id: doc._id,
    slug: (doc.slug as { current?: string } | undefined)?.current ?? doc._id,
    // Les articles du Content Lake sont publiés (le dataset ne contient aucun brouillon)
    status: 'published' as ContentStatus,
    visibility,
    title: str(doc.title) ?? '(sans titre)',
    excerpt: str(doc.excerpt) ?? null,
    bodyHtml,
    mainImage: image(lookup, doc.mainImage) ?? null,
    publishedAt: date(doc.publishedAt) ?? date(doc._createdAt) ?? new Date(),
    draft: null,
    legacy: legacyOf(doc, ['title', 'slug', 'excerpt', 'mainImage', 'publishedAt', 'visibility']),
    createdAt: date(doc._createdAt) ?? new Date(),
    updatedAt: date(doc._updatedAt) ?? new Date(),
  }
}

export function transformNewsletter(doc: SanityDoc) {
  return {
    id: doc._id,
    userId: (doc.user as Ref | undefined)?._ref ?? '',
    generalNewsletter: doc.generalNewsletter === true,
    announcementsNewsletter: doc.announcementsNewsletter === true,
    subscribedAt: date(doc.subscribedAt) ?? date(doc._createdAt) ?? new Date(),
    updatedAt: date(doc.updatedAt) ?? date(doc._updatedAt) ?? new Date(),
    legacy: legacyOf(doc, ['user', 'generalNewsletter', 'announcementsNewsletter', 'subscribedAt', 'updatedAt']),
  }
}

export function transformActivity(doc: SanityDoc) {
  return {
    id: doc._id,
    userId: (doc.user as Ref | undefined)?._ref ?? null,
    action: str(doc.action) ?? 'unknown',
    resource: str(doc.resource) ?? null,
    resourceId: str(doc.resourceId) ?? null,
    details: str(doc.details) ?? null,
    ipAddress: str(doc.ipAddress) ?? null,
    userAgent: str(doc.userAgent) ?? null,
    createdAt: date(doc.timestamp) ?? date(doc._createdAt) ?? new Date(),
  }
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Buffer.from(digest).toString('hex')
}

export async function transformResetToken(doc: SanityDoc) {
  return {
    id: doc._id,
    email: String(doc.email ?? '').toLowerCase(),
    // Le jeton était stocké en clair dans Sanity : on n'en garde que l'empreinte
    tokenHash: await sha256Hex(String(doc.token ?? doc._id)),
    purpose: 'reset' as const,
    expiresAt: date(doc.expiresAt) ?? new Date(0),
    usedAt: doc.used === true ? (date(doc._updatedAt) ?? new Date()) : null,
    createdAt: date(doc.createdAt) ?? date(doc._createdAt) ?? new Date(),
    legacy: legacyOf(doc, ['email', 'token', 'expiresAt', 'used', 'createdAt']),
  }
}
