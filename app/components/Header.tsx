import Link from 'next/link'
import Image from 'next/image'
import { auth } from '@/lib/auth'
import UserMenu from './UserMenu'

export default async function Header() {
  const session = await auth()

  return (
    <header className="bg-gradient-to-r from-blue-900 via-blue-700 to-blue-500 text-white">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-4">
            <div className="bg-white p-2 rounded">
              <Image
                src="/images/logo.jpg"
                alt="VH Besançon Alumni Logo"
                width={60}
                height={60}
                className="object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold">VH Besançon Alumni</h1>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="hover:text-blue-200 transition">
              Accueil
            </Link>
            <Link href="/blog" className="hover:text-blue-200 transition font-semibold">
              Blog
            </Link>
            {session && (
              <>
                <Link href="/annuaire" className="hover:text-blue-200 transition">
                  Annuaire
                </Link>
                <Link href="/dashboard" className="hover:text-blue-200 transition">
                  Dashboard
                </Link>
              </>
            )}
            {!session ? (
              <Link href="/connexion" className="bg-white text-blue-900 px-4 py-2 rounded font-semibold hover:bg-blue-50 transition">
                Connexion
              </Link>
            ) : (
              <UserMenu user={session.user} />
            )}
          </nav>

          {/* Barre de recherche */}
          <div className="hidden lg:flex items-center">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher..."
                className="bg-blue-800 text-white placeholder-blue-300 px-4 py-2 pr-10 rounded border-2 border-blue-600 focus:outline-none focus:border-blue-400"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-white">
                🔍
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}