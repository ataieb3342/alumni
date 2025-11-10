import { NextResponse } from 'next/server'
import { serverClient } from '@/sanity/lib/server-client'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      )
    }

    // Récupérer le statut du compte
    const user = await serverClient.fetch(
      `*[_type == "user" && email == $email][0]{
        accountStatus
      }`,
      { email }
    )

    if (!user) {
      return NextResponse.json({ accountStatus: null })
    }

    return NextResponse.json({ accountStatus: user.accountStatus })
  } catch (error) {
    console.error('Erreur lors de la vérification du statut:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la vérification' },
      { status: 500 }
    )
  }
}
