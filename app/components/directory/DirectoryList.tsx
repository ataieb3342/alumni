'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin, Search, X } from 'lucide-react'
import { DirectoryCard, DirectoryGrid, type DirectoryCardUser } from './DirectoryCard'
import DirectorySearchBox, { type Suggestion } from './DirectorySearchBox'
import FilterMenu from './FilterMenu'
import SubjectCheckboxes from './SubjectCheckboxes'
import {
  collectOrganizations,
  indexMember,
  matchesTokens,
  matchPlace,
  matchQuery,
  normalize,
  suggestCities,
  tokenize,
  type CityScope,
  type IndexedMember,
  type MatchHint,
} from '@/lib/directorySearch'
import { getSubject, SUBJECTS } from '@/lib/subjects'
import { cn } from '@/lib/utils'
import { SubjectIcon } from '@/app/components/ui/icons'
import { buttonClasses } from '@/app/components/ui/Button'

interface DirectoryListProps {
  members: DirectoryCardUser[]
  currentUserId?: string
  /** Paramètres de l'URL, pour retrouver sa recherche en revenant d'un profil */
  initialParams?: Record<string, string | string[] | undefined>
}

type Sort = 'pertinence' | 'nom' | 'promo'

interface Filters {
  q: string
  city: string
  scope: CityScope
  type: string
  promo: string
  subjects: string[]
  sort: Sort
}

const PAGE_SIZE = 24

const TYPE_FILTERS = [
  { value: 'alumni', label: 'Anciens élèves' },
  { value: 'prepa', label: 'Prépa' },
  { value: 'bts', label: 'BTS' },
  { value: 'staff', label: 'Personnel' },
]

const SCOPE_OPTIONS: { value: CityScope; label: string; help: string }[] = [
  { value: 'any', label: 'Tout le parcours', help: 'Membres qui y ont vécu, étudié ou travaillé' },
  { value: 'current', label: 'Ville actuelle', help: 'Membres qui y vivent aujourd’hui' },
]

const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: 'pertinence', label: 'Pertinence' },
  { value: 'nom', label: 'Nom' },
  { value: 'promo', label: 'Promo la plus récente' },
]

function filtersFromParams(params: DirectoryListProps['initialParams'] = {}): Filters {
  const get = (key: string) => {
    const value = params[key]
    return (Array.isArray(value) ? value[0] : value) ?? ''
  }
  const getAll = (key: string) => {
    const value = params[key]
    return value === undefined ? [] : Array.isArray(value) ? value : [value]
  }
  const sort = get('tri')
  return {
    q: get('q'),
    city: get('ville'),
    scope: get('quand') === 'actuelle' ? 'current' : 'any',
    type: get('type'),
    promo: get('promo'),
    subjects: getAll('matiere').filter((value) => getSubject(value)),
    sort: sort === 'nom' || sort === 'promo' ? sort : 'pertinence',
  }
}

function filtersToSearch(filters: Filters): string {
  const params = new URLSearchParams()
  if (filters.q.trim()) params.set('q', filters.q.trim())
  if (filters.city.trim()) params.set('ville', filters.city.trim())
  if (filters.scope === 'current') params.set('quand', 'actuelle')
  if (filters.type) params.set('type', filters.type)
  if (filters.promo) params.set('promo', filters.promo)
  for (const subject of filters.subjects) params.append('matiere', subject)
  if (filters.sort !== 'pertinence') params.set('tri', filters.sort)
  const search = params.toString()
  return search ? `?${search}` : ''
}

