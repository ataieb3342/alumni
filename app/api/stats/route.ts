import { NextResponse } from 'next/server'
import { serverClient } from '@/sanity/lib/server-client'
import { auth } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Vérifier que l'utilisateur est admin
    const user = await serverClient.fetch(
      `*[_type == "user" && _id == $userId][0]{ role }`,
      { userId: session.user.id }
    )

    if (user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // Nombre de jours
    const daysAgo = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)

    // Récupérer les statistiques générales
    const stats = await serverClient.fetch(`{
      "totalUsers": count(*[_type == "user"]),
      "activeUsers": count(*[_type == "user" && accountStatus == "active"]),
      "pendingUsers": count(*[_type == "user" && accountStatus == "pending"]),
      "totalAnnouncements": count(*[_type == "announcement"]),
      "newsletterSubscriptions": count(*[_type == "newsletterSubscription" && (generalNewsletter == true || announcementsNewsletter == true)])
    }`, { startDate: startDate.toISOString() })

    return NextResponse.json({
      period: daysAgo,
      totalUsers: stats.totalUsers,
      activeUsers: stats.activeUsers,
      pendingUsers: stats.pendingUsers,
      totalAnnouncements: stats.totalAnnouncements,
      newsletterSubscriptions: stats.newsletterSubscriptions,
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques' },
      { status: 500 }
    )
  }
}
