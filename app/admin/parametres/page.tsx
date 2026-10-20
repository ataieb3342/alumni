import { CheckCircle2, XCircle } from 'lucide-react'
import { requireAdminPage } from '@/lib/auth/session'
import { getEditableContent } from '@/lib/data/content'
import { driveConfigured } from '@/lib/drive-export'
import { databaseUrl } from '@/db'
import { storageDriver } from '@/lib/storage'
import { AdminCard, AdminHeader } from '@/app/components/admin/AdminCard'
import { ExportPanel } from '@/app/components/admin/ExportPanel'
import { SiteSettingsForm } from '@/app/components/admin/SiteSettingsForm'

export const metadata = { title: 'Réglages du site' }

export default async function AdminSettingsPage() {
  await requireAdminPage()
  const site = await getEditableContent('site')
  const checks = [
    { label: 'Base de données', ok: true, detail: databaseUrl().startsWith('pglite:') ? 'PGlite locale (développement)' : 'PostgreSQL' },
    { label: 'Stockage des images', ok: storageDriver() === 'blob' || !process.env.VERCEL, detail: storageDriver() === 'blob' ? 'Vercel Blob' : 'Fichiers locaux' },
    { label: 'Envoi d’e-mails (Gmail)', ok: !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD), detail: 'EMAIL_USER / EMAIL_PASSWORD' },
    { label: 'Destinataire des demandes d’inscription', ok: !!(process.env.ADMIN_EMAIL || process.env.EMAIL_USER), detail: 'ADMIN_EMAIL' },
    { label: 'Connexion Google', ok: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET), detail: 'GOOGLE_CLIENT_ID' },
    { label: 'Connexion LinkedIn', ok: !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET), detail: 'LINKEDIN_CLIENT_ID (facultatif)' },
    { label: 'Export Google Drive', ok: driveConfigured(), detail: 'CLIENT_ID, GOOGLE_REFRESH_TOKEN' },
    { label: 'Tâches planifiées', ok: !!process.env.CRON_SECRET, detail: 'CRON_SECRET' },
  ]
  return (
    <div className="space-y-6">
      <AdminHeader title="Réglages du site" lead="Ce qui ne s’édite pas sur une page : coordonnées, réseaux sociaux, pied de page, exports." />
      <AdminCard title="Identité et coordonnées">
        <SiteSettingsForm initial={site.data} revision={site.updatedAt?.toISOString() ?? 'initial'} />
      </AdminCard>
      <AdminCard title="Abonnés aux newsletters">
        <p className="mb-4 text-ink-soft">Export des préférences des membres (également synchronisé chaque nuit sur Google Drive).</p>
        <ExportPanel driveConfigured={driveConfigured()} />
      </AdminCard>
      <AdminCard title="Configuration technique">
        <ul className="divide-y divide-line">
          {checks.map((check) => (
            <li key={check.label} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="flex items-center gap-2 font-semibold text-ink">
                {check.ok ? <CheckCircle2 className="size-4 text-success" aria-hidden="true" /> : <XCircle className="size-4 text-red" aria-hidden="true" />}
                {check.label}
                <span className="sr-only">{check.ok ? ' : configuré' : ' : non configuré'}</span>
              </span>
              <span className="text-ink-muted">{check.detail}</span>
            </li>
          ))}
        </ul>
      </AdminCard>
    </div>
  )
}
