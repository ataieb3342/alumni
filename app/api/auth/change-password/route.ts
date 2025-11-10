import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { serverClient } from '@/sanity/lib/server-client'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    // Vérifier l'authentification
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Mot de passe actuel et nouveau mot de passe requis' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      )
    }

    // Récupérer l'utilisateur
    const user = await serverClient.fetch(
      `*[_type == "user" && _id == $userId][0]{ _id, password }`,
      { userId: session.user.id }
    )

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier le mot de passe actuel
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Mot de passe actuel incorrect' },
        { status: 400 }
      )
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Mettre à jour le mot de passe
    await serverClient
      .patch(user._id)
      .set({ password: hashedPassword })
      .commit()

    return NextResponse.json(
      { message: 'Mot de passe modifié avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}
