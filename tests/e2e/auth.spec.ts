import { accounts, expect, lastEmailTo, login, test } from './support'

test.describe('Comptes', () => {
  test('un mot de passe erroné est refusé avec un message clair', async ({ page }) => {
    await login(page, accounts().member.email, 'mauvais-mot-de-passe')
    await expect(page.getByRole('alert').filter({ hasText: /incorrect/i })).toBeVisible()
    await expect(page).toHaveURL(/\/connexion/)
  })

  test('un compte en attente de validation n’accède pas à l’espace membre', async ({ page }) => {
    const { pending } = accounts()
    await login(page, pending.email, pending.password)
    await expect(page.getByText(/attente de validation|en cours de validation/i).first()).toBeVisible()
    await page.goto('/annuaire')
    await expect(page).not.toHaveURL(/\/annuaire/)
  })

  test('inscription, validation par un administrateur, puis première connexion', async ({ page, browser }) => {
    const email = `nouveau.${Date.now()}@e2e.test`
    const password = `Nouveau!${Date.now()}a`
    await page.goto('/inscription')
    await page.getByRole('radio', { name: /Ancien·ne élève/ }).check({ force: true })
    await page.getByRole('textbox', { name: 'Prénom', exact: true }).fill('Noé')
    await page.getByRole('textbox', { name: 'Nom', exact: true }).fill('Nouveau')
    await page.getByRole('textbox', { name: 'Email', exact: true }).fill(email)
    // Validation en direct du mot de passe
    await page.getByRole('textbox', { name: 'Mot de passe', exact: true }).fill('court')
    await expect(page.getByRole('list', { name: 'Règles du mot de passe' })).toBeVisible()
    await page.getByRole('textbox', { name: 'Mot de passe', exact: true }).fill(password)
    await page.getByRole('textbox', { name: 'Confirmer le mot de passe', exact: true }).fill(password)
    await expect(page.getByText('Les mots de passe correspondent')).toBeVisible()
    await page.getByRole('button', { name: /Envoyer ma demande/ }).click()
    await expect(page).toHaveURL(/\/validation-en-cours/)

    // L'administrateur valide la demande depuis /admin/utilisateurs
    const admin = await browser.newContext({ storageState: '.data/e2e/state-admin.json' })
    const adminPage = await admin.newPage()
    await adminPage.goto('/admin/utilisateurs?statut=pending')
    const row = adminPage.getByRole('listitem').filter({ hasText: 'Noé Nouveau' })
    await row.getByRole('button', { name: 'Valider' }).click()
    await expect(adminPage.getByText(/Noé Nouveau validé·e/)).toBeVisible()
    expect((await lastEmailTo(email)).subject).toMatch(/valid/i)
    await admin.close()

    await login(page, email, password)
    await expect(page).toHaveURL(/\/accueil$/)
    await expect(page.getByText('Bonjour Noé')).toBeVisible()
  })

  test('mot de passe oublié : lien reçu par e-mail, nouveau mot de passe, connexion', async ({ page }) => {
    const member = accounts().forgetful
    await page.goto('/mot-de-passe-oublie')
    await page.getByRole('textbox', { name: 'Email du compte', exact: true }).fill(member.email)
    await page.getByRole('button', { name: 'Recevoir un lien' }).click()
    await expect(page.getByText(/Si un compte existe pour/)).toBeVisible()

    const mail = await lastEmailTo(member.email)
    const link = mail.html.match(/href="([^"]*reinitialiser-mot-de-passe\?token=[^"]+)"/)?.[1]
    expect(link).toBeTruthy()
    const newPassword = `Renouvele!${Date.now()}b`
    await page.goto(new URL(link!).pathname + new URL(link!).search)
    await page.getByRole('textbox', { name: 'Nouveau mot de passe', exact: true }).fill(newPassword)
    await page.getByRole('textbox', { name: 'Confirmer le mot de passe', exact: true }).fill(newPassword)
    await page.getByRole('button', { name: 'Enregistrer le mot de passe' }).click()
    await expect(page).toHaveURL(/\/connexion/)

    await login(page, member.email, newPassword)
    await expect(page).toHaveURL(/\/accueil$/)
    // Le lien ne sert qu'une fois
    await page.goto(new URL(link!).pathname + new URL(link!).search)
    await expect(page.getByText('Ce lien n’est plus valable')).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Nouveau mot de passe', exact: true })).toHaveCount(0)
  })
})
