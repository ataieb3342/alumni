import { getGoogleDriveClient } from '@/lib/google-drive'
import { buildSubscriptionsCsv } from '@/lib/data/newsletter'

export const DRIVE_FILE_NAME = 'newsletters_preferences.csv'

export function driveConfigured() {
  return !!(process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN)
}

/** Écrit (ou remplace) le CSV des abonnements dans le dossier Google Drive de l'association */
export async function syncSubscriptionsToDrive() {
  const { csv, count } = await buildSubscriptionsCsv()
  const drive = getGoogleDriveClient()
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID
  const existing = await drive.files.list({
    q: folderId ? `name='${DRIVE_FILE_NAME}' and '${folderId}' in parents and trashed=false` : `name='${DRIVE_FILE_NAME}' and trashed=false`,
    fields: 'files(id, name)',
  })
  const file = existing.data.files?.[0]
  const response = file?.id
    ? await drive.files.update({ fileId: file.id, media: { mimeType: 'text/csv', body: csv } })
    : await drive.files.create({
        requestBody: { name: DRIVE_FILE_NAME, mimeType: 'text/csv', ...(folderId ? { parents: [folderId] } : {}) },
        media: { mimeType: 'text/csv', body: csv },
      })
  return { fileId: response.data.id, fileName: DRIVE_FILE_NAME, subscribersCount: count }
}
