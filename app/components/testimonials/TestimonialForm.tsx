'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import type { TestimonialType } from '@/db/schema'
import { api } from '@/lib/client/api'
import { useForm } from '@/lib/client/useForm'
import { TESTIMONIAL_TYPES_INFO } from '@/lib/testimonials'
import { cn } from '@/lib/utils'
import { createTestimonialSchema } from '@/lib/validations'
import { Alert } from '@/app/components/ui/Alert'
import { Button } from '@/app/components/ui/Button'
import { CharCount, Field, Input, Textarea } from '@/app/components/ui/Field'

export interface TestimonialFormValues {
  id?: string
  title: string
  type: TestimonialType
  excerpt: string
  rating?: number | null
  tags: string[]
  answers: Record<string, string>
}

/**
 * Création et modification d'un témoignage (un seul formulaire) : toutes les
 * réponses restent modifiables, contrairement à l'ancien formulaire d'édition.
 */
export function TestimonialForm({ initial, cancelHref }: { initial?: TestimonialFormValues; cancelHref: string }) {
  const router = useRouter()
  const editing = !!initial?.id
  const [loading, setLoading] = useState(false)
  const form = useForm(createTestimonialSchema, {
    title: initial?.title ?? '',
    type: initial?.type ?? 'studies',
    excerpt: initial?.excerpt ?? '',
    rating: initial?.rating ?? undefined,
    tags: initial?.tags.join(', ') ?? '',
    ...(initial?.answers ?? {}),
  } as Record<string, unknown>)
  const type = form.values.type as TestimonialType
  const info = TESTIMONIAL_TYPES_INFO[type]
  const dirty = useMemo(() => JSON.stringify(form.values), [form.values])
  const [savedSnapshot, setSavedSnapshot] = useState(dirty)

  useEffect(() => {
    if (dirty === savedSnapshot) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, savedSnapshot])

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.validate()) {
      toast.error(form.firstError ?? 'Vérifiez le formulaire')
      return
    }
    setLoading(true)
    try {
      const result = await api<{ slug: string }>(editing ? `/api/testimonials/${initial!.id}` : '/api/testimonials/create', {
        method: editing ? 'PATCH' : 'POST',
        body: form.values,
      })
      setSavedSnapshot(dirty)
      toast.success(editing ? 'Témoignage mis à jour' : 'Merci ! Votre témoignage est publié.')
      router.push(editing ? '/temoignages/mes-temoignages' : `/temoignages/${result.slug}`)
      router.refresh()
    } catch (error) {
      form.applyServerError(error)
      setLoading(false)
    }
  }

  const text = (key: string) => String(form.values[key] ?? '')

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      {form.formError && <Alert tone="error">{form.formError}</Alert>}

      <fieldset className="rounded-[var(--radius-lg)] border border-line bg-paper-raised p-5 sm:p-7">
        <legend className="px-1 font-display text-xl text-ink">1. De quoi voulez-vous parler ?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.entries(TESTIMONIAL_TYPES_INFO) as [TestimonialType, (typeof TESTIMONIAL_TYPES_INFO)[TestimonialType]][]).map(([value, option]) => (
            <label
              key={value}
              className={cn(
                'flex cursor-pointer flex-col gap-0.5 rounded-[var(--radius-md)] border-2 p-3 has-[:focus-visible]:shadow-[var(--focus-ring)]',
                type === value ? 'border-blue bg-blue-soft' : 'border-line hover:border-line-strong'
              )}
            >
              <input type="radio" name="type" value={value} checked={type === value} onChange={() => form.set('type', value)} className="sr-only" />
              <span className="font-bold text-ink">{option.label}</span>
              <span className="text-sm text-ink-muted">{option.description}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-5 rounded-[var(--radius-lg)] border border-line bg-paper-raised p-5 sm:p-7">
        <legend className="px-1 font-display text-xl text-ink">2. L’essentiel</legend>
        <Field label="Titre" required error={form.error('title')} hint="10 à 120 caractères. Ex. « Ma prépa MPSI à Besançon : ce que j’aurais aimé savoir »" labelExtra={<CharCount value={text('title')} max={120} />}>
          <Input {...form.bind('title')} maxLength={140} />
        </Field>
        <Field label="Résumé" required error={form.error('excerpt')} hint="Deux ou trois phrases, affichées sur la carte (50 à 300 caractères)" labelExtra={<CharCount value={text('excerpt')} max={300} />}>
          <Textarea rows={3} {...form.bind('excerpt')} />
        </Field>
        <fieldset>
          <legend className="text-sm font-semibold text-ink">Note de l’expérience (facultatif)</legend>
          <div className="mt-2 flex items-center gap-1" role="radiogroup" aria-label="Note sur 5">
            {[1, 2, 3, 4, 5].map((value) => {
              const active = Number(form.values.rating ?? 0) >= value
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={Number(form.values.rating) === value}
                  aria-label={`${value} sur 5`}
                  onClick={() => form.set('rating', Number(form.values.rating) === value ? undefined : value)}
                  className="rounded-full p-1 focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
                >
                  <Star className={cn('size-7', active ? 'fill-highlight text-warning' : 'text-line-strong')} aria-hidden="true" />
                </button>
              )
            })}
          </div>
        </fieldset>
        <Field label="Mots-clés (facultatif)" error={form.error('tags')} hint="Séparés par des virgules : prépa, erasmus, alternance">
          <Input {...form.bind('tags')} />
        </Field>
      </fieldset>

      <fieldset className="space-y-5 rounded-[var(--radius-lg)] border border-line bg-paper-raised p-5 sm:p-7">
        <legend className="px-1 font-display text-xl text-ink">3. Racontez ({info.label.toLowerCase()})</legend>
        <p className="text-sm text-ink-muted">Répondez aux questions qui vous inspirent ; les autres resteront masquées.</p>
        <div className="grid gap-5 sm:grid-cols-2">
          {info.questions
            .filter((question) => question.fact)
            .map((question) => (
              <Field key={question.key} label={question.label} error={form.error(question.key)}>
                <Input {...form.bind(question.key)} placeholder={question.placeholder} />
              </Field>
            ))}
        </div>
        {info.questions
          .filter((question) => !question.fact)
          .map((question) => (
            <Field key={question.key} label={question.label} error={form.error(question.key)} labelExtra={<CharCount value={text(question.key)} max={question.key === 'mentoring_advice' ? 3000 : 2000} />}>
              <Textarea rows={5} {...form.bind(question.key)} placeholder={question.placeholder} />
            </Field>
          ))}
      </fieldset>

      <div className="sticky bottom-3 z-30 [.has-admin-bar_&]:bottom-20 flex flex-col-reverse gap-3 rounded-[var(--radius-lg)] border border-line bg-paper-raised/95 p-3 shadow-[var(--shadow-lg)] backdrop-blur sm:flex-row sm:items-center sm:justify-end">
        <Button variant="ghost" onClick={() => router.push(cancelHref)}>
          Annuler
        </Button>
        <Button type="submit" size="lg" loading={loading} loadingLabel="Enregistrement…">
          {editing ? 'Enregistrer les modifications' : 'Publier mon témoignage'}
        </Button>
      </div>
    </form>
  )
}
