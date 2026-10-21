import fs from 'node:fs'
import path from 'node:path'
import { expect, test as base, type Page } from '@playwright/test'
import type { E2EAccounts } from '@/tools/e2e/seed'

export const E2E_DIR = path.resolve('.data/e2e')
export const statePath = (role: 'admin' | 'member') => path.join(E2E_DIR, `state-${role}.json`)

export function accounts(): E2EAccounts {
  return JSON.parse(fs.readFileSync(path.join(E2E_DIR, 'accounts.json'), 'utf8'))
}

const octet = () => Math.floor(Math.random() * 250) + 1

/**
 * Chaque test a sa propre adresse IP (en-tête X-Forwarded-For) : le limiteur
 * de connexions (5 par minute et par IP) ne se déclenche pas entre scénarios.
 */
export const test = base.extend({
  extraHTTPHeaders: async ({}, provide) => {
    await provide({ 'x-forwarded-for': `10.${octet()}.${octet()}.${octet()}` })
  },
})
export { expect }

export async function login(page: Page, email: string, password: string) {
  await page.goto('/connexion')
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(email)
  await page.getByRole('textbox', { name: 'Mot de passe', exact: true }).fill(password)
  await page.getByRole('button', { name: 'Se connecter' }).click()
}

/** Dernier e-mail déposé dans la boîte de test pour ce destinataire */
export async function lastEmailTo(email: string) {
  const dir = path.join(E2E_DIR, 'outbox')
  let found: { to: string; subject: string; html: string } | undefined
  await expect
    .poll(
      () => {
        const files = fs.existsSync(dir) ? fs.readdirSync(dir).sort() : []
        found = files
          .map((file) => JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')))
          .filter((mail) => String(mail.to).includes(email))
          .at(-1)
        return !!found
      },
      { message: `e-mail pour ${email}` }
    )
    .toBe(true)
  return found!
}
