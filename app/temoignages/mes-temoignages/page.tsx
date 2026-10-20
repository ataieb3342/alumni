import type { Metadata } from 'next'
import { PenLine } from 'lucide-react'
import { requireMemberPage } from '@/lib/auth/session'
import { listTestimonialsByAuthor } from '@/lib/data/testimonials'
import { TESTIMONIAL_TYPES_INFO } from '@/lib/testimonials'
import { Badge } from '@/app/components/ui/Badge'
import { ButtonLink } from '@/app/components/ui/Button'
import { EmptyState } from '@/app/components/ui/EmptyState'
import { PageHero } from '@/app/components/site/PageHero'
import { ItemActions } from '@/app/components/content/ItemActions'

export const metadata: Metadata = { title: 'Mes témoignages' }

const STATUS = { published: { label: 'Publié', tone: 'green' }, draft: { label: 'Brouillon', tone: 'amber' }, archived: { label: 'Archivé', tone: 'neutral' } } as const

export default async function MyTestimonialsPage() {
  const user = await requireMemberPage('/temoignages/mes-temoignages')
  const testimonials = await listTestimonialsByAuthor(user.id)
  return (
    <>
      <PageHero
        size="sm"
        eyebrow="Témoignages"
        title="Mes témoignages"
        actions={
          <ButtonLink href="/temoignages/nouveau" icon={<PenLine className="size-4" aria-hidden="true" />}>
            Nouveau témoignage
          </ButtonLink>
        }
      />
      <div className="container-page py-10">
        <div className="mx-auto max-w-4xl">
          {testimonials.length === 0 ? (
            <EmptyState title="Aucun témoignage" action={<ButtonLink href="/temoignages/nouveau">Écrire mon premier témoignage</ButtonLink>}>
              Racontez une étape de votre parcours : une école, un stage, une expatriation…
            </EmptyState>
          ) : (
            <ul className="space-y-4">
              {testimonials.map((testimonial) => (
                <li key={testimonial.id} className="rounded-[var(--radius-lg)] border border-line bg-paper-raised p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="blue">{TESTIMONIAL_TYPES_INFO[testimonial.type].short}</Badge>
                    <Badge tone={STATUS[testimonial.status].tone}>{STATUS[testimonial.status].label}</Badge>
                    {testimonial.publishedAt && <span className="text-sm text-ink-muted">Publié le {testimonial.publishedAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
                  </div>
                  <h2 className="mt-2 text-xl text-ink">{testimonial.title}</h2>
                  <div className="mt-4">
                    <ItemActions
                      compact
                      endpoint={`/api/testimonials/${testimonial.id}`}
                      viewHref={`/temoignages/${testimonial.slug}`}
                      editHref={`/temoignages/modifier/${testimonial.slug}`}
                      title={testimonial.title}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
