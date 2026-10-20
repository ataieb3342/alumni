'use client'

import { Check } from 'lucide-react'
import { SUBJECTS } from '@/lib/subjects'
import { cn } from '@/lib/utils'
import { SubjectIcon } from '@/app/components/ui/icons'

interface SubjectCheckboxesProps {
  legend: string
  selected: string[]
  onChange: (selected: string[]) => void
  /** Nombre maximum de cases cochées ; les autres se désactivent une fois atteint */
  max?: number
  /** Nombre de membres par matière : affiché, et une matière vide se désactive */
  counts?: Map<string, number>
  /** Intitulés courts, pour les filtres */
  compact?: boolean
  className?: string
}

export default function SubjectCheckboxes({
  legend,
  selected,
  onChange,
  max,
  counts,
  compact = false,
  className = 'flex flex-wrap gap-2',
}: SubjectCheckboxesProps) {
  const full = max !== undefined && selected.length >= max

  return (
    // min-w-0 : un fieldset prend par défaut la largeur de son contenu, ce qui
    // casserait le défilement horizontal des filtres sur mobile
    <fieldset className="min-w-0">
      <legend className="sr-only">{legend}</legend>
      <div className={className}>
        {SUBJECTS.map((subject) => {
          const checked = selected.includes(subject.value)
          const count = counts?.get(subject.value) ?? 0
          const disabled = !checked && (full || (counts !== undefined && count === 0))

          return (
            <label
              key={subject.value}
              title={compact ? subject.label : undefined}
              className={cn(
                'relative inline-flex shrink-0 select-none items-center gap-2 rounded-full border py-1.5 pr-3 pl-2 text-sm font-semibold transition-colors has-[:focus-visible]:shadow-[var(--focus-ring)]',
                checked
                  ? 'cursor-pointer border-blue bg-blue-soft text-blue'
                  : disabled
                    ? 'cursor-not-allowed border-line bg-paper-raised text-ink-muted/60'
                    : 'cursor-pointer border-line bg-paper-raised text-ink-soft hover:border-blue/60'
              )}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                disabled={disabled}
                onChange={() =>
                  onChange(checked ? selected.filter((value) => value !== subject.value) : [...selected, subject.value])
                }
              />
              <span
                aria-hidden="true"
                className={cn(
                  'flex size-4 items-center justify-center rounded border transition-colors',
                  checked ? 'border-blue bg-blue text-on-blue' : 'border-line-strong bg-paper-raised'
                )}
              >
                {checked && <Check className="w-3 h-3" strokeWidth={3} />}
              </span>
              <SubjectIcon value={subject.value} className="size-4" />
              {compact ? subject.short : subject.label}
              {counts && <span className={cn('text-xs', checked ? 'text-blue' : 'text-ink-muted')}>{count}</span>}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
