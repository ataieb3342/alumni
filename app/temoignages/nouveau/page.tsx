import type { Metadata } from 'next'
import { requireMemberPage } from '@/lib/auth/session'
import { PageHero } from '@/app/components/site/PageHero'
import { TestimonialForm } from '@/app/components/testimonials/TestimonialForm'

export const metadata: Metadata = { title: 'Écrire un témoignage' }

export default async function NewTestimonialPage() {
  await requireMemberPage('/temoignages/nouveau')
  return (
    <>
      <PageHero size="sm" eyebrow="Témoignages" title="Partagez votre expérience" lead="Votre parcours peut aider un lycéen à choisir le sien. Quelques réponses suffisent." />
      <div className="container-page py-10">
        <div className="mx-auto max-w-3xl">
          <TestimonialForm cancelHref="/temoignages" />
        </div>
      </div>
    </>
  )
}
