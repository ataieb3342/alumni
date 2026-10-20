import Link from 'next/link'
import { ArrowRight, FileText } from 'lucide-react'
import { requireAdminPage } from '@/lib/auth/session'
import { listContentDrafts } from '@/lib/data/content'
import { listUnpublishedPosts } from '@/lib/data/posts'
import { getOverviewCounts, getVisitStats } from '@/lib/data/stats'
import { listUsersForAdmin } from '@/lib/data/users'
import { listAllAnnouncements } from '@/lib/data/announcements'
import { listAllTestimonials } from '@/lib/data/testimonials'
import { CONTENT_PAGES, isContentKey } from '@/lib/content/definitions'
import { USER_TYPE_LABELS } from '@/lib/utils'
import { AdminCard, AdminHeader, Stat } from '@/app/components/admin/AdminCard'
import { UserActions } from '@/app/components/admin/UserActions'
import { VisitsChart } from '@/app/components/admin/VisitsChart'
import { Badge } from '@/app/components/ui/Badge'
import { EmptyState } from '@/app/components/ui/EmptyState'

export const metadata = { title: 'Vue d’ensemble' }

export default async function AdminHome() {
  const admin = await requireAdminPage()
  const [counts, visits, pending, contentDrafts, postDrafts, announcements, testimonials] = await Promise.all([
    getOverviewCounts(),
    getVisitStats(7),
    listUsersForAdmin({ status: 'pending', pageSize: 10 }),
    listContentDrafts(),
    listUnpublishedPosts(),
    listAllAnnouncements(),
    listAllTestimonials(),
  ])
  const unpublished = [
    ...contentDrafts
      .filter((draft) => isContentKey(draft.key))
      .map((draft) => ({ key: `content:${draft.key}`, label: CONTENT_PAGES[draft.key as keyof typeof CONTENT_PAGES].label, kind: 'Page', href: CONTENT_PAGES[draft.key as keyof typeof CONTENT_PAGES].path, date: draft.updatedAt })),
    ...postDrafts.map((post) => ({ key: post.id, label: post.title, kind: post.status === 'published' ? 'Article (modifs)' : 'Article', href: `/blog/${post.slug}`, date: post.publishedAt })),
    ...announcements.filter((a) => a.status !== 'published').map((a) => ({ key: a.id, label: a.title, kind: a.status === 'draft' ? 'Annonce (brouillon)' : 'Annonce (archivée)', href: `/annonces/${a.slug}`, date: a.updatedAt })),
    ...testimonials.filter((t) => t.status !== 'published').map((t) => ({ key: t.id, label: t.title, kind: t.status === 'draft' ? 'Témoignage (brouillon)' : 'Témoignage (archivé)', href: `/temoignages/${t.slug}`, date: t.updatedAt })),
  ]

  return (
    <div className="space-y-6">
      <AdminHeader title={`Bonjour ${admin.firstName}`} lead="Ce qui demande votre attention, et l’activité de la semaine." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Inscriptions à valider" value={counts.pendingUsers} tone={counts.pendingUsers ? 'red' : 'ink'} hint={<Link className="link-ink" href="/admin/utilisateurs?statut=pending">Voir la liste</Link>} />
        <Stat label="Membres actifs" value={counts.activeUsers} hint={`${counts.totalUsers} comptes au total`} />
        <Stat label="Visiteurs connectés (7 j)" value={visits.uniqueVisitors} tone="blue" hint={`${visits.pageViews} pages vues · retour ${visits.returnRate} %`} />
        <Stat label="Contenus" value={counts.publishedPosts + counts.totalAnnouncements + counts.totalTestimonials} hint={`${counts.publishedPosts} articles · ${counts.totalAnnouncements} annonces · ${counts.totalTestimonials} témoignages`} />
      </div>

      <AdminCard title="Inscriptions en attente" action={<Link href="/admin/utilisateurs?statut=pending" className="link-ink text-sm font-semibold">Toutes les demandes</Link>}>
        {pending.rows.length === 0 ? (
          <p className="text-ink-muted">Aucune demande en attente. 🎉</p>
        ) : (
          <ul className="divide-y divide-line">
            {pending.rows.map((user) => (
              <li key={user.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-bold text-ink">
                    {user.firstName} {user.lastName} <Badge tone="neutral">{USER_TYPE_LABELS[user.userType]}</Badge>
                  </p>
                  <p className="text-sm text-ink-muted">
                    {user.email} · inscrit le {user.createdAt.toLocaleDateString('fr-FR')}
                    {user.oauthProvider ? ` · via ${user.oauthProvider === 'google' ? 'Google' : 'LinkedIn'}` : ''}
                  </p>
                </div>
                <UserActions user={user} isSelf={user.id === admin.id} />
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <AdminCard title="Visiteurs connectés, 7 derniers jours" action={<Link href="/admin/statistiques" className="link-ink text-sm font-semibold">Statistiques</Link>}>
          <VisitsChart series={visits.series} />
        </AdminCard>
        <AdminCard title="Non publiés" action={<Link href="/admin/contenus" className="link-ink text-sm font-semibold">Tous les contenus</Link>}>
          {unpublished.length === 0 ? (
            <EmptyState icon={<FileText className="size-6" aria-hidden="true" />} title="Tout est publié" className="py-8" />
          ) : (
            <ul className="divide-y divide-line">
              {unpublished.slice(0, 8).map((item) => (
                <li key={item.key}>
                  <Link href={item.href} className="group flex items-center justify-between gap-3 py-2.5">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-ink group-hover:text-blue">{item.label}</span>
                      <span className="text-xs text-ink-muted">{item.kind}</span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>
    </div>
  )
}
