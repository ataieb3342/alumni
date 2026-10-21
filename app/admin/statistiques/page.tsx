import Link from 'next/link'
import { requireAdminPage } from '@/lib/auth/session'
import { getVisitStats, listRecentActivity } from '@/lib/data/stats'
import { cn } from '@/lib/utils'
import { AdminCard, AdminHeader, Stat } from '@/app/components/admin/AdminCard'
import { VisitsChart } from '@/app/components/admin/VisitsChart'

export const metadata = { title: 'Statistiques' }

const ACTION_LABELS: Record<string, string> = {
  login: 'Connexion',
  signup: 'Inscription',
  page_visit: 'Visite',
}

export default async function AdminStatsPage({ searchParams }: { searchParams: Promise<{ periode?: string; action?: string }> }) {
  await requireAdminPage()
  const params = await searchParams
  const days = params.periode === '30' ? 30 : params.periode === '14' ? 14 : 7
  const action = params.action && /^[a-z_.]+$/.test(params.action) ? params.action : undefined
  const [stats, activity] = await Promise.all([getVisitStats(days), listRecentActivity(60, action)])

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Statistiques"
        lead="Fréquentation de l’espace membres (comptes connectés), hors compte du développeur."
        actions={
          <nav aria-label="Période" className="flex rounded-[var(--radius-sm)] bg-paper-raised p-1 shadow-[var(--shadow-sm)]">
            {[7, 14, 30].map((value) => (
              <Link
                key={value}
                href={`/admin/statistiques?periode=${value}`}
                aria-current={value === days ? 'page' : undefined}
                className={cn('rounded-[6px] px-3 py-1.5 text-sm font-semibold', value === days ? 'bg-blue text-on-blue' : 'text-ink-soft hover:text-ink')}
              >
                {value} jours
              </Link>
            ))}
          </nav>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Membres" value={stats.totalMembers} />
        <Stat label="Visiteurs uniques" value={stats.uniqueVisitors} tone="blue" />
        <Stat label="Pages vues" value={stats.pageViews} />
        <Stat label="Jour le plus actif" value={stats.mostActiveDay ? new Date(`${stats.mostActiveDay.date}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }) : '—'} hint={stats.mostActiveDay ? `${stats.mostActiveDay.visitors} visiteurs` : undefined} />
        <Stat label="Taux de retour" value={`${stats.returnRate} %`} hint="Visiteurs venus au moins deux jours" />
      </div>
      <AdminCard title={`Visiteurs connectés par jour (${days} jours)`}>
        <VisitsChart series={stats.series} />
      </AdminCard>
      <AdminCard
        title="Journal d’activité"
        action={
          <nav aria-label="Type d’activité" className="flex flex-wrap gap-1 text-sm">
            {[
              ['', 'Tout'],
              ['login', 'Connexions'],
              ['signup', 'Inscriptions'],
              ['page_visit', 'Visites'],
            ].map(([value, label]) => (
              <Link key={value || 'all'} href={`/admin/statistiques?periode=${days}${value ? `&action=${value}` : ''}`} aria-current={(action ?? '') === value ? 'page' : undefined} className={cn('rounded-full px-3 py-1 font-semibold', (action ?? '') === value ? 'bg-ink text-paper' : 'text-ink-soft hover:bg-paper-sunken')}>
                {label}
              </Link>
            ))}
          </nav>
        }
      >
        <ul className="divide-y divide-line text-sm">
          {activity.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
              <span className="min-w-0">
                <span className="font-semibold text-ink">{ACTION_LABELS[entry.action] ?? entry.action}</span>
                {' · '}
                <span className="text-ink-soft">{entry.user?.firstName ? `${entry.user.firstName} ${entry.user.lastName}` : 'Compte supprimé'}</span>
                {entry.resource && <span className="text-ink-muted"> · {entry.resource}</span>}
              </span>
              <time dateTime={entry.createdAt.toISOString()} className="text-xs text-ink-muted">
                {entry.createdAt.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Paris' })}
              </time>
            </li>
          ))}
        </ul>
      </AdminCard>
    </div>
  )
}
