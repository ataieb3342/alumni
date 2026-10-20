/**
 * Règles de mot de passe, partagées entre le formulaire (vérification en
 * direct) et le serveur. Sans dépendance : importable côté navigateur.
 */
/** Politique (inchangée) : 12 caractères, majuscule, minuscule, chiffre, caractère spécial @$!%*?& */
export const PASSWORD_RULES = [
  { id: 'length', label: 'Au moins 12 caractères', test: (value: string) => value.length >= 12 },
  { id: 'upper', label: 'Une majuscule (A-Z)', test: (value: string) => /[A-Z]/.test(value) },
  { id: 'lower', label: 'Une minuscule (a-z)', test: (value: string) => /[a-z]/.test(value) },
  { id: 'digit', label: 'Un chiffre (0-9)', test: (value: string) => /\d/.test(value) },
  { id: 'special', label: 'Un caractère spécial (@$!%*?&)', test: (value: string) => /[@$!%*?&]/.test(value) },
] as const

export function passwordIsValid(value: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(value))
}
