import { NextResponse } from 'next/server'
import { serverClient } from '@/sanity/lib/server-client'
import { sendPasswordResetEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      )
    }

    // Normaliser l'email en minuscules pour la comparaison
    const normalizedEmail = email.toLowerCase()

    // Vérifier si l'utilisateur existe
    const user = await serverClient.fetch(
      `*[_type == "user" && email == $email][0]`,
      { email: normalizedEmail }
    )

    // Pour des raisons de sécurité, on renvoie toujours un message de succès
    // même si l'utilisateur n'existe pas (pour éviter l'énumération d'emails)
    if (!user) {
      return NextResponse.json(
        { message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' },
        { status: 200 }
      )
    }

    // Générer un token sécurisé
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 3600000) // 1 heure

    // Invalider les anciens tokens pour cet email
    const oldTokens = await serverClient.fetch(
      `*[_type == "passwordResetToken" && email == $email && used == false]`,
      { email: normalizedEmail }
    )

    for (const oldToken of oldTokens) {
      await serverClient.patch(oldToken._id).set({ used: true }).commit()
    }

    // Créer un nouveau token dans Sanity
    await serverClient.create({
      _type: 'passwordResetToken',
      email: normalizedEmail,
      token,
      expiresAt: expiresAt.toISOString(),
      used: false,
      createdAt: new Date().toISOString(),
    })

    // Envoyer l'email
    const emailResult = await sendPasswordResetEmail(normalizedEmail, token)

    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error)
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}
