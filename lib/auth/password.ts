/**
 * Mots de passe.
 *
 * Les comptes migrés depuis Sanity ont des hash bcrypt `$2b$10$…` (bcryptjs,
 * coût 10, sel de 128 bits inclus dans la chaîne). Ils sont vérifiés tels
 * quels ; à la première connexion réussie, un hash dont le coût est inférieur
 * à BCRYPT_COST est recalculé de façon transparente.
 */
import bcrypt from 'bcryptjs'

/** Coût des nouveaux hash (surchargeable pour les tests) */
export function bcryptCost(): number {
  const fromEnv = Number(process.env.BCRYPT_COST)
  return Number.isInteger(fromEnv) && fromEnv >= 4 && fromEnv <= 15 ? fromEnv : 12
}

const BCRYPT_PATTERN = /^\$2[abxy]\$(\d{2})\$[./A-Za-z0-9]{53}$/

export function isBcryptHash(hash: string): boolean {
  return BCRYPT_PATTERN.test(hash)
}

export function hashCost(hash: string): number | null {
  const match = hash.match(BCRYPT_PATTERN)
  return match ? Number(match[1]) : null
}

/** Vrai si le hash doit être recalculé (format inconnu ou coût trop faible) */
export function needsRehash(hash: string): boolean {
  const cost = hashCost(hash)
  return cost === null || cost < bcryptCost()
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, bcryptCost())
}

/**
 * Vérifie un mot de passe contre un hash existant. Les variantes `$2y$`
 * (PHP) et `$2x$` sont ramenées à `$2b$`, qui leur est équivalente.
 * Un format inconnu est refusé.
 */
export async function verifyPassword(password: string, hash: string | null | undefined): Promise<boolean> {
  if (!hash || !isBcryptHash(hash)) return false
  const normalized = hash.replace(/^\$2[xy]\$/, '$2b$')
  return bcrypt.compare(password, normalized)
}

// Hash factice : un e-mail inconnu prend autant de temps qu'un mot de passe faux
let dummyHash: Promise<string> | undefined

export async function simulatePasswordCheck(password: string): Promise<void> {
  dummyHash ??= bcrypt.hash('compte-inexistant', 10)
  await bcrypt.compare(password, await dummyHash).catch(() => false)
}

export { PASSWORD_RULES, passwordIsValid } from '@/lib/password-rules'
