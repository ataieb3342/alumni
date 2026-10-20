'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { z } from 'zod'
import { toast } from 'sonner'
import { api, ApiError } from '@/lib/client/api'
import { useForm } from '@/lib/client/useForm'
import { changePasswordSchema } from '@/lib/validations'
import { Alert } from '@/app/components/ui/Alert'
import { Button } from '@/app/components/ui/Button'
import { useConfirm } from '@/app/components/ui/Dialog'
import { Field, Switch } from '@/app/components/ui/Field'
import { PasswordInput, PasswordRules } from '@/app/components/auth/PasswordField'

const passwordFormSchema = changePasswordSchema
  .extend({ confirmPassword: z.string() })
  .refine((data) => data.newPassword === data.confirmPassword, { message: 'Les mots de passe ne correspondent pas', path: ['confirmPassword'] })

export function PasswordPanel({ hasPassword }: { hasPassword: boolean }) {
  const [loading, setLoading] = useState(false)
  const form = useForm(passwordFormSchema, { currentPassword: '', newPassword: '', confirmPassword: '' })

  if (!hasPassword) {
    return (
      <Alert tone="info" title="Pas encore de mot de passe">
        Vous vous connectez avec Google ou LinkedIn. Pour ajouter un mot de passe, utilisez{' '}
        <a href="/mot-de-passe-oublie" className="link-ink font-semibold">
          « Mot de passe oublié »
        </a>{' '}
        avec votre adresse e-mail.
      </Alert>
    )
  }

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault()
        if (!form.validate()) return
        setLoading(true)
        try {
          await api('/api/auth/change-password', { body: { currentPassword: form.values.currentPassword, newPassword: form.values.newPassword } })
          toast.success('Mot de passe modifié')
          form.set('currentPassword', '')
          form.set('newPassword', '')
          form.set('confirmPassword', '')
        } catch (error) {
          form.applyServerError(error)
        } finally {
          setLoading(false)
        }
      }}
    >
      {form.formError && <Alert tone="error">{form.formError}</Alert>}
      <Field label="Mot de passe actuel" required error={form.error('currentPassword')}>
        <PasswordInput autoComplete="current-password" {...form.bind('currentPassword')} />
      </Field>
      <Field label="Nouveau mot de passe" required error={form.error('newPassword')}>
        <PasswordInput autoComplete="new-password" {...form.bind('newPassword')} />
      </Field>
      <PasswordRules value={form.values.newPassword} />
      <Field label="Confirmer le nouveau mot de passe" required error={form.error('confirmPassword')}>
        <PasswordInput autoComplete="new-password" {...form.bind('confirmPassword')} />
      </Field>
      <Button type="submit" loading={loading} loadingLabel="Modification…">
        Changer le mot de passe
      </Button>
    </form>
  )
}

export function NewsletterPanel({ initial }: { initial: { generalNewsletter: boolean; announcementsNewsletter: boolean } }) {
  const [preferences, setPreferences] = useState(initial)
  const [saving, setSaving] = useState<string | null>(null)

  // Enregistrement immédiat à chaque bascule : pas de bouton à oublier
  const toggle = async (key: keyof typeof preferences, value: boolean) => {
    const previous = preferences
    const next = { ...preferences, [key]: value }
    setPreferences(next)
    setSaving(key)
    try {
      await api('/api/user/preferences', { body: { preferences: next } })
      toast.success(value ? 'Abonnement activé' : 'Abonnement désactivé')
    } catch (error) {
      setPreferences(previous)
      toast.error(error instanceof ApiError ? error.message : 'Enregistrement impossible')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-5">
      <Switch
        label="Newsletter générale"
        description="Actualités de l’association, événements et informations importantes (envoi périodique)"
        checked={preferences.generalNewsletter}
        disabled={saving !== null}
        onChange={(value) => void toggle('generalNewsletter', value)}
      />
      <Switch
        label="Notifications des annonces"
        description="Un e-mail à chaque nouvelle annonce publiée (emplois, stages, opportunités)"
        checked={preferences.announcementsNewsletter}
        disabled={saving !== null}
        onChange={(value) => void toggle('announcementsNewsletter', value)}
      />
    </div>
  )
}

export function DeleteAccountPanel() {
  const confirm = useConfirm()
  const [busy, setBusy] = useState(false)
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-ink-soft">Votre profil, vos annonces, vos témoignages et vos préférences seront définitivement supprimés.</p>
      <Button
        variant="danger"
        loading={busy}
        onClick={async () => {
          const ok = await confirm({
            title: 'Supprimer mon compte ?',
            body: 'Cette action est définitive et irréversible. Toutes vos données seront perdues : profil, annonces, témoignages, préférences.',
            confirmLabel: 'Supprimer définitivement',
            requireText: 'SUPPRIMER',
          })
          if (!ok) return
          setBusy(true)
          try {
            await api('/api/user/delete', { method: 'DELETE' })
            toast.success('Compte supprimé')
            await signOut({ callbackUrl: '/' })
          } catch (error) {
            toast.error(error instanceof ApiError ? error.message : 'Suppression impossible')
            setBusy(false)
          }
        }}
      >
        Supprimer mon compte
      </Button>
    </div>
  )
}
