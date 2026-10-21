import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { apiRoute } from '@/lib/api'
import { HttpError } from '@/lib/auth/session'
import { deleteTestimonial, getTestimonialById, updateTestimonial } from '@/lib/data/testimonials'
import { logActivity } from '@/lib/activity-logger'
import { CONTENT_STATUSES } from '@/db/schema'
import { splitTestimonialInput } from '@/lib/testimonials'
import { updateTestimonialSchema } from '@/lib/validations'
import { imageSchema } from '@/lib/content/definitions'

async function editable(id: string, user: { id: string; role: string }) {
  const testimonial = await getTestimonialById(id)
  if (!testimonial) throw new HttpError(404, 'Témoignage non trouvé')
  if (testimonial.authorId !== user.id && user.role !== 'admin') throw new HttpError(403, 'Non autorisé à modifier ce témoignage')
  return testimonial
}

const patchSchema = updateTestimonialSchema.omit({ id: true }).extend({
  status: z.enum(CONTENT_STATUSES).optional(),
  /** Image de couverture : réservée aux administrateurs */
  featuredImage: imageSchema.nullable().optional(),
})

export const PATCH = apiRoute({ auth: 'user', body: patchSchema }, async ({ params, body, user }) => {
  const current = await editable(params.id, user)
  if (body.status && user.role !== 'admin') throw new HttpError(403, 'Seul un administrateur peut changer le statut')
  if (body.featuredImage !== undefined && user.role !== 'admin') throw new HttpError(403, 'Seul un administrateur peut changer l’image de couverture')
  const { status, featuredImage, ...fields } = body
  const input = splitTestimonialInput(fields, current.answers)
  const updated = await updateTestimonial(current.id, {
    ...(fields.title !== undefined ? { title: input.title } : {}),
    ...(fields.type !== undefined ? { type: input.type } : {}),
    ...(fields.excerpt !== undefined ? { excerpt: input.excerpt } : {}),
    ...('rating' in fields ? { rating: input.rating ?? null } : {}),
    ...(fields.tags !== undefined ? { tags: input.tags } : {}),
    answers: input.answers,
    ...(status ? { status } : {}),
    ...(featuredImage !== undefined ? { featuredImage } : {}),
  })
  if (user.role === 'admin' && current.authorId !== user.id) {
    await logActivity({ userId: user.id, action: 'admin.testimonial.update', resourceId: current.id })
  }
  revalidatePath('/temoignages')
  return updated
})

export const DELETE = apiRoute({ auth: 'user' }, async ({ params, user }) => {
  const current = await editable(params.id, user)
  await deleteTestimonial(current.id)
  if (user.role === 'admin' && current.authorId !== user.id) {
    await logActivity({ userId: user.id, action: 'admin.testimonial.delete', resourceId: current.id, details: current.title })
  }
  revalidatePath('/temoignages')
  return { success: true }
})
