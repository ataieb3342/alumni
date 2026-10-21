import { NextResponse } from 'next/server'
import { readLocalObject } from '@/lib/storage'

const TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
}

/** Médias du stockage local (développement, VPS). En production Vercel, les URL pointent vers Vercel Blob. */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params
  const path = key.join('/')
  let data: Buffer | null = null
  try {
    data = await readLocalObject(path)
  } catch {
    data = null
  }
  if (!data) return new NextResponse('Introuvable', { status: 404 })
  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  return new NextResponse(new Uint8Array(data), {
    headers: {
      'Content-Type': TYPES[ext] ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
