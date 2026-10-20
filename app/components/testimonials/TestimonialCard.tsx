import Link from 'next/link'
import { Heart, Star } from 'lucide-react'
import type { TestimonialWithAuthor } from '@/lib/data/testimonials'
import { TESTIMONIAL_TYPES_INFO } from '@/lib/testimonials'
import { Avatar } from '@/app/components/ui/Avatar'
import { Badge } from '@/app/components/ui/Badge'

export type TestimonialCardData = Pick<TestimonialWithAuthor, 'id' | 'slug' | 'title' | 'type' | 'excerpt' | 'rating' | 'likes' | 'tags' | 'publishedAt' | 'author'>

/** Carte de témoignage : citation en Fraunces, auteur, type */
export function TestimonialCard({ testimonial }: { testimonial: TestimonialCardData }) {
  const info = TESTIMONIAL_TYPES_INFO[testimonial.type]
  return (
    <Link
      href={`/temoignages/${testimonial.slug}`}
      className="group flex h-full flex-col rounded-[var(--radius-lg)] border border-line bg-paper-raised p-6 shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:border-blue/60 hover:shadow-[var(--shadow-md)]"
    >
      <div className="flex items-center justify-between gap-2">
        <Badge tone="blue">{info?.short ?? testimonial.type}</Badge>
        {testimonial.rating ? (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft" aria-label={`Note : ${testimonial.rating} sur 5`}>
            <Star className="size-4 fill-highlight text-warning" aria-hidden="true" />
            {testimonial.rating}/5
          </span>
        ) : null}
      </div>
      <h3 className="mt-4 text-xl leading-snug text-ink group-hover:text-blue">{testimonial.title}</h3>
      <p className="mt-2 line-clamp-3 text-ink-soft">
        <span aria-hidden="true" className="mr-0.5 font-display text-2xl leading-none text-red">
          «
        </span>
        {testimonial.excerpt}
      </p>
      {testimonial.tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Mots-clés">
          {testimonial.tags.slice(0, 4).map((tag) => (
            <li key={tag} className="text-xs font-semibold text-ink-muted">
              #{tag}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto flex items-center gap-3 border-t border-line pt-4">
        {testimonial.author && <Avatar firstName={testimonial.author.firstName} lastName={testimonial.author.lastName} image={testimonial.author.profileImage} seed={testimonial.author.id} size="sm" />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">
            {testimonial.author ? `${testimonial.author.firstName} ${testimonial.author.lastName}` : 'Ancien membre'}
          </p>
          <p className="text-xs text-ink-muted">{testimonial.author?.promotionYear ? `Promo ${testimonial.author.promotionYear}` : testimonial.publishedAt?.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
        </div>
        {testimonial.likes > 0 && (
          <span className="inline-flex items-center gap-1 text-sm text-ink-muted" aria-label={`${testimonial.likes} j'aime`}>
            <Heart className="size-4 text-red" aria-hidden="true" />
            {testimonial.likes}
          </span>
        )}
      </div>
    </Link>
  )
}
