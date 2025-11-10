import { NextResponse } from 'next/server'
import { serverClient } from '@/sanity/lib/server-client'
import { google } from 'googleapis'

export async function POST() {
  try {
    const { auth } = await import('@/lib/auth')
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

    // Vérifier la configuration Google Drive
    if (!process.env.GOOGLE_DRIVE_CLIENT_EMAIL || !process.env.GOOGLE_DRIVE_PRIVATE_KEY || !process.env.GOOGLE_DRIVE_FOLDER_ID) {
      return NextResponse.json(
        { error: 'Configuration Google Drive manquante. Ajoutez GOOGLE_DRIVE_CLIENT_EMAIL, GOOGLE_DRIVE_PRIVATE_KEY, et GOOGLE_DRIVE_FOLDER_ID dans .env' },
        { status: 500 }
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
        current_student: 'Élève actuel',
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

    // Configurer l'authentification Google Drive avec Service Account
    const googleAuth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_DRIVE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    })

    const drive = google.drive({ version: 'v3', auth: googleAuth })

    const fileName = `newsletters_export_${new Date().toISOString().split('T')[0]}.csv`

    // Upload vers Google Drive
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
        mimeType: 'text/csv',
      },
      media: {
        mimeType: 'text/csv',
        body: csv,
      },
    })

    return NextResponse.json({
      message: 'Export synchronisé avec Google Drive',
      fileId: response.data.id,
      fileName: fileName,
    })
  } catch (error) {
    console.error('Erreur lors de la synchronisation:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la synchronisation avec Google Drive', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    )
  }
}
