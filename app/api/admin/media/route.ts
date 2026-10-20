import { NextResponse } from 'next/server'
import { apiRoute } from '@/lib/api'
import { HttpError } from '@/lib/auth/session'
import { listMedia, MediaError, storeImage, toImageRef } from '@/lib/data/media'

/** Téléversement d'une image (édition sur place, médiathèque) */
export const POST = apiRoute({ auth: 'admin', rateLimit: { maxRequests: 30, windowMs: 60_000 } }, async ({ req, user }) => {
  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) throw new HttpError(400, 'Aucun fichier reçu')
  const alt = typeof form?.get('alt') === 'string' ? String(form.get('alt')).slice(0, 300) : undefined
  try {
    const item = await storeImage(file, { uploadedBy: user.id, alt, folder: 'uploads' })
    return NextResponse.json({ media: item, image: toImageRef(item, alt) }, { status: 201 })
  } catch (error) {
    if (error instanceof MediaError) throw new HttpError(error.status, error.message)
    throw error
  }
})

export const GET = apiRoute({ auth: 'admin' }, async ({ req }) => {
  const page = Number(new URL(req.url).searchParams.get('page') ?? 1)
  return listMedia({ page })
})
