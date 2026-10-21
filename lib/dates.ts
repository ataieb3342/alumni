/** Comparaisons à l'instant présent (hors du rendu des composants, pour rester pur) */
export function isPast(date: Date | null | undefined): boolean {
  return !!date && date.getTime() < Date.now()
}

export function isFuture(date: Date | null | undefined): boolean {
  return !!date && date.getTime() > Date.now()
}
