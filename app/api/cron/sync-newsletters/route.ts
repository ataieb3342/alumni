import { NextRequest, NextResponse } from 'next/server'
import { serverClient } from '@/sanity/lib/server-client'
import { google } from 'googleapis'

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'autorisation via le secret Vercel Cron
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Vérifier la configuration Google Drive
    if (!process.env.GOOGLE_DRIVE_CLIENT_EMAIL || !process.env.GOOGLE_DRIVE_PRIVATE_KEY || !process.env.GOOGLE_DRIVE_FOLDER_ID) {
      return NextResponse.json(
        { error: 'Configuration Google Drive manquante' },
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
      scopes: ['https://www.googleapis.com/auth/drive'],
    })

    const drive = google.drive({ version: 'v3', auth: googleAuth })

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
      success: true,
      message: 'Export synchronisé avec Google Drive',
      fileId: response.data.id,
      fileName: fileName,
      subscribersCount: subscriptions.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erreur lors de la synchronisation cron:', error)
    return NextResponse.json(
      {
        error: 'Erreur lors de la synchronisation',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
