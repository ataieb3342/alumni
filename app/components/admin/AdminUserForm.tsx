'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { api, ApiError } from '@/lib/client/api'
import { BOARD_ROLES, STAFF_CATEGORIES } from '@/lib/data/admin-users-schema'
import { cn } from '@/lib/utils'
import { Button } from '@/app/components/ui/Button'
import { Checkbox, Field, Input, Select } from '@/app/components/ui/Field'

export interface AdminEditableUser {
  id: string
  firstName: string
  lastName: string
  userType: string
  role: string
  accountStatus: string
  roleAssociation: string[]
  isVisibleInDirectory: boolean
  promotionYear: number | null
  city: string | null
  staffCategory: string | null
  staffDetails: string | null
}

/** Ce que le Studio permettait de modifier sur un membre : type, statut, rôles, visibilité, infos clés */
export function AdminUserForm({ user, isSelf }: { user: AdminEditableUser; isSelf: boolean }) {
  const router = useRouter()
  const [values, setValues] = useState(user)
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof AdminEditableUser>(key: K, value: AdminEditableUser[K]) => setValues((current) => ({ ...current, [key]: value }))
  const dirty = JSON.stringify(values) !== JSON.stringify(user)

  return (
    <form
      className="space-y-6"
      onSubmit={async (event) => {
        event.preventDefault()
        setBusy(true)
        try {
          const result = await api<{ emailSent?: boolean }>(`/api/admin/users/${user.id}`, {
            method: 'PATCH',
            body: {
              firstName: values.firstName,
              lastName: values.lastName,
              userType: values.userType,
              role: values.role,
              accountStatus: values.accountStatus,
              roleAssociation: values.roleAssociation,
              isVisibleInDirectory: values.isVisibleInDirectory,
              promotionYear: values.promotionYear,
              city: values.city || null,
              staffCategory: values.staffCategory || null,
              staffDetails: values.staffDetails || null,
            },
          })
          toast.success(result.emailSent ? 'Compte mis à jour, e-mail de validation envoyé' : 'Compte mis à jour')
          router.refresh()
        } catch (error) {
          toast.error(error instanceof ApiError ? error.message : 'Enregistrement impossible')
        } finally {
          setBusy(false)
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom">
          <Input value={values.firstName} onChange={(e) => set('firstName', e.target.value)} />
        </Field>
        <Field label="Nom">
          <Input value={values.lastName} onChange={(e) => set('lastName', e.target.value)} />
        </Field>
        <Field label="Statut du compte" hint={user.accountStatus === 'pending' ? 'Passer à « Actif » valide l’inscription et envoie l’e-mail de confirmation.' : undefined}>
          <Select value={values.accountStatus} onChange={(e) => set('accountStatus', e.target.value)} disabled={isSelf}>
            <option value="active">Actif</option>
            <option value="pending">En attente de validation</option>
            <option value="suspended">Suspendu</option>
            <option value="inactive">Inactif</option>
          </Select>
        </Field>
        <Field label="Rôle sur le site">
          <Select value={values.role} onChange={(e) => set('role', e.target.value)}>
            <option value="member">Membre</option>
            <option value="admin">Administrateur</option>
          </Select>
        </Field>
        <Field label="Type de membre">
          <Select value={values.userType} onChange={(e) => set('userType', e.target.value)}>
            <option value="alumni">Ancien élève</option>
            <option value="prepa">Prépa</option>
            <option value="bts">BTS</option>
            <option value="lyceen">Lycéen</option>
            <option value="staff">Personnel</option>
          </Select>
        </Field>
        <Field label="Promotion (année du bac)">
          <Input type="number" value={values.promotionYear ?? ''} onChange={(e) => set('promotionYear', e.target.value ? Number(e.target.value) : null)} />
        </Field>
        <Field label="Ville actuelle">
          <Input value={values.city ?? ''} onChange={(e) => set('city', e.target.value)} />
        </Field>
        {values.userType === 'staff' && (
          <>
            <Field label="Catégorie (personnel)">
              <Select value={values.staffCategory ?? ''} onChange={(e) => set('staffCategory', e.target.value)}>
                <option value="">—</option>
                {STAFF_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Poste">
              <Input value={values.staffDetails ?? ''} onChange={(e) => set('staffDetails', e.target.value)} />
            </Field>
          </>
        )}
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-ink">Rôle dans l’association (bureau, page À propos)</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {BOARD_ROLES.map((role) => {
            const checked = values.roleAssociation.includes(role.value)
            return (
              <label
                key={role.value}
                className={cn('inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold has-[:focus-visible]:shadow-[var(--focus-ring)]', checked ? 'border-blue bg-blue-soft text-blue' : 'border-line text-ink-soft')}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => set('roleAssociation', checked ? values.roleAssociation.filter((r) => r !== role.value) : [...values.roleAssociation, role.value])}
                />
                {role.label}
              </label>
            )
          })}
        </div>
      </fieldset>

      <Checkbox label="Visible dans l’annuaire" checked={values.isVisibleInDirectory} onChange={(e) => set('isVisibleInDirectory', e.target.checked)} />

      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Button variant="ghost" disabled={!dirty || busy} onClick={() => setValues(user)}>
          Annuler les changements
        </Button>
        <Button type="submit" loading={busy} disabled={!dirty}>
          Enregistrer
        </Button>
      </div>
    </form>
  )
}
