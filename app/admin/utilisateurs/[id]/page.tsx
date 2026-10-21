import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { requireAdminPage } from '@/lib/auth/session'
import { getPreferences } from '@/lib/data/newsletter'
import { getUserById } from '@/lib/data/users'
import { USER_TYPE_LABELS } from '@/lib/utils'
import { AdminCard, AdminHeader } from '@/app/components/admin/AdminCard'
import { AdminUserForm } from '@/app/components/admin/AdminUserForm'
import { UserActions } from '@/app/components/admin/UserActions'
import { NewsletterPanel } from '@/app/components/settings/SettingsPanels'
import { Avatar } from '@/app/components/ui/Avatar'

export const metadata = { title: 'Compte' }

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminPage()
  const user = await getUserById((await params).id)
  if (!user) notFound()
  const legacy = (user.legacy ?? {}) as { source?: string }
  const preferences = await getPreferences(user.id)
  return (
    <div className="space-y-6">
      <Link href="/admin/utilisateurs" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-blue">
        <ArrowLeft className="size-4" aria-hidden="true" /> Tous les comptes
      </Link>
      <AdminHeader
        title={`${user.firstName} ${user.lastName}`}
        lead={`${user.email} · ${USER_TYPE_LABELS[user.userType]}`}
        actions={
          <>
            <Link href={`/annuaire/${user.id}`} className="inline-flex h-11 items-center gap-1.5 rounded-[var(--radius-sm)] px-3 font-semibold text-blue hover:bg-blue-soft">
              Fiche publique <ExternalLink className="size-4" aria-hidden="true" />
            </Link>
            <UserActions user={{ ...user, hasPassword: !!user.passwordHash }} isSelf={user.id === admin.id} />
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_18rem]">
        <AdminCard title="Profil, statut et rôles">
          <AdminUserForm
            isSelf={user.id === admin.id}
            user={{
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              userType: user.userType,
              role: user.role,
              accountStatus: user.accountStatus,
              roleAssociation: user.roleAssociation,
              isVisibleInDirectory: user.isVisibleInDirectory,
              promotionYear: user.promotionYear,
              city: user.city,
              staffCategory: user.staffCategory,
              staffDetails: user.staffDetails,
            }}
          />
        </AdminCard>
        <AdminCard title="Compte">
          <div className="flex items-center gap-3">
            <Avatar firstName={user.firstName} lastName={user.lastName} image={user.profileImage} seed={user.id} />
            <div className="text-sm">
              <p className="font-semibold text-ink">Inscrit le {user.createdAt.toLocaleDateString('fr-FR')}</p>
              <p className="text-ink-muted">{user.lastLoginAt ? `Dernière connexion le ${user.lastLoginAt.toLocaleDateString('fr-FR')}` : 'Pas encore connecté depuis la migration'}</p>
            </div>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div>
              <dt className="font-semibold text-ink-muted">Connexion</dt>
              <dd className="text-ink">
                {[user.passwordHash && 'mot de passe', user.oauthProvider && (user.oauthProvider === 'google' ? 'Google' : 'LinkedIn')].filter(Boolean).join(' + ') || 'aucune (à inviter)'}
              </dd>
            </div>
            {legacy.source === 'sanity-studio' && (
              <div>
                <dt className="font-semibold text-ink-muted">Origine</dt>
                <dd className="text-ink">Compte administrateur du Studio Sanity : mot de passe non récupérable, à inviter.</dd>
              </div>
            )}
          </dl>
        </AdminCard>
        <AdminCard title="Abonnements" className="xl:col-start-2">
          <NewsletterPanel initial={preferences} endpoint={`/api/admin/users/${user.id}/newsletter`} />
        </AdminCard>
      </div>
    </div>
  )
}
