import { google } from 'googleapis'

/**
 * Créer un client OAuth2 pour Google Drive
 * Utilise le refresh token pour obtenir automatiquement un access token
 */
export function getGoogleDriveClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    'http://localhost:3000' // Redirect URI (pas utilisé ici, mais requis)
  )

  // Configurer le refresh token
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  })

  // Créer le client Drive
  const drive = google.drive({ version: 'v3', auth: oauth2Client })

  return drive
}
