'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { signOut } from 'next-auth/react'
import { LayoutDashboard, LogIn, LogOut, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isActive, type NavItem } from './NavLinks'
import { ACCOUNT_LINKS, UserAvatar, type MenuUser } from './UserMenu'
import { ThemeToggle } from './ThemeToggle'

/**
 * Menu mobile dans un <dialog> natif : focus piégé, Échap, retour du focus.
 * Fermé, il n'existe pas dans l'arbre d'accessibilité (contrairement à
 * l'ancien panneau simplement décalé hors écran).
 */
export function MobileNav({ items, user }: { items: NavItem[]; user: MenuUser | null }) {
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const pathname = usePathname()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  // Fermeture à chaque navigation
  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        aria-haspopup="dialog"
        className="inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-paper-sunken focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)] lg:hidden"
      >
        <Menu className="size-6" aria-hidden="true" />
      </button>
      <dialog
        ref={dialogRef}
        aria-label="Menu"
        onClose={() => setOpen(false)}
        onClick={(event) => event.target === dialogRef.current && setOpen(false)}
        className="m-0 ml-auto h-dvh max-h-dvh w-[min(22rem,88vw)] max-w-none border-l border-line bg-paper-raised p-0 text-ink backdrop:bg-[rgb(10_12_25/0.5)] open:animate-rise"
      >
        {open && (
          <nav aria-label="Navigation mobile" className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              {user ? (
                <div className="flex min-w-0 items-center gap-3">
                  <UserAvatar user={user} size={40} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-ink-muted">{user.email}</p>
                  </div>
                </div>
              ) : (
                <p className="font-display text-lg">Menu</p>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer le menu"
                className="inline-flex size-11 items-center justify-center rounded-full hover:bg-paper-sunken"
              >
                <X className="size-6" aria-hidden="true" />
              </button>
            </div>
            <ul className="flex-1 space-y-0.5 overflow-y-auto p-3">
              {items.map((item) => {
                const active = isActive(pathname, item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex h-12 items-center rounded-[var(--radius-sm)] border-l-[3px] px-4 text-lg font-semibold',
                        active ? 'border-red bg-paper-sunken text-ink' : 'border-transparent text-ink-soft hover:bg-paper-sunken'
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })}
              {user && (
                <>
                  <li aria-hidden="true" className="my-3 border-t border-line" />
                  {user.role === 'admin' && (
                    <li>
                      <Link href="/admin" className="flex h-11 items-center gap-3 rounded-[var(--radius-sm)] px-4 font-semibold text-red hover:bg-red-soft">
                        <LayoutDashboard className="size-5" aria-hidden="true" /> Administration
                      </Link>
                    </li>
                  )}
                  {ACCOUNT_LINKS.map(({ href, label, icon: Icon }) => (
                    <li key={href}>
                      <Link href={href} aria-current={isActive(pathname, href) ? 'page' : undefined} className="flex h-11 items-center gap-3 rounded-[var(--radius-sm)] px-4 text-ink-soft hover:bg-paper-sunken">
                        <Icon className="size-5" aria-hidden="true" /> {label}
                      </Link>
                    </li>
                  ))}
                </>
              )}
            </ul>
            <div className="flex items-center justify-between gap-3 border-t border-line p-3">
              <ThemeToggle />
              {user ? (
                <button type="button" onClick={() => signOut({ callbackUrl: '/' })} className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-sm)] px-4 font-semibold text-ink-soft hover:bg-paper-sunken">
                  <LogOut className="size-5" aria-hidden="true" /> Se déconnecter
                </button>
              ) : (
                <Link href="/connexion" className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-sm)] bg-blue px-4 font-semibold text-on-blue">
                  <LogIn className="size-5" aria-hidden="true" /> Se connecter
                </Link>
              )}
            </div>
          </nav>
        )}
      </dialog>
    </>
  )
}
