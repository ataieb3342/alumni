/**
 * Mesures Lighthouse (performance, accessibilité, bonnes pratiques, SEO) des
 * pages principales, en mobile et desktop, médiane de N passages.
 *
 * Usage :
 *   NEXTAUTH_SECRET=… node tools/perf/lighthouse.mjs --base http://localhost:3101 \
 *     --label before --runs 3 [--cwd <projet>] [--member-id <id>]
 *
 * Résultat : docs/perf/<label>.json (scores médians) + rapports HTML bruts
 * dans docs/perf/<label>/ (non versionnés).
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { sessionCookie } from './session-cookie.mjs'

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, all) => (cur.startsWith('--') ? [...acc, [cur.slice(2), all[i + 1]]] : acc), [])
)
const base = args.base ?? 'http://localhost:3000'
const label = args.label ?? 'run'
const runs = Number(args.runs ?? 3)
const cwd = args.cwd ?? process.cwd()
const outDir = path.join(process.cwd(), 'docs', 'perf')
const rawDir = path.join(outDir, label)
fs.mkdirSync(rawDir, { recursive: true })

const chrome = process.env.CHROME_PATH
const memberId = args['member-id']

const PAGES = [
  { name: 'accueil-visiteur', path: '/', auth: false },
  { name: 'a-propos', path: '/a-propos', auth: false },
  { name: 'connexion', path: '/connexion', auth: false },
  { name: 'accueil-membre', path: '/accueil', auth: true },
  { name: 'annuaire', path: '/annuaire', auth: true },
  ...(memberId ? [{ name: 'fiche-membre', path: `/annuaire/${memberId}`, auth: true }] : []),
  { name: 'annonces', path: '/annonces', auth: true },
  { name: 'temoignages', path: '/temoignages', auth: true },
  { name: 'blog', path: '/blog', auth: true },
]

const cookie = await sessionCookie({ cwd, userId: args['session-user'], email: args['session-email'] })
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

const results = {}
for (const page of PAGES) {
  for (const formFactor of ['mobile', 'desktop']) {
    const samples = []
    for (let i = 0; i < runs; i++) {
      const out = path.join(rawDir, `${page.name}-${formFactor}-${i}`)
      const flags = [
        '--yes', 'lighthouse@13.5.0', `${base}${page.path}`,
        '--quiet', '--output=json', '--output=html', `--output-path=${out}`,
        '--only-categories=performance,accessibility,best-practices,seo',
        '--chrome-flags=--headless=new --no-sandbox',
        // Le suivi des pages vues écrit en base : on ne le déclenche pas pendant les mesures
        '--blocked-url-patterns=*/api/activity/log*',
        ...(formFactor === 'desktop' ? ['--preset=desktop'] : []),
        ...(page.auth ? [`--extra-headers=${JSON.stringify({ Cookie: `${cookie.name}=${cookie.value}` })}`] : []),
      ]
      try {
        execFileSync('npx', flags, { stdio: ['ignore', 'ignore', 'pipe'], env: { ...process.env, ...(chrome ? { CHROME_PATH: chrome } : {}) } })
        const report = JSON.parse(fs.readFileSync(`${out}.report.json`, 'utf8'))
        if (report.finalDisplayedUrl && new URL(report.finalDisplayedUrl).pathname !== page.path) {
          console.warn(`! ${page.path} redirigé vers ${report.finalDisplayedUrl}`)
        }
        const c = report.categories
        samples.push({
          performance: Math.round(c.performance.score * 100),
          accessibility: Math.round(c.accessibility.score * 100),
          bestPractices: Math.round(c['best-practices'].score * 100),
          seo: Math.round(c.seo.score * 100),
          lcp: Math.round(report.audits['largest-contentful-paint'].numericValue),
          cls: Number(report.audits['cumulative-layout-shift'].numericValue.toFixed(3)),
          tbt: Math.round(report.audits['total-blocking-time'].numericValue),
          finalUrl: report.finalDisplayedUrl,
        })
        fs.rmSync(`${out}.report.json`)
      } catch (error) {
        console.error(`x ${page.path} ${formFactor} #${i}: ${String(error.stderr ?? error).slice(0, 300)}`)
      }
    }
    if (samples.length === 0) continue
    const key = `${page.name}:${formFactor}`
    results[key] = {
      path: page.path,
      formFactor,
      runs: samples.length,
      ...Object.fromEntries(
        ['performance', 'accessibility', 'bestPractices', 'seo', 'lcp', 'cls', 'tbt'].map((metric) => [metric, median(samples.map((s) => s[metric]))])
      ),
      finalUrl: samples[0].finalUrl,
    }
    console.log(key, JSON.stringify(results[key]))
  }
}

fs.writeFileSync(path.join(outDir, `${label}.json`), JSON.stringify({ base, runs, date: new Date().toISOString(), results }, null, 2))
console.log(`→ docs/perf/${label}.json`)
