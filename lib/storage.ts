/**
 * Stockage des images téléversées.
 *
 * - Vercel Blob (public) quand le projet est relié à un magasin Blob :
 *   `BLOB_STORE_ID` (identifiants OIDC, mode par défaut des nouveaux magasins)
 *   ou `BLOB_READ_WRITE_TOKEN` (jeton classique). URL publiques servies par
 *   le CDN de Vercel ;
 * - sinon système de fichiers (`MEDIA_DIR`, par défaut `.data/media`), servi
 *   par la route `/media/[...key]` : développement local, tests, VPS.
 */
import fs from 'node:fs/promises'
import path from 'node:path'

export interface StoredObject {
  key: string
  url: string
}

export type StorageDriver = 'blob' | 'fs'

export function storageDriver(): StorageDriver {
  if (process.env.STORAGE_DRIVER === 'fs') return 'fs'
  return process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID ? 'blob' : 'fs'
}

export function mediaDir(): string {
  return path.resolve(/*turbopackIgnore: true*/ process.env.MEDIA_DIR ?? '.data/media')
}

/** Une clé ne contient que des segments sûrs : pas de remontée de répertoire */
export function assertSafeKey(key: string): string {
  const normalized = path.posix.normalize(key)
  if (normalized.startsWith('..') || normalized.startsWith('/') || !/^[a-zA-Z0-9/_.-]+$/.test(normalized)) {
    throw new Error('Clé de stockage invalide')
  }
  return normalized
}

export async function putObject(key: string, data: Buffer, contentType: string): Promise<StoredObject> {
  const safeKey = assertSafeKey(key)
  if (storageDriver() === 'blob') {
    const { put } = await import('@vercel/blob')
    const blob = await put(safeKey, data, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    })
    return { key: safeKey, url: blob.url }
  }
  const file = path.join(/*turbopackIgnore: true*/ mediaDir(), safeKey)
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, data)
  return { key: safeKey, url: `/media/${safeKey}` }
}

export async function objectExists(key: string): Promise<boolean> {
  const safeKey = assertSafeKey(key)
  if (storageDriver() === 'blob') {
    const { head } = await import('@vercel/blob')
    try {
      await head(safeKey)
      return true
    } catch {
      return false
    }
  }
  try {
    await fs.access(path.join(/*turbopackIgnore: true*/ mediaDir(), safeKey))
    return true
  } catch {
    return false
  }
}

export async function deleteObject(key: string, url?: string): Promise<void> {
  const safeKey = assertSafeKey(key)
  if (storageDriver() === 'blob') {
    const { del } = await import('@vercel/blob')
    await del(url ?? safeKey)
    return
  }
  await fs.rm(path.join(/*turbopackIgnore: true*/ mediaDir(), safeKey), { force: true })
}

/** Lecture locale (pilote fichiers uniquement), pour la route `/media` */
export async function readLocalObject(key: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(path.join(/*turbopackIgnore: true*/ mediaDir(), assertSafeKey(key)))
  } catch {
    return null
  }
}
