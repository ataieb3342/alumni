'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Select } from '@/app/components/ui/Field'

/** Filtres de la liste des comptes, reflétés dans l'URL */
export function UserFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')

  const apply = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params.toString())
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    next.delete('page')
    router.replace(`${pathname}?${next.toString()}`)
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      if ((params.get('q') ?? '') !== q) apply({ q })
    }, 300)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
      <div className="relative">
        <label htmlFor="users-q" className="sr-only">
          Rechercher un compte
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
        <input
          id="users-q"
          type="search"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Nom ou e-mail…"
          className="h-11 w-full rounded-[var(--radius-sm)] border border-line-strong/60 bg-paper-raised pr-3 pl-9 text-ink outline-none focus:border-blue"
        />
      </div>
      <label className="sr-only" htmlFor="users-status">
        Statut
      </label>
      <Select id="users-status" value={params.get('statut') ?? ''} onChange={(event) => apply({ statut: event.target.value })} className="sm:w-44">
        <option value="">Tous les statuts</option>
        <option value="pending">En attente</option>
        <option value="active">Actifs</option>
        <option value="suspended">Suspendus</option>
        <option value="inactive">Inactifs</option>
      </Select>
      <label className="sr-only" htmlFor="users-role">
        Rôle
      </label>
      <Select id="users-role" value={params.get('role') ?? ''} onChange={(event) => apply({ role: event.target.value })} className="sm:w-44">
        <option value="">Tous les rôles</option>
        <option value="admin">Administrateurs</option>
        <option value="member">Membres</option>
      </Select>
      <label className="sr-only" htmlFor="users-type">
        Type
      </label>
      <Select id="users-type" value={params.get('type') ?? ''} onChange={(event) => apply({ type: event.target.value })} className="sm:w-44">
        <option value="">Tous les types</option>
        <option value="alumni">Anciens élèves</option>
        <option value="prepa">Prépa</option>
        <option value="bts">BTS</option>
        <option value="lyceen">Lycéens</option>
        <option value="staff">Personnel</option>
      </Select>
    </div>
  )
}
