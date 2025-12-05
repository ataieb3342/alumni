import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sendAdminNotificationEmail } from '@/lib/emails'
import { client } from '@/sanity/lib/client'

// Force cette route à utiliser le Node.js runtime (pas edge)
export const runtime = 'nodejs'

export async function POST(_request: NextRequest) {
  try {
    const session = await auth()
    
    // Vérifier que l'utilisateur est connecté et nouvellement inscrit
    if (!session || !session.user?.id || !session.user?.isNewUser) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Récupérer les infos utilisateur depuis Sanity
    const user = await client.fetch(
      `*[_type == "user" && _id == $userId][0]{
        _id,
        firstName,
        lastName,
        email,
        userType,
        oauthProvider
      }`,
      { userId: session.user.id }
    )

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Envoyer l'email à l'admin
    await sendAdminNotificationEmail({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userType: user.userType,
      userId: user._id,
    })

    return NextResponse.json({ 
      success: true,
      message: 'Notification admin envoyée'
    })
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification admin:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi de la notification' },
      { status: 500 }
    )
  }
}
