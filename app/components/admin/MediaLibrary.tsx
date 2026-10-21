'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Copy, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { api, ApiError } from '@/lib/client/api'
import { cn } from '@/lib/utils'
import { Button } from '@/app/components/ui/Button'
import { useConfirm } from '@/app/components/ui/Dialog'
import { Spinner } from '@/app/components/ui/Spinner'

export interface MediaItem {
  id: string
  url: string
  filename: string | null
  alt: string | null
  width: number | null
  height: number | null
  size: number
  createdAt: string
  uploader: string | null
}

/** Médiathèque : dépôt par glisser-déposer, texte alternatif, suppression (refusée si l'image est utilisée) */
export function MediaLibrary({ items }: { items: MediaItem[] }) {
  const router = useRouter()
  const confirm = useConfirm()
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(0)

  const upload = async (files: FileList | File[]) => {
    const list = [...files].filter((file) => file.type.startsWith('image/'))
    if (list.length === 0) return toast.error('Déposez des images (JPG, PNG, WEBP, GIF)')
    setUploading(list.length)
    let ok = 0
    for (const file of list) {
      const data = new FormData()
      data.append('file', file)
      try {
        await api('/api/admin/media', { formData: data })
        ok++
      } catch (error) {
        toast.error(`${file.name} : ${error instanceof ApiError ? error.message : 'échec'}`)
      }
      setUploading((count) => count - 1)
    }
    if (ok) toast.success(`${ok} image${ok > 1 ? 's' : ''} ajoutée${ok > 1 ? 's' : ''}`)
    router.refresh()
  }

  return (
    <div className="space-y-5">
      <label
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          void upload(event.dataTransfer.files)
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border-2 border-dashed p-8 text-center transition-colors has-[:focus-visible]:shadow-[var(--focus-ring)]',
          dragging ? 'border-blue bg-blue-soft' : 'border-line-strong/50 bg-paper hover:border-blue'
        )}
      >
        {uploading ? <Spinner className="size-7 text-blue" label="Téléversement en cours" /> : <Upload className="size-7 text-blue" aria-hidden="true" />}
        <span className="font-semibold text-ink">{uploading ? `Téléversement… (${uploading} restante${uploading > 1 ? 's' : ''})` : 'Glissez des images ici ou cliquez pour choisir'}</span>
        <span className="text-sm text-ink-muted">JPG, PNG, WEBP, GIF · 5 Mo max · converties en WebP, métadonnées retirées</span>
        <input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => event.target.files && void upload(event.target.files)} />
      </label>

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <li key={item.id} className="overflow-hidden rounded-[var(--radius-md)] border border-line bg-paper-raised">
            <div className="relative aspect-square bg-paper-sunken">
              <Image src={item.url} alt={item.alt ?? ''} fill sizes="(min-width: 1024px) 20vw, 45vw" className="object-cover" />
            </div>
            <div className="space-y-2 p-3 text-sm">
              <AltEditor item={item} />
              <p className="truncate text-xs text-ink-muted" title={item.filename ?? undefined}>
                {item.width && item.height ? `${item.width}×${item.height} · ` : ''}
                {Math.round(item.size / 1024)} Ko
              </p>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Copy className="size-4" aria-hidden="true" />}
                  onClick={async () => {
                    await navigator.clipboard.writeText(new URL(item.url, location.origin).toString())
                    toast.success('Adresse copiée')
                  }}
                >
                  Copier
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red hover:bg-red-soft hover:text-red"
                  icon={<Trash2 className="size-4" aria-hidden="true" />}
                  onClick={async () => {
                    if (!(await confirm({ title: 'Supprimer cette image ?', body: 'Le fichier sera supprimé définitivement. Une image encore utilisée ne peut pas être supprimée.', confirmLabel: 'Supprimer' }))) return
                    try {
                      await api(`/api/admin/media/${item.id}`, { method: 'DELETE' })
                      toast.success('Image supprimée')
                      router.refresh()
                    } catch (error) {
                      toast.error(error instanceof ApiError ? error.message : 'Suppression impossible')
                    }
                  }}
                >
                  Supprimer
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function AltEditor({ item }: { item: MediaItem }) {
  const [value, setValue] = useState(item.alt ?? '')
  const [saved, setSaved] = useState(item.alt ?? '')
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink-muted">Texte alternatif</span>
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={async () => {
          if (value === saved) return
          try {
            await api(`/api/admin/media/${item.id}`, { method: 'PATCH', body: { alt: value } })
            setSaved(value)
            toast.success('Texte alternatif enregistré')
          } catch (error) {
            toast.error(error instanceof ApiError ? error.message : 'Enregistrement impossible')
          }
        }}
        placeholder="Décrire l’image…"
        className={cn('mt-0.5 h-9 w-full rounded-[var(--radius-xs)] border bg-paper px-2 text-sm text-ink outline-none focus:border-blue', value ? 'border-line' : 'border-warning/60')}
      />
    </label>
  )
}
