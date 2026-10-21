'use client'

import { useState } from 'react'
import { CloudUpload, Download } from 'lucide-react'
import { toast } from 'sonner'
import { api, ApiError } from '@/lib/client/api'
import { Button, buttonClasses } from '@/app/components/ui/Button'

export function ExportPanel({ driveConfigured }: { driveConfigured: boolean }) {
  const [busy, setBusy] = useState(false)
  return (
    <div className="flex flex-wrap gap-2">
      <a href="/api/admin/newsletter/export" className={buttonClasses('secondary')}>
        <Download className="size-4" aria-hidden="true" /> Télécharger les abonnés (CSV)
      </a>
      <Button
        variant="secondary"
        loading={busy}
        disabled={!driveConfigured}
        icon={<CloudUpload className="size-4" aria-hidden="true" />}
        title={driveConfigured ? undefined : 'Google Drive n’est pas configuré'}
        onClick={async () => {
          setBusy(true)
          try {
            const result = await api<{ subscribersCount: number }>('/api/admin/newsletter/sync-drive', { method: 'POST' })
            toast.success(`Fichier mis à jour sur Google Drive (${result.subscribersCount} abonnés)`)
          } catch (error) {
            toast.error(error instanceof ApiError ? error.message : 'Synchronisation impossible')
          } finally {
            setBusy(false)
          }
        }}
      >
        Synchroniser avec Google Drive
      </Button>
    </div>
  )
}
