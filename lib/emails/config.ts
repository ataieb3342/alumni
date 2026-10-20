import fs from 'node:fs'
import path from 'node:path'
import nodemailer from 'nodemailer'
import type Mail from 'nodemailer/lib/mailer'
import { logger } from '@/lib/logger'

// Boîte lue par l'association : les réponses aux emails y arrivent
export const CONTACT_EMAIL = 'contact@vh-besancon-alumni.fr'

export type EmailTransportMode = 'smtp' | 'log' | 'outbox'

/**
 * Les e-mails ne partent réellement qu'en production, sur la vraie base. En
 * développement, en test ou sur une base locale (PGlite, qui peut contenir les
 * comptes migrés), ils sont seulement journalisés (`log`) ou déposés en
 * fichiers dans EMAIL_OUTBOX_DIR (`outbox`, tests de bout en bout).
 * EMAIL_TRANSPORT=smtp|log|outbox force le mode.
 */
export function emailTransportMode(): EmailTransportMode {
  const forced = process.env.EMAIL_TRANSPORT
  if (forced === 'smtp' || forced === 'log' || forced === 'outbox') return forced
  const url = process.env.DATABASE_URL ?? ''
  const realDatabase = url !== '' && !url.startsWith('pglite:')
  return process.env.NODE_ENV === 'production' && realDatabase ? 'smtp' : 'log'
}

// Les emails partent toujours du compte Gmail de l'association : l'envoi
// depuis contact@ par le SMTP d'OVH échoue faute de certificat. EMAIL_USER et
// EMAIL_PASSWORD sont donc l'adresse Gmail et son mot de passe d'application.
let smtp: nodemailer.Transporter | undefined
function smtpTransport() {
  smtp ??= nodemailer.createTransport(
    {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // STARTTLS sur le port 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    },
    {
      replyTo: `"Association VH Besançon" <${CONTACT_EMAIL}>`,
    }
  )
  return smtp
}

const recipientCount = (to: Mail.Options['to']) => (Array.isArray(to) ? to.length : to ? 1 : 0)

export const transporter = {
  async sendMail(options: Mail.Options) {
    const mode = emailTransportMode()
    if (mode === 'smtp') return smtpTransport().sendMail(options)

    if (mode === 'outbox') {
      const dir = path.resolve(process.env.EMAIL_OUTBOX_DIR ?? '.data/outbox')
      fs.mkdirSync(dir, { recursive: true })
      const file = path.join(dir, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`)
      fs.writeFileSync(file, JSON.stringify({ to: options.to, subject: options.subject, html: options.html, text: options.text }, null, 2))
    }
    // Ni destinataire ni contenu dans le journal : seulement le sujet
    logger.info(`E-mail non envoyé (mode ${mode}) : « ${options.subject ?? ''} » → ${recipientCount(options.to)} destinataire(s)`)
    return { messageId: `local-${Date.now()}`, accepted: [], rejected: [] }
  },
}
