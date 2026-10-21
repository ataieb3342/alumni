'use client'

import { useId, useState, type KeyboardEvent } from 'react'
import { Building2, CornerDownLeft, MapPin, Search, UserRound, X } from 'lucide-react'
import { getSubject } from '@/lib/subjects'
import { cn } from '@/lib/utils'
import { SubjectIcon } from '@/app/components/ui/icons'

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
      <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-blue" aria-hidden="true" />
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
        className="h-14 w-full rounded-[var(--radius-md)] border-2 border-line-strong/40 bg-paper-raised pr-12 pl-12 text-[1.05rem] text-ink outline-none transition placeholder:text-ink-muted focus:border-blue focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--blue)_18%,transparent)]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Effacer la recherche"
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1.5 text-ink-muted hover:bg-paper-sunken hover:text-ink"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}

      {expanded && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Suggestions"
          className="absolute top-full right-0 left-0 z-40 mt-2 max-h-[min(60vh,28rem)] overflow-y-auto rounded-[var(--radius-md)] border border-line bg-paper-raised py-2 shadow-[var(--shadow-lg)]"
        >
          {suggestions.map((suggestion, index) => {
            const header = index === 0 || suggestions[index - 1].kind !== suggestion.kind
            return (
              <li key={`${suggestion.kind}-${index}`} role="presentation">
                {header && (
                  <p className="px-4 pt-3 pb-1 text-xs font-bold tracking-[0.12em] text-ink-muted uppercase" role="presentation">
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
                  className={cn('flex cursor-pointer items-center gap-3 px-4 py-2.5', index === active && 'bg-highlight-soft')}
                >
                  <SuggestionContent suggestion={suggestion} />
                </div>
              </li>
            )
          })}
          <li role="presentation" className="mt-1 hidden items-center gap-2 border-t border-line px-4 pt-3 text-xs text-ink-muted sm:flex">
            <CornerDownLeft className="size-3.5" aria-hidden="true" />
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
          <span className={`${iconClass} bg-blue-soft text-blue`} aria-hidden="true"><SubjectIcon value={subject.value} className="size-4" /></span>
          <span className="min-w-0 flex-1 truncate font-semibold text-ink">{subject.label}</span>
          <span className="shrink-0 text-xs text-ink-muted">{countLabel(suggestion.count, 'profil')}</span>
        </>
      )
    }
    case 'city':
      return (
        <>
          <span className={`${iconClass} bg-red-soft text-red`} aria-hidden="true"><MapPin className="size-4" /></span>
          <span className="min-w-0 flex-1 truncate font-semibold text-ink">{suggestion.name}</span>
          <span className="shrink-0 text-xs text-ink-muted">
            {countLabel(suggestion.count, 'membre')} passé{suggestion.count > 1 ? 's' : ''} par là
          </span>
        </>
      )
    case 'organization':
      return (
        <>
          <span className={`${iconClass} bg-warning-soft text-warning`} aria-hidden="true"><Building2 className="size-4" /></span>
          <span className="min-w-0 flex-1 truncate font-semibold text-ink">{suggestion.name}</span>
          <span className="shrink-0 text-xs text-ink-muted">{countLabel(suggestion.count, 'membre')}</span>
        </>
      )
    case 'member':
      return (
        <>
          <span className={`${iconClass} bg-paper-sunken text-ink-soft`} aria-hidden="true"><UserRound className="size-4" /></span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-ink">{suggestion.name}</span>
            {suggestion.detail && <span className="block truncate text-xs text-ink-muted">{suggestion.detail}</span>}
          </span>
        </>
      )
  }
}
