'use client'

import { useRouter } from 'next/navigation'
import { useId, useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api, ApiError } from '@/lib/client/api'
import { Button } from '@/app/components/ui/Button'
import { useConfirm } from '@/app/components/ui/Dialog'
import { Spinner } from '@/app/components/ui/Spinner'

/** Image de couverture d'un témoignage : réservée aux administrateurs (comme dans le Studio) */
export function CoverImageControl({ testimonialId, hasImage }: { testimonialId: string; hasImage: boolean }) {
  const router = useRouter()
  const confirm = useConfirm()
  const inputId = useId()
  const [busy, setBusy] = useState(false)

  const save = async (featuredImage: unknown, message: string) => {
    await api(`/api/testimonials/${testimonialId}`, { method: 'PATCH', body: { featuredImage } })
    toast.success(message)
    router.refresh()
  }

  const upload = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { image } = await api<{ image: unknown }>('/api/admin/media', { formData })
      await save(image, 'Image de couverture enregistrée')
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Téléversement impossible')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-blue/40 bg-blue-soft/40 p-3 text-sm">
      <span className="font-semibold text-ink-soft">Administration :</span>
      <label
        htmlFor={inputId}
        className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] bg-paper-raised px-3 font-semibold text-ink shadow-[var(--shadow-sm)] has-[:focus-visible]:shadow-[var(--focus-ring)]"
      >
        {busy ? <Spinner className="size-4" /> : <ImagePlus className="size-4" aria-hidden="true" />}
        {hasImage ? 'Remplacer l’image de couverture' : 'Ajouter une image de couverture'}
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="sr-only"
          disabled={busy}
          onChange={(event) => {
            void upload(event.target.files?.[0])
            event.target.value = ''
          }}
        />
      </label>
      {hasImage && (
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          icon={<Trash2 className="size-4" aria-hidden="true" />}
          onClick={async () => {
            if (!(await confirm({ title: 'Retirer l’image de couverture ?', body: 'Elle reste disponible dans la médiathèque.', confirmLabel: 'Retirer' }))) return
            try {
              await save(null, 'Image de couverture retirée')
            } catch (error) {
              toast.error(error instanceof ApiError ? error.message : 'Modification impossible')
            }
          }}
        >
          Retirer l’image
        </Button>
      )}
    </div>
  )
}
