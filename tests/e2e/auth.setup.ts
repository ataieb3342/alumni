import { accounts, expect, login, statePath, test } from './support'

// Une connexion par rôle, réutilisée par les scénarios (storageState)
for (const role of ['admin', 'member'] as const) {
  test(`connexion ${role}`, async ({ page }) => {
    const account = accounts()[role]
    await login(page, account.email, account.password)
    await expect(page).toHaveURL(/\/accueil$/)
    await page.context().storageState({ path: statePath(role) })
  })
}
