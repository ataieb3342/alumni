'use client'

import { useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { api, ApiError } from '@/lib/client/api'
import { Button } from '@/app/components/ui/Button'
import { Dialog, useConfirm } from '@/app/components/ui/Dialog'
import { Spinner } from '@/app/components/ui/Spinner'
import { Badge } from '@/app/components/ui/Badge'
import type { VersionAction } from '@/db/schema'
import type { DocDescriptor } from './EditorShell'

interface Version {
  id: string
  action: VersionAction
  createdAt: string
  author: string | null
  summary: string
}

const ACTION_LABELS: Record<Version['action'], { label: string; tone: 'blue' | 'green' | 'amber' | 'neutral' | 'red' }> = {
  save: { label: 'Brouillon', tone: 'neutral' },
  publish: { label: 'Publication', tone: 'green' },
  unpublish: { label: 'Retrait', tone: 'amber' },
  restore: { label: 'Restauration', tone: 'blue' },
  delete: { label: 'Suppression', tone: 'red' },
  create: { label: 'Création', tone: 'blue' },
  initial: { label: 'Version d’origine', tone: 'neutral' },
}

/** Historique des versions d'un contenu, avec restauration dans le brouillon */
export function HistoryDialog({ doc, onClose, onRestore }: { doc: DocDescriptor; onClose: () => void; onRestore: (id: string) => Promise<void> }) {
  const [versions, setVersions] = useState<Version[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const confirm = useConfirm()

  useEffect(() => {
    let cancelled = false
    api<{ versions: Version[] }>(`${doc.endpoint}/versions`)
      .then((data) => !cancelled && setVersions(data.versions))
      .catch((err) => !cancelled && setError(err instanceof ApiError ? err.message : 'Historique indisponible'))
    return () => {
      cancelled = true
    }
  }, [doc.endpoint])

  return (
    <Dialog open onClose={onClose} title={`Historique — ${doc.label}`} description="Chaque enregistrement et chaque publication est conservé (50 dernières versions)." size="lg">
      {error && <p className="text-red">{error}</p>}
      {!versions && !error && (
        <p className="flex items-center gap-2 text-ink-muted">
          <Spinner /> Chargement…
        </p>
      )}
      {versions && versions.length === 0 && <p className="text-ink-muted">Aucune version enregistrée pour l’instant.</p>}
      {versions && versions.length > 0 && (
        <ol className="divide-y divide-line">
          {versions.map((version, index) => {
            const action = ACTION_LABELS[version.action]
            return (
              <li key={version.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge tone={action.tone}>{action.label}</Badge>
                    <time dateTime={version.createdAt} className="font-semibold text-ink">
                      {new Date(version.createdAt).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                    </time>
                    {version.author && <span className="text-ink-muted">par {version.author}</span>}
                    {index === 0 && <span className="text-ink-muted">(la plus récente)</span>}
                  </p>
                  <p className="mt-1 truncate text-sm text-ink-muted">{version.summary}</p>
                </div>
                {version.action !== 'delete' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<RotateCcw className="size-4" aria-hidden="true" />}
                    onClick={async () => {
                      const ok = await confirm({
                        title: 'Restaurer cette version ?',
                        body: 'Elle remplacera le brouillon actuel. La version publiée ne change pas tant que vous ne publiez pas.',
                        confirmLabel: 'Restaurer',
                        tone: 'primary',
                      })
                      if (!ok) return
                      await onRestore(version.id)
                      onClose()
                    }}
                  >
                    Restaurer
                  </Button>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </Dialog>
  )
}
