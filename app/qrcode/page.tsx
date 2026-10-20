import type { Metadata } from 'next'
import { CampaignPage } from '@/app/components/site/CampaignPage'

export const metadata: Metadata = {
  title: 'Rejoins VH Besançon Alumni',
  description: "Élève du lycée Victor Hugo ? Adhère à l'association pour construire ton futur réseau.",
}

// Page ouverte par le QR code distribué au lycée et dans les salons
export default function QRCodePage() {
  return <CampaignPage contentKey="qrcode" />
}
