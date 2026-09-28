'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { MapPin, Search, X } from 'lucide-react'
import DirectoryCard, { type DirectoryUser } from './DirectoryCard'
import {
  indexMember,
  matchPlace,
  normalize,
  matchQuery,
  suggestCities,
  tokenize,
  type CityScope,
  type IndexedMember,
  type MatchHint,
} from '@/lib/directorySearch'
import { getSubject } from '@/lib/subjects'
import SubjectCheckboxes from './SubjectCheckboxes'

interface DirectoryListProps {
  members: DirectoryUser[]
  currentUserId?: string
  /** Paramètres de l'URL, pour retrouver sa recherche en revenant d'un profil */
  initialParams?: Record<string, string | string[] | undefined>
}

interface Filters {
  q: string
  city: string
  scope: CityScope
  type: string
  promo: string
  subjects: string[]
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

function filtersFromParams(params: DirectoryListProps['initialParams'] = {}): Filters {
  const get = (key: string) => {
    const value = params[key]
    return (Array.isArray(value) ? value[0] : value) ?? ''
  }
  const getAll = (key: string) => {
    const value = params[key]
    return value === undefined ? [] : Array.isArray(value) ? value : [value]
  }
  return {
    q: get('q'),
    city: get('ville'),
    scope: get('quand') === 'actuelle' ? 'current' : 'any',
    type: get('type'),
    promo: get('promo'),
    subjects: getAll('matiere').filter((value) => getSubject(value)),
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
  const [filters, setFilters] = useState<Filters>(() => filtersFromParams(initialParams))
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const update = (patch: Partial<Filters>) => setFilters((prev) => ({ ...prev, ...patch }))
  const reset = () => setFilters(filtersFromParams())

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
      entry: IndexedMember<DirectoryUser>
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

    // Matières en commun, puis pertinence, puis profils remplis avant les
    // profils vides. Tri stable : à égalité, l'ordre alphabétique est conservé.
    const filled = (entry: IndexedMember) =>
      Number(!!(entry.summary.headline || entry.summary.city || entry.member.subjects?.length))
    found.sort(
      (a, b) =>
        b.subjectMatches - a.subjectMatches || b.score - a.score || filled(b.entry) - filled(a.entry)
    )
    return found
  }, [indexed, filters])

  // Proposer d'élargir « Ville actuelle » à tout le parcours quand ça rapporte plus
  const widerCount = useMemo(() => {
    const cityTokens = tokenize(filters.city)
    if (filters.scope !== 'current' || cityTokens.length === 0) return 0
    return indexed.filter((entry) => matchPlace(entry, cityTokens, 'any')).length
  }, [indexed, filters.city, filters.scope])

  const citySuggestions = useMemo(() => suggestCities(indexed, filters.scope), [indexed, filters.scope])
  // « brest » tapé à la main s'affiche « Brest » quand la ville est connue
  const cityLabel =
    citySuggestions.find((city) => normalize(city.name) === normalize(filters.city))?.name ?? filters.city.trim()

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

  // Ce qu'il manque au profil du visiteur pour qu'on le trouve
  const me = currentUserId ? indexed.find((entry) => entry.member._id === currentUserId) : undefined
  const missing = me
    ? [
        !me.summary.city && 'votre ville actuelle',
        !me.member.subjects?.length && 'vos matières',
        !me.summary.headline && 'votre poste ou vos études',
        me.member.userType !== 'staff' && !me.member.promotionYear && 'votre promo',
      ].filter((item): item is string => !!item)
    : []

  const hasFilters = filtersToSearch({ ...filters, scope: 'any' }) !== ''
  const visible = results.slice(0, visibleCount)
  const hints = Object.fromEntries(results.map(({ entry, hints }) => [entry.member._id, hints]))
  const activeScope = SCOPE_OPTIONS.find((option) => option.value === filters.scope)!

