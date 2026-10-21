import type { Metadata } from 'next'
import { LegalPage } from '@/app/components/site/LegalPage'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Protection des données personnelles et politique de confidentialité',
}

export default function PolitiqueConfidentialite() {
  return <LegalPage contentKey="privacy" />
}
