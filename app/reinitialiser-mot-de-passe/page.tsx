import type { Metadata } from 'next'
import { AuthLayout } from '@/app/components/auth/AuthLayout'
import { NewPasswordForm } from '@/app/components/auth/NewPasswordForm'

export const metadata: Metadata = { title: 'Nouveau mot de passe' }

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  return (
    <AuthLayout aside={false} title="Nouveau mot de passe" lead="Choisissez un mot de passe que vous n’utilisez nulle part ailleurs.">
      <NewPasswordForm token={token ?? ''} endpoint="/api/auth/reset-password" successUrl="/connexion?reset=1" submitLabel="Enregistrer le mot de passe" />
    </AuthLayout>
  )
}
