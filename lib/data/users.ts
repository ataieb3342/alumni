/**
 * Accès aux comptes et profils.
 */
import { and, asc, count, desc, eq, ilike, inArray, isNull, ne, or, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import {
  authTokens,
  users,
  type AccountStatus,
  type Education,
  type Experience,
  type ImageRef,
  type Role,
  type User,
  type UserType,
} from '@/db/schema'
import { newId } from '@/lib/ids'

export type { User }

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function getUserById(id: string): Promise<User | undefined> {
  const db = await getDb()
  return db.query.users.findFirst({ where: eq(users.id, id) })
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDb()
  return db.query.users.findFirst({ where: eq(users.email, normalizeEmail(email)) })
}

export interface CreateUserInput {
  email: string
  firstName: string
  lastName: string
  userType: UserType
  passwordHash?: string | null
  accountStatus?: AccountStatus
  role?: Role
  oauthProvider?: string | null
  oauthId?: string | null
  linkedIn?: string | null
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const db = await getDb()
  const [user] = await db
    .insert(users)
    .values({
      id: newId(),
      email: normalizeEmail(input.email),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      userType: input.userType,
      passwordHash: input.passwordHash ?? null,
      accountStatus: input.accountStatus ?? 'pending',
      role: input.role ?? 'member',
      oauthProvider: input.oauthProvider ?? null,
      oauthId: input.oauthId ?? null,
      linkedIn: input.linkedIn ?? null,
      // Les lycéens ne figurent pas dans l'annuaire par défaut
      isVisibleInDirectory: input.userType !== 'lyceen',
    })
    .returning()
  return user
}

export async function updateUser(id: string, patch: Partial<Omit<User, 'id' | 'createdAt'>>) {
  const db = await getDb()
  const [user] = await db
    .update(users)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning()
  return user
}

export async function setPasswordHash(id: string, passwordHash: string) {
  return updateUser(id, { passwordHash })
}

export async function recordLogin(id: string) {
  const db = await getDb()
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, id))
}

/**
 * Supprime un compte. Les annonces, témoignages et l'abonnement newsletter
 * partent avec lui (clés étrangères en cascade) ; le journal d'activité est
 * anonymisé.
 */
/** Supprime le compte ; annonces, témoignages et abonnements suivent (cascade), ainsi que les liens d'invitation ou de réinitialisation en cours */
export async function deleteUser(id: string) {
  const db = await getDb()
  await db.transaction(async (tx) => {
    const [deleted] = await tx.delete(users).where(eq(users.id, id)).returning({ email: users.email })
    if (deleted) await tx.delete(authTokens).where(eq(authTokens.email, deleted.email))
  })
}

// ---------------------------------------------------------------------------
// Annuaire
// ---------------------------------------------------------------------------

/** Champs exposés dans l'annuaire (jamais le hash ni les données OAuth brutes) */
export const directoryColumns = {
  id: users.id,
  email: users.email,
  firstName: users.firstName,
  lastName: users.lastName,
  userType: users.userType,
  promotionYear: users.promotionYear,
  city: users.city,
  subjects: users.subjects,
  currentStudies: users.currentStudies,
  linkedIn: users.linkedIn,
  bio: users.bio,
  description: users.description,
  education: users.education,
  experience: users.experience,
  roleAssociation: users.roleAssociation,
  staffCategory: users.staffCategory,
  staffDetails: users.staffDetails,
  profileImage: users.profileImage,
  coverImage: users.coverImage,
  createdAt: users.createdAt,
}

export interface DirectoryUser {
  id: string
  email: string
  firstName: string
  lastName: string
  userType: UserType
  promotionYear: number | null
  city: string | null
  subjects: string[]
  currentStudies: string | null
  linkedIn: string | null
  bio: string | null
  description: string | null
  education: Education[]
  experience: Experience[]
  roleAssociation: string[]
  staffCategory: string | null
  staffDetails: string | null
  profileImage: ImageRef | null
  coverImage: ImageRef | null
  createdAt: Date
}

const DIRECTORY_TYPES: UserType[] = ['alumni', 'bts', 'prepa', 'staff']

/**
 * Membres visibles dans l'annuaire : anciens, BTS, prépa et personnels
 * (les lycéens ont un profil restreint). Seuls les comptes actifs y figurent.
 */
export async function listDirectoryMembers(): Promise<DirectoryUser[]> {
  const db = await getDb()
  return db
    .select(directoryColumns)
    .from(users)
    .where(
      and(
        eq(users.isVisibleInDirectory, true),
        inArray(users.userType, DIRECTORY_TYPES),
        eq(users.accountStatus, 'active')
      )
    )
    .orderBy(asc(users.lastName), asc(users.firstName)) as Promise<DirectoryUser[]>
}

