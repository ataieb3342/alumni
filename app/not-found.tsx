import Link from 'next/link'
import { buttonClasses } from './components/ui/Button'

export default function NotFound() {
  return (
    <div className="bg-seyes">
      <div className="container-page py-20 sm:py-28">
        <div className="mx-auto max-w-xl text-center">
          <p className="font-display-tight text-[7rem] leading-none text-blue" aria-hidden="true">
            404
          </p>
          <h1 className="mt-2 font-display-tight text-4xl text-ink">Page introuvable</h1>
          <p className="mt-4 text-lg text-ink-soft">Cette page n’existe pas, ou plus. Elle a peut-être été déplacée, ou l’annonce a expiré.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className={buttonClasses('primary')}>
              Retour à l’accueil
            </Link>
            <Link href="/annuaire" className={buttonClasses('secondary')}>
              Ouvrir l’annuaire
            </Link>
          </div>
          <nav aria-label="Liens utiles" className="mt-10 border-t border-line pt-6">
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
              {[
                ['/annonces', 'Annonces'],
                ['/temoignages', 'Témoignages'],
                ['/blog', 'Blog'],
                ['/a-propos', 'À propos'],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="link-ink">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  )
}
