import type { Metadata } from 'next'
import { AuthLayout } from '@/app/components/auth/AuthLayout'
import { NewPasswordForm } from '@/app/components/auth/NewPasswordForm'

export const metadata: Metadata = { title: 'Activer mon compte' }

/** Lien d'invitation : comptes repris du Studio Sanity ou créés par un administrateur */
export default async function InvitationPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  return (
    <AuthLayout aside={false} title="Bienvenue !" lead="Choisissez votre mot de passe pour activer votre accès au site.">
      <NewPasswordForm token={token ?? ''} endpoint="/api/auth/accept-invitation" successUrl="/connexion?invitation=1" submitLabel="Activer mon compte" />
    </AuthLayout>
  )
}
