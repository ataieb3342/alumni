'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { z } from 'zod'
import { toast } from 'sonner'
import { api } from '@/lib/client/api'
import { useForm } from '@/lib/client/useForm'
import { registerSchema } from '@/lib/validations'
import { Alert } from '@/app/components/ui/Alert'
import { Button } from '@/app/components/ui/Button'
import { Field, Input } from '@/app/components/ui/Field'
import { PasswordInput, PasswordRules } from '@/app/components/auth/PasswordField'
import { OAuthButtons, type OAuthProvider } from '@/app/components/auth/OAuthButtons'
import { MemberTypePicker } from '@/app/components/auth/MemberTypePicker'

const schema = registerSchema
  .extend({ confirmPassword: z.string() })
  .refine((data) => data.password === data.confirmPassword, { message: 'Les mots de passe ne correspondent pas', path: ['confirmPassword'] })

export function RegisterForm({ providers }: { providers: OAuthProvider[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const form = useForm(schema, { firstName: '', lastName: '', email: '', userType: 'alumni', password: '', confirmPassword: '' })

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.validate()) {
      toast.error(form.firstError ?? 'Vérifiez le formulaire')
      return
    }
    setLoading(true)
    try {
      const { confirmPassword: _confirm, ...body } = form.values
      await api('/api/auth/register', { body: { ...body, email: body.email.trim().toLowerCase() } })
      toast.success('Demande envoyée ! Votre compte est en attente de validation.')
      router.push('/validation-en-cours')
    } catch (error) {
      form.applyServerError(error)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {form.formError && <Alert tone="error">{form.formError}</Alert>}
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <MemberTypePicker value={form.values.userType as string} onChange={(value) => form.set('userType', value)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom" required error={form.error('firstName')}>
            <Input autoComplete="given-name" {...form.bind('firstName')} />
          </Field>
          <Field label="Nom" required error={form.error('lastName')}>
            <Input autoComplete="family-name" {...form.bind('lastName')} />
          </Field>
        </div>
        <Field label="Email" required error={form.error('email')} hint="Il servira à vous connecter ; il n'est visible que des membres.">
          <Input type="email" autoComplete="email" inputMode="email" {...form.bind('email')} />
        </Field>
        <Field label="Mot de passe" required error={form.error('password')}>
          <PasswordInput autoComplete="new-password" {...form.bind('password')} />
        </Field>
        <PasswordRules value={form.values.password as string} />
        <Field label="Confirmer le mot de passe" required error={form.error('confirmPassword')} success={form.values.confirmPassword && !form.error('confirmPassword') && form.values.confirmPassword === form.values.password ? 'Les mots de passe correspondent' : null}>
          <PasswordInput autoComplete="new-password" {...form.bind('confirmPassword')} />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={loading} loadingLabel="Envoi…">
          Envoyer ma demande d’adhésion
        </Button>
        <p className="text-sm text-ink-muted">
          Un membre du bureau valide chaque inscription (en général sous quelques jours). En adhérant, vous acceptez notre{' '}
          <Link href="/politique-confidentialite" className="link-ink">
            politique de confidentialité
          </Link>
          .
        </p>
      </form>
      <OAuthButtons providers={providers} mode="signup" callbackUrl="/validation-en-cours" />
      <p className="text-center text-ink-soft">
        Déjà un compte ?{' '}
        <Link href="/connexion" className="link-ink font-semibold">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
