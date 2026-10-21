// @vitest-environment node
import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const sendUserProfileReminder = vi.fn()
const sendAnnouncementNotificationEmail = vi.fn()
vi.mock('@/lib/emails', () => ({ sendUserProfileReminder: (...args: unknown[]) => sendUserProfileReminder(...args) }))
vi.mock('@/lib/email', () => ({ sendAnnouncementNotificationEmail: (...args: unknown[]) => sendAnnouncementNotificationEmail(...args) }))

import { getDb } from '@/db'
import { newsletterSubscriptions, users } from '@/db/schema'
import { newId } from '@/lib/ids'
import { notifySubscribers } from '@/lib/notifications'
import { GET as profileReminders } from '@/app/api/cron/profile-reminders/route'
import { createUser, freshDb } from '../helpers/db'

const OLD = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
const cronRequest = (query = '', secret: string | null = process.env.CRON_SECRET!) =>
  new NextRequest(`http://localhost:3000/api/cron/profile-reminders${query}`, {
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  })

describe('Rappel de profil (tâche planifiée)', () => {
  let emptyOld: string
  let complete: string
  let recent: string
  let suspended: string

  beforeAll(async () => {
    process.env.CRON_SECRET = `cron-${newId()}`
    await freshDb()
    emptyOld = (await createUser({ createdAt: OLD })).id
    complete = (await createUser({ createdAt: OLD, education: [{ degree: 'BTS', school: 'Lycée', startYear: 2020 }] })).id
    recent = (await createUser()).id
    suspended = (await createUser({ createdAt: OLD, accountStatus: 'suspended' })).id
  })

  beforeEach(() => {
    sendUserProfileReminder.mockReset()
  })

  it('refuse un appel sans le secret de la tâche', async () => {
    expect((await profileReminders(cronRequest('', null))).status).toBe(401)
    expect((await profileReminders(cronRequest('', 'mauvais-secret'))).status).toBe(401)
    expect(sendUserProfileReminder).not.toHaveBeenCalled()
  })

  it('en essai à blanc, compte les membres concernés sans rien envoyer', async () => {
    const body = await (await profileReminders(cronRequest('?dryRun=1'))).json()
    expect(body).toMatchObject({ dryRun: true, eligible: 1 })
    expect(sendUserProfileReminder).not.toHaveBeenCalled()
  })

  it('n’écrit qu’aux comptes actifs inscrits depuis un mois au profil vide, une seule fois', async () => {
    sendUserProfileReminder.mockResolvedValue({ success: true })
    const body = await (await profileReminders(cronRequest())).json()
    expect(body).toEqual({ sent: 1, failed: 0 })
    const db = await getDb()
    const target = await db.query.users.findFirst({ where: eq(users.id, emptyOld) })
    expect(sendUserProfileReminder).toHaveBeenCalledWith({ firstName: target!.firstName, email: target!.email })
    expect(target?.profileReminderSentAt).toBeInstanceOf(Date)
    for (const id of [complete, recent, suspended]) {
      expect((await db.query.users.findFirst({ where: eq(users.id, id) }))?.profileReminderSentAt).toBeNull()
    }
    expect(await (await profileReminders(cronRequest())).json()).toEqual({ sent: 0, failed: 0 })
  })

  it('un envoi échoué est retenté au passage suivant', async () => {
    const id = (await createUser({ createdAt: OLD })).id
    sendUserProfileReminder.mockResolvedValueOnce({ success: false })
    expect(await (await profileReminders(cronRequest())).json()).toEqual({ sent: 0, failed: 1 })
    const db = await getDb()
    expect((await db.query.users.findFirst({ where: eq(users.id, id) }))?.profileReminderSentAt).toBeNull()
    sendUserProfileReminder.mockResolvedValueOnce({ success: true })
    expect(await (await profileReminders(cronRequest())).json()).toEqual({ sent: 1, failed: 0 })
  })
})

describe('Notification des nouvelles annonces', () => {
  beforeAll(async () => {
    await freshDb()
    const db = await getDb()
    const subscribe = async (userId: string, announcements: boolean) =>
      db.insert(newsletterSubscriptions).values({ id: newId(), userId, announcementsNewsletter: announcements })
    await subscribe((await createUser({ firstName: 'Inès', lastName: 'Abonnée' })).id, true)
    await subscribe((await createUser()).id, false)
    await subscribe((await createUser({ accountStatus: 'suspended' })).id, true)
  })

  it('écrit aux seuls abonnés actifs, sans bloquer si un envoi échoue', async () => {
    sendAnnouncementNotificationEmail.mockResolvedValue(undefined)
    const announcement = { title: 'CDI à Dijon', type: 'job_offer', company: 'Acme', location: null, slug: 'cdi-dijon' }
    const result = await notifySubscribers(announcement)
    expect(result).toMatchObject({ success: true, sent: 1, total: 1 })
    expect(sendAnnouncementNotificationEmail).toHaveBeenCalledWith(expect.stringContaining('@example.test'), 'Inès Abonnée', expect.objectContaining({ slug: 'cdi-dijon', company: 'Acme', location: undefined }))

    sendAnnouncementNotificationEmail.mockRejectedValue(new Error('SMTP indisponible'))
    expect(await notifySubscribers(announcement)).toMatchObject({ success: true, sent: 0, failed: 1 })
  })
})
