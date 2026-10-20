import { randomBytes } from 'node:crypto'
import { defineConfig, devices } from '@playwright/test'

/**
 * Tests de bout en bout sur un build de production (`next build` +
 * `next start`) et une base PGlite neuve remplie de membres fictifs
 * (tools/e2e/seed.ts). Aucun e-mail ne part : ils sont déposés dans
 * .data/e2e/outbox, où les tests lisent les liens d'invitation.
 *
 * Navigateur : Chromium de Playwright, ou Chrome installé
 * (PLAYWRIGHT_CHANNEL=chrome).
 */
const PORT = Number(process.env.E2E_PORT ?? 3200)
const BASE_URL = `http://localhost:${PORT}`
const secret = randomBytes(32).toString('base64url')

export default defineConfig({
  testDir: './tests/e2e',
  // Les scénarios partagent une base : exécution en série, dans l'ordre
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : [['list'], ['html', { open: 'never', outputFolder: '.data/e2e/report' }]],
  outputDir: '.data/e2e/results',
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}),
  },

  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/, use: { ...devices['Desktop Chrome'] } },
    { name: 'desktop', dependencies: ['setup'], testIgnore: /auth\.setup\.ts/, use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: {
    command: 'tsx tools/e2e/seed.ts && next build && next start -p ' + PORT,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 600_000,
    stdout: 'ignore',
    stderr: 'pipe',
    env: {
      DATABASE_URL: 'pglite:./.data/e2e/db',
      E2E_DIR: '.data/e2e',
      STORAGE_DRIVER: 'fs',
      MEDIA_DIR: '.data/e2e/media',
      EMAIL_TRANSPORT: 'outbox',
      EMAIL_OUTBOX_DIR: '.data/e2e/outbox',
      NEXTAUTH_URL: BASE_URL,
      AUTH_URL: BASE_URL,
      NEXT_PUBLIC_BASE_URL: BASE_URL,
      AUTH_TRUST_HOST: 'true',
      NEXTAUTH_SECRET: secret,
      AUTH_SECRET: secret,
      CRON_SECRET: randomBytes(16).toString('hex'),
      // Pas de connexion Google / LinkedIn ni d'envoi vers les services réels
      GOOGLE_CLIENT_ID: '',
      GOOGLE_CLIENT_SECRET: '',
      LINKEDIN_CLIENT_ID: '',
      LINKEDIN_CLIENT_SECRET: '',
      BLOB_READ_WRITE_TOKEN: '',
      EMAIL_USER: '',
      EMAIL_PASSWORD: '',
      NEXT_PUBLIC_SENTRY_DSN: '',
      SENTRY_DSN: '',
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },
})
