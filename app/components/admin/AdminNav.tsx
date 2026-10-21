'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, FileText, Image as ImageIcon, LayoutDashboard, Settings, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/admin', label: 'Vue d’ensemble', icon: LayoutDashboard },
  { href: '/admin/utilisateurs', label: 'Membres et rôles', icon: Users },
  { href: '/admin/contenus', label: 'Contenus', icon: FileText },
  { href: '/admin/medias', label: 'Médiathèque', icon: ImageIcon },
  { href: '/admin/statistiques', label: 'Statistiques', icon: BarChart3 },
  { href: '/admin/parametres', label: 'Réglages du site', icon: Settings },
]

export function AdminNav({ pending }: { pending: number }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Administration" className="scrollbar-none -mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="flex gap-1 lg:flex-col">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === '/admin' ? pathname === href : pathname.startsWith(href)
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-[var(--radius-sm)] border-l-[3px] px-3 py-2.5 text-sm font-semibold whitespace-nowrap',
                  active ? 'border-red bg-paper-raised text-ink shadow-[var(--shadow-sm)]' : 'border-transparent text-ink-soft hover:bg-paper-raised hover:text-ink'
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
                {href === '/admin/utilisateurs' && pending > 0 && <span className="ml-auto rounded-full bg-red px-2 py-0.5 text-xs text-on-red">{pending}</span>}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
