/**
 * Export complet du dataset Sanity (lecture seule) vers un instantané local.
 *
 * - documents : API d'export HTTP de Sanity (NDJSON, références et assets inclus) ;
 * - assets : chaque `sanity.imageAsset` / `sanity.fileAsset` est téléchargé ;
 * - images externes citées dans les articles (import WordPress) : téléchargées
 *   au mieux, sinon signalées ;
 * - comptes du Studio : e-mails et rôles des membres du projet (leurs mots de
 *   passe sont gérés par Sanity et ne sont pas exportables).
 *
 * Aucune écriture côté Sanity. Les identifiants sont lus dans l'environnement :
 *   SANITY_PROJECT_ID (ou NEXT_PUBLIC_SANITY_PROJECT_ID), SANITY_DATASET (ou
 *   NEXT_PUBLIC_SANITY_DATASET), SANITY_API_TOKEN (lecture suffit).
 *
 * Usage : npm run migrate:export [-- --out .migration/snapshot]
 * Idempotent : un asset déjà téléchargé avec la bonne taille n'est pas refait.
 */
import fs from 'node:fs'
import path from 'node:path'
import { externalImageFileName } from './transform'

interface SanityDoc {
  _id: string
  _type: string
  [key: string]: unknown
}

const API_VERSION = 'v2021-06-07'

