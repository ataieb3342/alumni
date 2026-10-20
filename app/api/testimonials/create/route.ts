import { apiRoute } from '@/lib/api'
import { createTestimonial } from '@/lib/data/testimonials'
import { RateLimitPresets } from '@/lib/rate-limit'
import { createTestimonialSchema } from '@/lib/validations'
import { splitTestimonialInput } from '@/lib/testimonials'

export const POST = apiRoute({ auth: 'user', body: createTestimonialSchema, rateLimit: RateLimitPresets.contentCreation }, async ({ body, user }) => {
  const testimonial = await createTestimonial(user.id, splitTestimonialInput(body))
  return { success: true, testimonialId: testimonial.id, slug: testimonial.slug }
})
