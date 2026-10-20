import { NextResponse } from 'next/server'
import { apiRoute } from '@/lib/api'
import { HttpError } from '@/lib/auth/session'
import { MediaError, storeImage, toImageRef } from '@/lib/data/media'

/** Photo de profil ou de couverture d'un membre (recadrée côté navigateur) */
export const POST = apiRoute({ auth: 'user', rateLimit: { maxRequests: 20, windowMs: 10 * 60_000, message: 'Trop d’images envoyées, réessayez plus tard.' } }, async ({ req, user }) => {
  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) throw new HttpError(400, 'Aucun fichier fourni')
  try {
    const item = await storeImage(file, { uploadedBy: user.id, folder: 'profiles', alt: `${user.firstName} ${user.lastName}` })
    return NextResponse.json({ mediaId: item.id, assetId: item.id, url: item.url, image: toImageRef(item) })
  } catch (error) {
    if (error instanceof MediaError) throw new HttpError(error.status, error.message)
    throw error
  }
})
