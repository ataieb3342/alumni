'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export interface NavItem {
  href: string
  label: string
  /** Lien mis en avant (l'annuaire, fonctionnalité clé) */
  primary?: boolean
}

export function isActive(pathname: string, href: string) {
  if (href === '/' || href === '/accueil') return pathname === href
  return pathname === href || pathname.startsWith(href + '/')
}

/** Navigation principale : l'onglet courant est souligné d'un trait rouge, comme une marge de cahier */
export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  return (
    <ul className="flex items-center gap-1">
      {items.map((item) => {
        const active = isActive(pathname, item.href)
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative inline-flex h-10 items-center rounded-[var(--radius-sm)] px-3 text-[0.95rem] font-semibold transition-colors',
                active ? 'text-ink' : 'text-ink-soft hover:bg-paper-sunken hover:text-ink',
                item.primary && !active && 'text-blue'
              )}
            >
              {item.label}
              {active && <span aria-hidden="true" className="animate-ink absolute inset-x-3 -bottom-[13px] h-[3px] rounded-full bg-red" />}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
