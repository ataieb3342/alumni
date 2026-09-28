'use client'

import { useId, useState, type KeyboardEvent } from 'react'
import { Building2, CornerDownLeft, MapPin, Search, UserRound, X } from 'lucide-react'
import { getSubject } from '@/lib/subjects'

export type Suggestion =
  | { kind: 'subject'; value: string; count: number }
  | { kind: 'city'; name: string; count: number }
  | { kind: 'organization'; name: string; count: number }
  | { kind: 'member'; id: string; name: string; detail?: string }

const GROUP_LABELS: Record<Suggestion['kind'], string> = {
  subject: 'Matières',
  city: 'Villes',
  organization: 'Écoles et entreprises',
  member: 'Membres',
}

interface DirectorySearchBoxProps {
  value: string
  onChange: (value: string) => void
  /** Déjà regroupées par type, dans l'ordre d'affichage */
  suggestions: Suggestion[]
  onSelect: (suggestion: Suggestion) => void
}

function countLabel(count: number, what: string) {
  return `${count} ${what}${count > 1 ? 's' : ''}`
}

/**
 * Champ de recherche à suggestions (motif combobox de l'ARIA) : flèches pour
 * parcourir, Entrée pour choisir, Échap pour fermer puis vider.
 */
export default function DirectorySearchBox({ value, onChange, suggestions, onSelect }: DirectorySearchBoxProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const listId = useId()
  const optionId = (index: number) => `${listId}-option-${index}`
  const expanded = open && value.trim().length > 0 && suggestions.length > 0

  const choose = (suggestion: Suggestion) => {
    onSelect(suggestion)
    setOpen(false)
    setActive(-1)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActive((index) => Math.min(index + 1, suggestions.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((index) => Math.max(index - 1, -1))
    } else if (event.key === 'Enter') {
      if (expanded && active >= 0) {
        event.preventDefault()
        choose(suggestions[active])
      } else {
        setOpen(false)
      }
    } else if (event.key === 'Escape') {
      if (expanded) setOpen(false)
      else onChange('')
    }
  }

  return (
    <div className="relative">
      <label htmlFor={`${listId}-input`} className="sr-only">
        Rechercher dans l&apos;annuaire
      </label>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" aria-hidden="true" />
      <input
        id={`${listId}-input`}
        type="text"
        role="combobox"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={expanded && active >= 0 ? optionId(active) : undefined}
        autoComplete="off"
        enterKeyHint="search"
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
          setOpen(true)
          setActive(-1)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        placeholder="Nom, école, ville, matière…"
        className="w-full h-14 pl-12 pr-12 rounded-2xl border border-gray-200 bg-gray-50 text-base text-gray-900 placeholder:text-gray-500 outline-none transition focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Effacer la recherche"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}

      {expanded && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Suggestions"
          className="absolute left-0 right-0 top-full mt-2 z-40 max-h-[min(60vh,28rem)] overflow-y-auto rounded-2xl border border-gray-200 bg-white py-2 shadow-2xl"
        >
          {suggestions.map((suggestion, index) => {
            const header = index === 0 || suggestions[index - 1].kind !== suggestion.kind
            return (
              <li key={`${suggestion.kind}-${index}`} role="presentation">
                {header && (
                  <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400" role="presentation">
                    {GROUP_LABELS[suggestion.kind]}
                  </p>
                )}
                <div
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === active}
                  // Garde le focus dans le champ : sinon le blur fermerait la liste avant le clic
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(suggestion)}
                  className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer ${index === active ? 'bg-blue-50' : ''}`}
                >
                  <SuggestionContent suggestion={suggestion} />
                </div>
              </li>
            )
          })}
          <li role="presentation" className="hidden sm:flex items-center gap-2 px-4 pt-3 mt-1 border-t border-gray-100 text-xs text-gray-400">
            <CornerDownLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Entrée pour chercher « {value.trim()} » dans tous les profils
          </li>
        </ul>
      )}
    </div>
  )
}

function SuggestionContent({ suggestion }: { suggestion: Suggestion }) {
  const iconClass = 'w-8 h-8 shrink-0 rounded-full flex items-center justify-center'

  switch (suggestion.kind) {
    case 'subject': {
      const subject = getSubject(suggestion.value)!
      return (
        <>
          <span className={`${iconClass} bg-gray-100 text-base`} aria-hidden="true">{subject.emoji}</span>
          <span className="flex-1 min-w-0 truncate font-medium text-gray-900">{subject.label}</span>
          <span className="shrink-0 text-xs text-gray-500">{countLabel(suggestion.count, 'profil')}</span>
        </>
      )
    }
    case 'city':
      return (
        <>
          <span className={`${iconClass} bg-rose-50 text-rose-600`} aria-hidden="true"><MapPin className="w-4 h-4" /></span>
          <span className="flex-1 min-w-0 truncate font-medium text-gray-900">{suggestion.name}</span>
          <span className="shrink-0 text-xs text-gray-500">
            {countLabel(suggestion.count, 'membre')} passé{suggestion.count > 1 ? 's' : ''} par là
          </span>
        </>
      )
    case 'organization':
      return (
        <>
          <span className={`${iconClass} bg-amber-50 text-amber-600`} aria-hidden="true"><Building2 className="w-4 h-4" /></span>
          <span className="flex-1 min-w-0 truncate font-medium text-gray-900">{suggestion.name}</span>
          <span className="shrink-0 text-xs text-gray-500">{countLabel(suggestion.count, 'membre')}</span>
        </>
      )
    case 'member':
      return (
        <>
          <span className={`${iconClass} bg-blue-50 text-blue-600`} aria-hidden="true"><UserRound className="w-4 h-4" /></span>
          <span className="flex-1 min-w-0">
            <span className="block truncate font-medium text-gray-900">{suggestion.name}</span>
            {suggestion.detail && <span className="block truncate text-xs text-gray-500">{suggestion.detail}</span>}
          </span>
        </>
      )
  }
}
