'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/client/api'
import { useForm } from '@/lib/client/useForm'
import { adminCreateUserSchema } from '@/lib/data/admin-users-schema'
import { Alert } from '@/app/components/ui/Alert'
import { Button } from '@/app/components/ui/Button'
import { Dialog } from '@/app/components/ui/Dialog'
import { Checkbox, Field, Input, Select } from '@/app/components/ui/Field'

/** Ajout d'un compte par un administrateur, avec invitation à choisir un mot de passe */
export function AddUserButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const form = useForm(adminCreateUserSchema, { email: '', firstName: '', lastName: '', userType: 'alumni', role: 'member', sendInvitation: true })
  return (
    <>
      <Button icon={<UserPlus className="size-4" aria-hidden="true" />} onClick={() => setOpen(true)}>
        Ajouter un compte
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Ajouter un compte"
        description="Le compte est actif immédiatement ; la personne reçoit un lien pour choisir son mot de passe (valable 7 jours)."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              loading={busy}
              onClick={async () => {
                if (!form.validate()) return
                setBusy(true)
                try {
                  const result = await api<{ id: string; invited: boolean }>('/api/admin/users', { body: form.values })
                  toast.success(result.invited ? 'Compte créé, invitation envoyée' : 'Compte créé')
                  setOpen(false)
                  router.push(`/admin/utilisateurs/${result.id}`)
                  router.refresh()
                } catch (error) {
                  form.applyServerError(error)
                } finally {
                  setBusy(false)
                }
              }}
            >
              Créer le compte
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {form.formError && <Alert tone="error">{form.formError}</Alert>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prénom" required error={form.error('firstName')}>
              <Input {...form.bind('firstName')} />
            </Field>
            <Field label="Nom" required error={form.error('lastName')}>
              <Input {...form.bind('lastName')} />
            </Field>
          </div>
          <Field label="E-mail" required error={form.error('email')}>
            <Input type="email" {...form.bind('email')} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type de membre">
              <Select value={String(form.values.userType)} onChange={(event) => form.set('userType', event.target.value)}>
                <option value="alumni">Ancien élève</option>
                <option value="prepa">Prépa</option>
                <option value="bts">BTS</option>
                <option value="lyceen">Lycéen</option>
                <option value="staff">Personnel</option>
              </Select>
            </Field>
            <Field label="Rôle">
              <Select value={String(form.values.role)} onChange={(event) => form.set('role', event.target.value)}>
                <option value="member">Membre</option>
                <option value="admin">Administrateur</option>
              </Select>
            </Field>
          </div>
          <Checkbox label="Envoyer l’invitation par e-mail" checked={!!form.values.sendInvitation} onChange={(event) => form.set('sendInvitation', event.target.checked)} />
        </div>
      </Dialog>
    </>
  )
}
