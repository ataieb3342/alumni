'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

interface HeroSectionProps {
  title?: string
  subtitle?: string
  showButtons?: boolean
  backgroundImage?: string
  sideImage?: string
}

export default function HeroSection({
  title,
  subtitle,
  showButtons = true,
  backgroundImage = '/images/lycee-victor-hugo.jpg',
  sideImage = '/images/lvh-facade-640x360.jpg'
}: HeroSectionProps = {}) {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Mode page d'accueil publique (par défaut)
  const isPublicHome = !title && !subtitle

  return (
    <section className={`relative text-white overflow-hidden ${isPublicHome ? 'min-h-[600px] md:min-h-[700px]' : 'py-20'}`}>
      {/* Image de fond avec overlay */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translateY(${scrollY * 0.5}px)`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        <Image
          src={backgroundImage}
          alt="Lycée Victor Hugo"
          fill
          className="object-cover object-bottom"
          priority
        />
        {/* Overlay avec gradient bleu et opacité */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-indigo-900/75 to-blue-800/80"></div>
        {/* Effet de texture */}
        <div className="absolute inset-0 bg-dots opacity-40" aria-hidden="true"></div>
      </div>

      {/* Contenu */}
      <div
        className={`relative z-10 max-w-7xl mx-auto px-6 ${isPublicHome ? 'py-24 md:py-32' : ''}`}
        style={{
          opacity: Math.max(0, 1 - scrollY / 400),
          transform: `translateY(${scrollY * 0.2}px)`,
          transition: 'opacity 0.1s ease-out, transform 0.1s ease-out'
        }}
      >
        {isPublicHome ? (
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {/* Badge décoratif */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400"></span>
                </span>
                Réseau d&apos;alumni depuis 2022
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-white via-blue-50 to-white bg-clip-text text-transparent drop-shadow-lg">
                  VH Besançon
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-200 via-indigo-200 to-blue-100 bg-clip-text text-transparent">
                  Alumni
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-blue-50 leading-relaxed font-light">
                L&apos;association qui{' '}
                <span className="font-semibold text-white">connecte</span> élèves actuels, anciens élèves et personnels
                du Lycée Victor Hugo de Besançon
              </p>

              {showButtons && (
                <>
                  <div className="flex flex-wrap gap-4 pt-6">
                    <Link
                      href="/inscription"
                      className="group inline-flex items-center gap-2 bg-white text-blue-900 hover:bg-blue-50 px-8 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-2xl hover:shadow-blue-500/50"
                    >
                      Créer mon compte
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                    </Link>
                    <Link
                      href="/connexion"
                      className="group inline-flex items-center gap-2 bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 border-2 border-white/30 hover:border-white/50"
                    >
                      Se connecter
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                    </Link>
                  </div>

                  <div className="flex items-center gap-2 pt-2 text-sm text-blue-100">
                    <CheckCircle2 className="w-5 h-5 text-green-400" aria-hidden="true" />
                    Adhésion gratuite
                  </div>
                </>
              )}
            </div>

            <div className="relative hidden md:block">
              <div className="relative h-[450px] rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20 transition-transform duration-500">
                <Image
                  src={sideImage}
                  alt="Lycée Victor Hugo"
                  fill
                  className="object-cover"
                  priority
                />
                {/* Overlay décoratif sur l'image */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent"></div>
              </div>
              {/* Éléments décoratifs flottants */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl animate-pulse" aria-hidden="true"></div>
              <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} aria-hidden="true"></div>
            </div>
          </div>
        ) : (
          // Mode page interne (blog, annuaire, annonces)
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              {title}
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              {subtitle}
            </p>
            <div className="mt-8 flex justify-center">
              <div className="w-24 h-1 bg-blue-400 rounded-full"></div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
