import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function AdminHeader({ title, lead, actions }: { title: string; lead?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display-tight text-[clamp(1.8rem,3.5vw,2.5rem)] text-ink">{title}</h1>
        {lead && <div className="mt-1 text-ink-soft">{lead}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function AdminCard({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-[var(--radius-lg)] border border-line bg-paper-raised p-5 sm:p-6', className)}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="font-sans text-lg font-bold text-ink">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Stat({ label, value, hint, tone = 'ink' }: { label: string; value: ReactNode; hint?: ReactNode; tone?: 'ink' | 'red' | 'blue' }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-paper-raised p-5">
      <p className="text-sm font-semibold text-ink-muted">{label}</p>
      <p className={cn('mt-1 font-display-tight text-4xl leading-none', tone === 'red' ? 'text-red' : tone === 'blue' ? 'text-blue' : 'text-ink')}>{value}</p>
      {hint && <p className="mt-2 text-xs text-ink-muted">{hint}</p>}
    </div>
  )
}
