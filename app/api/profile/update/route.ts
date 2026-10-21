import { eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { media } from '@/db/schema'
import { apiRoute } from '@/lib/api'
import { HttpError } from '@/lib/auth/session'
import { toImageRef } from '@/lib/data/media'
import { updateUser } from '@/lib/data/users'
import { updateProfileSchema } from '@/lib/validations'

function withKeys<T extends { _key?: string }>(items: T[]) {
  return items.map((item) => ({ ...item, _key: item._key ?? Math.random().toString(36).slice(2, 14) }))
}

/** Une image de profil doit être un média téléversé par le membre lui-même */
async function ownImage(mediaId: string, userId: string) {
  const db = await getDb()
  const item = await db.query.media.findFirst({ where: eq(media.id, mediaId) })
  if (!item || item.uploadedBy !== userId) throw new HttpError(400, 'Image introuvable')
  return toImageRef(item)
}

/** Mise à jour de son propre profil (jamais celui d'un autre : l'identifiant vient de la session) */
export const POST = apiRoute({ auth: 'user', body: updateProfileSchema }, async ({ body, user }) => {
  const { userId: _ignored, education, experience, profileImageId, coverImageId, ...fields } = body
  const patch: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue
    patch[key] = value === '' ? null : value
  }
  if (fields.promotionYear === undefined && 'promotionYear' in body) patch.promotionYear = null
  if (education !== undefined) patch.education = withKeys(education)
  if (experience !== undefined) patch.experience = withKeys(experience)
  if (profileImageId !== undefined) patch.profileImage = profileImageId ? await ownImage(profileImageId, user.id) : null
  if (coverImageId !== undefined) patch.coverImage = coverImageId ? await ownImage(coverImageId, user.id) : null
  // Le prénom et le nom restent obligatoires
  if (patch.firstName === null) delete patch.firstName
  if (patch.lastName === null) delete patch.lastName
  await updateUser(user.id, patch)
  return { message: 'Profil mis à jour avec succès' }
})
