import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { serverClient } from '@/sanity/lib/server-client'
import { auth } from '@/lib/auth'

export async function GET() {
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

    // Récupérer tous les abonnements avec les infos utilisateur
    const subscriptions = await serverClient.fetch(
      `*[_type == "newsletterSubscription"]{
        user->{
          firstName,
          lastName,
          email,
          userType
        },
        generalNewsletter,
        announcementsNewsletter,
        subscribedAt
      }`
    )

    interface Subscription {
      user?: {
        firstName?: string
        lastName?: string
        email?: string
        userType?: string
      }
      generalNewsletter?: boolean
      announcementsNewsletter?: boolean
      subscribedAt?: string
    }

    // Générer le CSV
    const csvHeader = 'Prénom,Nom,Email,Type de membre,Newsletter générale,Notifications annonces,Date d\'inscription\n'
    const csvRows = subscriptions.map((sub: Subscription) => {
      const userTypeLabels: Record<string, string> = {
        lyceen: 'Lycéen',
        bts: 'BTS',
        prepa: 'Prépa',
        alumni: 'Ancien élève',
        staff: 'Personnel',
      }

      const userType = sub.user?.userType || ''
      return [
        sub.user?.firstName || '',
        sub.user?.lastName || '',
        sub.user?.email || '',
        (userType && userTypeLabels[userType]) || userType,
        sub.generalNewsletter ? 'Oui' : 'Non',
        sub.announcementsNewsletter ? 'Oui' : 'Non',
        sub.subscribedAt ? new Date(sub.subscribedAt).toLocaleDateString('fr-FR') : '',
      ]
        .map(field => `"${field}"`)
        .join(',')
    }).join('\n')

    const csv = csvHeader + csvRows

    // Retourner le CSV
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="newsletters_export_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    logger.error('Erreur lors de l\'export:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'export' },
      { status: 500 }
    )
  }
}
