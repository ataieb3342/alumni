'use client'

import Link from 'next/link'
import { useState, type ReactNode } from 'react'
import { Link2 } from 'lucide-react'
import { Button } from '@/app/components/ui/Button'
import { Dialog } from '@/app/components/ui/Dialog'
import { Field, Input } from '@/app/components/ui/Field'
import { useEditor, useFieldValue } from './EditorShell'
import { EditableText } from './EditableText'

/**
 * Lien éditable : en mode édition, le libellé se modifie sur place (le clic
 * ne navigue plus) et l'adresse via le petit bouton « lien ».
 */
export function EditableLink({
  docKey,
  path,
  initial,
  className,
  icon,
  iconRight,
}: {
  docKey: string
  path: string
  initial: { label: string; href: string }
  className?: string
  icon?: ReactNode
  iconRight?: ReactNode
}) {
  const editor = useEditor()
  const [href, setHref] = useFieldValue<string>(docKey, `${path}.href`, initial.href)
  const [label] = useFieldValue<string>(docKey, `${path}.label`, initial.label)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(href)

  if (!editor?.editMode) {
    return (
      <Link href={href || '#'} className={className}>
        {icon}
        <span>{label}</span>
        {iconRight}
      </Link>
    )
  }

  const valid = draft === '' || /^(https?:\/\/|mailto:|tel:|\/)/.test(draft)
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={className}>
        {icon}
        <EditableText docKey={docKey} path={`${path}.label`} initial={initial.label} label="Libellé du bouton" />
        {iconRight}
      </span>
      <button
        type="button"
        onClick={() => {
          setDraft(href)
          setOpen(true)
        }}
        title={`Adresse : ${href}`}
        aria-label={`Modifier l'adresse du lien « ${label} »`}
        className="inline-flex size-9 items-center justify-center rounded-full border border-line bg-paper-raised text-blue shadow-sm hover:bg-blue-soft"
      >
        <Link2 className="size-4" aria-hidden="true" />
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Adresse du lien"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              disabled={!valid}
              onClick={() => {
                setHref(draft.trim())
                setOpen(false)
              }}
            >
              Valider
            </Button>
          </>
        }
      >
        <Field label="Adresse" hint="Une page du site (/inscription) ou une adresse complète (https://…, mailto:…)" error={valid ? null : 'Commencez par /, https://, mailto: ou tel:'}>
          <Input value={draft} onChange={(event) => setDraft(event.target.value)} inputMode="url" autoComplete="off" />
        </Field>
      </Dialog>
    </span>
  )
}