/** Fiche d'un membre (consultable par tout membre connecté) */
export async function getMemberProfile(id: string): Promise<DirectoryUser | undefined> {
  const db = await getDb()
  const [row] = await db
    .select(directoryColumns)
    .from(users)
    .where(and(eq(users.id, id), ne(users.accountStatus, 'pending')))
    .limit(1)
  return row as DirectoryUser | undefined
}

/** Derniers inscrits avec un profil présentable (photo, parcours ou bio) */
export async function listRecentMembers(limit = 6): Promise<DirectoryUser[]> {
  const db = await getDb()
  return db
    .select(directoryColumns)
    .from(users)
    .where(
      and(
        eq(users.isVisibleInDirectory, true),
        inArray(users.userType, DIRECTORY_TYPES),
        eq(users.accountStatus, 'active'),
        or(
          sql`${users.profileImage} is not null`,
          sql`jsonb_array_length(${users.experience}) > 0`,
          sql`jsonb_array_length(${users.education}) > 0`,
          sql`coalesce(${users.bio}, '') <> ''`
        )
      )
    )
    .orderBy(desc(users.createdAt))
    .limit(limit) as Promise<DirectoryUser[]>
}

/** Membres du bureau (rôle dans l'association), pour la page À propos */
export async function listBoardMembers(): Promise<DirectoryUser[]> {
  const db = await getDb()
  return db
    .select(directoryColumns)
    .from(users)
    .where(and(sql`cardinality(${users.roleAssociation}) > 0`, eq(users.accountStatus, 'active'))) as Promise<DirectoryUser[]>
}

// ---------------------------------------------------------------------------
// Administration
// ---------------------------------------------------------------------------

export interface UserListFilters {
  q?: string
  status?: AccountStatus | ''
  role?: Role | ''
  type?: UserType | ''
  page?: number
  pageSize?: number
}

export async function listUsersForAdmin(filters: UserListFilters = {}) {
  const db = await getDb()
  const pageSize = filters.pageSize ?? 25
  const page = Math.max(1, filters.page ?? 1)
  const conditions = []
  if (filters.q?.trim()) {
    const term = `%${filters.q.trim().replace(/[%_]/g, '\\$&')}%`
    conditions.push(
      or(
        ilike(users.email, term),
        ilike(users.firstName, term),
        ilike(users.lastName, term),
        ilike(sql`${users.firstName} || ' ' || ${users.lastName}`, term)
      )
    )
  }
  if (filters.status) conditions.push(eq(users.accountStatus, filters.status))
  if (filters.role) conditions.push(eq(users.role, filters.role))
  if (filters.type) conditions.push(eq(users.userType, filters.type))
  const where = conditions.length ? and(...conditions) : undefined

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        userType: users.userType,
        role: users.role,
        accountStatus: users.accountStatus,
        hasPassword: sql<boolean>`${users.passwordHash} is not null`,
        oauthProvider: users.oauthProvider,
        roleAssociation: users.roleAssociation,
        isVisibleInDirectory: users.isVisibleInDirectory,
        profileImage: users.profileImage,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .where(where)
      // Les demandes en attente d'abord : c'est l'action la plus fréquente
      .orderBy(sql`case when ${users.accountStatus} = 'pending' then 0 else 1 end`, desc(users.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(users).where(where),
  ])
  return { rows, total: Number(total), page, pageSize }
}

export async function countUsersByStatus() {
  const db = await getDb()
  const rows = await db.select({ status: users.accountStatus, n: count() }).from(users).groupBy(users.accountStatus)
  return Object.fromEntries(rows.map((row) => [row.status, Number(row.n)])) as Partial<Record<AccountStatus, number>>
}

export async function countAdmins(): Promise<number> {
  const db = await getDb()
  const [row] = await db.select({ n: count() }).from(users).where(and(eq(users.role, 'admin'), eq(users.accountStatus, 'active')))
  return Number(row.n)
}

/** Profils restés vides un mois après l'inscription (rappel automatique) */
export async function listProfileReminderCandidates(delayDays: number, limit: number) {
  const db = await getDb()
  const threshold = new Date(Date.now() - delayDays * 24 * 60 * 60 * 1000)
  return db
    .select({ id: users.id, firstName: users.firstName, email: users.email })
    .from(users)
    .where(
      and(
        eq(users.accountStatus, 'active'),
        inArray(users.userType, DIRECTORY_TYPES),
        eq(users.isVisibleInDirectory, true),
        isNull(users.profileReminderSentAt),
        sql`${users.createdAt} < ${threshold}`,
        sql`jsonb_array_length(${users.education}) = 0`,
        sql`jsonb_array_length(${users.experience}) = 0`,
        sql`coalesce(${users.staffDetails}, '') = ''`,
        sql`coalesce(${users.currentStudies}, '') = ''`
      )
    )
    .orderBy(asc(users.createdAt))
    .limit(limit)
}

export async function countProfileReminderCandidates(delayDays: number) {
  return (await listProfileReminderCandidates(delayDays, 10_000)).length
}
