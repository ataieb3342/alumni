import { apiRoute } from '@/lib/api'
import { HttpError } from '@/lib/auth/session'
import { driveConfigured, syncSubscriptionsToDrive } from '@/lib/drive-export'

export const POST = apiRoute({ auth: 'admin' }, async () => {
  if (!driveConfigured()) throw new HttpError(500, 'Configuration Google Drive manquante (CLIENT_ID, CLIENT_SECRET, GOOGLE_REFRESH_TOKEN)')
  return { message: 'Export synchronisé avec Google Drive', ...(await syncSubscriptionsToDrive()) }
})
