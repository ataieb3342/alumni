'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function AlumniContent() {
  useEffect(() => {
    // Écouter les messages du widget HelloAsso
    const handleMessage = (event: MessageEvent) => {
      if (event.data.height) {
        const haWidgetElement = document.getElementById('haWidget') as HTMLIFrameElement
        if (haWidgetElement) {
          haWidgetElement.style.height = event.data.height + 'px'
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
      {/* Animations de fond */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Header avec logo */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-lg rounded-2xl mb-6 shadow-2xl">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 leading-tight tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300">
              VH Besançon Alumni
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-purple-100 font-medium max-w-2xl mx-auto">
            Parce que tu as aussi galéré avec ton orientation
          </p>
        </div>

        {/* Réseaux sociaux en évidence */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12 animate-slide-up">
          <a
            href="https://www.instagram.com/vh_besancon_alumni/"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-gradient-to-br from-pink-500 via-purple-500 to-orange-400 hover:from-pink-600 hover:via-purple-600 hover:to-orange-500 rounded-2xl px-8 py-4 transition-all duration-300 hover:scale-110 shadow-2xl hover:shadow-pink-500/50"
          >
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span className="text-white font-bold text-lg">Instagram</span>
            </div>
          </a>
          <a
            href="https://www.linkedin.com/company/vh-besancon-alumni/"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-2xl px-8 py-4 transition-all duration-300 hover:scale-110 shadow-2xl hover:shadow-blue-500/50"
          >
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span className="text-white font-bold text-lg">LinkedIn</span>
            </div>
          </a>
        </div>

        {/* Section avantages */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
            <div className="w-14 h-14 bg-yellow-400/20 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Guide les élèves actuels</h3>
            <p className="text-purple-100">Aide-les dans leur orientation, propose des stages, partage ton expérience</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
            <div className="w-14 h-14 bg-green-400/20 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Retrouve tes camarades</h3>
            <p className="text-purple-100">Reconnecte avec tes anciens et développe ton réseau professionnel</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
            <div className="w-14 h-14 bg-pink-400/20 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Crée du lien</h3>
            <p className="text-purple-100">Événements entre anciens, rencontres avec les élèves, transmission</p>
          </div>
        </div>

        {/* CTA principal */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden max-w-4xl mx-auto animate-fade-in-up">
          <div className="p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 text-sm text-green-700 font-semibold bg-green-100 px-5 py-2 rounded-full mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Adhésion 100% gratuite
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Aide la prochaine génération
              </h2>
              <p className="text-lg text-gray-600 mb-2">
                Tu te souviens du stress du post-bac ? Des galères pour trouver un stage ? Aujourd&apos;hui, tu peux aider ceux qui vivent la même chose.
              </p>
              <div className="inline-flex items-center gap-2 text-sm text-blue-600 font-semibold bg-blue-50 px-4 py-2 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Inscription en 2 minutes
              </div>
            </div>

            {/* Widget HelloAsso */}
            <div className="mb-8">
              <iframe
                id="haWidget"
                allowTransparency={true}
                src="https://www.helloasso.com/associations/vh-besancon-alumni/adhesions/formulaire-d-adhesion/widget"
                style={{ width: '100%', border: 'none', minHeight: '600px' }}
              />
            </div>

            {/* Après adhésion */}
            <div className="text-center pt-6 border-t border-gray-200 space-y-4">
              <div>
                <p className="text-gray-600 mb-4 font-medium">Tu viens d&apos;adhérer ? Crée ton compte maintenant !</p>
                <Link
                  href="/inscription"
                  className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
                >
                  Créer mon compte
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>

              <div className="text-sm text-gray-500">
                Déjà un compte ? <Link href="/connexion" className="text-blue-600 hover:text-blue-700 font-semibold">Se connecter</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer contact */}
        <div className="text-center mt-12">
          <div className="text-purple-100">
            <p className="mb-2">Une question ?</p>
            <a href="mailto:contact@vh-besancon-alumni.fr" className="text-white font-semibold hover:text-yellow-300 transition-colors">
              contact@vh-besancon-alumni.fr
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(60px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 1s ease-out 0.3s both;
        }

        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out 0.5s both;
        }

        .delay-700 {
          animation-delay: 700ms;
        }

        .delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </div>
  )
}
