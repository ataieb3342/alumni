import { accounts, expect, login, statePath, test } from './support'

test.describe('Parcours membre', () => {
  test.use({ storageState: statePath('member') })

  test('annonces : recherche et filtre par type', async ({ page }) => {
    await page.goto('/annonces')
    const types = page.getByRole('group', { name: "Type d'annonce" })
    await types.getByRole('button', { name: /Événements/ }).click()
    await expect(types.getByRole('button', { name: /Événements/ })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('link', { name: /Conférence sur la lumière/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Vente de calculatrices/ })).toHaveCount(0)

    await types.getByRole('button', { name: /Toutes/ }).click()
    await page.getByRole('searchbox', { name: 'Rechercher une annonce' }).fill('calculatrices')
    await expect(page.getByRole('link', { name: /Vente de calculatrices/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Conférence sur la lumière/ })).toHaveCount(0)
  })

  test('annuaire : suggestion choisie au clavier', async ({ page }) => {
    await page.goto('/annuaire')
    const search = page.getByRole('combobox', { name: "Rechercher dans l'annuaire" })
    await search.fill('Pari')
    const suggestions = page.getByRole('listbox', { name: 'Suggestions' })
    await expect(suggestions.getByRole('option').first()).toContainText('Paris')
    await search.press('ArrowDown')
    await expect(suggestions.getByRole('option').first()).toHaveAttribute('aria-selected', 'true')
    await search.press('Enter')
    await expect(page).toHaveURL(/ville=Paris/)
    await expect(page.getByRole('link', { name: /Léa Bernard/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Hugo Petit/ })).toHaveCount(0)
  })

  test('préférences de newsletter enregistrées dès qu’on coche', async ({ page }) => {
    await page.goto('/parametres')
    const toggle = page.getByRole('switch', { name: 'Notifications des annonces' })
    const before = await toggle.getAttribute('aria-checked')
    await toggle.click()
    await expect(page.getByText(/Abonnement (activé|désactivé)/)).toBeVisible()
    await page.reload()
    await expect(page.getByRole('switch', { name: 'Notifications des annonces' })).toHaveAttribute('aria-checked', before === 'true' ? 'false' : 'true')
  })

  test('témoignage : écrire, retrouver, supprimer', async ({ page }) => {
    const title = `Mon année d’échange au Canada ${Date.now()}`
    await page.goto('/temoignages/nouveau')
    await page.getByRole('radio', { name: /international/i }).check({ force: true })
    await page.getByRole('textbox', { name: 'Titre', exact: true }).fill(title)
    await page.getByRole('textbox', { name: 'Résumé', exact: true }).fill('Une année scolaire à Montréal : l’inscription, le logement, les cours et ce que j’en retiens pour la suite.')
    await page.getByRole('radio', { name: '4 sur 5' }).click()
    await page.getByRole('button', { name: 'Publier mon témoignage' }).click()
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()

    await page.goto('/temoignages')
    await page.getByRole('searchbox', { name: 'Rechercher un témoignage' }).fill('Canada')
    await expect(page.getByRole('link', { name: new RegExp(title) })).toBeVisible()

    await page.goto('/temoignages/mes-temoignages')
    const item = page.getByRole('listitem').filter({ hasText: title })
    await item.getByRole('button', { name: 'Supprimer' }).click()
    await page.getByRole('dialog', { name: 'Supprimer définitivement ?' }).getByRole('button', { name: 'Supprimer' }).click()
    await expect(page.getByRole('listitem').filter({ hasText: title })).toHaveCount(0)
  })
})

test.describe('Mobile : aucune page ne déborde horizontalement', () => {
  test.use({ viewport: { width: 375, height: 760 } })

  for (const role of ['member', 'admin'] as const) {
    test(`pages ${role === 'member' ? 'membres' : 'd’administration'}`, async ({ browser }) => {
      const context = await browser.newContext({ storageState: statePath(role), viewport: { width: 375, height: 760 } })
      const page = await context.newPage()
      const paths =
        role === 'member'
          ? ['/accueil', '/annuaire', '/annonces', '/annonces/nouvelle', '/temoignages', '/temoignages/nouveau', '/blog', '/profil', '/parametres', '/a-propos']
          : ['/admin', '/admin/utilisateurs', '/admin/contenus', '/admin/medias', '/admin/statistiques', '/admin/parametres']
      for (const path of paths) {
        await page.goto(path)
        await expect(page.locator('main'), path).toBeVisible()
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
        expect(overflow, `${path} déborde de ${overflow}px`).toBeLessThanOrEqual(0)
      }
      await context.close()
    })
  }
})

