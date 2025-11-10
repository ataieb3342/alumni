'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Home, BookOpen, Menu, X } from 'lucide-react'

export default function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-slate-900 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 flex-shrink-0 group">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden ring-2 ring-slate-700 group-hover:ring-cyan-400 transition-all duration-300">
              <Image
                src="/images/logo.jpg"
                alt="VH Besançon Alumni Logo"
                width={48}
                height={48}
                className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div>
              <h1 className="text-sm sm:text-xl lg:text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                VH Besançon Alumni
              </h1>
              <p className="hidden sm:block text-xs text-slate-400 group-hover:text-cyan-400 -mt-1 transition-colors">Réseau des anciens</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              href="/"
              className="flex items-center space-x-2 px-3 lg:px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-all group"
            >
              <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-sm lg:text-base font-medium">Accueil</span>
            </Link>
            <Link
              href="/a-propos"
              className="flex items-center space-x-2 px-3 lg:px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-all group"
            >
              <BookOpen className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="text-sm lg:text-base font-medium">À propos</span>
            </Link>
            <div className="pl-2 lg:pl-4 border-l border-slate-700">
              <Link
                href="/connexion"
                className="flex items-center px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg hover:shadow-cyan-500/50 text-sm lg:text-base"
              >
                Connexion
              </Link>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-all"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-800">
            <nav className="flex flex-col space-y-2">
              <Link
                href="/"
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home className="w-5 h-5" />
                <span className="font-medium">Accueil</span>
              </Link>
              <Link
                href="/a-propos"
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-cyan-400 transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                <BookOpen className="w-5 h-5" />
                <span className="font-medium">À propos</span>
              </Link>
              <div className="pt-2 border-t border-slate-800">
                <Link
                  href="/connexion"
                  className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Connexion
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
