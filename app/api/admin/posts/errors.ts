import { ZodError } from 'zod'
import { HttpError } from '@/lib/auth/session'
import { ContentError } from '@/lib/data/content'

/** Convertit les erreurs métier en réponses HTTP lisibles */
export async function withContentErrors<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch (error) {
    if (error instanceof ContentError) throw new HttpError(error.status, error.message)
    if (error instanceof ZodError) throw error
    throw error
  }
}