test.describe('Comptes : paramètres', () => {
  test('changer son mot de passe, se déconnecter, se reconnecter', async ({ page }) => {
    const account = accounts().changer
    const next = `Change!${Date.now()}x`
    await login(page, account.email, account.password)
    await expect(page).toHaveURL(/\/accueil$/)
    await page.goto('/parametres')
    await page.getByRole('textbox', { name: 'Mot de passe actuel', exact: true }).fill(account.password)
    await page.getByRole('textbox', { name: 'Nouveau mot de passe', exact: true }).fill(next)
    await page.getByRole('textbox', { name: 'Confirmer le nouveau mot de passe', exact: true }).fill(next)
    await page.getByRole('button', { name: 'Changer le mot de passe' }).click()
    await expect(page.getByText('Mot de passe modifié')).toBeVisible()

    await page.getByRole('button', { name: /Mon compte/ }).click()
    await page.getByRole('menuitem', { name: 'Se déconnecter' }).or(page.getByRole('button', { name: 'Se déconnecter' })).first().click()
    await expect(page).toHaveURL(/localhost:\d+\/$/)

    await login(page, account.email, account.password)
    await expect(page.getByRole('alert').filter({ hasText: /incorrect/i })).toBeVisible()
    await login(page, account.email, next)
    await expect(page).toHaveURL(/\/accueil$/)
  })

  test('supprimer son compte : ses annonces disparaissent, la connexion est refusée', async ({ page, browser }) => {
    const account = accounts().leaving
    await login(page, account.email, account.password)
    await expect(page).toHaveURL(/\/accueil$/)
    await page.goto('/parametres')
    await page.getByRole('button', { name: 'Supprimer mon compte' }).click()
    const dialog = page.getByRole('dialog', { name: 'Supprimer mon compte ?' })
    await expect(dialog.getByRole('button', { name: 'Supprimer définitivement' })).toBeDisabled()
    await dialog.getByRole('textbox').fill('SUPPRIMER')
    await dialog.getByRole('button', { name: 'Supprimer définitivement' }).click()
    await expect(page).toHaveURL(/localhost:\d+\/$/)

    const member = await browser.newContext({ storageState: statePath('member') })
    const memberPage = await member.newPage()
    await memberPage.goto('/annonces')
    await expect(memberPage.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(memberPage.getByRole('link', { name: /Vente de calculatrices/ })).toHaveCount(0)
    await memberPage.goto('/annuaire?q=Marc')
    await expect(memberPage.getByRole('link', { name: /Marc Départ/ })).toHaveCount(0)
    await member.close()

    await login(page, account.email, account.password)
    await expect(page.getByRole('alert').filter({ hasText: /incorrect/i })).toBeVisible()
  })

  test('lycéen : profil restreint et absent de l’annuaire', async ({ page }) => {
    const account = accounts().student
    await login(page, account.email, account.password)
    await expect(page).toHaveURL(/\/accueil$/)
    await page.goto('/profil')
    await expect(page.getByRole('textbox', { name: 'Prénom', exact: true })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Ville actuelle', exact: true })).toHaveCount(0)
    await page.goto('/annuaire?q=Zo%C3%A9')
    await expect(page.getByRole('link', { name: /Zoé Lycéenne/ })).toHaveCount(0)
  })
})

test.describe('Visiteur sur mobile', () => {
  test.use({ viewport: { width: 375, height: 760 }, isMobile: true, hasTouch: true })

  test('menu mobile et recherche dans le blog', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Ouvrir le menu' }).click()
    await page.getByRole('navigation', { name: 'Navigation mobile' }).getByRole('link', { name: 'Blog' }).click()
    await expect(page).toHaveURL(/\/blog$/)
    const search = page.getByRole('searchbox', { name: 'Rechercher un article' })
    await search.fill('Bienvenue')
    await expect(page.getByRole('link', { name: /Bienvenue sur le nouveau site/ })).toBeVisible()
    await search.fill('aucun article ne parle de ça')
    await expect(page.getByRole('link', { name: /Bienvenue sur le nouveau site/ })).toHaveCount(0)
    // Pas de défilement horizontal sur mobile
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
})
