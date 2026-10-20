'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { RotateCcw } from 'lucide-react'
import * as Sentry from '@sentry/nextjs'
import { Button, buttonClasses } from './components/ui/Button'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="container-page py-20">
      <div className="mx-auto max-w-xl text-center">
        <p className="font-hand text-3xl text-red">Oups, une rature…</p>
        <h1 className="mt-2 font-display-tight text-4xl text-ink">Une erreur est survenue</h1>
        <p className="mt-4 text-lg text-ink-soft">Désolé, quelque chose s’est mal passé. Réessayez ; si le problème persiste, écrivez-nous.</p>
        {process.env.NODE_ENV === 'development' && <pre className="mt-6 overflow-x-auto rounded-[var(--radius-md)] bg-paper-sunken p-4 text-left text-xs text-red">{error.message}</pre>}
        {error.digest && <p className="mt-3 text-xs text-ink-muted">Référence : {error.digest}</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button onClick={reset} icon={<RotateCcw className="size-4" aria-hidden="true" />}>
            Réessayer
          </Button>
          <Link href="/" className={buttonClasses('secondary')}>
            Retour à l’accueil
          </Link>
          <a href="mailto:contact@vh-besancon-alumni.fr" className={buttonClasses('ghost')}>
            Nous écrire
          </a>
        </div>
      </div>
    </div>
  )
}
