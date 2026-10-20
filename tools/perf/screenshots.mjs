/**
 * Captures d'écran des pages principales (mobile 390×844, desktop 1440×900).
 *
 * Usage : NEXTAUTH_SECRET=… node tools/perf/screenshots.mjs --base http://localhost:3101 --label before [--cwd <projet>]
 *           [--only public|members] [--blur-members] [--session-user <id>]
 * Résultat : docs/screenshots/<label>/<page>-<format>.jpg
 *
 * --blur-members floute textes et photos des pages membres : le dépôt est
 * public, les captures ne doivent laisser lire aucune donnée personnelle.
 */
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'
import { sessionCookie } from './session-cookie.mjs'

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, all) => (cur.startsWith('--') ? [...acc, [cur.slice(2), all[i + 1]]] : acc), [])
)
const base = args.base ?? 'http://localhost:3000'
const label = args.label ?? 'run'
const cwd = args.cwd ?? process.cwd()
const outDir = path.join(process.cwd(), 'docs', 'screenshots', label)
fs.mkdirSync(outDir, { recursive: true })
const memberId = args['member-id']
const only = args.only
const BLUR_CSS = `
  main img, main picture, main svg image, main [style*="background-image"] { filter: blur(16px) !important; }
  main :is(h1, h2, h3, h4, p, a, span, li, dd, dt, td, th, label, strong, em, small, figcaption, blockquote, button) {
    color: transparent !important; text-shadow: 0 0 10px rgba(40, 40, 60, 0.8) !important;
  }
`

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
const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {})
for (const [format, viewport] of Object.entries({ mobile: { width: 390, height: 844 }, desktop: { width: 1440, height: 900 } })) {
  for (const auth of [false, true].filter((a) => !only || (only === 'members') === a)) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: format === 'mobile' ? 2 : 1, locale: 'fr-FR' })
    if (auth) await context.addCookies([{ name: cookie.name, value: cookie.value, url: base, secure: cookie.secure }])
    await context.route('**/api/activity/log', (route) => route.fulfill({ status: 204 }))
    const page = await context.newPage()
    for (const target of PAGES.filter((p) => p.auth === auth)) {
      await page.goto(`${base}${target.path}`, { waitUntil: 'load' })
      await page.waitForTimeout(1500)
      if (auth && 'blur-members' in args) await page.addStyleTag({ content: BLUR_CSS })
      await page.screenshot({ path: path.join(outDir, `${target.name}-${format}.jpg`), type: 'jpeg', quality: 70, fullPage: false })
      console.log(`${target.name}-${format}`)
    }
    await context.close()
  }
}
await browser.close()
