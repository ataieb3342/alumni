import type { Metadata } from 'next'
import { AuthLayout } from '@/app/components/auth/AuthLayout'
import { availableProviders } from '@/lib/auth/providers'
import { RegisterForm } from './RegisterForm'

export const metadata: Metadata = { title: 'Adhérer', description: 'Adhésion libre et gratuite au réseau des anciens du lycée Victor Hugo de Besançon' }

export default function RegisterPage() {
  return (
    <AuthLayout title="Adhérer au réseau" lead="Gratuit, en deux minutes. Lycéens, étudiants, anciens et personnels du lycée sont les bienvenus.">
      <RegisterForm providers={availableProviders()} />
    </AuthLayout>
  )
}
