import type { Metadata } from 'next'
import { AuthLayout } from '@/app/components/auth/AuthLayout'
import { ChooseTypeForm } from './ChooseTypeForm'

export const metadata: Metadata = { title: 'Complétez votre profil' }

export default function ChooseTypePage() {
  return (
    <AuthLayout aside={false} title="Une dernière étape" lead="Dites-nous quel est votre lien avec le lycée Victor Hugo pour finaliser votre inscription.">
      <ChooseTypeForm />
    </AuthLayout>
  )
}
