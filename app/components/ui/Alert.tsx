import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tone = 'info' | 'success' | 'warning' | 'error'

const styles: Record<Tone, { box: string; icon: typeof Info }> = {
  info: { box: 'bg-blue-soft text-ink border-blue/30', icon: Info },
  success: { box: 'bg-success-soft text-ink border-success/30', icon: CheckCircle2 },
  warning: { box: 'bg-warning-soft text-ink border-warning/30', icon: AlertTriangle },
  error: { box: 'bg-red-soft text-ink border-red/30', icon: XCircle },
}

const iconColor: Record<Tone, string> = { info: 'text-blue', success: 'text-success', warning: 'text-warning', error: 'text-red' }

/** Message en ligne ; les erreurs sont annoncées immédiatement aux lecteurs d'écran */
export function Alert({ tone = 'info', title, children, className, action }: { tone?: Tone; title?: string; children?: ReactNode; className?: string; action?: ReactNode }) {
  const { box, icon: Icon } = styles[tone]
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-[var(--radius-md)] border p-4 text-sm', box, className)}>
      <Icon className={cn('mt-0.5 size-5 shrink-0', iconColor[tone])} aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className="font-semibold text-ink">{title}</p>}
        {children && <div className="text-ink-soft">{children}</div>}
      </div>
      {action}
    </div>
  )
}
