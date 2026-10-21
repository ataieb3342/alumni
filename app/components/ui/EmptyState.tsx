import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** État vide : une page de cahier encore blanche, avec une piste pour la remplir */
export function EmptyState({ icon, title, children, action, className }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-[var(--radius-lg)] border border-dashed border-line-strong/50 bg-paper-raised px-6 py-12 text-center', className)}>
      {icon && (
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-paper-sunken text-ink-muted" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="text-xl text-ink">{title}</h3>
      {children && <div className="mx-auto mt-2 max-w-md text-ink-soft">{children}</div>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  )
}
