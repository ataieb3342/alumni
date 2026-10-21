'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { toast } from 'sonner'
import { ANNOUNCEMENT_TYPES, type AnnouncementType } from '@/db/schema'
import { api } from '@/lib/client/api'
import { useForm } from '@/lib/client/useForm'
import { cn } from '@/lib/utils'
import { Alert } from '@/app/components/ui/Alert'
import { Button } from '@/app/components/ui/Button'
import { CharCount, Field, Input, Textarea } from '@/app/components/ui/Field'
import { ANNOUNCEMENT_TYPES_META } from './meta'

const schema = z
  .object({
    title: z.string().trim().min(3, 'Le titre doit contenir au moins 3 caractères').max(100, '100 caractères maximum'),
    type: z.enum(ANNOUNCEMENT_TYPES),
    company: z.string().max(100, 'Le nom est trop long'),
    location: z.string().max(200, 'Lieu trop long'),
    description: z.string().trim().min(10, 'La description doit contenir au moins 10 caractères').max(5000, '5000 caractères maximum'),
    contactEmail: z.string().trim().email('Cet e-mail ne semble pas valide').or(z.literal('')),
    contactPhone: z.string().trim().regex(/^[\d\s\-+()]*$/, 'Chiffres, espaces et + uniquement').max(20, 'Numéro trop long'),
    externalLink: z.string().trim().url('Adresse complète attendue (https://…)').or(z.literal('')),
    expiresAt: z.string(),
    eventDate: z.string(),
  })
  .refine((data) => data.contactEmail || data.contactPhone || data.externalLink, {
    message: 'Indiquez au moins un moyen de contact : e-mail, téléphone ou lien',
    path: ['contactEmail'],
  })
  .refine((data) => data.type !== 'event' || data.eventDate, { message: 'Indiquez la date et l’heure de l’événement', path: ['eventDate'] })

export interface AnnouncementFormInitial {
  id: string
  title: string
  type: AnnouncementType
  company: string | null
  location: string | null
  description: string
  contactEmail: string | null
  contactPhone: string | null
  externalLink: string | null
  expiresAt: string | null
  eventDate: string | null
}

/** Date ISO → valeur d'un champ datetime-local, à l'heure du navigateur */
function toLocalInput(iso: string | null, withTime: boolean) {
  if (!iso) return ''
  const date = new Date(iso)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString()
  return withTime ? local.slice(0, 16) : local.slice(0, 10)
}

