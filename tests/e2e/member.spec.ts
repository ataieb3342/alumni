import { expect, statePath, test } from './support'

test.use({ storageState: statePath('member') })

test.describe('Membre', () => {
  test('cherche dans l’annuaire par matière et par ville, puis ouvre une fiche', async ({ page }) => {
    await page.goto('/annuaire')
    await expect(page.getByRole('heading', { name: /Tous les membres/ })).toBeVisible()

    // Recherche libre : nom, école, ville, matière
    await page.getByRole('combobox', { name: "Rechercher dans l'annuaire" }).fill('physique')
    await expect(page.getByRole('link', { name: /Léa Bernard/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Hugo Petit/ })).toHaveCount(0)
    await expect(page).toHaveURL(/q=physique/)

    // Filtres dans l'adresse : partageables
    await page.goto('/annuaire?ville=Besan%C3%A7on')
    await expect(page.getByRole('link', { name: /Hugo Petit/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Léa Bernard/ })).toHaveCount(0)

    await page.getByRole('link', { name: /Hugo Petit/ }).click()
    await expect(page.getByRole('heading', { level: 1, name: /Hugo Petit/ })).toBeVisible()
    await expect(page.getByText('Interne en médecine').first()).toBeVisible()
  })

  test('voit les articles réservés aux membres et les témoignages', async ({ page }) => {
    // Chaque page vue est journalisée (statistiques de fréquentation)
    const logged = page.waitForResponse((response) => response.url().endsWith('/api/activity/log'))
    await page.goto('/blog')
    expect((await logged).status()).toBe(200)
    await expect(page.getByRole('link', { name: /Compte rendu réservé aux membres/ })).toBeVisible()
    await page.goto('/temoignages')
    await expect(page.getByRole('link', { name: /De la prépa aux études de médecine/ })).toBeVisible()
  })

  test('publie, modifie puis supprime une annonce', async ({ page }) => {
    const title = `Stage de développement web ${Date.now()}`
    await page.goto('/annonces/nouvelle')
    await page.getByRole('radio', { name: 'Stage' }).check({ force: true })
    await page.getByRole('textbox', { name: 'Titre', exact: true }).fill(title)
    await page.getByRole('textbox', { name: 'Description', exact: true }).fill('Six mois au sein d’une équipe produit à Besançon.')
    // Validation : un moyen de contact est obligatoire
    await page.getByRole('button', { name: 'Publier l’annonce' }).click()
    await expect(page.getByText('Indiquez au moins un moyen de contact').first()).toBeVisible()
    await page.getByRole('textbox', { name: 'E-mail de contact', exact: true }).fill('recrutement@e2e.test')
    await page.getByRole('button', { name: 'Publier l’annonce' }).click()
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()

    await page.goto('/annonces/mes-annonces')
    const item = page.getByRole('listitem').filter({ hasText: title })
    await item.getByRole('link', { name: 'Modifier' }).click()
    await page.getByRole('textbox', { name: 'Lieu', exact: true }).fill('Besançon')
    await page.getByRole('button', { name: 'Enregistrer les modifications' }).click()
    await expect(page).toHaveURL(/\/annonces\/mes-annonces/)
    await expect(item).toContainText('Besançon')

    await item.getByRole('button', { name: 'Supprimer' }).click()
    const dialog = page.getByRole('dialog', { name: 'Supprimer définitivement ?' })
    await dialog.getByRole('button', { name: 'Supprimer' }).click()
    await expect(page.getByRole('listitem').filter({ hasText: title })).toHaveCount(0)
  })

  test('complète son profil, visible ensuite dans l’annuaire', async ({ page }) => {
    await page.goto('/profil')
    await page.getByRole('textbox', { name: 'Ville actuelle', exact: true }).fill('Grenoble')
    await page.getByRole('textbox', { name: 'Quelques mots sur vous', exact: true }).fill('Ingénieure logiciel, ravie d’aider les lycéens.')
    await page.getByRole('button', { name: /Enregistrer/ }).first().click()
    await expect(page.getByText('Profil mis à jour')).toBeVisible()

    await page.goto('/annuaire?ville=Grenoble')
    await expect(page.getByRole('link', { name: /Camille Martin/ })).toBeVisible()
  })

  test('une fois connecté, aucun lien ne renvoie vers l’inscription', async ({ page }) => {
    const pages = ['/accueil', '/a-propos', '/alumni', '/qrcode', '/blog', '/annuaire', '/annonces', '/temoignages', '/profil', '/parametres', '/mentions-legales']
    for (const path of pages) {
      await page.goto(path)
      await expect(page.locator('main'), path).toBeVisible()
      await expect(page.locator('a[href^="/inscription"]'), path).toHaveCount(0)
    }
    // Pages de campagne : un accès à l'espace membre à la place de l'appel à adhérer
    await page.goto('/qrcode')
    await expect(page.getByRole('link', { name: /Mon espace membre/ })).toBeVisible()

    // Menu mobile
    await page.setViewportSize({ width: 375, height: 760 })
    await page.goto('/a-propos')
    await page.getByRole('button', { name: 'Ouvrir le menu' }).click()
    const menu = page.getByRole('navigation', { name: 'Navigation mobile' })
    await expect(menu).toBeVisible()
    await expect(menu.locator('a[href^="/inscription"], a[href^="/connexion"]')).toHaveCount(0)

    // Ouvrir l'inscription ou la connexion ramène à l'espace membre
    await page.goto('/inscription')
    await expect(page).toHaveURL(/\/accueil$/)
    await page.goto('/connexion')
    await expect(page).toHaveURL(/\/accueil$/)
  })

  test('n’a pas accès à l’administration, même par l’API', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).not.toHaveURL(/\/admin/)
    await expect(page.getByRole('region', { name: "Barre d'administration" })).toHaveCount(0)

    // Appel direct, jeton CSRF valide compris : refusé côté serveur
    const status = await page.evaluate(async () => {
      const csrf = document.cookie.match(/csrf_token=([^;]+)/)?.[1] ?? ''
      const response = await fetch('/api/admin/content/about/draft', {
        method: 'PUT',
        headers: { 'content-type': 'application/json', 'x-csrf-token': csrf },
        body: JSON.stringify({ data: { hero: { title: 'Piraté' } } }),
      })
      return response.status
    })
    expect(status).toBe(403)
  })
})
