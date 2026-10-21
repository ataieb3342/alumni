import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getActiveUser } from '@/lib/auth/session'
import { safeCallbackUrl } from '@/lib/utils'
import { AuthLayout } from '@/app/components/auth/AuthLayout'
import { availableProviders } from '@/lib/auth/providers'
import { LoginForm } from './LoginForm'

export const metadata: Metadata = { title: 'Connexion' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams
  const callbackUrl = safeCallbackUrl(params.callbackUrl)
  // Compte relu en base : un jeton périmé (compte supprimé ou suspendu) ne redirige pas
  if (await getActiveUser()) redirect(callbackUrl)

  const notice =
    params.registered === 'true' && params.pending === 'true'
      ? "Votre demande d'inscription a été envoyée avec succès. Vous recevrez un email une fois votre compte validé par un administrateur."
      : params.reset === '1'
        ? 'Mot de passe modifié : vous pouvez vous connecter.'
        : params.invitation === '1'
          ? 'Mot de passe enregistré : bienvenue ! Connectez-vous pour continuer.'
          : undefined

  return (
    <AuthLayout title="Connexion" lead="Retrouvez l’annuaire, les annonces et les témoignages de la communauté.">
      <LoginForm callbackUrl={callbackUrl} providers={availableProviders()} notice={notice} />
    </AuthLayout>
  )
}
