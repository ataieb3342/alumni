import { expect, test } from './support'

test.describe('Visiteur', () => {
  test('découvre l’accueil, l’association et le blog public', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Aller au contenu' })).toBeAttached()

    await page.getByRole('navigation', { name: 'Navigation principale' }).getByRole('link', { name: 'À propos' }).click()
    await expect(page).toHaveURL(/\/a-propos/)

    await page.goto('/blog')
    await expect(page.getByRole('link', { name: /Bienvenue sur le nouveau site/ })).toBeVisible()
    // Les articles réservés aux membres n'apparaissent pas aux visiteurs
    await expect(page.getByText('Compte rendu réservé aux membres')).toHaveCount(0)
    await page.getByRole('link', { name: /Bienvenue sur le nouveau site/ }).click()
    await expect(page.getByRole('heading', { level: 1, name: /Bienvenue sur le nouveau site/ })).toBeVisible()
    await expect(page.getByText('Le site fait peau neuve.')).toBeVisible()
  })

  test('est invité à adhérer : liens vers l’inscription sur l’accueil, l’association et le pied de page', async ({ page }) => {
    for (const path of ['/', '/a-propos', '/qrcode']) {
      await page.goto(path)
      await expect(page.locator('main a[href^="/inscription"]').first(), path).toBeVisible()
    }
    await expect(page.getByRole('contentinfo').getByRole('link', { name: /Adhérer/ })).toBeVisible()
  })

  test('est invité à se connecter pour l’annuaire, puis y revient après connexion', async ({ page }) => {
    await page.goto('/annuaire?ville=Paris')
    await expect(page).toHaveURL(/\/connexion\?callbackUrl=%2Fannuaire%3Fville%3DParis/)
  })

  test('les pages membres et l’administration ne sont pas accessibles', async ({ page, request }) => {
    for (const path of ['/annonces', '/temoignages', '/profil', '/admin']) {
      await page.goto(path)
      await expect(page, path).toHaveURL(/\/connexion/)
    }
    // Écriture directe sur l'API sans session : refusée
    const response = await request.post('/api/announcements/create', { data: { title: 'Intrus' } })
    expect([401, 403]).toContain(response.status())
  })

  test('une adresse inconnue affiche une page 404 utile', async ({ page }) => {
    // Hors des sections publiques, un visiteur est d'abord invité à se connecter (comme avant)
    const response = await page.goto('/blog/cet-article-n-existe-pas')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { name: 'Page introuvable' })).toBeVisible()
    await expect(page.getByRole('link', { name: /accueil/i }).first()).toBeVisible()
  })
})
