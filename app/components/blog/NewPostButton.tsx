'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { api, ApiError } from '@/lib/client/api'
import { Button } from '@/app/components/ui/Button'
import { Dialog } from '@/app/components/ui/Dialog'
import { Field, Input } from '@/app/components/ui/Field'

/** Création d'un article (administrateurs) : il naît en brouillon, invisible des visiteurs */
export function NewPostButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return (
    <>
      <Button variant="highlight" icon={<Plus className="size-4" aria-hidden="true" />} onClick={() => setOpen(true)}>
        Nouvel article
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Nouvel article"
        description="Il sera créé en brouillon : vous l’écrirez directement sur sa page, puis le publierez."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              loading={busy}
              disabled={!title.trim()}
              onClick={async () => {
                setBusy(true)
                setError(null)
                try {
                  const { slug } = await api<{ slug: string }>('/api/admin/posts', { body: { title } })
                  toast.success('Brouillon créé')
                  router.push(`/blog/${slug}`)
                } catch (err) {
                  setError(err instanceof ApiError ? err.message : 'Création impossible')
                  setBusy(false)
                }
              }}
            >
              Créer le brouillon
            </Button>
          </>
        }
      >
        <Field label="Titre de l’article" error={error}>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} autoFocus maxLength={200} />
        </Field>
      </Dialog>
    </>
  )
}
