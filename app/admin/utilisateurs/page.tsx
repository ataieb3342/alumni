import Link from 'next/link'
import { Suspense } from 'react'
import { requireAdminPage } from '@/lib/auth/session'
import { listUsersForAdmin } from '@/lib/data/users'
import { ACCOUNT_STATUSES, ROLES, USER_TYPES, type AccountStatus, type Role, type UserType } from '@/db/schema'
import { cn, USER_TYPE_LABELS } from '@/lib/utils'
import { AdminCard, AdminHeader } from '@/app/components/admin/AdminCard'
import { AddUserButton } from '@/app/components/admin/AddUserButton'
import { UserFilters } from '@/app/components/admin/UserFilters'
import { UserActions } from '@/app/components/admin/UserActions'
import { Avatar } from '@/app/components/ui/Avatar'
import { Badge } from '@/app/components/ui/Badge'

export const metadata = { title: 'Membres et rôles' }

const STATUS_BADGE = {
  active: { label: 'Actif', tone: 'green' },
  pending: { label: 'En attente', tone: 'highlight' },
  suspended: { label: 'Suspendu', tone: 'red' },
  inactive: { label: 'Inactif', tone: 'neutral' },
} as const

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const admin = await requireAdminPage()
  const params = await searchParams
  const pick = <T extends string>(values: readonly T[], value?: string) => (value && values.includes(value as T) ? (value as T) : '')
  const page = Math.max(1, Number(params.page ?? 1) || 1)
  const result = await listUsersForAdmin({
    q: params.q,
    status: pick<AccountStatus>(ACCOUNT_STATUSES, params.statut),
    role: pick<Role>(ROLES, params.role),
    type: pick<UserType>(USER_TYPES, params.type),
    page,
  })
  const pages = Math.max(1, Math.ceil(result.total / result.pageSize))
  const pageHref = (n: number) => {
    const next = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][])
    next.set('page', String(n))
    return `/admin/utilisateurs?${next.toString()}`
  }

  return (
    <div className="space-y-6">
      <AdminHeader title="Membres et rôles" lead="Validez les inscriptions, gérez les rôles (administrateurs, bureau) et les accès." actions={<AddUserButton />} />
      <AdminCard>
        <Suspense>
          <UserFilters />
        </Suspense>
        <p className="mt-4 text-sm text-ink-muted" aria-live="polite">
          {result.total} compte{result.total > 1 ? 's' : ''}
        </p>
        <ul className="mt-2 divide-y divide-line">
          {result.rows.map((user) => (
            <li key={user.id} className="flex flex-wrap items-center gap-3 py-3">
              <Avatar firstName={user.firstName} lastName={user.lastName} image={user.profileImage} seed={user.id} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/utilisateurs/${user.id}`} className="font-bold text-ink hover:text-blue">
                    {user.firstName} {user.lastName}
                  </Link>
                  <Badge tone={STATUS_BADGE[user.accountStatus].tone}>{STATUS_BADGE[user.accountStatus].label}</Badge>
                  {user.role === 'admin' && <Badge tone="red">Admin</Badge>}
                  {user.roleAssociation.length > 0 && <Badge tone="blue">Bureau</Badge>}
                  {!user.hasPassword && !user.oauthProvider && <Badge tone="outline">Sans mot de passe</Badge>}
                </p>
                <p className="truncate text-sm text-ink-muted">
                  {user.email} · {USER_TYPE_LABELS[user.userType]}
                  {user.lastLoginAt ? ` · vu le ${user.lastLoginAt.toLocaleDateString('fr-FR')}` : ''}
                  {!user.isVisibleInDirectory && ' · masqué de l’annuaire'}
                </p>
              </div>
              <UserActions user={user} isSelf={user.id === admin.id} />
            </li>
          ))}
        </ul>
        {pages > 1 && (
          <nav aria-label="Pages" className="mt-4 flex flex-wrap justify-center gap-2">
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={pageHref(n)}
                aria-current={n === page ? 'page' : undefined}
                className={cn('inline-flex size-9 items-center justify-center rounded-full text-sm font-semibold', n === page ? 'bg-blue text-on-blue' : 'border border-line text-ink-soft hover:border-ink')}
              >
                {n}
              </Link>
            ))}
          </nav>
        )}
      </AdminCard>
    </div>
  )
}
