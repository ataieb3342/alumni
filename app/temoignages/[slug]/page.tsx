import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Heart, PenLine, Star } from 'lucide-react'
import { requireMemberPage } from '@/lib/auth/session'
import { getTestimonialBySlug } from '@/lib/data/testimonials'
import { TESTIMONIAL_TYPES_INFO } from '@/lib/testimonials'
import { formatLinkedInUrl, USER_TYPE_LABELS } from '@/lib/utils'
import { Avatar } from '@/app/components/ui/Avatar'
import { Badge } from '@/app/components/ui/Badge'
import { ButtonLink } from '@/app/components/ui/Button'
import { Picture } from '@/app/components/ui/Picture'
import { Alert } from '@/app/components/ui/Alert'
import { ItemActions } from '@/app/components/content/ItemActions'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const testimonial = await getTestimonialBySlug((await params).slug)
  return { title: testimonial?.title ?? 'Témoignage', description: testimonial?.excerpt }
}

export default async function TestimonialPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const viewer = await requireMemberPage(`/temoignages/${slug}`)
  const testimonial = await getTestimonialBySlug(slug, viewer)
  if (!testimonial) notFound()
  const info = TESTIMONIAL_TYPES_INFO[testimonial.type]
  const facts = info.questions.filter((q) => q.fact && testimonial.answers[q.key])
  const answers = info.questions.filter((q) => !q.fact && testimonial.answers[q.key])
  const canEdit = viewer.id === testimonial.authorId || viewer.role === 'admin'

  return (
    <article>
      {testimonial.featuredImage && (
        <div className="relative h-56 sm:h-80">
          <Picture image={testimonial.featuredImage} alt="" sizes="100vw" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-paper to-transparent" aria-hidden="true" />
        </div>
      )}
      <div className="container-page py-10 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <Link href="/temoignages" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-blue">
            <ArrowLeft className="size-4" aria-hidden="true" /> Tous les témoignages
          </Link>
          {testimonial.status !== 'published' && (
            <Alert tone="warning" className="mt-4">
              Ce témoignage est {testimonial.status === 'draft' ? 'en brouillon' : 'archivé'} : seuls son auteur et les administrateurs le voient.
            </Alert>
          )}
          <header className="mt-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="blue">{info.label}</Badge>
              {testimonial.publishedAt && (
                <time dateTime={testimonial.publishedAt.toISOString()} className="text-sm text-ink-muted">
                  {testimonial.publishedAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </time>
              )}
            </div>
            <h1 className="mt-4 font-display-tight text-[clamp(2rem,5vw,3.25rem)] leading-[1.05] text-ink">{testimonial.title}</h1>
            <p className="mt-5 border-l-4 border-red pl-5 font-display text-xl text-ink-soft italic sm:text-2xl">{testimonial.excerpt}</p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              {testimonial.rating && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-highlight-soft px-3 py-1 font-semibold text-ink">
                  <Star className="size-4 fill-highlight text-warning" aria-hidden="true" /> {testimonial.rating}/5
                </span>
              )}
              {testimonial.likes > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-soft px-3 py-1 font-semibold text-ink">
                  <Heart className="size-4 text-red" aria-hidden="true" /> {testimonial.likes}
                </span>
              )}
              {testimonial.tags.map((tag) => (
                <span key={tag} className="text-sm font-semibold text-ink-muted">
                  #{tag}
                </span>
              ))}
            </div>
            {testimonial.author && (
              <div className="mt-8 flex items-center gap-4 rounded-[var(--radius-lg)] border border-line bg-paper-raised p-4">
                <Avatar firstName={testimonial.author.firstName} lastName={testimonial.author.lastName} image={testimonial.author.profileImage} seed={testimonial.author.id} />
                <div className="min-w-0 flex-1">
                  <Link href={`/annuaire/${testimonial.author.id}`} className="font-bold text-ink hover:text-blue">
                    {testimonial.author.firstName} {testimonial.author.lastName}
                  </Link>
                  <p className="text-sm text-ink-muted">
                    {USER_TYPE_LABELS[testimonial.author.userType] ?? 'Membre'}
                    {testimonial.author.promotionYear ? ` · Promo ${testimonial.author.promotionYear}` : ''}
                  </p>
                </div>
                {testimonial.author.linkedIn && (
                  <a href={formatLinkedInUrl(testimonial.author.linkedIn)} target="_blank" rel="noopener noreferrer" className="link-ink text-sm font-semibold">
                    LinkedIn <span className="sr-only">(nouvel onglet)</span>
                  </a>
                )}
              </div>
            )}
          </header>

          {facts.length > 0 && (
            <dl className="mt-10 grid gap-4 rounded-[var(--radius-lg)] bg-paper-sunken p-6 sm:grid-cols-2">
              {facts.map((question) => (
                <div key={question.key}>
                  <dt className="text-sm font-semibold text-ink-muted">{question.label}</dt>
                  <dd className="font-bold text-ink">{testimonial.answers[question.key]}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-10 space-y-10">
            {answers.map((question) => (
              <section key={question.key}>
                <h2 className="text-2xl text-ink">{question.heading ?? question.label}</h2>
                <p className="mt-3 text-lg leading-relaxed whitespace-pre-line text-ink-soft">{testimonial.answers[question.key]}</p>
              </section>
            ))}
          </div>

          {testimonial.author?.bio && (
            <aside className="mt-12 rounded-[var(--radius-lg)] border border-line bg-paper-raised p-6">
              <h2 className="text-xl text-ink">À propos de l’auteur</h2>
              <p className="mt-2 whitespace-pre-line text-ink-soft">{testimonial.author.bio}</p>
            </aside>
          )}

          <footer className="mt-12 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
            {canEdit ? (
              <ItemActions
                endpoint={`/api/testimonials/${testimonial.id}`}
                editHref={`/temoignages/modifier/${testimonial.slug}`}
                title={testimonial.title}
                status={testimonial.status}
                canModerate={viewer.role === 'admin'}
                afterDelete="/temoignages"
              />
            ) : (
              <Link href="/temoignages" className="link-ink font-semibold">
                Retour aux témoignages
              </Link>
            )}
            <ButtonLink href="/temoignages/nouveau" icon={<PenLine className="size-4" aria-hidden="true" />}>
              Partager mon expérience
            </ButtonLink>
          </footer>
        </div>
      </div>
    </article>
  )
}
