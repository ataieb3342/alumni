'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { z } from 'zod'
import { toast } from 'sonner'
import { api } from '@/lib/client/api'
import { useForm } from '@/lib/client/useForm'
import { passwordSchema } from '@/lib/validations'
import { Alert } from '@/app/components/ui/Alert'
import { Button } from '@/app/components/ui/Button'
import { Field } from '@/app/components/ui/Field'
import { PasswordInput, PasswordRules } from './PasswordField'

const schema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, { message: 'Les mots de passe ne correspondent pas', path: ['confirmPassword'] })

/** Choix d'un nouveau mot de passe à partir d'un lien reçu par e-mail (réinitialisation ou invitation) */
export function NewPasswordForm({ token, endpoint, successUrl, submitLabel }: { token: string; endpoint: string; successUrl: string; submitLabel: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const form = useForm(schema, { password: '', confirmPassword: '' })

  if (!token) {
    return (
      <Alert tone="error" title="Lien incomplet">
        Ce lien ne contient pas de jeton. Utilisez le lien reçu par e-mail ou{' '}
        <Link href="/mot-de-passe-oublie" className="link-ink font-semibold">
          demandez-en un nouveau
        </Link>
        .
      </Alert>
    )
  }

  return (
    <form
      noValidate
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault()
        if (!form.validate()) return
        setLoading(true)
        try {
          await api(endpoint, { body: { token, password: form.values.password } })
          toast.success('Mot de passe enregistré')
          router.push(successUrl)
        } catch (error) {
          form.applyServerError(error)
          setLoading(false)
        }
      }}
    >
      {form.formError && (
        <Alert tone="error">
          {form.formError}{' '}
          <Link href="/mot-de-passe-oublie" className="link-ink font-semibold">
            Demander un nouveau lien
          </Link>
        </Alert>
      )}
      <Field label="Nouveau mot de passe" required error={form.error('password')}>
        <PasswordInput autoComplete="new-password" autoFocus {...form.bind('password')} />
      </Field>
      <PasswordRules value={form.values.password} />
      <Field label="Confirmer le mot de passe" required error={form.error('confirmPassword')}>
        <PasswordInput autoComplete="new-password" {...form.bind('confirmPassword')} />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={loading} loadingLabel="Enregistrement…">
        {submitLabel}
      </Button>
    </form>
  )
}
