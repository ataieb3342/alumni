import type { Metadata } from 'next'
import { AuthLayout } from '@/app/components/auth/AuthLayout'
import { ForgotForm } from './ForgotForm'

export const metadata: Metadata = { title: 'Mot de passe oublié' }

export default function ForgotPasswordPage() {
  return (
    <AuthLayout aside={false} title="Mot de passe oublié" lead="Indiquez votre e-mail : nous vous envoyons un lien pour en choisir un nouveau. Fonctionne aussi pour définir un premier mot de passe.">
      <ForgotForm />
    </AuthLayout>
  )
}
