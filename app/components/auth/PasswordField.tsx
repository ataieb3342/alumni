'use client'

import { useId, useState, type InputHTMLAttributes } from 'react'
import { Check, Eye, EyeOff, X } from 'lucide-react'
import { PASSWORD_RULES } from '@/lib/password-rules'
import { cn } from '@/lib/utils'
import { controlClasses } from '@/app/components/ui/Field'

/** Champ mot de passe avec bouton afficher / masquer */
export function PasswordInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input {...props} type={visible ? 'text' : 'password'} className={cn(controlClasses, 'h-11 pr-12', className)} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        aria-pressed={visible}
        className="absolute top-1/2 right-1.5 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-[var(--radius-xs)] text-ink-muted hover:bg-paper-sunken hover:text-ink focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
      >
        {visible ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
      </button>
    </div>
  )
}

/** Règles cochées au fil de la frappe */
export function PasswordRules({ value, id }: { value: string; id?: string }) {
  const autoId = useId()
  return (
    <ul id={id ?? autoId} className="grid gap-1 text-sm sm:grid-cols-2" aria-label="Règles du mot de passe">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value)
        return (
          <li key={rule.id} className={cn('flex items-center gap-1.5', ok ? 'text-success' : 'text-ink-muted')}>
            {ok ? <Check className="size-4 shrink-0" aria-hidden="true" /> : <X className="size-4 shrink-0 opacity-60" aria-hidden="true" />}
            <span>
              {rule.label}
              <span className="sr-only">{ok ? ' : respectée' : ' : manquante'}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
