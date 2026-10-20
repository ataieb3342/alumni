import Link from 'next/link'
import { ArrowUpRight, Mail, MapPin } from 'lucide-react'
import { getPublishedContent } from '@/lib/data/content'
import { Logo } from './Logo'

const LINKS = [
  {
    title: 'Le réseau',
    items: [
      { href: '/annuaire', label: 'Annuaire' },
      { href: '/annonces', label: 'Annonces' },
      { href: '/temoignages', label: 'Témoignages' },
      { href: '/blog', label: 'Blog' },
    ],
  },
  {
    title: "L'association",
    items: [
      { href: '/a-propos', label: 'À propos' },
      { href: '/inscription', label: 'Adhérer (gratuit)' },
      { href: '/mentions-legales', label: 'Mentions légales' },
      { href: '/politique-confidentialite', label: 'Confidentialité' },
    ],
  },
]

/** Pied de page : textes et coordonnées éditables dans Administration › Réglages du site */
export default async function Footer() {
  const site = await getPublishedContent('site')
  return (
    <footer className="bg-wash text-on-wash">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="space-y-4">
          <Logo tone="wash" />
          <p className="max-w-xs text-sm text-on-wash-soft">{site.description}</p>
          <ul className="flex flex-wrap gap-2">
            {site.socials.map((social) => (
              <li key={social.id}>
                <a
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold ring-1 ring-white/20 hover:bg-white/10"
                >
                  {social.label}
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  <span className="sr-only">(nouvel onglet)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        {LINKS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="mb-3 font-sans text-xs font-bold tracking-[0.14em] text-on-wash-soft uppercase">{column.title}</h2>
            <ul className="space-y-2">
              {column.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-on-wash/90 underline-offset-4 hover:text-on-wash hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div className="space-y-3 text-sm">
          <h2 className="mb-3 font-sans text-xs font-bold tracking-[0.14em] text-on-wash-soft uppercase">Contact</h2>
          <p className="flex gap-2">
            <Mail className="mt-0.5 size-4 shrink-0 text-highlight" aria-hidden="true" />
            <a href={`mailto:${site.contactEmail}`} className="break-all underline-offset-4 hover:underline">
              {site.contactEmail}
            </a>
          </p>
          <p className="flex gap-2 whitespace-pre-line text-on-wash-soft">
            <MapPin className="mt-0.5 size-4 shrink-0 text-highlight" aria-hidden="true" />
            {site.address}
          </p>
          <div className="pt-2">
            <p className="font-display text-lg text-on-wash">{site.joinTitle}</p>
            <p className="text-on-wash-soft">{site.joinText}</p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-on-wash-soft sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}
          </p>
          <p>
            <a href={site.creditUrl} target="_blank" rel="noopener noreferrer" className="hover:text-on-wash hover:underline">
              {site.creditLabel}
            </a>
            {site.creditEmail && (
              <>
                {' · '}
                <a href={`mailto:${site.creditEmail}`} className="hover:text-on-wash hover:underline">
                  {site.creditEmail}
                </a>
              </>
            )}
          </p>
        </div>
      </div>
    </footer>
  )
}
