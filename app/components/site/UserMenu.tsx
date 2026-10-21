'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useId, useRef, useState } from 'react'
import { signOut } from 'next-auth/react'
import { ChevronDown, LayoutDashboard, LogOut, Megaphone, MessageSquareQuote, Settings, UserRound } from 'lucide-react'
import { cn, USER_TYPE_LABELS } from '@/lib/utils'

export interface MenuUser {
  name: string
  firstName: string
  lastName: string
  email: string
  image: string | null
  userType: string
  role: string
}

export const ACCOUNT_LINKS = [
  { href: '/profil', label: 'Mon profil', icon: UserRound },
  { href: '/annonces/mes-annonces', label: 'Mes annonces', icon: Megaphone },
  { href: '/temoignages/mes-temoignages', label: 'Mes témoignages', icon: MessageSquareQuote },
  { href: '/parametres', label: 'Paramètres', icon: Settings },
]

export function UserAvatar({ user, size = 32 }: { user: MenuUser; size?: number }) {
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() || 'VH'
  return user.image ? (
    <Image src={user.image} alt="" width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span aria-hidden="true" className="grid place-items-center rounded-full bg-blue-soft font-display font-semibold text-blue" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {initials}
    </span>
  )
}

/** Menu du compte (motif « disclosure ») : Échap ou clic extérieur pour fermer, focus rendu au bouton */
export function UserMenu({ user }: { user: MenuUser }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 items-center gap-2 rounded-full py-1 pr-2 pl-1 text-ink-soft hover:bg-paper-sunken hover:text-ink focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
      >
        <UserAvatar user={user} />
        <span className="sr-only">Mon compte, {user.name}</span>
        <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>
      <div
        id={menuId}
        hidden={!open}
        className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-[var(--radius-md)] border border-line bg-paper-raised shadow-[var(--shadow-lg)]"
      >
        <div className="flex items-center gap-3 border-b border-line p-4">
          <UserAvatar user={user} size={44} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{user.name}</p>
            <p className="truncate text-sm text-ink-muted">{user.email}</p>
            <p className="mt-0.5 text-xs font-semibold text-blue">
              {USER_TYPE_LABELS[user.userType] ?? 'Membre'}
              {user.role === 'admin' && ' · Administrateur'}
            </p>
          </div>
        </div>
        <ul className="p-1.5">
          {user.role === 'admin' && (
            <li>
              <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 font-semibold text-red hover:bg-red-soft">
                <LayoutDashboard className="size-4" aria-hidden="true" />
                Administration
              </Link>
            </li>
          )}
          {ACCOUNT_LINKS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link href={href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-ink-soft hover:bg-paper-sunken hover:text-ink">
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="border-t border-line p-1.5">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-left text-ink-soft hover:bg-paper-sunken hover:text-ink"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  )
}
