import type { Metadata } from 'next'
import Link from 'next/link'
import { requireMemberPage } from '@/lib/auth/session'
import { getPreferences } from '@/lib/data/newsletter'
import { PageHero } from '@/app/components/site/PageHero'
import { DeleteAccountPanel, NewsletterPanel, PasswordPanel } from '@/app/components/settings/SettingsPanels'

export const metadata: Metadata = { title: 'Paramètres' }

export default async function SettingsPage() {
  const user = await requireMemberPage('/parametres')
  const preferences = await getPreferences(user.id)
  return (
    <>
      <PageHero size="sm" eyebrow="Mon compte" title="Paramètres" lead="Connexion, notifications et données personnelles." />
      <div className="container-page py-10">
        <div className="mx-auto max-w-3xl space-y-6">
          <section className="rounded-[var(--radius-lg)] border border-line bg-paper-raised p-5 sm:p-7" aria-labelledby="compte">
            <h2 id="compte" className="text-2xl text-ink">
              Compte
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-semibold text-ink-muted">Nom</dt>
                <dd className="font-semibold text-ink">
                  {user.firstName} {user.lastName}
                </dd>
                <dd className="text-sm text-ink-muted">
                  Modifiable dans{' '}
                  <Link href="/profil" className="link-ink">
                    Mon profil
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-ink-muted">E-mail</dt>
                <dd className="font-semibold break-all text-ink">{user.email}</dd>
                <dd className="text-sm text-ink-muted">Pour le modifier, contactez un administrateur</dd>
              </div>
            </dl>
          </section>
          <section className="rounded-[var(--radius-lg)] border border-line bg-paper-raised p-5 sm:p-7" aria-labelledby="securite">
            <h2 id="securite" className="text-2xl text-ink">
              Sécurité
            </h2>
            <p className="mt-1 mb-5 text-ink-soft">Modifiez votre mot de passe pour sécuriser votre compte.</p>
            <PasswordPanel hasPassword={!!user.passwordHash} />
          </section>
          <section id="newsletter" className="scroll-mt-24 rounded-[var(--radius-lg)] border border-line bg-paper-raised p-5 sm:p-7" aria-labelledby="newsletter-titre">
            <h2 id="newsletter-titre" className="text-2xl text-ink">
              Newsletters
            </h2>
            <p className="mt-1 mb-5 text-ink-soft">Choisissez les e-mails que vous souhaitez recevoir. Enregistré immédiatement.</p>
            <NewsletterPanel initial={preferences} />
          </section>
          <section className="rounded-[var(--radius-lg)] border-2 border-red/40 bg-paper-raised p-5 sm:p-7" aria-labelledby="danger">
            <h2 id="danger" className="text-2xl text-red-strong">
              Supprimer mon compte
            </h2>
            <div className="mt-4">
              <DeleteAccountPanel />
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
