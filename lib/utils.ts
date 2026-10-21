/**
 * Génère un slug à partir d'un titre
 * - Convertit en minuscules
 * - Retire les accents (normalisation NFD)
 * - Garde seulement lettres, chiffres, espaces et tirets
 * - Remplace espaces par tirets
 * - Limite à 96 caractères
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
    .replace(/[^a-z0-9\s-]/g, '') // Garder seulement lettres, chiffres, espaces et tirets
    .trim()
    .replace(/\s+/g, '-') // Remplacer espaces par tirets
    .replace(/-+/g, '-') // Remplacer tirets multiples par un seul
    .substring(0, 96) // Limiter à 96 caractères
}

/** Concatène des classes CSS en ignorant les valeurs vides */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

/** « 1 membre », « 3 membres » */
export function plural(count: number, word: string, pluralWord = `${word}s`): string {
  return `${count} ${count > 1 ? pluralWord : word}`
}

/** « a », « a et b », « a, b et c » */
export function joinFrench(items: string[]): string {
  return items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} et ${items.at(-1)}`
}

/** Chemin de redirection sûr (même site uniquement) */
export function safeCallbackUrl(value: string | null | undefined, fallback = '/accueil'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback
  return value
}

export const USER_TYPE_LABELS: Record<string, string> = {
  lyceen: 'Lycéen',
  bts: 'BTS',
  prepa: 'Prépa',
  alumni: 'Ancien élève',
  staff: 'Personnel',
}

export function formatLinkedInUrl(url: string | null | undefined): string {
  if (!url) return ''
  return /^https?:\/\//.test(url) ? url : `https://${url}`
}
