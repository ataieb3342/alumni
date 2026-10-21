'use client'

import {
  cloneElement,
  forwardRef,
  isValidElement,
  useId,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export const controlClasses =
  'block w-full rounded-[var(--radius-sm)] border bg-paper-raised px-3.5 text-[1rem] text-ink placeholder:text-ink-muted/80 ' +
  'transition-[border-color,box-shadow] duration-150 outline-none ' +
  'border-line-strong/70 hover:border-ink-muted focus:border-blue focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--blue)_25%,transparent)] ' +
  'aria-[invalid=true]:border-red aria-[invalid=true]:focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--red)_25%,transparent)] ' +
  'disabled:cursor-not-allowed disabled:bg-paper-sunken disabled:text-ink-muted'

interface FieldProps {
  label: ReactNode
  /** Aide sous le champ (format attendu, usage) */
  hint?: ReactNode
  error?: string | null
  /** Message de validation réussie, affiché après saisie */
  success?: string | null
  required?: boolean
  /** Élément à droite du libellé (lien « Mot de passe oublié ? »…) */
  labelExtra?: ReactNode
  className?: string
  id?: string
  /** Un seul contrôle : il reçoit id, aria-describedby, aria-invalid et required */
  children: ReactElement<Record<string, unknown>>
}

/**
 * Champ de formulaire accessible : libellé associé, aide et erreur reliées au
 * contrôle (`aria-describedby`), erreur annoncée en direct.
 */
export function Field({ label, hint, error, success, required, labelExtra, className, id, children }: FieldProps) {
  const autoId = useId()
  const controlId = id ?? (children.props.id as string | undefined) ?? autoId
  const hintId = hint ? `${controlId}-hint` : undefined
  const errorId = `${controlId}-error`
  const describedBy = [hintId, error ? errorId : undefined].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={controlId} className="text-sm font-semibold text-ink">
          {label}
          {required && (
            <span className="ml-0.5 text-red" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {labelExtra}
      </div>
      {isValidElement(children)
        ? cloneElement(children, {
            id: controlId,
            'aria-describedby': describedBy,
            'aria-invalid': error ? true : undefined,
            required: required || undefined,
          })
        : children}
      {hint && (
        <p id={hintId} className="text-sm text-ink-muted">
          {hint}
        </p>
      )}
      <p id={errorId} aria-live="polite" className={cn('flex items-start gap-1.5 text-sm', error ? 'text-red' : 'text-success')}>
        {error ? (
          <>
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </>
        ) : success ? (
          <>
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{success}</span>
          </>
        ) : null}
      </p>
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(controlClasses, 'h-11', className)} {...props} />
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, rows = 5, ...props },
  ref
) {
  return <textarea ref={ref} rows={rows} className={cn(controlClasses, 'py-2.5 leading-relaxed', className)} {...props} />
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref
) {
  return (
    <select ref={ref} className={cn(controlClasses, 'h-11 pr-9 appearance-none bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20stroke%3D%22%235f6475%22%20stroke-width%3D%222%22%20viewBox%3D%220%200%2024%2024%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E")] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat', className)} {...props}>
      {children}
    </select>
  )
})

/** Case à cocher avec libellé et description, zone cliquable large */
export function Checkbox({
  label,
  description,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; description?: ReactNode }) {
  const id = useId()
  return (
    <div className={cn('flex gap-3', className)}>
      <input
        id={props.id ?? id}
        type="checkbox"
        className="mt-0.5 size-5 shrink-0 cursor-pointer rounded border-line-strong accent-[var(--blue)]"
        aria-describedby={description ? `${props.id ?? id}-desc` : undefined}
        {...props}
      />
      <div className="min-w-0">
        <label htmlFor={props.id ?? id} className="cursor-pointer font-semibold text-ink">
          {label}
        </label>
        {description && (
          <p id={`${props.id ?? id}-desc`} className="text-sm text-ink-muted">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

/** Interrupteur (rôle switch) pour les préférences on/off */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
}) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p id={`${id}-label`} className="font-semibold text-ink">
          {label}
        </p>
        {description && (
          <p id={`${id}-desc`} className="text-sm text-ink-muted">
            {description}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-desc` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-full border-2 transition-colors duration-200',
          'focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] disabled:opacity-50',
          checked ? 'border-blue bg-blue' : 'border-line-strong bg-paper-sunken'
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'inline-block size-5 rounded-full bg-paper-raised shadow-sm transition-transform duration-200 ease-[var(--ease-spring)]',
            checked ? 'translate-x-[1.35rem]' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  )
}

/** Compteur de caractères relié au champ */
export function CharCount({ value, max }: { value: string; max: number }) {
  const remaining = max - value.length
  return (
    <span className={cn('text-xs tabular-nums', remaining < 0 ? 'text-red font-semibold' : remaining < max * 0.1 ? 'text-warning' : 'text-ink-muted')}>
      {value.length}/{max}
    </span>
  )
}
