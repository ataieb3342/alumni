import { afterEach, vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = 'test-project-id'
process.env.NEXT_PUBLIC_SANITY_DATASET = 'test'

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks()
})
