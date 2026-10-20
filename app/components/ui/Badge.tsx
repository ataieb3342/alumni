import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type BadgeTone = 'neutral' | 'blue' | 'red' | 'green' | 'amber' | 'highlight' | 'outline'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-paper-sunken text-ink-soft',
  blue: 'bg-blue-soft text-blue',
  red: 'bg-red-soft text-red',
  green: 'bg-success-soft text-success',
  amber: 'bg-warning-soft text-warning',
  highlight: 'bg-highlight text-on-highlight',
  outline: 'border border-line-strong/60 text-ink-soft',
}

export function Badge({ tone = 'neutral', className, children, icon }: { tone?: BadgeTone; className?: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5', tones[tone], className)}>
      {icon}
      {children}
    </span>
  )
}
