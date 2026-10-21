import sharp from 'sharp'
import type { Browser, Page } from '@playwright/test'
import { expect, statePath, test } from './support'

test.use({ storageState: statePath('admin') })

const adminBar = (page: Page) => page.getByRole('region', { name: "Barre d'administration" })

async function enterEditMode(page: Page) {
  await adminBar(page).getByRole('button', { name: 'Édition' }).click()
  await expect(adminBar(page).getByRole('button', { name: 'Édition' })).toHaveAttribute('aria-pressed', 'true')
}

/** Ce que voit un visiteur (navigateur sans session) */
async function asVisitor<T>(browser: Browser, path: string, read: (page: Page) => Promise<T>) {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const page = await context.newPage()
  await page.goto(path)
  try {
    return await read(page)
  } finally {
    await context.close()
  }
}

const visitorTitle = (browser: Browser) => asVisitor(browser, '/a-propos', (page) => page.getByRole('heading', { level: 1 }).innerText())

test('un administrateur enregistre son profil malgré la barre d’administration', async ({ page }) => {
  await page.goto('/profil')
  await expect(adminBar(page)).toBeVisible()
  await page.setViewportSize({ width: 1100, height: 900 })
  await page.getByRole('textbox', { name: 'Ville actuelle', exact: true }).fill('Dijon')
  // Milieu de page : la barre d'enregistrement est collée en bas de l'écran, là où
  // s'affiche la barre d'administration. Clic à l'écran, sans défilement.
  const save = page.getByRole('button', { name: 'Enregistrer', exact: true }).last()
  const box = await save.boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await expect(page.getByText('Profil mis à jour')).toBeVisible()
  // Le lien voisin n'est pas masqué non plus
  const link = await page.getByRole('link', { name: /Voir mon profil public/ }).boundingBox()
  const bar = await adminBar(page).locator('> div').boundingBox()
  expect(link!.y + link!.height).toBeLessThanOrEqual(bar!.y)
})

test.describe('Administration sur place', () => {
  test('modifier un texte : brouillon invisible des visiteurs, publication, puis restauration', async ({ page, browser }) => {
    const original = await visitorTitle(browser)
    const edited = `Notre association, en ${Date.now()}`

    await page.goto('/a-propos')
    await enterEditMode(page)
    const title = page.getByRole('textbox', { name: 'Titre de la page' })
    await title.click()
    await title.press('ControlOrMeta+a')
    await title.pressSequentially(edited)
    await title.blur()
    await expect(adminBar(page)).toContainText('Modifications en cours')
    await adminBar(page).getByRole('button', { name: 'Enregistrer' }).click()
    await expect(adminBar(page)).toContainText(/Brouillon enregistré/)

    // Le brouillon n'est pas visible des visiteurs
    expect((await visitorTitle(browser)).trim()).toBe(original.trim())

    await adminBar(page).getByRole('button', { name: 'Publier' }).click()
    await expect(adminBar(page)).toContainText('À jour : version publiée')
    await expect.poll(async () => (await visitorTitle(browser)).trim()).toBe(edited)

    // Historique : restaurer la version précédente, puis la republier
    await adminBar(page).getByRole('button', { name: "Plus d'actions" }).click()
    await page.getByRole('button', { name: 'Historique des versions' }).click()
    const history = page.getByRole('dialog', { name: /Historique/ })
    await expect(history).toBeVisible()
    await history.getByRole('button', { name: 'Restaurer' }).last().click()
    await page.getByRole('dialog', { name: 'Restaurer cette version ?' }).getByRole('button', { name: 'Restaurer' }).click()
    await expect(page.getByRole('textbox', { name: 'Titre de la page' })).toHaveText(original.trim())
    await adminBar(page).getByRole('button', { name: 'Publier' }).click()
    await expect.poll(async () => (await visitorTitle(browser)).trim()).toBe(original.trim())
  })

  test('remplacer une image par téléversement, publiée ensuite pour les visiteurs', async ({ page, browser }) => {
    const png = await sharp({ create: { width: 1200, height: 800, background: '#2b59c3', channels: 3 } }).png().toBuffer()
    await page.goto('/a-propos')
    await enterEditMode(page)
    await page.getByLabel(/Photo du lycée/).setInputFiles({ name: 'lycee.png', mimeType: 'image/png', buffer: png })
    await expect(adminBar(page)).toContainText(/Brouillon enregistré à/)
    await adminBar(page).getByRole('button', { name: 'Publier' }).click()
    await expect(adminBar(page)).toContainText('À jour : version publiée')

    const src = await asVisitor(browser, '/a-propos', (visitor) => visitor.locator('aside img').first().getAttribute('src'))
    expect(src).toMatch(/media%2Fuploads|\/media\/uploads\//)
  })

  test('écrire un article : brouillon introuvable pour les visiteurs jusqu’à sa publication', async ({ page, browser }) => {
    const title = `Retour sur le gala ${Date.now()}`
    await page.goto('/blog')
    await enterEditMode(page)
    await page.getByRole('button', { name: 'Nouvel article' }).click()
    const dialog = page.getByRole('dialog', { name: 'Nouvel article' })
    await dialog.getByLabel('Titre de l’article').fill(title)
    await dialog.getByRole('button', { name: 'Créer le brouillon' }).click()
    await expect(page).toHaveURL(/\/blog\/retour-sur-le-gala/)
    const path = new URL(page.url()).pathname
    // La barre a pris en charge le nouvel article
    await expect(adminBar(page)).toContainText('jamais publié')

    // Brouillon : page « introuvable » pour un visiteur, non indexable
    await asVisitor(browser, path, async (visitor) => {
      await expect(visitor.getByRole('heading', { name: 'Page introuvable' })).toBeVisible()
      await expect(visitor.getByText(title)).toHaveCount(0)
      await expect(visitor.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(1)
    })

    await adminBar(page).getByRole('button', { name: 'Publier' }).click()
    await expect(adminBar(page)).toContainText('À jour : version publiée')
    await expect
      .poll(() => asVisitor(browser, path, (visitor) => visitor.getByRole('heading', { level: 1 }).innerText()))
      .toBe(title)
  })

  test('tableau de bord : comptes en attente, contenus non publiés, médias, réglages', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    for (const name of ['Membres et rôles', 'Contenus', 'Médiathèque', 'Réglages du site']) {
      await expect(page.getByRole('navigation').getByRole('link', { name: new RegExp(name) }).first()).toBeVisible()
    }
    await page.goto('/admin/utilisateurs?statut=pending')
    await expect(page.getByText('Paul Attente')).toBeVisible()
  })
})
