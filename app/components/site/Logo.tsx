import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * Monogramme « VH » façon tampon encreur, légèrement incliné, et nom du
 * réseau en Fraunces. Le lien ramène à l'accueil adapté (visiteur ou membre).
 */
export function Logo({ href = '/', className, tone = 'ink' }: { href?: string; className?: string; tone?: 'ink' | 'wash' }) {
  return (
    <Link href={href} className={cn('group inline-flex items-center gap-2.5 rounded-[var(--radius-sm)] focus-visible:outline-offset-4', className)}>
      <span
        aria-hidden="true"
        className={cn(
          'grid size-10 -rotate-3 place-items-center rounded-[10px] border-2 font-display text-[1.15rem] italic leading-none font-bold transition-transform duration-300 ease-[var(--ease-spring)] group-hover:rotate-0',
          tone === 'wash' ? 'border-on-wash text-on-wash' : 'border-blue text-blue'
        )}
        style={{ fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 1' }}
      >
        VH
      </span>
      <span className="leading-none">
        <span className={cn('block font-display text-[1.05rem] font-semibold tracking-tight', tone === 'wash' ? 'text-on-wash' : 'text-ink')}>
          Besançon Alumni
        </span>
        <span className={cn('mt-0.5 block text-[0.7rem] font-semibold tracking-[0.12em] uppercase', tone === 'wash' ? 'text-on-wash-soft' : 'text-ink-muted')}>
          Lycée Victor Hugo
        </span>
      </span>
    </Link>
  )
}
