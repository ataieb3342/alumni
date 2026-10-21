'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowDown, ArrowUp, History, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { SiteContent } from '@/lib/content/definitions'
import { api, ApiError } from '@/lib/client/api'
import { newId } from '@/lib/ids'
import { Button } from '@/app/components/ui/Button'
import { useConfirm } from '@/app/components/ui/Dialog'
import { Field, Input, Textarea } from '@/app/components/ui/Field'
import { HistoryDialog } from '@/app/components/edit/HistoryDialog'

/** Réglages du site (pied de page, contact, réseaux) : publiés à l'enregistrement, versions conservées */
export function SiteSettingsForm({ initial, revision }: { initial: SiteContent; revision: string }) {
  const router = useRouter()
  const confirm = useConfirm()
  const [values, setValues] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<{ field?: string; message: string } | null>(null)
  const [history, setHistory] = useState(false)
  const set = <K extends keyof SiteContent>(key: K, value: SiteContent[K]) => setValues((current) => ({ ...current, [key]: value }))
  const dirty = JSON.stringify(values) !== JSON.stringify(initial)
  const fieldError = (field: string) => (error?.field === field ? error.message : null)

  return (
    <form
      className="space-y-6"
      onSubmit={async (event) => {
        event.preventDefault()
        setBusy(true)
        setError(null)
        try {
          await api('/api/admin/content/site/draft', { method: 'PUT', body: values })
          await api('/api/admin/content/site/publish', { method: 'POST' })
          toast.success('Réglages publiés')
          router.refresh()
        } catch (err) {
          setError({ field: err instanceof ApiError ? err.field : undefined, message: err instanceof ApiError ? err.message : 'Enregistrement impossible' })
          toast.error(err instanceof ApiError ? err.message : 'Enregistrement impossible')
        } finally {
          setBusy(false)
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom du site" error={fieldError('name')}>
          <Input value={values.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="E-mail de contact" error={fieldError('contactEmail')}>
          <Input type="email" value={values.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} />
        </Field>
        <Field label="Accroche" className="sm:col-span-2" error={fieldError('tagline')}>
          <Input value={values.tagline} onChange={(e) => set('tagline', e.target.value)} />
        </Field>
        <Field label="Présentation (pied de page)" className="sm:col-span-2" error={fieldError('description')}>
          <Textarea rows={2} value={values.description} onChange={(e) => set('description', e.target.value)} />
        </Field>
        <Field label="Adresse postale" error={fieldError('address')}>
          <Textarea rows={3} value={values.address} onChange={(e) => set('address', e.target.value)} />
        </Field>
        <div className="space-y-4">
          <Field label="Appel à adhérer : titre" error={fieldError('joinTitle')}>
            <Input value={values.joinTitle} onChange={(e) => set('joinTitle', e.target.value)} />
          </Field>
          <Field label="Appel à adhérer : texte" error={fieldError('joinText')}>
            <Input value={values.joinText} onChange={(e) => set('joinText', e.target.value)} />
          </Field>
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-ink">Réseaux sociaux</legend>
        <ul className="mt-2 space-y-2">
          {values.socials.map((social, index) => (
            <li key={social.id} className="grid gap-2 sm:grid-cols-[10rem_1fr_auto]">
              <Input aria-label={`Réseau ${index + 1} : nom`} value={social.label} onChange={(e) => set('socials', values.socials.map((s, i) => (i === index ? { ...s, label: e.target.value } : s)))} />
              <Input aria-label={`Réseau ${index + 1} : adresse`} value={social.url} inputMode="url" onChange={(e) => set('socials', values.socials.map((s, i) => (i === index ? { ...s, url: e.target.value } : s)))} />
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" aria-label="Monter" disabled={index === 0} onClick={() => set('socials', values.socials.map((s, i, all) => (i === index - 1 ? all[index] : i === index ? all[index - 1] : s)))}>
                  <ArrowUp className="size-4" aria-hidden="true" />
                </Button>
                <Button size="sm" variant="ghost" aria-label="Descendre" disabled={index === values.socials.length - 1} onClick={() => set('socials', values.socials.map((s, i, all) => (i === index + 1 ? all[index] : i === index ? all[index + 1] : s)))}>
                  <ArrowDown className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Supprimer ${social.label}`}
                  className="text-red hover:bg-red-soft hover:text-red"
                  onClick={async () => {
                    if (await confirm({ title: `Retirer ${social.label || 'ce réseau'} ?`, confirmLabel: 'Retirer' })) set('socials', values.socials.filter((_, i) => i !== index))
                  }}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
        {values.socials.length < 8 && (
          <Button size="sm" variant="secondary" className="mt-2" icon={<Plus className="size-4" aria-hidden="true" />} onClick={() => set('socials', [...values.socials, { id: newId(8), label: '', url: 'https://' }])}>
            Ajouter un réseau
          </Button>
        )}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Crédit (pied de page)">
          <Input value={values.creditLabel} onChange={(e) => set('creditLabel', e.target.value)} />
        </Field>
        <Field label="Lien du crédit" error={fieldError('creditUrl')}>
          <Input value={values.creditUrl} onChange={(e) => set('creditUrl', e.target.value)} />
        </Field>
        <Field label="E-mail du crédit">
          <Input value={values.creditEmail} onChange={(e) => set('creditEmail', e.target.value)} />
        </Field>
      </div>

      <div className="flex flex-wrap justify-between gap-2 border-t border-line pt-4">
        <Button variant="ghost" icon={<History className="size-4" aria-hidden="true" />} onClick={() => setHistory(true)}>
          Historique
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" disabled={!dirty || busy} onClick={() => setValues(initial)}>
            Annuler
          </Button>
          <Button type="submit" loading={busy} disabled={!dirty}>
            Publier les réglages
          </Button>
        </div>
      </div>
      {history && (
        <HistoryDialog
          doc={{ key: 'content:site', label: 'Réglages du site', endpoint: '/api/admin/content/site', data: values, hasDraft: false, revision }}
          onClose={() => setHistory(false)}
          onRestore={async (versionId) => {
            await api(`/api/admin/content/site/versions/${versionId}/restore`, { method: 'POST' })
            await api('/api/admin/content/site/publish', { method: 'POST' })
            toast.success('Version restaurée et publiée')
            router.refresh()
          }}
        />
      )}
    </form>
  )
}
