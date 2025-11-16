import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { serverClient } from '@/sanity/lib/server-client'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const data = await request.json()
    const { userType, promotionYear, currentJob, company, bio, phone } = data

    // Mettre à jour le profil de l'utilisateur
    const updates: Record<string, string | number> = {
      userType,
    }

    if (phone) updates.phone = phone
    if (bio) updates.bio = bio
    if (currentJob) updates.currentJob = currentJob
    if (company) updates.company = company
    if (promotionYear) updates.promotionYear = parseInt(promotionYear)

    await serverClient
      .patch(session.user.id)
      .set(updates)
      .commit()

    return NextResponse.json({ 
      success: true,
      message: 'Profil mis à jour avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    )
  }
}
