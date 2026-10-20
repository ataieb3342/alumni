'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { z } from 'zod'
import { toast } from 'sonner'
import { useForm } from '@/lib/client/useForm'
import { Alert } from '@/app/components/ui/Alert'
import { Button } from '@/app/components/ui/Button'
import { Field, Input } from '@/app/components/ui/Field'
import { PasswordInput } from '@/app/components/auth/PasswordField'
import { OAuthButtons, type OAuthProvider } from '@/app/components/auth/OAuthButtons'

const schema = z.object({
  email: z.string().trim().min(1, 'Indiquez votre e-mail').email('Cet e-mail ne semble pas valide'),
  password: z.string().min(1, 'Indiquez votre mot de passe'),
})

const MESSAGES: Record<string, string> = {
  invalid_credentials: 'Email ou mot de passe incorrect',
  oauth_account:
    "Ce compte n'a pas de mot de passe : connectez-vous avec Google ou LinkedIn, ou définissez-en un avec « Mot de passe oublié ».",
  pending_validation:
    'Votre compte est en attente de validation par un administrateur. Vous recevrez un email une fois votre compte validé.',
  account_disabled: "Ce compte est désactivé. Écrivez-nous à contact@vh-besancon-alumni.fr si c'est une erreur.",
  rate_limited: 'Trop de tentatives. Réessayez dans une minute.',
}

export function LoginForm({ callbackUrl, providers, notice }: { callbackUrl: string; providers: OAuthProvider[]; notice?: string }) {
  const router = useRouter()
  const form = useForm(schema, { email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.validate()) return
    setLoading(true)
    try {
      // Un seul aller-retour : le serveur renvoie un code d'erreur précis
      const result = await signIn('credentials', { email: form.values.email.trim(), password: form.values.password, redirect: false })
      if (result?.error) {
        form.setFormError(MESSAGES[result.code ?? ''] ?? MESSAGES.invalid_credentials)
        setLoading(false)
        return
      }
      toast.success('Connexion réussie')
      router.push(callbackUrl)
      router.refresh()
    } catch {
      form.setFormError('Connexion impossible pour le moment. Réessayez dans un instant.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {notice && <Alert tone="success">{notice}</Alert>}
      {form.formError && <Alert tone="error">{form.formError}</Alert>}
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Email" error={form.error('email')}>
          <Input type="email" autoComplete="email" inputMode="email" placeholder="prenom.nom@exemple.fr" {...form.bind('email')} />
        </Field>
        <Field
          label="Mot de passe"
          error={form.error('password')}
          labelExtra={
            <Link href="/mot-de-passe-oublie" className="link-ink text-sm font-semibold">
              Mot de passe oublié ?
            </Link>
          }
        >
          <PasswordInput autoComplete="current-password" {...form.bind('password')} />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={loading} loadingLabel="Connexion…">
          Se connecter
        </Button>
      </form>
      <OAuthButtons providers={providers} mode="signin" callbackUrl={callbackUrl} />
      <p className="text-center text-ink-soft">
        Pas encore de compte ?{' '}
        <Link href="/inscription" className="link-ink font-semibold">
          Adhérer gratuitement
        </Link>
      </p>
    </div>
  )
}