function env(name: string, fallback?: string): string {
  const value = process.env[name] ?? (fallback ? process.env[fallback] : undefined)
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}${fallback ? ` (ou ${fallback})` : ''}`)
  return value
}

function argValue(flag: string, fallback: string): string {
  const index = process.argv.indexOf(flag)
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback
}

async function fetchOk(url: string, init?: RequestInit, attempts = 3): Promise<Response> {
  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url, init)
      if (response.ok) return response
      lastError = new Error(`HTTP ${response.status} sur ${url.replace(/\?.*/, '')}`)
      if (response.status < 500 && response.status !== 429) break
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) => setTimeout(resolve, 500 * attempt))
  }
  throw lastError
}

/** Collecte les URL d'images externes des blocs Portable Text (articles importés de WordPress) */
function externalImageUrls(doc: SanityDoc): string[] {
  const urls: string[] = []
  const visit = (value: unknown) => {
    if (Array.isArray(value)) return value.forEach(visit)
    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>
      if (record._type === 'image' && typeof record.url === 'string' && !record.asset) urls.push(record.url)
      Object.values(record).forEach(visit)
    }
  }
  visit(doc)
  return urls
}

async function main() {
  const projectId = env('SANITY_PROJECT_ID', 'NEXT_PUBLIC_SANITY_PROJECT_ID')
  const dataset = env('SANITY_DATASET', 'NEXT_PUBLIC_SANITY_DATASET')
  const token = env('SANITY_API_TOKEN')
  const outDir = path.resolve(argValue('--out', '.migration/snapshot'))
  const assetsDir = path.join(outDir, 'assets')
  const externalDir = path.join(outDir, 'external')
  fs.mkdirSync(assetsDir, { recursive: true })
  fs.mkdirSync(externalDir, { recursive: true })
  const headers = { Authorization: `Bearer ${token}` }

  // 1. Documents
  console.log('Export des documents…')
  const exportUrl = `https://${projectId}.api.sanity.io/${API_VERSION}/data/export/${dataset}`
  const ndjson = await (await fetchOk(exportUrl, { headers })).text()
  const docs: SanityDoc[] = ndjson
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line))
  fs.writeFileSync(path.join(outDir, 'documents.ndjson'), ndjson.endsWith('\n') ? ndjson : `${ndjson}\n`, { mode: 0o600 })

  const counts: Record<string, number> = {}
  for (const doc of docs) counts[doc._type] = (counts[doc._type] ?? 0) + 1
  const drafts = docs.filter((doc) => doc._id.startsWith('drafts.')).length

  // 2. Assets Sanity
  const assets = docs.filter((doc) => doc._type === 'sanity.imageAsset' || doc._type === 'sanity.fileAsset')
  let downloaded = 0
  let skipped = 0
  for (const asset of assets) {
    const url = asset.url as string
    const file = path.join(assetsDir, `${asset._id}.${asset.extension ?? 'bin'}`)
    if (fs.existsSync(file) && fs.statSync(file).size === asset.size) {
      skipped++
      continue
    }
    const buffer = Buffer.from(await (await fetchOk(url)).arrayBuffer())
    fs.writeFileSync(file, buffer)
    downloaded++
  }
  console.log(`Assets : ${downloaded} téléchargés, ${skipped} déjà présents`)

  // 3. Images externes des articles
  const external = [...new Set(docs.flatMap(externalImageUrls))]
  const externalReport: { url: string; file?: string; error?: string }[] = []
  for (const url of external) {
    const file = path.join(externalDir, externalImageFileName(url))
    if (fs.existsSync(file)) {
      externalReport.push({ url, file: path.basename(file) })
      continue
    }
    try {
      const response = await fetchOk(url, undefined, 2)
      const type = response.headers.get('content-type') ?? ''
      if (!type.startsWith('image/')) throw new Error(`type ${type}`)
      fs.writeFileSync(file, Buffer.from(await response.arrayBuffer()))
      externalReport.push({ url, file: path.basename(file) })
    } catch (error) {
      externalReport.push({ url, error: String(error instanceof Error ? error.message : error) })
    }
  }
  console.log(`Images externes : ${externalReport.filter((r) => r.file).length}/${external.length} récupérées`)

  // 4. Comptes du Studio (gérés par Sanity : e-mail et rôle seulement)
  let studioMembers: { id: string; roles: string[]; isRobot: boolean; email?: string; name?: string }[] = []
  try {
    const project = await (await fetchOk(`https://api.sanity.io/${API_VERSION}/projects/${projectId}`, { headers })).json()
    const members = (project.members ?? []) as { id: string; isRobot?: boolean; roles?: { name: string }[] }[]
    const humans = members.filter((member) => !member.isRobot)
    let profiles: { id: string; email?: string; displayName?: string }[] = []
    if (humans.length > 0) {
      const response = await fetch(
        `https://api.sanity.io/${API_VERSION}/projects/${projectId}/users/${humans.map((m) => m.id).join(',')}`,
        { headers }
      )
      if (response.ok) {
        const body = await response.json()
        profiles = Array.isArray(body) ? body : [body]
      }
    }
    studioMembers = members.map((member) => {
      const profile = profiles.find((p) => p.id === member.id)
      return {
        id: member.id,
        roles: (member.roles ?? []).map((role) => role.name),
        isRobot: !!member.isRobot,
        email: profile?.email?.toLowerCase(),
        name: profile?.displayName,
      }
    })
  } catch (error) {
    console.warn(`Membres du Studio non lus : ${error instanceof Error ? error.message : error}`)
  }
  fs.writeFileSync(path.join(outDir, 'studio-members.json'), JSON.stringify(studioMembers, null, 2), { mode: 0o600 })
  fs.writeFileSync(path.join(outDir, 'external-images.json'), JSON.stringify(externalReport, null, 2))

  const manifest = {
    exportedAt: new Date().toISOString(),
    projectId,
    dataset,
    documents: docs.length,
    drafts,
    counts,
    assets: { total: assets.length, bytes: assets.reduce((sum, a) => sum + Number(a.size ?? 0), 0) },
    externalImages: { total: external.length, retrieved: externalReport.filter((r) => r.file).length },
    studioMembers: {
      total: studioMembers.length,
      humans: studioMembers.filter((m) => !m.isRobot).length,
      withEmail: studioMembers.filter((m) => m.email).length,
      roles: studioMembers.map((m) => m.roles.join('+')),
    },
  }
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
  console.log(JSON.stringify({ ...manifest, projectId: '<masqué>' }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
