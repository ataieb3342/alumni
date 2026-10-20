'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { Spinner } from '@/app/components/ui/Spinner'
import type { OAuthProvider } from '@/lib/auth/providers'

export type { OAuthProvider }

const LABELS: Record<OAuthProvider, string> = { google: 'Google', linkedin: 'LinkedIn' }

function ProviderIcon({ provider }: { provider: OAuthProvider }) {
  if (provider === 'google') {
    return (
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.5 10.5 0 0 0 12 1 11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path fill="#0A66C2" d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  )
}

export function OAuthButtons({ providers, mode, callbackUrl }: { providers: OAuthProvider[]; mode: 'signin' | 'signup'; callbackUrl: string }) {
  const [loading, setLoading] = useState<OAuthProvider | null>(null)
  if (providers.length === 0) return null
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-sm text-ink-muted">
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
        {mode === 'signin' ? 'ou se connecter avec' : "ou s'inscrire avec"}
        <span className="h-px flex-1 bg-line" aria-hidden="true" />
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {providers.map((provider) => (
          <button
            key={provider}
            type="button"
            disabled={loading !== null}
            onClick={() => {
              setLoading(provider)
              void signIn(provider, { callbackUrl }).catch(() => setLoading(null))
            }}
            className="inline-flex h-11 items-center justify-center gap-2.5 rounded-[var(--radius-sm)] border border-line-strong/60 bg-paper-raised font-semibold text-ink shadow-[0_2px_0_0_var(--line)] transition hover:border-ink disabled:opacity-60 focus-visible:outline-none focus-visible:shadow-[var(--focus-ring)]"
          >
            {loading === provider ? <Spinner className="size-5" /> : <ProviderIcon provider={provider} />}
            {LABELS[provider]}
          </button>
        ))}
      </div>
    </div>
  )
}
