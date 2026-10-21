'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { api, ApiError } from '@/lib/client/api'
import { Alert } from '@/app/components/ui/Alert'
import { Button } from '@/app/components/ui/Button'
import { Spinner } from '@/app/components/ui/Spinner'
import { MemberTypePicker } from '@/app/components/auth/MemberTypePicker'

/** Première connexion OAuth : le compte n'est créé qu'après ce choix */
export function ChooseTypeForm() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userType, setUserType] = useState('alumni')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const submitted = useRef(false)
  const sessionRef = useRef(session)

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  useEffect(() => {
    if (status === 'loading' || submitted.current) return
    if (status === 'unauthenticated') router.push('/connexion')
    else if (status === 'authenticated' && !session?.user?.needsTypeSelection) router.push('/profil')
  }, [status, session, router])

  // Quitter la page sans choisir : on efface la session temporaire
  useEffect(
    () => () => {
      if (!submitted.current && sessionRef.current?.user?.id?.startsWith('temp-')) void signOut({ redirect: false })
    },
    []
  )

  if (status === 'loading') {
    return (
      <p className="flex items-center gap-2 text-ink-muted">
        <Spinner /> Chargement…
      </p>
    )
  }

  return (
    <form
      className="space-y-6"
      onSubmit={async (event) => {
        event.preventDefault()
        setError(null)
        setLoading(true)
        try {
          await api('/api/auth/update-user-type', { body: { userType } })
          submitted.current = true
          toast.success('Demande envoyée ! Votre compte est en attente de validation.')
          await signOut({ redirect: false })
          router.push('/validation-en-cours')
        } catch (err) {
          setError(err instanceof ApiError ? err.message : 'Une erreur est survenue')
          setLoading(false)
        }
      }}
    >
      {error && <Alert tone="error">{error}</Alert>}
      {session?.user?.email && (
        <p className="text-sm text-ink-muted">
          Compte : <strong className="text-ink">{session.user.email}</strong>
        </p>
      )}
      <MemberTypePicker value={userType} onChange={setUserType} />
      <Button type="submit" size="lg" className="w-full" loading={loading} loadingLabel="Envoi…">
        Finaliser mon inscription
      </Button>
    </form>
  )
}
