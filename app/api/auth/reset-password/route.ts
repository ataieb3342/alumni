import { NextResponse } from 'next/server'
import { serverClient } from '@/sanity/lib/server-client'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token et mot de passe requis' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      )
    }

    // Récupérer le token
    const resetToken = await serverClient.fetch(
      `*[_type == "passwordResetToken" && token == $token && used == false][0]`,
      { token }
    )

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Token invalide ou déjà utilisé' },
        { status: 400 }
      )
    }

    // Vérifier si le token a expiré
    const expiresAt = new Date(resetToken.expiresAt)
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Ce token a expiré. Veuillez demander un nouveau lien.' },
        { status: 400 }
      )
    }

    // Récupérer l'utilisateur
    const user = await serverClient.fetch(
      `*[_type == "user" && email == $email][0]`,
      { email: resetToken.email }
    )

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Mettre à jour le mot de passe de l'utilisateur
    await serverClient
      .patch(user._id)
      .set({ password: hashedPassword })
      .commit()

    // Marquer le token comme utilisé
    await serverClient
      .patch(resetToken._id)
      .set({ used: true })
      .commit()

    return NextResponse.json(
      { message: 'Mot de passe réinitialisé avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}
