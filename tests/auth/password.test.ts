// @vitest-environment node
import bcrypt from 'bcryptjs'
import { describe, expect, it } from 'vitest'
import { hashCost, hashPassword, isBcryptHash, needsRehash, passwordIsValid, verifyPassword } from '@/lib/auth/password'

describe('Mots de passe', () => {
  it('vérifie un hash au format des comptes migrés ($2b$10$, bcryptjs, coût 10)', async () => {
    const migrated = await bcrypt.hash('Ancien-Mot2Passe!', 10)
    expect(migrated).toMatch(/^\$2b\$10\$/)
    expect(await verifyPassword('Ancien-Mot2Passe!', migrated)).toBe(true)
    expect(await verifyPassword('mauvais', migrated)).toBe(false)
  })

  it('accepte les variantes $2a$ et $2y$ de bcrypt', async () => {
    const hash = await bcrypt.hash('Variante@2026x', 4)
    expect(await verifyPassword('Variante@2026x', hash.replace(/^\$2b\$/, '$2a$'))).toBe(true)
    expect(await verifyPassword('Variante@2026x', hash.replace(/^\$2b\$/, '$2y$'))).toBe(true)
  })

  it('refuse un format inconnu, un hash vide ou absent', async () => {
    expect(await verifyPassword('x', 'md5:5f4dcc3b5aa765d61d8327deb882cf99')).toBe(false)
    expect(await verifyPassword('x', '')).toBe(false)
    expect(await verifyPassword('x', null)).toBe(false)
  })

  it('détecte les hash à recalculer (coût inférieur au coût courant ou format inconnu)', async () => {
    const previous = process.env.BCRYPT_COST
    process.env.BCRYPT_COST = '12'
    const migrated = await bcrypt.hash('x', 10)
    expect(hashCost(migrated)).toBe(10)
    expect(needsRehash(migrated)).toBe(true)
    expect(needsRehash('pas-un-hash')).toBe(true)
    process.env.BCRYPT_COST = '10'
    expect(needsRehash(migrated)).toBe(false)
    process.env.BCRYPT_COST = previous
  })

  it('produit des hash bcrypt au coût configuré, avec un sel différent à chaque fois', async () => {
    const a = await hashPassword('Identique@123456')
    const b = await hashPassword('Identique@123456')
    expect(isBcryptHash(a)).toBe(true)
    expect(hashCost(a)).toBe(4)
    expect(a).not.toBe(b)
  })

  it('applique la politique : 12 caractères, majuscule, minuscule, chiffre, caractère spécial', () => {
    expect(passwordIsValid('Court1!')).toBe(false)
    expect(passwordIsValid('sansmajuscule1!')).toBe(false)
    expect(passwordIsValid('SANSMINUSCULE1!')).toBe(false)
    expect(passwordIsValid('SansChiffre!!!x')).toBe(false)
    expect(passwordIsValid('SansSpecial123x')).toBe(false)
    expect(passwordIsValid('Conforme@2026xx')).toBe(true)
  })
})
