import { NextResponse } from 'next/server'
import { serverClient } from '@/sanity/lib/server-client'
import { auth } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      userId, 
      firstName, 
      lastName, 
      phone, 
      promotionYear, 
      currentStudies,
      currentJob,
      company,
      linkedIn,
      bio,
      isVisibleInDirectory
    } = body

    // Vérifier que l'utilisateur modifie bien son propre profil
    const user = await serverClient.fetch(
      `*[_type == "user" && _id == $userId && email == $email][0]`,
      { userId, email: session.user.email }
    )

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé ou non autorisé' },
        { status: 403 }
      )
    }

    // Mettre à jour l'utilisateur
    await serverClient
      .patch(userId)
      .set({
        firstName,
        lastName,
        phone,
        promotionYear: promotionYear ? parseInt(promotionYear) : undefined,
        currentStudies,
        currentJob,
        company,
        linkedIn,
        bio,
        isVisibleInDirectory,
      })
      .commit()

    return NextResponse.json(
      { message: 'Profil mis à jour avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    )
  }
}