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
