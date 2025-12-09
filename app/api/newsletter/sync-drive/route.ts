import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { serverClient } from '@/sanity/lib/server-client'
import { getGoogleDriveClient } from '@/lib/google-drive'

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
    if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
      return NextResponse.json(
        { error: 'Configuration Google Drive manquante. Ajoutez CLIENT_ID, CLIENT_SECRET, et GOOGLE_REFRESH_TOKEN dans .env' },
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

    // Configurer l'authentification Google Drive avec OAuth
    const drive = getGoogleDriveClient()
    const fileName = 'newsletters_preferences.csv'

    // Chercher si le fichier existe déjà dans le dossier
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
    const existingFiles = await drive.files.list({
      q: folderId
        ? `name='${fileName}' and '${folderId}' in parents and trashed=false`
        : `name='${fileName}' and trashed=false`,
      fields: 'files(id, name)',
    })

    let response
    let fileId: string

    if (existingFiles.data.files && existingFiles.data.files.length > 0) {
      // Le fichier existe, on le met à jour
      fileId = existingFiles.data.files[0].id!
      response = await drive.files.update({
        fileId,
        media: {
          mimeType: 'text/csv',
          body: csv,
        },
      })
    } else {
      // Le fichier n'existe pas, on le crée
      response = await drive.files.create({
        requestBody: {
          name: fileName,
          mimeType: 'text/csv',
          ...(folderId && { parents: [folderId] }),
        },
        media: {
          mimeType: 'text/csv',
          body: csv,
        },
      })
      fileId = response.data.id!
    }

    return NextResponse.json({
      message: 'Export synchronisé avec Google Drive',
      fileId: response.data.id,
      fileName: fileName,
    })
  } catch (error) {
    logger.error('Erreur lors de la synchronisation:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la synchronisation avec Google Drive', details: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    )
  }
}
