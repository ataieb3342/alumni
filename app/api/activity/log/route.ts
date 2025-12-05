import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { logActivity, getClientIp, getUserAgent } from '@/lib/activity-logger'

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

    // Récupérer les données de la requête
    const body = await request.json()
    const { action, resource, resourceId, details } = body

    if (!action) {
      return NextResponse.json(
        { error: 'Action requise' },
        { status: 400 }
      )
    }

    // Extraire l'IP et le user agent
    const ipAddress = getClientIp(request)
    const userAgent = getUserAgent(request)

    // Logger l'activité
    const result = await logActivity({
      userId: session.user.id,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
    })

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement du log' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Erreur dans l\'API de logging:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
