import { NextResponse } from 'next/server'
import { serverClient } from '@/sanity/lib/server-client'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, password, userType } = body

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await serverClient.fetch(
      `*[_type == "user" && email == $email][0]`,
      { email }
    )

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      )
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Créer l'utilisateur dans Sanity
    const newUser = await serverClient.create({
      _type: 'user',
      firstName,
      lastName,
      email,
      password: hashedPassword,
      userType,
      isVisibleInDirectory: userType !== 'current_student', // Les élèves ne sont pas dans l'annuaire par défaut
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json(
      { message: 'Inscription réussie', userId: newUser._id },
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