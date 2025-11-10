import { NextResponse } from 'next/server'
import { serverClient } from '@/sanity/lib/server-client'
import bcrypt from 'bcryptjs'
import { sendAdminNotificationEmail } from '@/lib/email'
import { logActivity, getClientIp, getUserAgent } from '@/lib/activity-logger'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, password, userType } = body

    // Vérifier si l'utilisateur existe déjà (peu importe le statut)
    const existingUser = await serverClient.fetch(
      `*[_type == "user" && email == $email][0]{
        _id,
        accountStatus
      }`,
      { email }
    )

    if (existingUser) {
      // Si un utilisateur existe avec cet email
      if (existingUser.accountStatus === 'pending') {
        return NextResponse.json(
          { error: 'Une demande d\'inscription avec cet email est déjà en cours de validation' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      )
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Créer l'utilisateur dans Sanity avec statut "pending"
    const newUser = await serverClient.create({
      _type: 'user',
      firstName,
      lastName,
      email,
      password: hashedPassword,
      userType,
      accountStatus: 'pending', // L'utilisateur doit être validé par un admin
      isVisibleInDirectory: userType !== 'current_student', // Les élèves ne sont pas dans l'annuaire par défaut
      createdAt: new Date().toISOString(),
    })

    // Envoyer un email de notification aux admins
    try {
      await sendAdminNotificationEmail({
        firstName,
        lastName,
        email,
        userType,
        userId: newUser._id,
      })
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email:', emailError)
      // On continue même si l'email échoue
    }

    // Logger l'activité
    await logActivity({
      userId: newUser._id,
      action: 'signup',
      resource: 'user',
      resourceId: newUser._id,
      details: `Nouvelle inscription: ${firstName} ${lastName} (${userType})`,
      ipAddress: getClientIp(request),
      userAgent: getUserAgent(request),
    })

    return NextResponse.json(
      {
        message: 'Votre demande d\'inscription a été envoyée. Vous recevrez un email une fois votre compte validé par un administrateur.',
        userId: newUser._id
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'inscription' },
      { status: 500 }
    )
  }
}