'use client'

import Link from 'next/link'
import { useState } from 'react'
import { MailCheck } from 'lucide-react'
import { api } from '@/lib/client/api'
import { useForm } from '@/lib/client/useForm'
import { forgotPasswordSchema } from '@/lib/validations'
import { Alert } from '@/app/components/ui/Alert'
import { Button } from '@/app/components/ui/Button'
import { Field, Input } from '@/app/components/ui/Field'

export function ForgotForm() {
  const [loading, setLoading] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const form = useForm(forgotPasswordSchema, { email: '' })

  if (sentTo) {
    return (
      <div className="space-y-5 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-success-soft text-success">
          <MailCheck className="size-7" aria-hidden="true" />
        </span>
        <p className="text-ink-soft" role="status">
          Si un compte existe pour <strong className="text-ink">{sentTo}</strong>, un lien de réinitialisation vient d’y être envoyé. Il est valable une heure.
        </p>
        <p className="text-sm text-ink-muted">Pensez à regarder dans les courriers indésirables.</p>
        <Link href="/connexion" className="link-ink font-semibold">
          Retour à la connexion
        </Link>
      </div>
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
          await api('/api/auth/forgot-password', { body: { email: form.values.email.trim() } })
          setSentTo(form.values.email.trim())
        } catch (error) {
          form.applyServerError(error)
        } finally {
          setLoading(false)
        }
      }}
    >
      {form.formError && <Alert tone="error">{form.formError}</Alert>}
      <Field label="Email du compte" required error={form.error('email')}>
        <Input type="email" autoComplete="email" inputMode="email" autoFocus {...form.bind('email')} />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={loading} loadingLabel="Envoi…">
        Recevoir un lien
      </Button>
      <p className="text-center text-ink-soft">
        <Link href="/connexion" className="link-ink font-semibold">
          Retour à la connexion
        </Link>
      </p>
    </form>
  )
}
