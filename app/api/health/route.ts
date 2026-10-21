/**
 * Health check endpoint
 * Vérifie l'état de santé de l'application et de ses dépendances
 */
import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { getDb } from '@/db'
import { performHealthCheck } from '@/lib/monitoring'
import { storageDriver } from '@/lib/storage'

export const dynamic = 'force-dynamic'

export async function GET() {
  const result = await performHealthCheck({
    database: async () => {
      const db = await getDb()
      await db.execute(sql`select 1`)
    },
    storage: async () => {
      if (process.env.NODE_ENV === 'production' && process.env.VERCEL && storageDriver() !== 'blob') {
        throw new Error('Aucun magasin Vercel Blob relié (BLOB_STORE_ID ou BLOB_READ_WRITE_TOKEN) : les images téléversées ne seraient pas conservées')
      }
    },
    email: async () => {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        throw new Error('Email service not configured')
      }
      // L'envoi passe par le SMTP de Gmail (voir lib/emails/config.ts)
      if (!process.env.EMAIL_USER.endsWith('@gmail.com')) {
        throw new Error("EMAIL_USER doit être l'adresse Gmail de l'association")
      }
    },
  })
  return NextResponse.json(result, { status: result.status === 'healthy' ? 200 : 503 })
}
