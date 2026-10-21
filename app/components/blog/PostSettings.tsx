'use client'

import { Globe, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Field, Input } from '@/app/components/ui/Field'
import { useEditor, useFieldValue } from '@/app/components/edit/EditorShell'

/** Réglages d'un article en mode édition : adresse, visibilité, date de publication */
export function PostSettings({ docKey, initial }: { docKey: string; initial: { slug: string; visibility: 'public' | 'members'; publishedAt: string } }) {
  const editor = useEditor()
  const [slug, setSlug] = useFieldValue(docKey, 'slug', initial.slug)
  const [visibility, setVisibility] = useFieldValue(docKey, 'visibility', initial.visibility)
  const [publishedAt, setPublishedAt] = useFieldValue(docKey, 'publishedAt', initial.publishedAt)
  if (!editor?.editMode) return null
  const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  return (
    <aside aria-label="Réglages de l’article" className="rounded-[var(--radius-lg)] border-2 border-dashed border-blue/40 bg-blue-soft/40 p-5">
      <p className="font-display text-lg text-ink">Réglages de l’article</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Field label="Adresse (/blog/…)" error={validSlug ? null : 'Minuscules, chiffres et tirets'}>
          <Input value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase())} />
        </Field>
        <Field label="Date de publication">
          <Input type="date" value={publishedAt.slice(0, 10)} onChange={(event) => event.target.value && setPublishedAt(new Date(`${event.target.value}T12:00:00`).toISOString())} />
        </Field>
        <fieldset>
          <legend className="text-sm font-semibold text-ink">Visible par</legend>
          <div className="mt-1.5 flex rounded-[var(--radius-sm)] bg-paper-sunken p-1">
            {(
              [
                ['public', 'Tout le monde', Globe],
                ['members', 'Membres', Lock],
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                aria-pressed={visibility === value}
                onClick={() => setVisibility(value)}
                className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-[6px] px-2 py-2 text-sm font-semibold', visibility === value ? 'bg-paper-raised text-blue shadow-sm' : 'text-ink-soft')}
              >
                <Icon className="size-4" aria-hidden="true" /> {label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
    </aside>
  )
}