/** « a », « a et b », « a, b et c » */
function joinFrench(items: string[]): string {
  return items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} et ${items.at(-1)}`
}

function plural(count: number, word: string) {
  return `${count} ${word}${count > 1 ? 's' : ''}`
}

export default function DirectoryList({ members, currentUserId, initialParams }: DirectoryListProps) {
  const router = useRouter()
  const [filters, setFilters] = useState<Filters>(() => filtersFromParams(initialParams))
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const update = (patch: Partial<Filters>) => setFilters((prev) => ({ ...prev, ...patch }))
  const reset = () => setFilters((prev) => ({ ...filtersFromParams(), sort: prev.sort }))

  // Retour à la première « page » quand les filtres changent. Ajustement
  // pendant le rendu plutôt que dans un effet : évite un rendu intermédiaire.
  // https://react.dev/learn/you-might-not-need-an-effect
  const filtersKey = JSON.stringify(filters)
  const [prevFiltersKey, setPrevFiltersKey] = useState(filtersKey)
  if (prevFiltersKey !== filtersKey) {
    setPrevFiltersKey(filtersKey)
    setVisibleCount(PAGE_SIZE)
  }

  // Filtres dans l'URL : on retrouve sa recherche après avoir ouvert un
  // profil, et on peut partager un lien « anciens passés par Brest ».
  // Différé pour ne pas réécrire l'historique à chaque frappe.
  useEffect(() => {
    const timeout = setTimeout(() => {
      const search = filtersToSearch(filters)
      if (search !== window.location.search) {
        window.history.replaceState(null, '', `${window.location.pathname}${search}`)
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [filters])

  const indexed = useMemo(() => members.map(indexMember), [members])

  const results = useMemo(() => {
    const queryTokens = tokenize(filters.q)
    const cityTokens = tokenize(filters.city)
    const found: {
      entry: IndexedMember<DirectoryCardUser>
      score: number
      subjectMatches: number
      hints: MatchHint[]
    }[] = []

    for (const entry of indexed) {
      const { member } = entry
      if (filters.type && member.userType !== filters.type) continue
      if (filters.promo && String(member.promotionYear ?? '') !== filters.promo) continue

      // Au moins une matière cochée ; ceux qui les cumulent passent devant
      const subjectMatches = filters.subjects.filter((subject) => member.subjects?.includes(subject)).length
      if (filters.subjects.length > 0 && subjectMatches === 0) continue

      const hints: MatchHint[] = []
      let score = 0

      if (cityTokens.length > 0) {
        const place = matchPlace(entry, cityTokens, filters.scope)
        if (!place) continue
        hints.push(...place.hints)
      }

      if (queryTokens.length > 0) {
        const match = matchQuery(entry, queryTokens)
        if (!match) continue
        score = match.score
        if (match.hint && !hints.some((hint) => hint.label === match.hint!.label)) hints.push(match.hint)
      }

      found.push({ entry, score, subjectMatches, hints })
    }

    // Tri stable : à égalité, l'ordre alphabétique de la requête est conservé
    if (filters.sort === 'promo') {
      found.sort((a, b) => (b.entry.member.promotionYear ?? 0) - (a.entry.member.promotionYear ?? 0))
    } else if (filters.sort === 'pertinence') {
      // Matières en commun, puis pertinence du texte, puis profils remplis avant les vides
      const filled = (entry: IndexedMember) =>
        Number(!!(entry.summary.headline || entry.summary.city || entry.member.subjects?.length))
      found.sort(
        (a, b) =>
          b.subjectMatches - a.subjectMatches || b.score - a.score || filled(b.entry) - filled(a.entry)
      )
    }
    return found
  }, [indexed, filters])

  // Proposer d'élargir « Ville actuelle » à tout le parcours quand ça rapporte plus
  const widerCount = useMemo(() => {
    const cityTokens = tokenize(filters.city)
    if (filters.scope !== 'current' || cityTokens.length === 0) return 0
    return indexed.filter((entry) => matchPlace(entry, cityTokens, 'any')).length
  }, [indexed, filters.city, filters.scope])

  const cities = useMemo(() => suggestCities(indexed, filters.scope), [indexed, filters.scope])
  const citiesAnyScope = useMemo(() => suggestCities(indexed, 'any'), [indexed])
  const organizations = useMemo(() => collectOrganizations(indexed), [indexed])

  // « brest » tapé à la main s'affiche « Brest » quand la ville est connue
  const cityLabel =
    citiesAnyScope.find((city) => normalize(city.name) === normalize(filters.city))?.name ?? filters.city.trim()

  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const member of members) counts.set(member.userType, (counts.get(member.userType) ?? 0) + 1)
    return counts
  }, [members])

  const promoOptions = useMemo(() => {
    const counts = new Map<number, number>()
    for (const member of members) {
      if (member.promotionYear) counts.set(member.promotionYear, (counts.get(member.promotionYear) ?? 0) + 1)
    }
    return [...counts.entries()].sort(([a], [b]) => b - a)
  }, [members])

  const subjectCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const member of members) {
      for (const subject of member.subjects ?? []) counts.set(subject, (counts.get(subject) ?? 0) + 1)
    }
    return counts
  }, [members])

  // Suggestions de la barre : matières, villes, écoles, puis personnes
  const suggestions = useMemo((): Suggestion[] => {
    const tokens = tokenize(filters.q)
    if (tokens.length === 0) return []
    return [
      ...SUBJECTS.filter(
        (subject) =>
          !filters.subjects.includes(subject.value) &&
          subjectCounts.get(subject.value) &&
          matchesTokens(`${subject.label} ${subject.short} ${subject.keywords}`, tokens)
      )
        .slice(0, 3)
        .map((subject) => ({ kind: 'subject' as const, value: subject.value, count: subjectCounts.get(subject.value)! })),
      ...citiesAnyScope
        .filter((city) => matchesTokens(city.name, tokens))
        .slice(0, 3)
        .map((city) => ({ kind: 'city' as const, ...city })),
      ...organizations
        .filter((organization) => matchesTokens(organization.name, tokens))
        .slice(0, 3)
        .map((organization) => ({ kind: 'organization' as const, ...organization })),
      ...indexed
        .filter((entry) => matchesTokens(`${entry.member.firstName} ${entry.member.lastName}`, tokens))
        .slice(0, 4)
        .map((entry) => ({
          kind: 'member' as const,
          id: entry.member.id,
          name: `${entry.member.firstName} ${entry.member.lastName}`,
          detail: [
            entry.member.promotionYear && `Promo ${entry.member.promotionYear}`,
            entry.summary.headline,
          ].filter(Boolean).join(' · '),
        })),
    ]
  }, [filters.q, filters.subjects, subjectCounts, citiesAnyScope, organizations, indexed])

  const onSuggestion = (suggestion: Suggestion) => {
    switch (suggestion.kind) {
      case 'subject':
        update({ q: '', subjects: [...filters.subjects, suggestion.value] })
        break
      case 'city':
        update({ q: '', city: suggestion.name, scope: 'any' })
        break
      case 'organization':
        update({ q: suggestion.name })
        break
      case 'member':
        router.push(`/annuaire/${suggestion.id}`)
        break
    }
  }

  // Ce qu'il manque au profil du visiteur pour qu'on le trouve
  const me = currentUserId ? indexed.find((entry) => entry.member.id === currentUserId) : undefined
  const missing = me
    ? [
        !me.summary.city && 'votre ville actuelle',
        !me.member.subjects?.length && 'vos matières',
        !me.summary.headline && 'votre poste ou vos études',
        me.member.userType !== 'staff' && !me.member.promotionYear && 'votre promo',
      ].filter((item): item is string => !!item)
    : []

  const hasFilters = filtersToSearch({ ...filters, scope: 'any', sort: 'pertinence' }) !== ''
  const visible = results.slice(0, visibleCount)
  const hints = Object.fromEntries(results.map(({ entry, hints }) => [entry.member.id, hints]))
  const cityScope = SCOPE_OPTIONS.find((option) => option.value === filters.scope)!
  const cityTokens = tokenize(filters.city)

  // Filtres actifs, retirables d'un clic
  const activeChips: { key: string; label: string; remove: () => void }[] = [
    ...(filters.q.trim() ? [{ key: 'q', label: `« ${filters.q.trim()} »`, remove: () => update({ q: '' }) }] : []),
    ...(filters.city.trim()
      ? [{
          key: 'city',
          label: `${filters.scope === 'current' ? 'Vit à' : 'Passé par'} ${cityLabel}`,
          remove: () => update({ city: '' }),
        }]
      : []),
    ...filters.subjects.map((value) => {
      const subject = getSubject(value)!
      return {
        key: value,
        label: subject.short,
        remove: () => update({ subjects: filters.subjects.filter((s) => s !== value) }),
      }
    }),
    ...(filters.promo ? [{ key: 'promo', label: `Promo ${filters.promo}`, remove: () => update({ promo: '' }) }] : []),
    ...(filters.type
      ? [{ key: 'type', label: TYPE_FILTERS.find((t) => t.value === filters.type)?.label ?? filters.type, remove: () => update({ type: '' }) }]
      : []),
  ]

  return (
    <div className="space-y-10">
      {/* Recherche et filtres */}
      <div className="rounded-[var(--radius-lg)] border border-line bg-paper-raised p-3 shadow-[var(--shadow-md)] sm:p-4">
        <DirectorySearchBox value={filters.q} onChange={(q) => update({ q })} suggestions={suggestions} onSelect={onSuggestion} />

        <div className="scrollbar-none -mx-3 mt-3 flex items-center gap-2 overflow-x-auto px-3 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <FilterMenu
            title="Ville"
            active={!!filters.city.trim()}
            resultCount={results.length}
            label={
              <>
                <MapPin className="size-4" aria-hidden="true" />
                {filters.city.trim() ? cityLabel : 'Ville'}
              </>
            }
          >
            {(close) => (
              <div className="space-y-3">
                <div className="flex rounded-[var(--radius-sm)] bg-paper-sunken p-1 text-sm" role="group" aria-label="Portée de la ville">
                  {SCOPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={filters.scope === option.value}
                      onClick={() => update({ scope: option.value })}
                      className={cn(
                        'flex-1 rounded-[6px] px-3 py-1.5 font-semibold transition',
                        filters.scope === option.value ? 'bg-paper-raised text-blue shadow-sm' : 'text-ink-soft hover:text-ink'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="px-1 text-xs text-ink-muted">{cityScope.help}</p>
                <div className="relative">
                  <label htmlFor="directory-city" className="sr-only">
                    Ville
                  </label>
                  <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
                  <input
                    id="directory-city"
                    type="text"
                    value={filters.city}
                    onChange={(event) => update({ city: event.target.value })}
                    placeholder="Lyon, Brest, Montréal…"
                    autoComplete="off"
                    className="h-11 w-full rounded-[var(--radius-sm)] border border-line-strong/60 bg-paper pr-9 pl-9 text-ink outline-none placeholder:text-ink-muted focus:border-blue"
                  />
                  {filters.city && (
                    <button
                      type="button"
                      onClick={() => update({ city: '' })}
                      aria-label="Effacer la ville"
                      className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-ink-muted hover:text-ink"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
                <ul className="-mx-1">
                  {cities
                    .filter((city) => cityTokens.length === 0 || matchesTokens(city.name, cityTokens))
                    .slice(0, 8)
                    .map((city) => (
                      <li key={city.name}>
                        <button
                          type="button"
                          onClick={() => {
                            update({ city: city.name })
                            close()
                          }}
                          className="flex w-full items-center justify-between rounded-[var(--radius-sm)] px-3 py-2 text-sm text-ink hover:bg-paper-sunken"
                        >
                          {city.name}
                          <span className="text-xs text-ink-muted">{city.count}</span>
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </FilterMenu>

          {subjectCounts.size > 0 && (
            <FilterMenu
              title="Matières"
              active={filters.subjects.length > 0}
              resultCount={results.length}
              label={filters.subjects.length > 0 ? `Matières · ${filters.subjects.length}` : 'Matières'}
            >
              {() => (
                <div className="space-y-3">
                  <p className="text-sm text-ink-soft">Cochez celles qui vous plaisent : les profils qui en cumulent le plus apparaissent en premier.</p>
                  <SubjectCheckboxes
                    legend="Filtrer par matière"
                    selected={filters.subjects}
                    onChange={(subjects) => update({ subjects })}
                    counts={subjectCounts}
                    compact
                    className="grid grid-cols-2 gap-2 [&>label]:rounded-[var(--radius-sm)] [&>label]:py-2"
                  />
                </div>
              )}
            </FilterMenu>
          )}

          {filters.type !== 'staff' && promoOptions.length > 0 && (
            <FilterMenu title="Promotion" active={!!filters.promo} resultCount={results.length} label={filters.promo ? `Promo ${filters.promo}` : 'Promo'}>
              {(close) => (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      update({ promo: '' })
                      close()
                    }}
                    className={cn(
                      'col-span-3 rounded-[var(--radius-sm)] border px-3 py-2 text-sm font-semibold',
                      !filters.promo ? 'border-blue bg-blue-soft text-blue' : 'border-line text-ink-soft hover:border-ink'
                    )}
                  >
                    Toutes les promos
                  </button>
                  {promoOptions.map(([year, count]) => (
                    <button
                      key={year}
                      type="button"
                      aria-pressed={filters.promo === String(year)}
                      onClick={() => {
                        update({ promo: String(year) })
                        close()
                      }}
                      className={cn(
                        'rounded-[var(--radius-sm)] border px-2 py-2 text-sm font-semibold',
                        filters.promo === String(year) ? 'border-blue bg-blue-soft text-blue' : 'border-line text-ink-soft hover:border-ink'
                      )}
                    >
                      {year} <span className="text-xs text-ink-muted">{count}</span>
                    </button>
                  ))}
                </div>
              )}
            </FilterMenu>
          )}

          <FilterMenu title="Profil" active={!!filters.type} resultCount={results.length} label={TYPE_FILTERS.find((type) => type.value === filters.type)?.label ?? 'Profil'}>
            {(close) => (
              <ul className="-mx-1">
                {[{ value: '', label: 'Tous les membres' }, ...TYPE_FILTERS.filter((type) => typeCounts.get(type.value))].map((type) => (
                  <li key={type.value || 'all'}>
                    <button
                      type="button"
                      aria-pressed={filters.type === type.value}
                      onClick={() => {
                        update({ type: type.value, promo: type.value === 'staff' ? '' : filters.promo })
                        close()
                      }}
                      className={cn(
                        'flex w-full items-center justify-between rounded-[var(--radius-sm)] px-3 py-2.5 text-sm',
                        filters.type === type.value ? 'bg-blue-soft font-semibold text-blue' : 'text-ink hover:bg-paper-sunken'
                      )}
                    >
                      {type.label}
                      <span className="text-xs text-ink-muted">{type.value ? typeCounts.get(type.value) : members.length}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </FilterMenu>
        </div>

        {activeChips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={chip.remove}
                aria-label={`Retirer le filtre ${chip.label}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink py-1 pr-2 pl-3 text-sm font-semibold text-paper transition-colors hover:bg-ink-soft"
              >
                {chip.label}
                <X className="size-3.5" aria-hidden="true" />
              </button>
            ))}
            <button type="button" onClick={reset} className="ml-1 text-sm font-semibold text-ink-muted hover:text-ink">
              Tout effacer
            </button>
          </div>
        )}
      </div>

      {/* Invitation à compléter son profil */}
      {missing.length > 0 && (
        <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-dashed border-red/50 bg-red-soft/50 p-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm text-ink">
            <span className="font-bold">Aidez les autres à vous trouver :</span> ajoutez {joinFrench(missing)} à votre profil.
          </p>
          <Link href="/profil" className={buttonClasses('primary', 'sm', 'shrink-0')}>
            Compléter mon profil
          </Link>
        </div>
      )}

      {/* Découverte, tant qu'aucune recherche n'est lancée */}
      {!hasFilters && subjectCounts.size > 0 && (
        <section aria-labelledby="explorer-matieres" className="space-y-5">
          <div>
            <h2 id="explorer-matieres" className="text-2xl text-ink">
              Explorer par matière
            </h2>
            <p className="text-ink-soft">Choisissez une matière qui vous plaît pour découvrir où elle a mené les anciens.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {SUBJECTS.filter((subject) => subjectCounts.get(subject.value)).map((subject) => (
              <button
                key={subject.value}
                type="button"
                onClick={() => update({ subjects: [subject.value] })}
                className="group flex items-center gap-3 rounded-[var(--radius-md)] border border-line bg-paper-raised p-3 text-left transition hover:-translate-y-0.5 hover:border-blue/60 hover:shadow-[var(--shadow-md)] sm:p-4"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-blue-soft text-blue transition-colors group-hover:bg-blue group-hover:text-on-blue" aria-hidden="true">
                  <SubjectIcon value={subject.value} className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block leading-snug font-bold text-ink">{subject.short}</span>
                  <span className="block text-xs text-ink-muted">{plural(subjectCounts.get(subject.value)!, 'profil')}</span>
                </span>
              </button>
            ))}
          </div>

          {citiesAnyScope.length > 0 && (
            <div className="scrollbar-none -mx-4 flex items-center gap-2 overflow-x-auto px-4 pt-2 sm:mx-0 sm:flex-wrap sm:px-0">
              <span className="shrink-0 font-display text-lg text-ink">Où sont-ils passés ?</span>
              {citiesAnyScope.slice(0, 10).map((city) => (
                <button
                  key={city.name}
                  type="button"
                  onClick={() => update({ city: city.name, scope: 'any' })}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-paper-raised px-3 py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:border-red/60 hover:text-ink"
                >
                  <MapPin className="size-3.5 text-red" aria-hidden="true" />
                  {city.name}
                  <span className="text-xs text-ink-muted">{city.count}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Résultats */}
      <section aria-labelledby="directory-results" className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 id="directory-results" className="text-2xl text-ink" aria-live="polite">
              {hasFilters ? plural(results.length, 'membre') : 'Tous les membres'}
              {!hasFilters && <span className="ml-2 font-sans text-base font-semibold text-ink-muted">{members.length}</span>}
            </h2>
            {filters.subjects.length > 1 && filters.sort === 'pertinence' && (
              <p className="text-xs text-ink-muted">Ceux qui cochent le plus de ces matières apparaissent en premier</p>
            )}
          </div>
          <div className="shrink-0">
            <label htmlFor="directory-sort" className="sr-only">
              Trier par
            </label>
            <select
              id="directory-sort"
              value={filters.sort}
              onChange={(event) => update({ sort: event.target.value as Sort })}
              className="h-10 rounded-[var(--radius-sm)] border border-line-strong/50 bg-paper-raised pr-8 pl-3 text-sm text-ink outline-none focus:border-blue"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.value === 'pertinence' ? 'Trier : pertinence' : `Trier : ${option.label.toLowerCase()}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {widerCount > results.length && (
          <button
            type="button"
            onClick={() => update({ scope: 'any' })}
            className="w-full rounded-[var(--radius-md)] border border-dashed border-line-strong/60 p-3 text-left text-sm text-ink-soft transition hover:border-blue hover:bg-paper-raised"
          >
            Peu de membres ont indiqué leur ville actuelle.{' '}
            <span className="font-bold text-blue">
              {widerCount > 1 ? `Voir les ${widerCount} membres passés` : 'Voir le membre passé'} par {cityLabel} →
            </span>
          </button>
        )}

        {results.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-line-strong/50 bg-paper-raised p-10 text-center">
            <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-paper-sunken">
              <Search className="size-6 text-ink-muted" aria-hidden="true" />
            </div>
            <h3 className="text-xl text-ink">Aucun membre ne correspond</h3>
            <p className="mx-auto mt-1 max-w-md text-ink-soft">
              {filters.city
                ? 'Essayez une ville voisine, ou cherchez plutôt une école ou une entreprise de la région.'
                : 'Essayez un autre mot : une école, une entreprise, un métier ou une promo.'}
            </p>
            <button type="button" onClick={reset} className={buttonClasses('secondary', 'md', 'mt-5')}>
              Tout effacer
            </button>
          </div>
        ) : (
          <>
            <DirectoryGrid>
              {visible.map(({ entry }) => (
                <li key={entry.member.id}>
                  <DirectoryCard
                    user={entry.member}
                    isMe={entry.member.id === currentUserId}
                    hints={hints[entry.member.id]}
                    highlightSubjects={filters.subjects}
                  />
                </li>
              ))}
            </DirectoryGrid>

            {results.length > visibleCount && (
              <div className="flex justify-center pt-2">
                <button type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)} className={buttonClasses('secondary', 'lg')}>
                  Afficher plus ({plural(results.length - visibleCount, 'restant')})
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
