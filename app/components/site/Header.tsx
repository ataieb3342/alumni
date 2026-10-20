import { auth } from '@/lib/auth'
import { ButtonLink } from '@/app/components/ui/Button'
import { Logo } from './Logo'
import { NavLinks, type NavItem } from './NavLinks'
import { MobileNav } from './MobileNav'
import { UserMenu, type MenuUser } from './UserMenu'
import { ThemeToggle } from './ThemeToggle'

const MEMBER_NAV: NavItem[] = [
  { href: '/accueil', label: 'Accueil' },
  { href: '/annuaire', label: 'Annuaire', primary: true },
  { href: '/annonces', label: 'Annonces' },
  { href: '/temoignages', label: 'Témoignages' },
  { href: '/blog', label: 'Blog' },
]

const VISITOR_NAV: NavItem[] = [
  { href: '/', label: 'Accueil' },
  { href: '/blog', label: 'Blog' },
  { href: '/a-propos', label: 'À propos' },
]

/** En-tête unique : la navigation s'adapte au visiteur ou au membre connecté */
export default async function Header() {
  const session = await auth()
  const isMember = !!session?.user?.id && !session.user.id.startsWith('temp-') && session.user.accountStatus === 'active'
  const user: MenuUser | null = isMember
    ? {
        name: session!.user.name ?? '',
        firstName: session!.user.firstName ?? '',
        lastName: session!.user.lastName ?? '',
        email: session!.user.email ?? '',
        image: session!.user.image ?? null,
        userType: session!.user.userType,
        role: session!.user.role,
      }
    : null
  const items = isMember ? [...MEMBER_NAV, { href: '/a-propos', label: 'À propos' }] : VISITOR_NAV

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur-md supports-[backdrop-filter]:bg-paper/80">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo href={isMember ? '/accueil' : '/'} />
        <nav aria-label="Navigation principale" className="hidden lg:block">
          <NavLinks items={isMember ? MEMBER_NAV : VISITOR_NAV} />
        </nav>
        <div className="flex items-center gap-1.5">
          <ThemeToggle className="hidden lg:inline-flex" />
          {user ? (
            <div className="hidden lg:block">
              <UserMenu user={user} />
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <ButtonLink href="/connexion" variant="ghost" size="sm">
                Se connecter
              </ButtonLink>
              <ButtonLink href="/inscription" size="sm">
                Adhérer
              </ButtonLink>
            </div>
          )}
          <MobileNav items={items} user={user} />
        </div>
      </div>
    </header>
  )
}
