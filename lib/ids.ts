const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

/**
 * Identifiant aléatoire base 62 (22 caractères ≈ 131 bits), au même format
 * que les identifiants Sanity conservés lors de la migration.
 */
export function newId(length = 22): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  let id = ''
  for (const byte of bytes) id += ALPHABET[byte % ALPHABET.length]
  return id
}

/** Jeton secret (64 caractères hexadécimaux) pour les liens envoyés par e-mail */
export function newSecretToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}
