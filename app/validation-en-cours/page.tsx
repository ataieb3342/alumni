import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Hourglass, MailCheck } from 'lucide-react'
import { auth } from '@/lib/auth'
import { buttonClasses } from '@/app/components/ui/Button'

export const metadata: Metadata = { title: 'Validation en cours' }

export default async function ValidationPendingPage() {
  const session = await auth()
  if (session?.user?.accountStatus === 'active' && !session.user.id?.startsWith('temp-')) redirect('/accueil')
  const disabled = session?.user?.accountStatus === 'suspended' || session?.user?.accountStatus === 'inactive'

  return (
    <div className="bg-seyes">
      <div className="container-page py-16 sm:py-24">
        <div className="mx-auto max-w-xl rounded-[var(--radius-lg)] border border-line bg-paper-raised p-8 text-center shadow-[var(--shadow-md)] sm:p-12">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-highlight text-on-highlight">
            <Hourglass className="size-8" aria-hidden="true" />
          </span>
          <h1 className="mt-6 font-display-tight text-4xl text-ink">{disabled ? 'Compte désactivé' : 'Validation en cours'}</h1>
          <p className="mt-4 text-lg text-ink-soft">
            {disabled
              ? 'Ce compte a été désactivé par un administrateur. Écrivez-nous si vous pensez que c’est une erreur.'
              : 'Votre compte a bien été créé ! Un membre du bureau va examiner votre demande d’inscription.'}
          </p>
          {!disabled && (
            <p className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-blue-soft px-4 py-3 text-ink">
              <MailCheck className="size-5 shrink-0 text-blue" aria-hidden="true" />
              Vous recevrez un e-mail dès que votre compte sera validé.
            </p>
          )}
          {session?.user && (
            <dl className="mt-6 space-y-1 text-sm text-ink-muted">
              <div>
                <dt className="inline">Inscrit en tant que : </dt>
                <dd className="inline font-semibold text-ink">{session.user.name}</dd>
              </div>
              <div>
                <dt className="inline">E-mail : </dt>
                <dd className="inline font-semibold text-ink">{session.user.email}</dd>
              </div>
            </dl>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/connexion" className={buttonClasses('primary')}>
              Retour à la connexion
            </Link>
            <a href="mailto:contact@vh-besancon-alumni.fr" className={buttonClasses('secondary')}>
              Nous écrire
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
