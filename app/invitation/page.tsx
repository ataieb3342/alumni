import type { Metadata } from 'next'
import { AuthLayout } from '@/app/components/auth/AuthLayout'
import { NewPasswordForm } from '@/app/components/auth/NewPasswordForm'
import { CONTACT_EMAIL } from '@/lib/emails/config'
import { checkToken } from '@/lib/data/tokens'

export const metadata: Metadata = { title: 'Activer mon compte' }

/** Lien d'invitation : comptes repris du Studio Sanity ou créés par un administrateur */
export default async function InvitationPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  const check = token ? await checkToken(token, 'invite') : null
  return (
    <AuthLayout aside={false} title="Bienvenue !" lead="Choisissez votre mot de passe pour activer votre accès au site.">
      <NewPasswordForm
        token={token ?? ''}
        endpoint="/api/auth/accept-invitation"
        successUrl="/connexion?invitation=1"
        submitLabel="Activer mon compte"
        problem={check && !check.ok ? check.reason : undefined}
        renew={{ href: `mailto:${CONTACT_EMAIL}?subject=Nouveau%20lien%20d%27invitation`, label: 'Demandez une nouvelle invitation à l’association' }}
      />
    </AuthLayout>
  )
}
