'use client'

import { useId } from 'react'
import { BookOpen, Briefcase, GraduationCap, School, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export const MEMBER_TYPES = [
  { value: 'lyceen', label: 'Lycéen·ne', description: 'Élève actuel du lycée', icon: School },
  { value: 'prepa', label: 'Prépa', description: 'Classe préparatoire', icon: BookOpen },
  { value: 'bts', label: 'BTS', description: 'Étudiant·e en BTS', icon: Briefcase },
  { value: 'alumni', label: 'Ancien·ne élève', description: 'Passé·e par le lycée', icon: GraduationCap },
  { value: 'staff', label: 'Personnel', description: 'Enseignant, direction, vie scolaire…', icon: Users },
] as const

/** Choix du type de membre en cartes radio (clavier : flèches) */
export function MemberTypePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const name = useId()
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-ink">
        Vous êtes <span className="text-red" aria-hidden="true">*</span>
      </legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {MEMBER_TYPES.map(({ value: option, label, description, icon: Icon }) => (
          <label
            key={option}
            className={cn(
              'relative flex cursor-pointer flex-col gap-1 rounded-[var(--radius-md)] border-2 p-3 transition-colors has-[:focus-visible]:shadow-[var(--focus-ring)]',
              value === option ? 'border-blue bg-blue-soft' : 'border-line bg-paper-raised hover:border-line-strong'
            )}
          >
            <input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} className="sr-only" />
            <Icon className={cn('size-5', value === option ? 'text-blue' : 'text-ink-muted')} aria-hidden="true" />
            <span className="font-semibold text-ink">{label}</span>
            <span className="text-xs text-ink-muted">{description}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
