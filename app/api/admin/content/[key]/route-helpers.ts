import { HttpError } from '@/lib/auth/session'
import { isContentKey, type ContentKey } from '@/lib/content/definitions'

export function contentKeyFrom(params: Record<string, string>): ContentKey {
  const key = params.key
  if (!key || !isContentKey(key)) throw new HttpError(404, 'Contenu inconnu')
  return key
}
