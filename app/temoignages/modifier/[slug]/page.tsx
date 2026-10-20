import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { requireMemberPage } from '@/lib/auth/session'
import { getTestimonialBySlug } from '@/lib/data/testimonials'
import { PageHero } from '@/app/components/site/PageHero'
import { TestimonialForm } from '@/app/components/testimonials/TestimonialForm'

export const metadata: Metadata = { title: 'Modifier un témoignage' }

export default async function EditTestimonialPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const viewer = await requireMemberPage(`/temoignages/modifier/${slug}`)
  const testimonial = await getTestimonialBySlug(slug, viewer)
  if (!testimonial) notFound()
  if (testimonial.authorId !== viewer.id && viewer.role !== 'admin') redirect('/temoignages/mes-temoignages')
  return (
    <>
      <PageHero size="sm" eyebrow="Témoignages" title="Modifier le témoignage" lead={testimonial.title} />
      <div className="container-page py-10">
        <div className="mx-auto max-w-3xl">
          <TestimonialForm
            cancelHref="/temoignages/mes-temoignages"
            initial={{
              id: testimonial.id,
              title: testimonial.title,
              type: testimonial.type,
              excerpt: testimonial.excerpt,
              rating: testimonial.rating,
              tags: testimonial.tags,
              answers: testimonial.answers,
            }}
          />
        </div>
      </div>
    </>
  )
}
