'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Session } from 'next-auth'
import { Home, BookOpen, Users, Megaphone, Settings, Info, LogOut, LogIn, Menu, X } from 'lucide-react'

interface MobileMenuProps {
  session: Session | null
}

export default function MobileMenu({ session }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  return (
    <div className="md:hidden">
      {/* Burger Button */}
      <button
        onClick={toggleMenu}
        className="relative z-50 p-2 text-slate-300 hover:bg-slate-800 hover:text-cyan-400 rounded-lg transition-colors"
        aria-label="Menu"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 z-30 backdrop-blur-sm"
          onClick={closeMenu}
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-slate-900 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header du menu */}
          <div className="p-6 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900">
            <h2 className="text-xl font-bold text-white">Menu</h2>
            <p className="text-cyan-400 text-sm mt-1">VH Besançon Alumni</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-4">
            <div className="space-y-1">
              <Link
                href={session ? "/accueil" : "/"}
                onClick={closeMenu}
                className="flex items-center space-x-3 py-3 px-4 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors group"
              >
                <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Accueil</span>
              </Link>
              <Link
                href="/blog"
                onClick={closeMenu}
                className="flex items-center space-x-3 py-3 px-4 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors group"
              >
                <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Blog</span>
              </Link>
              {session && (
                <>
                  <div className="pt-2 pb-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 pb-2">
                      Espace membre
                    </p>
                  </div>
                  <Link
                    href="/annuaire"
                    onClick={closeMenu}
                    className="flex items-center space-x-3 py-3 px-4 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors group"
                  >
                    <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Annuaire</span>
                  </Link>
                  <Link
                    href="/annonces"
                    onClick={closeMenu}
                    className="flex items-center space-x-3 py-3 px-4 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors group"
                  >
                    <Megaphone className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Annonces</span>
                  </Link>
                  <Link
                    href="/parametres"
                    onClick={closeMenu}
                    className="flex items-center space-x-3 py-3 px-4 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors group"
                  >
                    <Settings className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Paramètres</span>
                  </Link>
                  <Link
                    href="/a-propos"
                    onClick={closeMenu}
                    className="flex items-center space-x-3 py-3 px-4 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-colors group"
                  >
                    <Info className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">À propos</span>
                  </Link>
                </>
              )}
            </div>
          </nav>

          {/* Footer du menu */}
          <div className="p-4 border-t border-slate-700 bg-slate-800">
            {session ? (
              <div className="space-y-3">
                <div className="px-2">
                  <p className="text-sm font-medium text-white">{session.user?.name}</p>
                  <p className="text-xs text-slate-400">{session.user?.email}</p>
                </div>
                <form action="/api/auth/signout" method="POST">
                  <button
                    type="submit"
                    onClick={closeMenu}
                    className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-red-500/10 text-red-400 rounded-lg font-medium hover:bg-red-500/20 transition-colors group border border-red-500/20"
                  >
                    <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Déconnexion</span>
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/connexion"
                onClick={closeMenu}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg"
              >
                <LogIn className="w-5 h-5" />
                <span>Connexion</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
