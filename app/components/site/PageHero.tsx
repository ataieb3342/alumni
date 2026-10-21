import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * En-tête de page « cahier » : réglure Seyès discrète, marge rouge, titre en
 * Fraunces. Le titre et le chapeau peuvent être des éléments éditables.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  actions,
  children,
  className,
  size = 'md',
}: {
  eyebrow?: ReactNode
  title: ReactNode
  lead?: ReactNode
  actions?: ReactNode
  children?: ReactNode
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <section className={cn('bg-seyes relative border-b border-line', className)}>
      <div className={cn('container-page relative', size === 'sm' ? 'py-8 sm:py-10' : 'py-10 sm:py-16')}>
        <div className="max-w-3xl pl-0 sm:pl-10">
          {eyebrow && <p className="animate-rise mb-3 text-sm font-bold tracking-[0.12em] text-red uppercase">{eyebrow}</p>}
          <h1 className="animate-rise-1 font-display-tight text-[clamp(2rem,4.6vw,3.4rem)] text-ink">{title}</h1>
          {lead && <div className="animate-rise-2 mt-3 max-w-2xl text-lg text-ink-soft sm:text-xl">{lead}</div>}
          {actions && <div className="animate-rise-3 mt-6 flex flex-wrap items-center gap-3">{actions}</div>}
        </div>
        {children}
      </div>
    </section>
  )
}

export function SectionHeading({ id, title, lead, action, className }: { id?: string; title: ReactNode; lead?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3', className)}>
      <div className="min-w-0 max-w-2xl">
        <h2 id={id} className="text-[clamp(1.5rem,2.8vw,2.1rem)] text-ink">
          {title}
        </h2>
        {lead && <div className="mt-1.5 text-ink-soft">{lead}</div>}
      </div>
      {action}
    </div>
  )
}
