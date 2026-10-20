'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Check, KeyRound, MoreHorizontal, PenLine, Shield, ShieldOff, Trash2, UserX, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { api, ApiError } from '@/lib/client/api'
import { cn } from '@/lib/utils'
import { Button } from '@/app/components/ui/Button'
import { useConfirm } from '@/app/components/ui/Dialog'

export interface AdminUserRow {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'member' | 'admin'
  accountStatus: 'active' | 'pending' | 'suspended' | 'inactive'
  hasPassword: boolean
}

/** Actions rapides sur un compte (le serveur revérifie tout : rôle admin, dernier admin, soi-même) */
export function UserActions({ user, isSelf }: { user: AdminUserRow; isSelf: boolean }) {
  const router = useRouter()
  const confirm = useConfirm()
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const name = `${user.firstName} ${user.lastName}`

  const run = async (label: string, action: () => Promise<unknown>) => {
    setBusy(true)
    setOpen(false)
    try {
      await action()
      toast.success(label)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Action impossible')
    } finally {
      setBusy(false)
    }
  }
  const patch = (body: Record<string, unknown>) => api(`/api/admin/users/${user.id}`, { method: 'PATCH', body })

  return (
    <div className="flex items-center justify-end gap-1.5">
      {user.accountStatus === 'pending' && (
        <Button
          size="sm"
          loading={busy}
          icon={<Check className="size-4" aria-hidden="true" />}
          onClick={() =>
            run(`${name} validé·e : un e-mail de confirmation est parti`, async () => {
              const result = await patch({ accountStatus: 'active' })
              if ((result as { emailSent?: boolean }).emailSent === false) toast.warning("Compte validé, mais l'e-mail n'a pas pu être envoyé")
            })
          }
        >
          Valider
        </Button>
      )}
      <div className="relative">
        <button
          type="button"
          aria-expanded={open}
          aria-label={`Actions pour ${name}`}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex size-9 items-center justify-center rounded-full text-ink-soft hover:bg-paper-sunken"
        >
          <MoreHorizontal className="size-5" aria-hidden="true" />
        </button>
        {open && (
          <ul className="absolute right-0 z-30 mt-1 w-64 rounded-[var(--radius-md)] border border-line bg-paper-raised p-1.5 shadow-[var(--shadow-lg)]">
            <MenuItem href={`/admin/utilisateurs/${user.id}`} icon={PenLine}>
              Modifier le profil et les rôles
            </MenuItem>
            {user.accountStatus === 'active' && !isSelf && (
              <MenuItem
                icon={UserX}
                onClick={async () => {
                  if (await confirm({ title: `Suspendre ${name} ?`, body: 'Le compte ne pourra plus se connecter et disparaîtra de l’annuaire.', confirmLabel: 'Suspendre' }))
                    void run('Compte suspendu', () => patch({ accountStatus: 'suspended' }))
                }}
              >
                Suspendre
              </MenuItem>
            )}
            {(user.accountStatus === 'suspended' || user.accountStatus === 'inactive') && (
              <MenuItem icon={UserCheck} onClick={() => void run('Compte réactivé', () => patch({ accountStatus: 'active' }))}>
                Réactiver
              </MenuItem>
            )}
            {user.role === 'member' ? (
              <MenuItem
                icon={Shield}
                onClick={async () => {
                  if (await confirm({ title: `Nommer ${name} administrateur ?`, body: 'Il ou elle pourra modifier tout le site, valider les inscriptions et gérer les rôles.', confirmLabel: 'Nommer administrateur', tone: 'primary' }))
                    void run(`${name} est administrateur`, () => patch({ role: 'admin' }))
                }}
              >
                Nommer administrateur
              </MenuItem>
            ) : (
              <MenuItem
                icon={ShieldOff}
                onClick={async () => {
                  if (await confirm({ title: `Retirer le rôle d’administrateur à ${name} ?`, confirmLabel: 'Retirer le rôle' }))
                    void run('Rôle retiré', () => patch({ role: 'member' }))
                }}
              >
                Retirer le rôle d’administrateur
              </MenuItem>
            )}
            <MenuItem
              icon={KeyRound}
              onClick={() =>
                void run(user.hasPassword ? 'Lien de réinitialisation envoyé' : 'Invitation envoyée', () => api(`/api/admin/users/${user.id}/invite`, { method: 'POST' }))
              }
            >
              {user.hasPassword ? 'Envoyer un lien de réinitialisation' : 'Envoyer une invitation'}
            </MenuItem>
            {!isSelf && (
              <MenuItem
                icon={Trash2}
                danger
                onClick={async () => {
                  if (
                    await confirm({
                      title: `Supprimer le compte de ${name} ?`,
                      body: 'Le profil, ses annonces, ses témoignages et ses préférences seront définitivement supprimés.',
                      confirmLabel: 'Supprimer définitivement',
                      requireText: 'SUPPRIMER',
                    })
                  )
                    void run('Compte supprimé', () => api(`/api/admin/users/${user.id}`, { method: 'DELETE' }))
                }}
              >
                Supprimer le compte…
              </MenuItem>
            )}
          </ul>
        )}
      </div>
    </div>
  )
}

function MenuItem({ icon: Icon, children, onClick, href, danger }: { icon: typeof Check; children: React.ReactNode; onClick?: () => void; href?: string; danger?: boolean }) {
  const className = cn('flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm', danger ? 'text-red hover:bg-red-soft' : 'text-ink-soft hover:bg-paper-sunken hover:text-ink')
  return (
    <li>
      {href ? (
        <Link href={href} className={className}>
          <Icon className="size-4" aria-hidden="true" /> {children}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className={className}>
          <Icon className="size-4" aria-hidden="true" /> {children}
        </button>
      )}
    </li>
  )
}
