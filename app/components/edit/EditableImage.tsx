'use client'

import { useId, useRef, useState, type ReactNode } from 'react'
import { ImagePlus, Type, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import type { ImageRef } from '@/db/schema'
import { api, ApiError } from '@/lib/client/api'
import { setAt, getAt } from '@/lib/content/path'
import { cn } from '@/lib/utils'
import { Button } from '@/app/components/ui/Button'
import { Dialog, useConfirm } from '@/app/components/ui/Dialog'
import { Field, Input } from '@/app/components/ui/Field'
import { Spinner } from '@/app/components/ui/Spinner'
import { useEditor } from './EditorShell'

/**
 * Image remplaçable par glisser-déposer (ou en choisissant un fichier). Le
 * fichier est normalisé côté serveur (WebP, EXIF retirés) puis référencé dans
 * le brouillon.
 */
export function EditableImage({
  docKey,
  path,
  children,
  className,
  allowRemove = false,
  label = 'Image',
}: {
  docKey: string
  path: string
  children: ReactNode
  className?: string
  allowRemove?: boolean
  label?: string
}) {
  const editor = useEditor()
  const confirm = useConfirm()
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [altOpen, setAltOpen] = useState(false)
  const current = editor?.docs[docKey] ? (getAt(editor.docs[docKey].data, path) as ImageRef | null | undefined) : undefined
  const [alt, setAlt] = useState('')

  if (!editor?.editMode) return <div className={className}>{children}</div>

  const upload = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Déposez un fichier image (JPG, PNG, WEBP, GIF)')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (current?.alt) formData.append('alt', current.alt)
      const { image } = await api<{ image: ImageRef }>('/api/admin/media', { formData })
      await editor.commit(docKey, (data) => setAt(data, path, { ...image, alt: current?.alt ?? image.alt ?? '' }))
      toast.success('Image remplacée dans le brouillon')
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Téléversement impossible')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      className={cn('group/image relative', className)}
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        void upload(event.dataTransfer.files[0])
      }}
    >
      {children}
      <div
        className={cn(
          'absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-[inherit] border-2 border-dashed p-3 text-center transition-all',
          dragging ? 'border-highlight bg-wash/70 opacity-100' : 'border-blue/60 bg-wash/0 opacity-0 group-hover/image:bg-wash/55 group-hover/image:opacity-100 focus-within:bg-wash/55 focus-within:opacity-100'
        )}
      >
        {uploading ? (
          <p className="flex items-center gap-2 font-semibold text-on-wash">
            <Spinner /> Téléversement…
          </p>
        ) : (
          <>
            <p className="hidden text-sm font-semibold text-on-wash sm:block">
              <Upload className="mr-1 inline size-4" aria-hidden="true" />
              Glissez une image ici
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <label htmlFor={inputId} className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] bg-paper-raised px-3 text-sm font-semibold text-ink shadow focus-within:shadow-[var(--focus-ring)]">
                <ImagePlus className="size-4" aria-hidden="true" />
                {current ? 'Remplacer' : 'Ajouter'}
                <span className="sr-only"> : {label}</span>
                <input
                  ref={inputRef}
                  id={inputId}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  className="sr-only"
                  onChange={(event) => {
                    void upload(event.target.files?.[0])
                    event.target.value = ''
                  }}
                />
              </label>
              {current && (
                <button
                  type="button"
                  onClick={() => {
                    setAlt(current.alt ?? '')
                    setAltOpen(true)
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] bg-paper-raised px-3 text-sm font-semibold text-ink shadow"
                >
                  <Type className="size-4" aria-hidden="true" /> Texte alternatif
                </button>
              )}
              {current && allowRemove && (
                <button
                  type="button"
                  onClick={async () => {
                    if (await confirm({ title: 'Retirer cette image ?', body: 'Elle reste disponible dans la médiathèque.', confirmLabel: 'Retirer' }))
                      await editor.commit(docKey, (data) => setAt(data, path, null))
                  }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] bg-red px-3 text-sm font-semibold text-on-red shadow"
                >
                  <Trash2 className="size-4" aria-hidden="true" /> Retirer
                </button>
              )}
            </div>
            {current && !current.alt && <p className="rounded bg-highlight px-2 py-0.5 text-xs font-semibold text-on-highlight">Texte alternatif manquant</p>}
          </>
        )}
      </div>
      <Dialog
        open={altOpen}
        onClose={() => setAltOpen(false)}
        title="Texte alternatif"
        description="Décrivez l’image pour les personnes qui ne la voient pas. Laissez vide si elle est purement décorative."
        footer={
          <>
            <Button variant="secondary" onClick={() => setAltOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={async () => {
                setAltOpen(false)
                await editor.commit(docKey, (data) => setAt(data, `${path}.alt`, alt.trim()))
              }}
            >
              Enregistrer
            </Button>
          </>
        }
      >
        <Field label="Description de l’image" hint="Ex. « La façade du lycée Victor Hugo sous la neige »">
          <Input value={alt} onChange={(event) => setAlt(event.target.value)} maxLength={300} />
        </Field>
      </Dialog>
    </div>
  )
}
