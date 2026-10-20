import os from 'node:os'
import path from 'node:path'
import { afterEach, vi } from 'vitest'
import '@testing-library/jest-dom'

// Base PostgreSQL embarquée, en mémoire : une base neuve par fichier de test
process.env.DATABASE_URL = 'pglite:memory'
process.env.STORAGE_DRIVER = 'fs'
process.env.MEDIA_DIR = path.join(os.tmpdir(), `alumni-test-media-${process.pid}`)
// Coût bcrypt minimal pour des tests rapides (les hash migrés restent au coût 10)
process.env.BCRYPT_COST = '4'
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'

afterEach(() => {
  vi.clearAllMocks()
})
