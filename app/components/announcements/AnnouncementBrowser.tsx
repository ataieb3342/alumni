'use client'

import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { normalize } from '@/lib/directorySearch'
import { cn, plural } from '@/lib/utils'
import { Button } from '@/app/components/ui/Button'
import { EmptyState } from '@/app/components/ui/EmptyState'
import { AnnouncementCard, type AnnouncementCardData } from './AnnouncementCard'
import { ANNOUNCEMENT_TYPES_META } from './meta'

/** Recherche (titre, entreprise, lieu, auteur) et filtre par type, plus récentes d'abord */
export function AnnouncementBrowser({ announcements }: { announcements: AnnouncementCardData[] }) {
  const [type, setType] = useState('')
  const [query, setQuery] = useState('')
  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const a of announcements) map.set(a.type, (map.get(a.type) ?? 0) + 1)
    return map
  }, [announcements])
  const results = useMemo(() => {
    const q = normalize(query)
    return announcements.filter((a) => {
      if (type && a.type !== type) return false
      if (!q) return true
      const haystack = normalize([a.title, a.company, a.location, a.author ? `${a.author.firstName} ${a.author.lastName}` : ''].filter(Boolean).join(' '))
      return q.split(' ').every((token) => haystack.includes(token))
    })
  }, [announcements, type, query])

  return (
    <div className="space-y-8">
      <div className="rounded-[var(--radius-lg)] border border-line bg-paper-raised p-3 shadow-[var(--shadow-md)] sm:p-4">
        <div className="relative">
          <label htmlFor="announcement-search" className="sr-only">
            Rechercher une annonce
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-blue" aria-hidden="true" />
          <input
            id="announcement-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Titre, entreprise, ville, auteur…"
            className="h-12 w-full rounded-[var(--radius-md)] border-2 border-line-strong/40 bg-paper-raised pr-11 pl-12 text-ink outline-none placeholder:text-ink-muted focus:border-blue [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Effacer la recherche" className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1.5 text-ink-muted hover:bg-paper-sunken">
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <div role="group" aria-label="Type d'annonce" className="scrollbar-none -mx-3 mt-3 flex gap-2 overflow-x-auto px-3 sm:mx-0 sm:flex-wrap sm:px-0">
          {[
            { value: '', label: 'Toutes', count: announcements.length },
            ...Object.entries(ANNOUNCEMENT_TYPES_META)
              .filter(([value]) => counts.get(value))
              .map(([value, meta]) => ({ value, label: meta.plural, count: counts.get(value) ?? 0 })),
          ].map((option) => (
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
        {plural(results.length, 'annonce')}
      </p>
      {results.length === 0 ? (
        <EmptyState
          icon={<Search className="size-6" aria-hidden="true" />}
          title="Aucune annonce trouvée"
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
          Essayez de modifier vos critères de recherche ou de filtres.
        </EmptyState>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {results.map((announcement) => (
            <li key={announcement.id}>
              <AnnouncementCard announcement={announcement} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