  const chipClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
      active
        ? 'bg-blue-600 border-blue-600 text-white'
        : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-700'
    }`

  return (
    <div className="space-y-6">
      {/* Panneau de recherche */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 space-y-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="relative">
            <label htmlFor="directory-query" className="sr-only">Rechercher un membre</label>
            <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" aria-hidden="true" />
            <input
              id="directory-query"
              type="search"
              value={filters.q}
              onChange={(e) => update({ q: e.target.value })}
              placeholder="Nom, école, entreprise, métier…"
              autoComplete="off"
              className="w-full pl-11 pr-10 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition text-gray-900 placeholder:text-gray-400 [&::-webkit-search-cancel-button]:hidden"
            />
            {filters.q && (
              <button
                type="button"
                onClick={() => update({ q: '' })}
                aria-label="Effacer la recherche"
                className="absolute right-2 top-2 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="space-y-2">
            <div className="relative">
              <label htmlFor="directory-city" className="sr-only">Ville</label>
              <MapPin className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" aria-hidden="true" />
              <input
                id="directory-city"
                type="text"
                list="directory-cities"
                value={filters.city}
                onChange={(e) => update({ city: e.target.value })}
                placeholder="Ville : Lyon, Brest, Montréal…"
                autoComplete="off"
                className="w-full pl-11 pr-10 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition text-gray-900 placeholder:text-gray-400"
              />
              <datalist id="directory-cities">
                {citySuggestions.map((city) => (
                  <option key={city.name} value={city.name} />
                ))}
              </datalist>
              {filters.city && (
                <button
                  type="button"
                  onClick={() => update({ city: '' })}
                  aria-label="Effacer la ville"
                  className="absolute right-2 top-2 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="flex p-1 bg-gray-100 rounded-xl text-sm" role="group" aria-label="Portée de la ville">
              {SCOPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={filters.scope === option.value}
                  onClick={() => update({ scope: option.value })}
                  className={`flex-1 px-3 py-1.5 rounded-lg font-medium transition ${
                    filters.scope === option.value
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 px-1">{activeScope.help}</p>
          </div>
        </div>

        {/* Villes représentées */}
        {!filters.city && citySuggestions.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap pb-1 sm:pb-0">
            <span className="text-sm text-gray-500 shrink-0">
              {filters.scope === 'current' ? 'Où vivent-ils ?' : 'Où sont-ils passés ?'}
            </span>
            {citySuggestions.slice(0, 8).map((city) => (
              <button key={city.name} type="button" onClick={() => update({ city: city.name })} className={chipClass(false)}>
                {city.name}
                <span className="text-xs text-gray-400">{city.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Matières : n'apparaissent qu'une fois choisies par au moins un membre */}
        {subjectCounts.size > 0 && (
          <div className="pt-4 border-t border-gray-100 space-y-2">
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">Matières</span> · cochez celles qui vous plaisent
            </p>
            <SubjectCheckboxes
              legend="Filtrer par matière"
              selected={filters.subjects}
              onChange={(subjects) => update({ subjects })}
              counts={subjectCounts}
              compact
              className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 pb-1 sm:mx-0 sm:px-0 sm:pb-0 sm:flex-wrap"
            />
          </div>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center gap-3 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap pb-1 sm:pb-0 flex-1">
            <button type="button" aria-pressed={!filters.type} onClick={() => update({ type: '' })} className={chipClass(!filters.type)}>
              Tous
              <span className={`text-xs ${!filters.type ? 'text-blue-100' : 'text-gray-400'}`}>{members.length}</span>
            </button>
            {TYPE_FILTERS.filter((type) => typeCounts.get(type.value)).map((type) => {
              const active = filters.type === type.value
              return (
                <button
                  key={type.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => update({ type: active ? '' : type.value, promo: type.value === 'staff' ? '' : filters.promo })}
                  className={chipClass(active)}
                >
                  {type.label}
                  <span className={`text-xs ${active ? 'text-blue-100' : 'text-gray-400'}`}>{typeCounts.get(type.value)}</span>
                </button>
              )
            })}
          </div>

          {filters.type !== 'staff' && promoOptions.length > 0 && (
            <div className="lg:w-52">
              <label htmlFor="directory-promo" className="sr-only">Promotion</label>
              <select
                id="directory-promo"
                value={filters.promo}
                onChange={(e) => update({ promo: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              >
                <option value="">Toutes les promos</option>
                {promoOptions.map(([year, count]) => (
                  <option key={year} value={year}>
                    Promo {year} ({count})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

      </div>

      {/* Invitation à compléter son profil */}
      {missing.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-200">
          <p className="flex-1 text-sm text-blue-900">
            <span className="font-semibold">Aidez les autres à vous trouver :</span>{' '}
            ajoutez {joinFrench(missing)} à votre profil.
          </p>
          <Link
            href="/profil"
            className="shrink-0 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
          >
            Compléter mon profil
          </Link>
        </div>
      )}

      {/* Résultats */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-600" aria-live="polite">
            <span className="font-semibold text-gray-900">{plural(results.length, 'membre')}</span>
            {filters.city.trim() && (
              <>
                {filters.scope === 'current' ? ' vivant à ' : results.length > 1 ? ' passés par ' : ' passé par '}
                <span className="font-semibold text-gray-900">{cityLabel}</span>
              </>
            )}
            {filters.subjects.length > 0 && (
              <> · {filters.subjects.map((subject) => getSubject(subject)?.short).join(' + ')}</>
            )}
            {filters.promo && <> · promo {filters.promo}</>}
          </p>
          {filters.subjects.length > 1 && (
            <p className="mt-0.5 text-xs text-gray-500">
              Ceux qui cochent le plus de ces matières apparaissent en premier
            </p>
          )}
        </div>
        {hasFilters && (
          <button type="button" onClick={reset} className="shrink-0 text-sm font-medium text-blue-700 hover:text-blue-800">
            Tout effacer
          </button>
        )}
      </div>

      {widerCount > results.length && (
        <button
          type="button"
          onClick={() => update({ scope: 'any' })}
          className="w-full text-left p-3 rounded-xl border border-dashed border-gray-300 text-sm text-gray-700 hover:border-blue-300 hover:bg-white transition"
        >
          Peu de membres ont indiqué leur ville actuelle.{' '}
          <span className="font-semibold text-blue-700">
            {widerCount > 1 ? `Voir les ${widerCount} membres passés` : 'Voir le membre passé'} par {cityLabel} →
          </span>
        </button>
      )}

      {results.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6 text-gray-400" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Aucun membre ne correspond</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {filters.city
              ? 'Essayez une ville voisine, ou cherchez plutôt une école ou une entreprise de la région.'
              : 'Essayez un autre mot : une école, une entreprise, un métier ou une promo.'}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-5 inline-flex items-center px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-blue-300 hover:text-blue-700 transition"
          >
            Tout effacer
          </button>
        </div>
      ) : (
        <>
          <DirectoryCard
            users={visible.map(({ entry }) => entry.member)}
            currentUserId={currentUserId}
            hints={hints}
            highlightSubjects={filters.subjects}
          />

          {results.length > visibleCount && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                className="px-6 py-3 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 shadow-sm hover:border-blue-300 hover:text-blue-700 transition"
              >
                Afficher plus ({plural(results.length - visibleCount, 'restant')})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
