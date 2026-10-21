import type { Metadata } from 'next'
import { AuthLayout } from '@/app/components/auth/AuthLayout'
import { NewPasswordForm } from '@/app/components/auth/NewPasswordForm'
import { checkToken } from '@/lib/data/tokens'

export const metadata: Metadata = { title: 'Nouveau mot de passe' }

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  // Lien vérifié dès l'ouverture : pas de mot de passe saisi pour rien
  const check = token ? await checkToken(token, 'reset') : null
  return (
    <AuthLayout aside={false} title="Nouveau mot de passe" lead="Choisissez un mot de passe que vous n’utilisez nulle part ailleurs.">
      <NewPasswordForm
        token={token ?? ''}
        endpoint="/api/auth/reset-password"
        successUrl="/connexion?reset=1"
        submitLabel="Enregistrer le mot de passe"
        problem={check && !check.ok ? check.reason : undefined}
        renew={{ href: '/mot-de-passe-oublie', label: 'Demander un nouveau lien' }}
      />
    </AuthLayout>
  )
}
