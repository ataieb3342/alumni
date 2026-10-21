import type { Metadata } from 'next'
import { CampaignPage } from '@/app/components/site/CampaignPage'

export const metadata: Metadata = {
  title: 'Rejoins VH Besançon Alumni',
  description: 'Retrouve tes anciens camarades de Victor Hugo et développe ton réseau professionnel',
}

// Page de la campagne e-mail adressée aux anciens
export default function AlumniPage() {
  return <CampaignPage contentKey="alumni" />
}
