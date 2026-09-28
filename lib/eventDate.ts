/**
 * Dates d'événements, toujours à l'heure de Paris : le rendu serveur tourne en
 * UTC sur Vercel, un afterwork à 19h s'afficherait sinon « à 17h ».
 */
const TIME_ZONE = 'Europe/Paris'

const dayFormat = new Intl.DateTimeFormat('fr-FR', { timeZone: TIME_ZONE, weekday: 'long', day: 'numeric', month: 'long' })
const timeFormat = new Intl.DateTimeFormat('fr-FR', { timeZone: TIME_ZONE, hour: 'numeric', minute: '2-digit' })
const partsFormat = new Intl.DateTimeFormat('fr-FR', { timeZone: TIME_ZONE, day: 'numeric', month: 'short' })
const calendarFormat = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })

/** « 19h », « 19h30 » */
export function formatEventTime(iso: string): string {
  return timeFormat.format(new Date(iso)).replace(/:00$/, 'h').replace(':', 'h')
}

/** « jeudi 15 octobre à 19h », « jeudi 1er octobre à 19h » */
export function formatEventDate(iso: string): string {
  const day = dayFormat.format(new Date(iso)).replace(/ 1 /, ' 1er ')
  return `${day} à ${formatEventTime(iso)}`
}

/** Jour et mois abrégé pour une pastille de calendrier : { day: '15', month: 'oct.' } */
export function eventDateParts(iso: string): { day: string; month: string } {
  const parts = partsFormat.formatToParts(new Date(iso))
  return {
    day: parts.find((part) => part.type === 'day')?.value ?? '',
    month: parts.find((part) => part.type === 'month')?.value ?? '',
  }
}

/** Nombre de jours calendaires (à Paris) entre maintenant et l'événement */
function calendarDaysUntil(iso: string, now: Date): number {
  const toUtcMidnight = (date: Date) => Date.parse(calendarFormat.format(date))
  return Math.round((toUtcMidnight(new Date(iso)) - toUtcMidnight(now)) / 86_400_000)
}

/** « Aujourd'hui », « Demain », « Dans 5 jours », « Dans 3 semaines » */
export function eventCountdown(iso: string, now = new Date()): string {
  const days = calendarDaysUntil(iso, now)
  if (days <= 0) return "Aujourd'hui"
  if (days === 1) return 'Demain'
  if (days < 14) return `Dans ${days} jours`
  if (days < 60) return `Dans ${Math.round(days / 7)} semaines`
  return `Dans ${Math.round(days / 30)} mois`
}
