import Link from 'next/link'
import { forwardRef, type ButtonHTMLAttributes, type ComponentProps, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Spinner } from './Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'highlight' | 'on-wash'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'relative inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] font-semibold whitespace-nowrap select-none ' +
  'transition-[background-color,color,box-shadow,transform,border-color] duration-150 ease-[var(--ease-out)] ' +
  'disabled:cursor-not-allowed disabled:opacity-55 aria-disabled:cursor-not-allowed aria-disabled:opacity-55 ' +
  'focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]'

/*
 * Les boutons pleins ont une « tranche » d'encre en bas (ombre portée dure)
 * qui s'écrase à l'appui : un clic se sent, comme un tampon.
 */
const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-blue text-on-blue shadow-[0_3px_0_0_var(--blue-strong)] hover:bg-blue-strong active:translate-y-[2px] active:shadow-[0_1px_0_0_var(--blue-strong)]',
  secondary:
    'bg-paper-raised text-ink border border-line-strong/60 shadow-[0_2px_0_0_var(--line)] hover:border-ink hover:bg-paper active:translate-y-[1px] active:shadow-none',
  ghost: 'text-ink-soft hover:text-ink hover:bg-paper-sunken',
  danger:
    'bg-red text-on-red shadow-[0_3px_0_0_var(--red-strong)] hover:bg-red-strong active:translate-y-[2px] active:shadow-[0_1px_0_0_var(--red-strong)]',
  highlight:
    'bg-highlight text-on-highlight shadow-[0_3px_0_0_#c9a915] hover:brightness-95 active:translate-y-[2px] active:shadow-[0_1px_0_0_#c9a915]',
  'on-wash': 'bg-white/10 text-on-wash ring-1 ring-white/25 hover:bg-white/20',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-[0.95rem]',
  lg: 'h-13 px-7 text-base',
}

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className)
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  /** Texte annoncé et affiché pendant le chargement */
  loadingLabel?: string
  icon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, loadingLabel, icon, className, children, disabled, type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClasses(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner className="size-4" /> : icon}
      <span>{loading && loadingLabel ? loadingLabel : children}</span>
    </button>
  )
})

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  iconRight?: ReactNode
}

export function ButtonLink({ variant = 'primary', size = 'md', icon, iconRight, className, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, cn('group', className))} {...props}>
      {icon}
      <span>{children}</span>
      {iconRight}
    </Link>
  )
}
