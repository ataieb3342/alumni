/**
 * Tableau Markdown avant / après à partir de docs/perf/before.json et after.json.
 * Usage : node tools/perf/compare.mjs [before] [after]
 */
import fs from 'node:fs'
import path from 'node:path'

const [beforeLabel = 'before', afterLabel = 'after'] = process.argv.slice(2)
const read = (label) => JSON.parse(fs.readFileSync(path.join('docs', 'perf', `${label}.json`), 'utf8'))
const before = read(beforeLabel)
const after = read(afterLabel)

const NAMES = {
  'accueil-visiteur': 'Accueil (visiteur)',
  'a-propos': 'À propos',
  connexion: 'Connexion',
  'accueil-membre': 'Accueil membre',
  annuaire: 'Annuaire',
  'fiche-membre': 'Fiche membre',
  annonces: 'Annonces',
  temoignages: 'Témoignages',
  blog: 'Blog',
}
const delta = (a, b) => {
  const d = b - a
  return d === 0 ? '=' : d > 0 ? `+${d}` : `${d}`
}
const cell = (a, b) => `${a} → **${b}** (${delta(a, b)})`
const ms = (a, b) => `${(a / 1000).toFixed(1)} → **${(b / 1000).toFixed(1)}** s`

for (const formFactor of ['mobile', 'desktop']) {
  console.log(`\n**${formFactor === 'mobile' ? 'Mobile' : 'Ordinateur'}** (médiane de ${after.runs} passages)\n`)
  console.log('| Page | Performance | Accessibilité | Bonnes pratiques | SEO | LCP | CLS |')
  console.log('|---|---|---|---|---|---|---|')
  const totals = { performance: [0, 0], accessibility: [0, 0], bestPractices: [0, 0], seo: [0, 0] }
  let count = 0
  for (const [name, label] of Object.entries(NAMES)) {
    const a = before.results[`${name}:${formFactor}`]
    const b = after.results[`${name}:${formFactor}`]
    if (!a || !b) continue
    count++
    for (const key of Object.keys(totals)) {
      totals[key][0] += a[key]
      totals[key][1] += b[key]
    }
    console.log(`| ${label} | ${cell(a.performance, b.performance)} | ${cell(a.accessibility, b.accessibility)} | ${cell(a.bestPractices, b.bestPractices)} | ${cell(a.seo, b.seo)} | ${ms(a.lcp, b.lcp)} | ${a.cls} → **${b.cls}** |`)
  }
  const avg = (key, i) => Math.round(totals[key][i] / count)
  console.log(`| **Moyenne** | ${cell(avg('performance', 0), avg('performance', 1))} | ${cell(avg('accessibility', 0), avg('accessibility', 1))} | ${cell(avg('bestPractices', 0), avg('bestPractices', 1))} | ${cell(avg('seo', 0), avg('seo', 1))} | | |`)
}
