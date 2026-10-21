import type { Metadata } from 'next'
import { LegalPage } from '@/app/components/site/LegalPage'

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales et informations légales du site',
}

export default function MentionsLegales() {
  return <LegalPage contentKey="legal" />
}
