import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { apiRoute } from '@/lib/api'
import { HttpError } from '@/lib/auth/session'
import { deleteAnnouncement, getAnnouncementById, updateAnnouncement } from '@/lib/data/announcements'
import { logActivity } from '@/lib/activity-logger'
import { CONTENT_STATUSES } from '@/db/schema'
import { patchAnnouncementSchema } from '@/lib/validations'

/** Auteur ou administrateur ; toute autre personne reçoit 403, même en appelant l'API directement */
async function editable(id: string, user: { id: string; role: string }) {
  const announcement = await getAnnouncementById(id)
  if (!announcement) throw new HttpError(404, 'Annonce non trouvée')
  if (announcement.authorId !== user.id && user.role !== 'admin') throw new HttpError(403, 'Non autorisé à modifier cette annonce')
  return announcement
}

const patchSchema = patchAnnouncementSchema.extend({
  /** Réservé aux administrateurs (modération) */
  status: z.enum(CONTENT_STATUSES).optional(),
})

export const PATCH = apiRoute({ auth: 'user', body: patchSchema }, async ({ params, body, user }) => {
  const current = await editable(params.id, user)
  if (body.status && user.role !== 'admin') throw new HttpError(403, 'Seul un administrateur peut changer le statut')
  const description = body.description
  const updated = await updateAnnouncement(current.id, {
    ...(body.title !== undefined ? { title: body.title } : {}),
    ...(body.type !== undefined ? { type: body.type } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(body.company !== undefined ? { company: body.company || null } : {}),
    ...(body.location !== undefined ? { location: body.location || null } : {}),
    ...(body.contactEmail !== undefined ? { contactEmail: body.contactEmail || null } : {}),
    ...(body.contactPhone !== undefined ? { contactPhone: body.contactPhone || null } : {}),
    ...(body.externalLink !== undefined ? { externalLink: body.externalLink || null } : {}),
    ...(body.expiresAt !== undefined ? { expiresAt: body.expiresAt ? new Date(body.expiresAt) : null } : {}),
    ...(body.eventDate !== undefined ? { eventDate: body.eventDate ? new Date(body.eventDate) : null } : {}),
    ...(body.status ? { status: body.status } : {}),
  })
  if (user.role === 'admin' && current.authorId !== user.id) {
    await logActivity({ userId: user.id, action: 'admin.announcement.update', resourceId: current.id })
  }
  revalidatePath('/annonces')
  return updated
})

export const DELETE = apiRoute({ auth: 'user' }, async ({ params, user }) => {
  const current = await editable(params.id, user)
  await deleteAnnouncement(current.id)
  if (user.role === 'admin' && current.authorId !== user.id) {
    await logActivity({ userId: user.id, action: 'admin.announcement.delete', resourceId: current.id, details: current.title })
  }
  revalidatePath('/annonces')
  return { success: true }
})
