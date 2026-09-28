'use client'

import { Check } from 'lucide-react'
import { SUBJECTS } from '@/lib/subjects'

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
              className={`relative inline-flex shrink-0 items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border text-sm font-medium select-none transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-500 has-[:focus-visible]:ring-offset-1 ${
                checked
                  ? 'bg-blue-50 border-blue-500 text-blue-800 cursor-pointer'
                  : disabled
                    ? 'bg-white border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 cursor-pointer'
              }`}
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
                className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                  checked ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300'
                }`}
              >
                {checked && <Check className="w-3 h-3" strokeWidth={3} />}
              </span>
              <span aria-hidden="true">{subject.emoji}</span>
              {compact ? subject.short : subject.label}
              {counts && <span className={`text-xs ${checked ? 'text-blue-500' : 'text-gray-400'}`}>{count}</span>}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
