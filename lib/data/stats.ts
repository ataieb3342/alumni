/**
 * Statistiques du tableau de bord (anciennement le widget du Studio Sanity).
 */
import { and, count, eq, gte, isNotNull, ne, or, sql } from 'drizzle-orm'
import { getDb } from '@/db'
import { activityLogs, announcements, newsletterSubscriptions, posts, testimonials, users } from '@/db/schema'

/** Compte exclu des statistiques (développeur du site), comme dans le Studio */
const EXCLUDED_EMAILS = (process.env.STATS_EXCLUDED_EMAILS ?? 'contact@ataieb-dev.fr')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

export interface VisitStats {
  days: number
  totalMembers: number
  uniqueVisitors: number
  pageViews: number
  mostActiveDay: { date: string; visitors: number } | null
  returnRate: number
  series: { date: string; visitors: number }[]
}

export async function getVisitStats(days: 7 | 14 | 30): Promise<VisitStats> {
  const db = await getDb()
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const excluded = EXCLUDED_EMAILS.length
    ? sql`${users.email} not in (${sql.join(EXCLUDED_EMAILS.map((e) => sql`${e}`), sql`, `)})`
    : sql`true`

  const [members] = await db.select({ n: count() }).from(users).where(excluded)
  const visits = await db
    .select({
      userId: activityLogs.userId,
      day: sql<string>`to_char(${activityLogs.createdAt} at time zone 'Europe/Paris', 'YYYY-MM-DD')`,
    })
    .from(activityLogs)
    .innerJoin(users, eq(users.id, activityLogs.userId))
    .where(and(eq(activityLogs.action, 'page_visit'), gte(activityLogs.createdAt, since), isNotNull(activityLogs.userId), excluded))

  const perDay = new Map<string, Set<string>>()
  const perUser = new Map<string, Set<string>>()
  for (const visit of visits) {
    if (!visit.userId) continue
    if (!perDay.has(visit.day)) perDay.set(visit.day, new Set())
    perDay.get(visit.day)!.add(visit.userId)
    if (!perUser.has(visit.userId)) perUser.set(visit.userId, new Set())
    perUser.get(visit.userId)!.add(visit.day)
  }

  // Série complète, jours sans visite compris (courbe continue)
  const series: { date: string; visitors: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })
    series.push({ date, visitors: perDay.get(date)?.size ?? 0 })
  }
  const mostActive = series.reduce<{ date: string; visitors: number } | null>(
    (best, day) => (day.visitors > (best?.visitors ?? 0) ? day : best),
    null
  )
  const returning = [...perUser.values()].filter((set) => set.size > 1).length

  return {
    days,
    totalMembers: Number(members.n),
    uniqueVisitors: perUser.size,
    pageViews: visits.length,
    mostActiveDay: mostActive,
    returnRate: perUser.size ? Math.round((returning / perUser.size) * 100) : 0,
    series,
  }
}

export async function getOverviewCounts() {
  const db = await getDb()
  const [[usersRow], [pending], [active], [annRow], [testiRow], [postRow], [subsRow]] = await Promise.all([
    db.select({ n: count() }).from(users),
    db.select({ n: count() }).from(users).where(eq(users.accountStatus, 'pending')),
    db.select({ n: count() }).from(users).where(eq(users.accountStatus, 'active')),
    db.select({ n: count() }).from(announcements),
    db.select({ n: count() }).from(testimonials),
    db.select({ n: count() }).from(posts).where(eq(posts.status, 'published')),
    db
      .select({ n: count() })
      .from(newsletterSubscriptions)
      .where(or(eq(newsletterSubscriptions.generalNewsletter, true), eq(newsletterSubscriptions.announcementsNewsletter, true))),
  ])
  return {
    totalUsers: Number(usersRow.n),
    pendingUsers: Number(pending.n),
    activeUsers: Number(active.n),
    totalAnnouncements: Number(annRow.n),
    totalTestimonials: Number(testiRow.n),
    publishedPosts: Number(postRow.n),
    newsletterSubscriptions: Number(subsRow.n),
  }
}

export async function listRecentActivity(limit = 50, action?: string) {
  const db = await getDb()
  return db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      resource: activityLogs.resource,
      details: activityLogs.details,
      createdAt: activityLogs.createdAt,
      user: { id: users.id, firstName: users.firstName, lastName: users.lastName },
    })
    .from(activityLogs)
    .leftJoin(users, eq(users.id, activityLogs.userId))
    .where(action ? eq(activityLogs.action, action) : ne(activityLogs.action, ''))
    .orderBy(sql`${activityLogs.createdAt} desc`)
    .limit(limit)
}
