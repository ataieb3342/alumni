/**
 * Complète un contenu enregistré avec les valeurs par défaut : un champ ajouté
 * au schéma après coup apparaît avec son texte par défaut au lieu de casser
 * la page. Les tableaux enregistrés sont repris tels quels.
 */
export function mergeWithDefaults<T>(defaults: T, stored: unknown): T {
  if (stored === undefined || stored === null) return defaults
  if (Array.isArray(defaults)) return (Array.isArray(stored) ? stored : defaults) as T
  if (defaults && typeof defaults === 'object') {
    if (typeof stored !== 'object' || Array.isArray(stored)) return defaults
    const result: Record<string, unknown> = { ...(defaults as Record<string, unknown>) }
    for (const [key, value] of Object.entries(stored as Record<string, unknown>)) {
      result[key] = key in result ? mergeWithDefaults(result[key], value) : value
    }
    return result as T
  }
  return (typeof stored === typeof defaults ? stored : defaults) as T
}

/** Remplace `{count}` par un nombre, sans le jeton s'il n'y a rien à compter */
export function withCount(text: string, count: number): string {
  return text.replace(/\{count\}/g, String(count))
}
