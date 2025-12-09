import { vi } from 'vitest'

// Mock Sanity client
export const mockSanityClient = {
  fetch: vi.fn(),
  create: vi.fn(),
  patch: vi.fn(() => ({
    set: vi.fn(() => ({
      unset: vi.fn(() => ({
        commit: vi.fn(),
      })),
      commit: vi.fn(),
    })),
    unset: vi.fn(() => ({
      commit: vi.fn(),
    })),
    commit: vi.fn(),
  })),
}

// Mock auth session
export const mockSession = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    accountStatus: 'active',
    userType: 'alumni',
  },
}

// Mock email functions
export const mockSendAdminNewUserNotification = vi.fn().mockResolvedValue(undefined)

// Reset all mocks
export function resetAllMocks() {
  vi.clearAllMocks()
  mockSanityClient.fetch.mockReset()
  mockSanityClient.create.mockReset()
  mockSendAdminNewUserNotification.mockReset()
}
