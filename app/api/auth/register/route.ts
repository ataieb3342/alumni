import { NextResponse } from 'next/server'
import { serverClient } from '@/sanity/lib/server-client'
import bcrypt from 'bcryptjs'
import { sendAdminNotificationEmail } from '@/lib/email'
import { z } from 'zod'

const registerSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères').max(50, 'Le prénom est trop long').regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'Le prénom contient des caractères invalides'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(50, 'Le nom est trop long').regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'Le nom contient des caractères invalides'),
  email: z.string().email('Email invalide').toLowerCase(),
  password: z.string().min(12, 'Le mot de passe doit contenir au moins 12 caractères').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&)'),
  userType: z.enum(['current_student', 'alumni', 'staff'], { message: 'Type d\'utilisateur invalide' }),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Valider les données avec Zod
    const validation = registerSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.issues[0]
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      )
    }

    const { firstName, lastName, email, password, userType } = validation.data

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