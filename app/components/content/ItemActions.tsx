'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Eye, PenLine, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api, ApiError } from '@/lib/client/api'
import { buttonClasses } from '@/app/components/ui/Button'
import { useConfirm } from '@/app/components/ui/Dialog'
import { Select } from '@/app/components/ui/Field'

const STATUS_LABELS = { published: 'Publié', draft: 'Brouillon', archived: 'Archivé' } as const

/**
 * Actions sur une annonce ou un témoignage : voir, modifier, supprimer (avec
 * confirmation) et, pour un administrateur, changer le statut (modération).
 */
export function ItemActions({
  endpoint,
  viewHref,
  editHref,
  title,
  status,
  canModerate = false,
  afterDelete,
  compact = false,
}: {
  endpoint: string
  viewHref?: string
  editHref?: string
  title: string
  status?: keyof typeof STATUS_LABELS
  canModerate?: boolean
  afterDelete?: string
  compact?: boolean
}) {
  const router = useRouter()
  const confirm = useConfirm()
  const [busy, setBusy] = useState(false)

  const remove = async () => {
    const ok = await confirm({
      title: 'Supprimer définitivement ?',
      body: (
        <>
          « <strong className="text-ink">{title}</strong> » sera supprimé. Cette action est irréversible.
        </>
      ),
      confirmLabel: 'Supprimer',
    })
    if (!ok) return
    setBusy(true)
    try {
      await api(endpoint, { method: 'DELETE' })
      toast.success('Supprimé')
      if (afterDelete) router.push(afterDelete)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Suppression impossible')
    } finally {
      setBusy(false)
    }
  }

  const changeStatus = async (next: string) => {
    setBusy(true)
    try {
      await api(endpoint, { method: 'PATCH', body: { status: next } })
      toast.success(`Statut : ${STATUS_LABELS[next as keyof typeof STATUS_LABELS]}`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Modification impossible')
    } finally {
      setBusy(false)
    }
  }

  const size = compact ? 'sm' : 'md'
  return (
    <div className="flex flex-wrap items-center gap-2">
      {viewHref && (
        <Link href={viewHref} className={buttonClasses('secondary', size)}>
          <Eye className="size-4" aria-hidden="true" /> Voir
        </Link>
      )}
      {editHref && (
        <Link href={editHref} className={buttonClasses('secondary', size)}>
          <PenLine className="size-4" aria-hidden="true" /> Modifier
        </Link>
      )}
      {canModerate && status && (
        <label className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft">
          Statut
          <Select value={status} disabled={busy} onChange={(event) => void changeStatus(event.target.value)} className="h-9 w-auto py-0 text-sm">
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </label>
      )}
      <button type="button" onClick={remove} disabled={busy} className={buttonClasses('ghost', size, 'text-red hover:bg-red-soft hover:text-red')}>
        <Trash2 className="size-4" aria-hidden="true" /> Supprimer
      </button>
    </div>
  )
}
