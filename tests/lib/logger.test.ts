import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Logger', () => {
  let originalNodeEnv: string | undefined
  let consoleLogSpy: ReturnType<typeof vi.spyOn>
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    originalNodeEnv = process.env.NODE_ENV

    // Spy on console methods
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Clear module cache to ensure fresh logger instance
    vi.resetModules()
  })

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
    vi.restoreAllMocks()
  })

  describe('Development mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    it('should log debug messages in development', async () => {
      const { logger } = await import('@/lib/logger')
      logger.debug('Debug message', { key: 'value' })
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] Debug message')
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('{"key":"value"}')
      )
    })

    it('should log info messages in development', async () => {
      const { logger } = await import('@/lib/logger')
      logger.info('Info message')
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] Info message')
      )
    })

    it('should log warn messages in development', async () => {
      const { logger } = await import('@/lib/logger')
      logger.warn('Warning message')
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] Warning message')
      )
    })

    it('should log error messages in development', async () => {
      const { logger } = await import('@/lib/logger')
      const error = new Error('Test error')
      logger.error('Error message', error, { extra: 'data' })
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Error message')
      )
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Test error"')
      )
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('"extra":"data"'))
    })

    it('should include stack trace in development', async () => {
      const { logger } = await import('@/lib/logger')
      const error = new Error('Test error with stack')
      error.stack = 'Error stack trace here'
      logger.error('Error with stack', error)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error stack trace here')
      )
    })

    it('should log activity messages in development', async () => {
      const { logger } = await import('@/lib/logger')
      logger.activity('User logged in', { userId: '123' })
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ACTIVITY] User logged in')
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('{"userId":"123"}'))
    })
  })

  describe('Production mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production'
    })

    it('should NOT log debug messages in production', async () => {
      const { logger } = await import('@/lib/logger')
      logger.debug('Debug message')
      expect(consoleLogSpy).not.toHaveBeenCalled()
    })

    it('should NOT log info messages in production', async () => {
      const { logger } = await import('@/lib/logger')
      logger.info('Info message')
      expect(consoleInfoSpy).not.toHaveBeenCalled()
    })

    it('should NOT log warn messages in production', async () => {
      const { logger } = await import('@/lib/logger')
      logger.warn('Warning message')
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('should log error messages in production', async () => {
      const { logger } = await import('@/lib/logger')
      const error = new Error('Production error')
      logger.error('Error message', error)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Error message')
      )
    })

    it('should NOT include stack trace in production', async () => {
      const { logger } = await import('@/lib/logger')
      const error = new Error('Error in production')
      error.stack = 'Error stack trace'
      logger.error('Error', error)
      expect(consoleErrorSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Error stack trace')
      )
    })

    it('should log activity messages in production (simplified)', async () => {
      const { logger } = await import('@/lib/logger')
      logger.activity('User logged in', { userId: '123' })
      expect(consoleLogSpy).toHaveBeenCalledWith('[ACTIVITY] User logged in')
      // En production, les activity logs ne devraient pas inclure le contexte détaillé
      expect(consoleLogSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('{"userId":"123"}')
      )
    })
  })

  describe('logError helper', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    it('should log Error instances', async () => {
      const { logError } = await import('@/lib/logger')
      const error = new Error('Test error')
      logError(error, 'Custom context')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Custom context')
      )
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Test error"')
      )
    })

    it('should log non-Error values', async () => {
      const { logError } = await import('@/lib/logger')
      logError('String error', 'Context')
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Context'))
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"error":"String error"')
      )
    })

    it('should use default context if none provided', async () => {
      const { logError } = await import('@/lib/logger')
      const error = new Error('Test')
      logError(error)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Une erreur est survenue')
      )
    })

    it('should handle non-Error with default context', async () => {
      const { logError } = await import('@/lib/logger')
      logError({ custom: 'error' })
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Une erreur inconnue est survenue')
      )
    })
  })

  describe('Message formatting', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    it('should include timestamp in all messages', async () => {
      const { logger } = await import('@/lib/logger')
      logger.info('Test message')
      expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T/))
    })

    it('should format messages without context', async () => {
      const { logger } = await import('@/lib/logger')
      logger.info('Simple message')
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] Simple message')
      )
      expect(consoleInfoSpy).not.toHaveBeenCalledWith(expect.stringContaining('|'))
    })

    it('should format messages with context', async () => {
      const { logger } = await import('@/lib/logger')
      logger.info('Message with context', { key: 'value' })
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] Message with context | {"key":"value"}')
      )
    })

    it('should handle Error objects with additional context', async () => {
      const { logger } = await import('@/lib/logger')
      const error = new Error('Test error')
      logger.error('Error occurred', error, { userId: '123' })
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"userId":"123"')
      )
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Test error"')
      )
    })
  })
})
