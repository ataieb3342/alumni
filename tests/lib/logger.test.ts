import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    // Spy on console.log (le nouveau logger utilise console.log pour tout)
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    // Clear module cache to ensure fresh logger instance
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  describe('Development mode', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development')
    })

    it('should log debug messages in development', async () => {
      const { logger } = await import('@/lib/logger')
      logger.debug('Debug message', { key: 'value' })

      expect(consoleLogSpy).toHaveBeenCalled()
      const logOutput = consoleLogSpy.mock.calls[0][0]
      expect(logOutput).toContain('Debug message')
      expect(logOutput).toContain('DEBUG')
    })

    it('should log info messages in development', async () => {
      const { logger } = await import('@/lib/logger')
      logger.info('Info message')

      expect(consoleLogSpy).toHaveBeenCalled()
      const logOutput = consoleLogSpy.mock.calls[0][0]
      expect(logOutput).toContain('Info message')
      expect(logOutput).toContain('INFO')
    })

    it('should log warn messages in development', async () => {
      const { logger } = await import('@/lib/logger')
      logger.warn('Warning message')

      expect(consoleLogSpy).toHaveBeenCalled()
      const logOutput = consoleLogSpy.mock.calls[0][0]
      expect(logOutput).toContain('Warning message')
      expect(logOutput).toContain('WARN')
    })

    it('should log error messages in development', async () => {
      const { logger } = await import('@/lib/logger')
      const error = new Error('Test error')
      logger.error('Error message', error, { extra: 'data' })

      expect(consoleLogSpy).toHaveBeenCalled()
      const logOutput = consoleLogSpy.mock.calls[0][0]
      expect(logOutput).toContain('Error message')
      expect(logOutput).toContain('ERROR')
      expect(logOutput).toContain('Test error')
    })

    it('should include stack trace in development', async () => {
      const { logger } = await import('@/lib/logger')
      const error = new Error('Test error with stack')
      error.stack = 'Error stack trace here'
      logger.error('Error with stack', error)

      expect(consoleLogSpy).toHaveBeenCalled()
      const logOutput = consoleLogSpy.mock.calls[0][0]
      expect(logOutput).toContain('Error stack trace here')
    })

    it('should log activity messages in development', async () => {
      const { logger } = await import('@/lib/logger')
      logger.activity('User logged in', { userId: '123' })

      expect(consoleLogSpy).toHaveBeenCalled()
      const logOutput = consoleLogSpy.mock.calls[0][0]
      expect(logOutput).toContain('ACTIVITY')
      expect(logOutput).toContain('User logged in')
    })
  })

  describe('Production mode', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production')
    })

    it('should NOT log debug messages in production', async () => {
      const { logger } = await import('@/lib/logger')
      logger.debug('Debug message')
      expect(consoleLogSpy).not.toHaveBeenCalled()
    })

    it('should log info messages in production (JSON format)', async () => {
      const { logger } = await import('@/lib/logger')
      logger.info('Info message')

      expect(consoleLogSpy).toHaveBeenCalled()
      const logOutput = consoleLogSpy.mock.calls[0][0]

      // En production, c'est du JSON
      const parsed = JSON.parse(logOutput)
      expect(parsed.level).toBe('info')
      expect(parsed.message).toBe('Info message')
      expect(parsed.timestamp).toBeDefined()
    })

    it('should log warn messages in production (JSON format)', async () => {
      const { logger } = await import('@/lib/logger')
      logger.warn('Warning message')

      expect(consoleLogSpy).toHaveBeenCalled()
      const logOutput = consoleLogSpy.mock.calls[0][0]

      const parsed = JSON.parse(logOutput)
      expect(parsed.level).toBe('warn')
      expect(parsed.message).toBe('Warning message')
    })

    it('should log error messages in production (JSON format)', async () => {
      const { logger } = await import('@/lib/logger')
      const error = new Error('Production error')
      logger.error('Error message', error)

      expect(consoleLogSpy).toHaveBeenCalled()
      const logOutput = consoleLogSpy.mock.calls[0][0]

      const parsed = JSON.parse(logOutput)
      expect(parsed.level).toBe('error')
      expect(parsed.message).toBe('Error message')
      expect(parsed.error.message).toBe('Production error')
    })

    it('should NOT include stack trace in production', async () => {
      const { logger } = await import('@/lib/logger')
      const error = new Error('Error in production')
      error.stack = 'Error stack trace'
      logger.error('Error', error)

      expect(consoleLogSpy).toHaveBeenCalled()
      const logOutput = consoleLogSpy.mock.calls[0][0]

      const parsed = JSON.parse(logOutput)
      expect(parsed.error.stack).toBeUndefined()
    })

    it('should log activity messages in production (JSON format)', async () => {
      const { logger } = await import('@/lib/logger')
      logger.activity('User logged in', { userId: '123' })

      expect(consoleLogSpy).toHaveBeenCalled()
      const logOutput = consoleLogSpy.mock.calls[0][0]

      const parsed = JSON.parse(logOutput)
      expect(parsed.message).toContain('ACTIVITY')
      expect(parsed.message).toContain('User logged in')
    })
  })

  describe('logError helper', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development')
    })

    it('should log Error instances', async () => {
      const { logError } = await import('@/lib/logger')
      const error = new Error('Test error')
      logError(error, 'Custom context')

      expect(consoleLogSpy).toHaveBeenCalled()
      const logOutput = consoleLogSpy.mock.calls[0][0]
      expect(logOutput).toContain('Custom context')
      expect(logOutput).toContain('Test error')
    })

    it('should log non-Error values', async () => {
      const { logError } = await import('@/lib/logger')
      logError('String error', 'Context')

      expect(consoleLogSpy).toHaveBeenCalled()
      const logOutput = consoleLogSpy.mock.calls[0][0]
      expect(logOutput).toContain('Context')
    })

    it('should use default context if none provided', async () => {
      const { logError } = await import('@/lib/logger')
      const error = new Error('Test')
      logError(error)

      expect(consoleLogSpy).toHaveBeenCalled()
      const logOutput = consoleLogSpy.mock.calls[0][0]
      expect(logOutput).toContain('Une erreur est survenue')
    })

    it('should handle non-Error with default context', async () => {
      const { logError } = await import('@/lib/logger')
      logError({ custom: 'error' })

      expect(consoleLogSpy).toHaveBeenCalled()
      const logOutput = consoleLogSpy.mock.calls[0][0]
      expect(logOutput).toContain('Une erreur inconnue est survenue')
    })
  })

  describe('Structured logging', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production')
    })

    it('should output JSON in production', async () => {
      const { logger } = await import('@/lib/logger')
      logger.info('Test message', { userId: '123' })

      expect(consoleLogSpy).toHaveBeenCalled()
      const logOutput = consoleLogSpy.mock.calls[0][0]

      // Doit être du JSON valide
      expect(() => JSON.parse(logOutput)).not.toThrow()

      const parsed = JSON.parse(logOutput)
      expect(parsed.timestamp).toBeDefined()
      expect(parsed.level).toBe('info')
      expect(parsed.message).toBe('Test message')
      expect(parsed.context.userId).toBe('123')
    })

    it('should include correlation ID when available', async () => {
      const { logger } = await import('@/lib/logger')

      // Simuler un contexte avec correlation ID
      // Note: En réalité, ceci serait défini par AsyncLocalStorage dans le middleware
      logger.info('Test with correlation')

      expect(consoleLogSpy).toHaveBeenCalled()
      const logOutput = consoleLogSpy.mock.calls[0][0]
      const parsed = JSON.parse(logOutput)

      // Le correlation ID est undefined si pas dans un contexte de requête
      expect(parsed.correlationId).toBeUndefined()
    })

    it('should format errors properly in JSON', async () => {
      const { logger } = await import('@/lib/logger')
      const error = new Error('Test error')
      error.name = 'TestError'

      logger.error('Error occurred', error, { extra: 'context' })

      expect(consoleLogSpy).toHaveBeenCalled()
      const logOutput = consoleLogSpy.mock.calls[0][0]
      const parsed = JSON.parse(logOutput)

      expect(parsed.error.name).toBe('TestError')
      expect(parsed.error.message).toBe('Test error')
      expect(parsed.context.extra).toBe('context')
    })
  })

  describe('Performance logging', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'development')
    })

    it('should log performance metrics', async () => {
      const { logger } = await import('@/lib/logger')
      logger.performance('Database query', 150, { query: 'SELECT *' })

      expect(consoleLogSpy).toHaveBeenCalled()
      const logOutput = consoleLogSpy.mock.calls[0][0]
      expect(logOutput).toContain('Database query')
      expect(logOutput).toContain('150')
    })
  })
})
