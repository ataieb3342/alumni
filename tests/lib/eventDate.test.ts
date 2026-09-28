import { describe, it, expect } from 'vitest'
import { eventCountdown, eventDateParts, formatEventDate, formatEventTime } from '@/lib/eventDate'

describe('eventDate', () => {
  it("affiche l'heure de Paris, pas celle du serveur", () => {
    // 17h UTC = 19h à Paris en octobre (heure d'été)
    expect(formatEventTime('2026-10-15T17:00:00.000Z')).toBe('19h')
    expect(formatEventTime('2026-10-15T17:30:00.000Z')).toBe('19h30')
    // 18h UTC = 19h à Paris en décembre (heure d'hiver)
    expect(formatEventTime('2026-12-10T18:00:00.000Z')).toBe('19h')
  })

  it('formate la date complète', () => {
    expect(formatEventDate('2026-10-15T17:00:00.000Z')).toBe('jeudi 15 octobre à 19h')
    expect(formatEventDate('2026-10-01T17:00:00.000Z')).toBe('jeudi 1er octobre à 19h')
  })

  it('donne le jour et le mois pour la pastille', () => {
    expect(eventDateParts('2026-10-15T17:00:00.000Z')).toEqual({ day: '15', month: 'oct.' })
    // 23h30 UTC le 31 = déjà le 1er novembre à Paris
    expect(eventDateParts('2026-10-31T23:30:00.000Z')).toEqual({ day: '1', month: 'nov.' })
  })

  describe('eventCountdown', () => {
    const now = new Date('2026-10-15T08:00:00.000Z')

    it('compte en jours calendaires à Paris', () => {
      expect(eventCountdown('2026-10-15T17:00:00.000Z', now)).toBe("Aujourd'hui")
      expect(eventCountdown('2026-10-16T06:00:00.000Z', now)).toBe('Demain')
      // 22h30 UTC le 15 = 0h30 le 16 à Paris
      expect(eventCountdown('2026-10-15T22:30:00.000Z', now)).toBe('Demain')
      expect(eventCountdown('2026-10-20T17:00:00.000Z', now)).toBe('Dans 5 jours')
    })

    it('passe aux semaines puis aux mois', () => {
      expect(eventCountdown('2026-11-05T17:00:00.000Z', now)).toBe('Dans 3 semaines')
      expect(eventCountdown('2027-01-15T17:00:00.000Z', now)).toBe('Dans 3 mois')
    })
  })
})
