import fs from 'node:fs'
import { accounts, expect, login, statePath, test } from './support'

test.use({ storageState: statePath('admin') })

test.describe('Administration : membres et modération', () => {
  test('suspendre un membre : il disparaît de l’annuaire', async ({ page, browser }) => {
    await page.goto('/admin/utilisateurs')
    await page.getByRole('button', { name: 'Actions pour Yanis Roux' }).click()
    await page.getByRole('button', { name: 'Suspendre' }).click()
    await page.getByRole('dialog', { name: 'Suspendre Yanis Roux ?' }).getByRole('button', { name: 'Suspendre' }).click()
    await expect(page.getByText(/Yanis Roux/).first()).toBeVisible()

    const member = await browser.newContext({ storageState: statePath('member') })
    const memberPage = await member.newPage()
    await memberPage.goto('/annuaire?q=Yanis')
    await expect(memberPage.getByRole('heading', { name: 'Aucun membre ne correspond' })).toBeVisible()
    await expect(memberPage.getByRole('link', { name: /Yanis Roux/ })).toHaveCount(0)
    await member.close()
  })

  test('un membre supprimé pendant sa session retombe sur la connexion, sans boucle', async ({ page, browser }) => {
    const ghost = accounts().ghost
    const memberContext = await browser.newContext({ storageState: { cookies: [], origins: [] }, extraHTTPHeaders: { 'x-forwarded-for': '10.77.1.1' } })
    const memberPage = await memberContext.newPage()
    await login(memberPage, ghost.email, ghost.password)
    await expect(memberPage).toHaveURL(/\/accueil$/)

    await page.goto('/admin/utilisateurs')
    await page.getByRole('button', { name: 'Actions pour Gaspard Fantôme' }).click()
    await page.getByRole('button', { name: 'Supprimer le compte…' }).click()
    const dialog = page.getByRole('dialog', { name: 'Supprimer le compte de Gaspard Fantôme ?' })
    await dialog.getByRole('textbox').fill('SUPPRIMER')
    await dialog.getByRole('button', { name: 'Supprimer définitivement' }).click()
    await expect(page.getByText('Compte supprimé')).toBeVisible()

    // Son jeton paraît encore valide, mais le compte n'existe plus : connexion, pas de boucle
    await memberPage.goto('/connexion')
    await expect(memberPage.getByRole('heading', { name: 'Connexion' })).toBeVisible()
    await memberPage.goto('/accueil')
    await expect(memberPage).toHaveURL(/\/connexion/)
    await memberPage.goto('/inscription')
    await expect(memberPage.getByRole('heading', { name: 'Adhérer au réseau' })).toBeVisible()
    await memberContext.close()
  })

  test('modifier la fiche d’un membre et le nommer au bureau', async ({ page, browser }) => {
    await page.goto('/admin/utilisateurs')
    await page.getByRole('link', { name: 'Inès Moreau' }).click()
    await page.getByRole('textbox', { name: 'Ville actuelle', exact: true }).fill('Strasbourg')
    await page.getByText('Trésorier(e)', { exact: true }).click()
    await page.getByRole('button', { name: 'Enregistrer', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Enregistrer', exact: true })).toBeDisabled()

    const visitor = await browser.newContext({ storageState: { cookies: [], origins: [] } })
    const visitorPage = await visitor.newPage()
    await visitorPage.goto('/a-propos')
    await expect(visitorPage.getByRole('region', { name: 'Le bureau' })).toContainText('Inès Moreau')
    await visitor.close()
  })

  test('archiver une annonce la retire de la liste, la republier la rétablit', async ({ page, browser }) => {
    await page.goto('/admin/contenus')
    const row = page.getByRole('listitem').filter({ hasText: 'Conférence sur la lumière' })
    await row.getByRole('combobox', { name: 'Statut' }).selectOption('archived')
    await expect(page.getByText('Statut : Archivé')).toBeVisible()

    const member = await browser.newContext({ storageState: statePath('member') })
    const memberPage = await member.newPage()
    await memberPage.goto('/annonces')
    await expect(memberPage.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(memberPage.getByRole('link', { name: /Conférence sur la lumière/ })).toHaveCount(0)

    await row.getByRole('combobox', { name: 'Statut' }).selectOption('published')
    await expect(page.getByText('Statut : Publié')).toBeVisible()
    await memberPage.reload()
    await expect(memberPage.getByRole('link', { name: /Conférence sur la lumière/ })).toBeVisible()
    await member.close()
  })

  test('médiathèque, statistiques et export des abonnés', async ({ page }) => {
    await page.goto('/admin/medias')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await page.goto('/admin/statistiques')
    await expect(page.getByRole('heading', { name: 'Journal d’activité' })).toBeVisible()

    await page.goto('/admin/parametres')
    const download = page.waitForEvent('download')
    await page.getByRole('link', { name: /Télécharger les abonnés/ }).or(page.getByRole('button', { name: /Télécharger les abonnés/ })).first().click()
    const file = await download
    expect(file.suggestedFilename()).toMatch(/\.csv$/)
    const csv = fs.readFileSync((await file.path())!, 'utf8')
    expect(csv.split('\n')[0]).toMatch(/mail/i)
  })
})
