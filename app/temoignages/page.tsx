import type { Metadata } from 'next'
import { PenLine, NotebookPen } from 'lucide-react'
import { requireMemberPage } from '@/lib/auth/session'
import { loadPageContent } from '@/lib/content/page'
import { listPublishedTestimonials } from '@/lib/data/testimonials'
import { createEditor } from '@/app/components/edit/editor'
import { EditableArea } from '@/app/components/edit/EditableArea'
import { ButtonLink } from '@/app/components/ui/Button'
import { EmptyState } from '@/app/components/ui/EmptyState'
import { PageHero } from '@/app/components/site/PageHero'
import { TestimonialBrowser } from '@/app/components/testimonials/TestimonialBrowser'

export const metadata: Metadata = {
  title: 'Témoignages',
  description: "Les retours d'expérience des anciens sur leurs études, parcours professionnels et vies à l'international",
}

export default async function TestimonialsPage() {
  await requireMemberPage('/temoignages')
  const [testimonials, page] = await Promise.all([listPublishedTestimonials(), loadPageContent('testimonials')])
  const e = createEditor('content:testimonials', page.data, page.editMode)
  return (
    <EditableArea docs={[page.doc]}>
      <PageHero
        size="sm"
        eyebrow="Ils racontent"
        title={e.text('title', { label: 'Titre' })}
        lead={e.text('lead', { as: 'p', label: 'Chapeau', multiline: true })}
        actions={
          <>
            <ButtonLink href="/temoignages/nouveau" icon={<PenLine className="size-4" aria-hidden="true" />}>
              Écrire un témoignage
            </ButtonLink>
            <ButtonLink href="/temoignages/mes-temoignages" variant="secondary" icon={<NotebookPen className="size-4" aria-hidden="true" />}>
              Mes témoignages
            </ButtonLink>
          </>
        }
      />
      <div className="container-page py-10 sm:py-14">
        {testimonials.length === 0 ? (
          <EmptyState title="Aucun témoignage pour l’instant" action={<ButtonLink href="/temoignages/nouveau">Écrire le premier</ButtonLink>}>
            Votre parcours peut aider un lycéen à choisir le sien.
          </EmptyState>
        ) : (
          <TestimonialBrowser testimonials={testimonials} />
        )}
      </div>
    </EditableArea>
  )
}
