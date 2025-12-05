'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function PageVisitTracker() {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  useEffect(() => {
    // Ne logger que si l'utilisateur est authentifié et que le status est "authenticated"
    if (status !== 'authenticated' || !session?.user?.id) {
      return
    }

    // Ne pas logger certaines pages sensibles ou inutiles
    const excludedPaths = [
      '/connexion',
      '/inscription',
      '/mot-de-passe-oublie',
      '/reinitialiser-mot-de-passe',
      '/validation-en-cours',
      '/choisir-type',
      '/api',
    ]

    // Vérifier si le chemin actuel doit être exclu
    if (excludedPaths.some(path => pathname?.startsWith(path))) {
      return
    }

    // Logger la visite de la page
    const logPageVisit = async () => {
      try {
        await fetch('/api/activity/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'page_visit',
            resource: pathname,
            details: `Visite de la page ${pathname}`,
          }),
        })
      } catch (error) {
        // Échec silencieux pour ne pas affecter l'expérience utilisateur
        console.debug('Erreur lors du logging de la visite:', error)
      }
    }

    logPageVisit()
  }, [pathname, session?.user?.id, status])

  // Ce composant ne rend rien
  return null
}
