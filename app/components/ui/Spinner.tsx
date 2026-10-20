import { cn } from '@/lib/utils'

/** Indicateur de chargement : un trait d'encre qui tourne */
export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <svg
      className={cn('animate-spin motion-reduce:animate-none', className ?? 'size-5')}
      viewBox="0 0 24 24"
      fill="none"
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse motion-reduce:animate-none rounded-[var(--radius-sm)] bg-paper-sunken', className)} />
}
