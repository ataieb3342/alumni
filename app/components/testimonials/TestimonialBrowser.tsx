'use client'

import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { normalize } from '@/lib/directorySearch'
import { TESTIMONIAL_TYPES_INFO } from '@/lib/testimonials'
import { cn, plural } from '@/lib/utils'
import { EmptyState } from '@/app/components/ui/EmptyState'
import { Button } from '@/app/components/ui/Button'
import { TestimonialCard, type TestimonialCardData } from './TestimonialCard'

/** Recherche (titre, résumé, mots-clés, auteur) et filtre par type */
export function TestimonialBrowser({ testimonials }: { testimonials: TestimonialCardData[] }) {
  const [type, setType] = useState('')
  const [query, setQuery] = useState('')
  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of testimonials) map.set(t.type, (map.get(t.type) ?? 0) + 1)
    return map
  }, [testimonials])

  const results = useMemo(() => {
    const q = normalize(query)
    return testimonials.filter((t) => {
      if (type && t.type !== type) return false
      if (!q) return true
      const haystack = normalize([t.title, t.excerpt, t.tags.join(' '), t.author ? `${t.author.firstName} ${t.author.lastName}` : ''].join(' '))
      return q.split(' ').every((token) => haystack.includes(token))
    })
  }, [testimonials, type, query])

  return (
    <div className="space-y-8">
      <div className="rounded-[var(--radius-lg)] border border-line bg-paper-raised p-3 shadow-[var(--shadow-md)] sm:p-4">
        <div className="relative">
          <label htmlFor="testimonial-search" className="sr-only">
            Rechercher un témoignage
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-blue" aria-hidden="true" />
          <input
            id="testimonial-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Titre, auteur, mot-clé (#prépa, #erasmus)…"
            className="h-12 w-full rounded-[var(--radius-md)] border-2 border-line-strong/40 bg-paper-raised pr-11 pl-12 text-ink outline-none placeholder:text-ink-muted focus:border-blue [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Effacer la recherche" className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1.5 text-ink-muted hover:bg-paper-sunken">
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <div role="group" aria-label="Type de témoignage" className="scrollbar-none -mx-3 mt-3 flex gap-2 overflow-x-auto px-3 sm:mx-0 sm:flex-wrap sm:px-0">
          {[{ value: '', label: 'Tous', count: testimonials.length }, ...Object.entries(TESTIMONIAL_TYPES_INFO).filter(([value]) => counts.get(value)).map(([value, info]) => ({ value, label: info.label, count: counts.get(value) ?? 0 }))].map((option) => (
            <button
              key={option.value || 'all'}
              type="button"
              aria-pressed={type === option.value}
              onClick={() => setType(option.value)}
              className={cn(
                'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors',
                type === option.value ? 'border-blue bg-blue text-on-blue' : 'border-line bg-paper-raised text-ink-soft hover:border-ink'
              )}
            >
              {option.label}
              <span className={cn('text-xs', type === option.value ? 'opacity-80' : 'text-ink-muted')}>{option.count}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {plural(results.length, 'témoignage')}
      </p>
      {results.length === 0 ? (
        <EmptyState
          icon={<Search className="size-6" aria-hidden="true" />}
          title="Aucun témoignage trouvé"
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setType('')
                setQuery('')
              }}
            >
              Réinitialiser les filtres
            </Button>
          }
        >
          Essayez un autre mot ou un autre type de témoignage.
        </EmptyState>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {results.map((testimonial) => (
            <li key={testimonial.id}>
              <TestimonialCard testimonial={testimonial} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