export function AnnouncementForm({ initial }: { initial?: AnnouncementFormInitial }) {
  const router = useRouter()
  const editing = !!initial
  const [loading, setLoading] = useState(false)
  const form = useForm(schema, {
    title: initial?.title ?? '',
    type: initial?.type ?? 'job_offer',
    company: initial?.company ?? '',
    location: initial?.location ?? '',
    description: initial?.description ?? '',
    contactEmail: initial?.contactEmail ?? '',
    contactPhone: initial?.contactPhone ?? '',
    externalLink: initial?.externalLink ?? '',
    expiresAt: toLocalInput(initial?.expiresAt ?? null, false),
    eventDate: toLocalInput(initial?.eventDate ?? null, true),
  })
  const snapshot = useMemo(() => JSON.stringify(form.values), [form.values])
  const [saved, setSaved] = useState(snapshot)
  useEffect(() => {
    if (snapshot === saved) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [snapshot, saved])

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.validate()) {
      toast.error(form.firstError ?? 'Vérifiez le formulaire')
      return
    }
    setLoading(true)
    const values = form.values
    const body = {
      title: values.title.trim(),
      type: values.type,
      company: values.company.trim(),
      location: values.location.trim(),
      description: values.description.trim(),
      contactEmail: values.contactEmail.trim(),
      contactPhone: values.contactPhone.trim(),
      externalLink: values.externalLink.trim(),
      // La validation serveur attend des dates ISO complètes
      expiresAt: values.expiresAt ? new Date(`${values.expiresAt}T23:59:59`).toISOString() : '',
      eventDate: values.type === 'event' && values.eventDate ? new Date(values.eventDate).toISOString() : '',
    }
    try {
      const result = await api<{ slug: string }>(editing ? `/api/announcements/${initial!.id}` : '/api/announcements/create', {
        method: editing ? 'PATCH' : 'POST',
        body: editing ? { ...body, company: body.company || null, location: body.location || null, contactEmail: body.contactEmail || null, contactPhone: body.contactPhone || null, externalLink: body.externalLink || null, expiresAt: body.expiresAt || null, eventDate: body.eventDate || null } : body,
      })
      setSaved(snapshot)
      toast.success(editing ? 'Annonce mise à jour' : 'Annonce publiée ! Les membres abonnés sont prévenus.')
      router.push(editing ? '/annonces/mes-annonces' : `/annonces/${result.slug}`)
      router.refresh()
    } catch (error) {
      form.applyServerError(error)
      setLoading(false)
    }
  }

  const type = form.values.type
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      {form.formError && <Alert tone="error">{form.formError}</Alert>}

      <fieldset className="rounded-[var(--radius-lg)] border border-line bg-paper-raised p-5 sm:p-7">
        <legend className="px-1 font-display text-xl text-ink">1. Type d’annonce</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ANNOUNCEMENT_TYPES.map((value) => {
            const meta = ANNOUNCEMENT_TYPES_META[value]
            const Icon = meta.icon
            return (
              <label
                key={value}
                className={cn(
                  'flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-md)] border-2 p-3 has-[:focus-visible]:shadow-[var(--focus-ring)]',
                  type === value ? 'border-blue bg-blue-soft' : 'border-line hover:border-line-strong'
                )}
              >
                <input type="radio" name="type" value={value} checked={type === value} onChange={() => form.set('type', value)} className="sr-only" />
                <Icon className={cn('size-5 shrink-0', type === value ? 'text-blue' : 'text-ink-muted')} aria-hidden="true" />
                <span className="text-sm font-bold text-ink">{meta.label}</span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-5 rounded-[var(--radius-lg)] border border-line bg-paper-raised p-5 sm:p-7">
        <legend className="px-1 font-display text-xl text-ink">2. L’annonce</legend>
        <Field label="Titre" required error={form.error('title')} labelExtra={<CharCount value={form.values.title} max={100} />} hint="Ex. « Stage développeur web – 6 mois – Besançon »">
          <Input {...form.bind('title')} maxLength={120} />
        </Field>
        {type === 'event' && (
          <Field label="Date et heure de l’événement" required error={form.error('eventDate')} hint="Le prochain événement s’affiche en grand sur l’accueil des membres">
            <Input type="datetime-local" {...form.bind('eventDate')} />
          </Field>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Entreprise / organisation" error={form.error('company')}>
            <Input autoComplete="organization" {...form.bind('company')} />
          </Field>
          <Field label="Lieu" error={form.error('location')} hint="Ville, région ou « À distance »">
            <Input {...form.bind('location')} />
          </Field>
        </div>
        <Field
          label="Description"
          required
          error={form.error('description')}
          labelExtra={<CharCount value={form.values.description} max={5000} />}
          hint="Missions, profil recherché, conditions… Laissez une ligne vide entre deux paragraphes ; commencez une ligne par « - » pour une liste."
        >
          <Textarea rows={10} {...form.bind('description')} />
        </Field>
      </fieldset>

      <fieldset className="space-y-5 rounded-[var(--radius-lg)] border border-line bg-paper-raised p-5 sm:p-7">
        <legend className="px-1 font-display text-xl text-ink">3. Comment répondre</legend>
        <p className="text-sm text-ink-muted">Au moins un moyen de contact.</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="E-mail de contact" error={form.error('contactEmail')}>
            <Input type="email" inputMode="email" autoComplete="email" {...form.bind('contactEmail')} />
          </Field>
          <Field label="Téléphone" error={form.error('contactPhone')}>
            <Input type="tel" autoComplete="tel" {...form.bind('contactPhone')} />
          </Field>
        </div>
        <Field label="Lien (candidature, billetterie…)" error={form.error('externalLink')}>
          <Input type="url" inputMode="url" placeholder="https://" {...form.bind('externalLink')} />
        </Field>
        <Field label="Date d’expiration (facultatif)" error={form.error('expiresAt')} hint="Après cette date, l’annonce disparaît de la liste">
          <Input type="date" min={new Date().toISOString().slice(0, 10)} {...form.bind('expiresAt')} />
        </Field>
      </fieldset>

      <div className="sticky bottom-3 z-30 [.has-admin-bar_&]:bottom-20 flex flex-col-reverse gap-3 rounded-[var(--radius-lg)] border border-line bg-paper-raised/95 p-3 shadow-[var(--shadow-lg)] backdrop-blur sm:flex-row sm:items-center sm:justify-end">
        <Button variant="ghost" onClick={() => router.push(editing ? '/annonces/mes-annonces' : '/annonces')}>
          Annuler
        </Button>
        <Button type="submit" size="lg" loading={loading} loadingLabel="Enregistrement…">
          {editing ? 'Enregistrer les modifications' : 'Publier l’annonce'}
        </Button>
      </div>
    </form>
  )
}
