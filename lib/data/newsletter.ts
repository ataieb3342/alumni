import { and, eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { newsletterSubscriptions, users } from '@/db/schema'
import { newId } from '@/lib/ids'

export interface NewsletterPreferences {
  generalNewsletter: boolean
  announcementsNewsletter: boolean
}

export async function getPreferences(userId: string): Promise<NewsletterPreferences> {
  const db = await getDb()
  const row = await db.query.newsletterSubscriptions.findFirst({ where: eq(newsletterSubscriptions.userId, userId) })
  return { generalNewsletter: row?.generalNewsletter ?? false, announcementsNewsletter: row?.announcementsNewsletter ?? false }
}

export async function setPreferences(userId: string, preferences: Partial<NewsletterPreferences>) {
  const db = await getDb()
  const now = new Date()
  const current = await getPreferences(userId)
  const next = { ...current, ...preferences }
  await db
    .insert(newsletterSubscriptions)
    .values({ id: newId(), userId, ...next, subscribedAt: now, updatedAt: now })
    .onConflictDoUpdate({ target: newsletterSubscriptions.userId, set: { ...next, updatedAt: now } })
  return next
}

/** Membres actifs abonnés aux notifications d'annonces */
export async function listAnnouncementSubscribers() {
  const db = await getDb()
  return db
    .select({ email: users.email, firstName: users.firstName, lastName: users.lastName })
    .from(newsletterSubscriptions)
    .innerJoin(users, eq(users.id, newsletterSubscriptions.userId))
    .where(and(eq(newsletterSubscriptions.announcementsNewsletter, true), eq(users.accountStatus, 'active')))
}

/** Export CSV des abonnements (administration, Google Drive) */
export async function listSubscriptionsForExport() {
  const db = await getDb()
  return db
    .select({
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      userType: users.userType,
      generalNewsletter: newsletterSubscriptions.generalNewsletter,
      announcementsNewsletter: newsletterSubscriptions.announcementsNewsletter,
      subscribedAt: newsletterSubscriptions.subscribedAt,
    })
    .from(newsletterSubscriptions)
    .innerJoin(users, eq(users.id, newsletterSubscriptions.userId))
}

const USER_TYPE_LABELS: Record<string, string> = {
  lyceen: 'Lycéen',
  bts: 'BTS',
  prepa: 'Prépa',
  alumni: 'Ancien élève',
  staff: 'Personnel',
}

function csvCell(value: string): string {
  // Neutralise les formules (=, +, -, @) à l'ouverture dans un tableur
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value
  return `"${safe.replace(/"/g, '""')}"`
}

export async function buildSubscriptionsCsv(): Promise<{ csv: string; count: number }> {
  const rows = await listSubscriptionsForExport()
  const header = "Prénom,Nom,Email,Type de membre,Newsletter générale,Notifications annonces,Date d'inscription\n"
  const body = rows
    .map((row) =>
      [
        row.firstName,
        row.lastName,
        row.email,
        USER_TYPE_LABELS[row.userType] ?? row.userType,
        row.generalNewsletter ? 'Oui' : 'Non',
        row.announcementsNewsletter ? 'Oui' : 'Non',
        row.subscribedAt ? row.subscribedAt.toLocaleDateString('fr-FR') : '',
      ]
        .map(csvCell)
        .join(',')
    )
    .join('\n')
  return { csv: header + body, count: rows.length }
}
