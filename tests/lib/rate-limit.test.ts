import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import {
  rateLimit,
  RateLimitPresets,
  resetRateLimitStore,
  getRateLimitStats
} from '@/lib/rate-limit'

// Mock pour NextRequest
function createMockRequest(ip: string = '127.0.0.1'): NextRequest {
  const request = new NextRequest('http://localhost:3000/api/test', {
    method: 'POST',
  })

  // Mock des headers pour l'IP
  const headers = new Headers()
  headers.set('x-forwarded-for', ip)

  Object.defineProperty(request, 'headers', {
    value: headers,
    writable: true,
  })

  return request
}

describe('Rate Limiting Middleware', () => {
  beforeEach(() => {
    // Réinitialiser le store avant chaque test
    resetRateLimitStore()
    vi.clearAllTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('rateLimit', () => {
    it('devrait autoriser les requêtes sous la limite', () => {
      const request = createMockRequest('192.168.1.1')
      const config = { maxRequests: 5, windowMs: 60000 }

      // Première requête
      const result1 = rateLimit(request, config)
      expect(result1.success).toBe(true)
      expect(result1.response).toBeUndefined()

      // Deuxième requête
      const result2 = rateLimit(request, config)
      expect(result2.success).toBe(true)
    })

    it('devrait bloquer les requêtes au-delà de la limite', () => {
      const request = createMockRequest('192.168.1.2')
      const config = { maxRequests: 3, windowMs: 60000 }

      // Effectuer 3 requêtes (limite)
      for (let i = 0; i < 3; i++) {
        const result = rateLimit(request, config)
        expect(result.success).toBe(true)
      }

      // La 4ème requête devrait être bloquée
      const blockedResult = rateLimit(request, config)
      expect(blockedResult.success).toBe(false)
      expect(blockedResult.response).toBeDefined()

      // Vérifier le statut 429
      if (blockedResult.response) {
        expect(blockedResult.response.status).toBe(429)
      }
    })

    it('devrait retourner les bons headers de rate limit', async () => {
      const request = createMockRequest('192.168.1.3')
      const config = { maxRequests: 2, windowMs: 60000 }

      // Remplir la limite
      rateLimit(request, config)
      rateLimit(request, config)

      // Requête qui dépasse
      const blockedResult = rateLimit(request, config)

      if (blockedResult.response) {
        const headers = blockedResult.response.headers
        expect(headers.get('X-RateLimit-Limit')).toBe('2')
        expect(headers.get('X-RateLimit-Remaining')).toBe('0')
        expect(headers.get('Retry-After')).toBeDefined()
        expect(headers.get('X-RateLimit-Reset')).toBeDefined()
      }
    })

    it('devrait utiliser un message d\'erreur personnalisé', async () => {
      const request = createMockRequest('192.168.1.4')
      const config = {
        maxRequests: 1,
        windowMs: 60000,
        message: 'Custom error message'
      }

      // Première requête OK
      rateLimit(request, config)

      // Deuxième requête bloquée
      const blockedResult = rateLimit(request, config)

      if (blockedResult.response) {
        const json = await blockedResult.response.json()
        expect(json.error).toBe('Custom error message')
      }
    })

    it('devrait gérer plusieurs IPs indépendamment', () => {
      const config = { maxRequests: 2, windowMs: 60000 }

      const request1 = createMockRequest('192.168.1.5')
      const request2 = createMockRequest('192.168.1.6')

      // IP1: 2 requêtes OK
      expect(rateLimit(request1, config).success).toBe(true)
      expect(rateLimit(request1, config).success).toBe(true)

      // IP1: 3ème requête bloquée
      expect(rateLimit(request1, config).success).toBe(false)

      // IP2: devrait toujours être autorisée
      expect(rateLimit(request2, config).success).toBe(true)
      expect(rateLimit(request2, config).success).toBe(true)
    })

    it('devrait réinitialiser après la fenêtre de temps', () => {
      vi.useFakeTimers()

      const request = createMockRequest('192.168.1.7')
      const config = { maxRequests: 2, windowMs: 1000 } // 1 seconde

      // Remplir la limite
      expect(rateLimit(request, config).success).toBe(true)
      expect(rateLimit(request, config).success).toBe(true)
      expect(rateLimit(request, config).success).toBe(false)

      // Avancer le temps de 1.1 secondes
      vi.advanceTimersByTime(1100)

      // Devrait être autorisé à nouveau
      expect(rateLimit(request, config).success).toBe(true)

      vi.useRealTimers()
    })
  })

  describe('RateLimitPresets', () => {
    it('devrait avoir un preset auth correct', () => {
      expect(RateLimitPresets.auth).toEqual({
        maxRequests: 5,
        windowMs: 60 * 1000,
        message: expect.any(String),
      })
    })

    it('devrait avoir un preset contentCreation correct', () => {
      expect(RateLimitPresets.contentCreation).toEqual({
        maxRequests: 10,
        windowMs: 5 * 60 * 1000,
        message: expect.any(String),
      })
    })

    it('devrait avoir un preset sensitive correct', () => {
      expect(RateLimitPresets.sensitive).toEqual({
        maxRequests: 3,
        windowMs: 60 * 60 * 1000,
        message: expect.any(String),
      })
    })

    it('devrait avoir un preset email correct', () => {
      expect(RateLimitPresets.email).toEqual({
        maxRequests: 3,
        windowMs: 15 * 60 * 1000,
        message: expect.any(String),
      })
    })

    it('devrait avoir un preset general correct', () => {
      expect(RateLimitPresets.general).toEqual({
        maxRequests: 100,
        windowMs: 60 * 1000,
        message: expect.any(String),
      })
    })
  })

  describe('getRateLimitStats', () => {
    it('devrait retourner les stats pour une IP spécifique', () => {
      const request = createMockRequest('192.168.1.8')
      const config = { maxRequests: 5, windowMs: 60000 }

      // Faire quelques requêtes
      rateLimit(request, config)
      rateLimit(request, config)

      const stats = getRateLimitStats('192.168.1.8')
      expect(stats.ip).toBe('192.168.1.8')
      expect(stats.attempts).toBe(2)
      expect(stats.timestamps).toHaveLength(2)
    })

    it('devrait retourner les stats globales', () => {
      const config = { maxRequests: 5, windowMs: 60000 }

      // Plusieurs IPs
      rateLimit(createMockRequest('192.168.1.9'), config)
      rateLimit(createMockRequest('192.168.1.10'), config)
      rateLimit(createMockRequest('192.168.1.10'), config)

      const stats = getRateLimitStats()
      expect(stats.totalIps).toBe(2)
      expect(stats.totalAttempts).toBe(3)
    })
  })

  describe('Extraction de l\'IP', () => {
    it('devrait extraire l\'IP depuis x-forwarded-for', () => {
      const request = createMockRequest('192.168.1.11')
      const config = { maxRequests: 1, windowMs: 60000 }

      rateLimit(request, config)
      const stats = getRateLimitStats('192.168.1.11')

      expect(stats.attempts).toBe(1)
    })

    it('devrait gérer plusieurs IPs dans x-forwarded-for', () => {
      const request = new NextRequest('http://localhost:3000/api/test')
      const headers = new Headers()
      headers.set('x-forwarded-for', '192.168.1.12, 10.0.0.1, 172.16.0.1')

      Object.defineProperty(request, 'headers', {
        value: headers,
        writable: true,
      })

      const config = { maxRequests: 1, windowMs: 60000 }
      rateLimit(request, config)

      // Devrait utiliser la première IP
      const stats = getRateLimitStats('192.168.1.12')
      expect(stats.attempts).toBe(1)
    })

    it('devrait utiliser x-real-ip si x-forwarded-for n\'existe pas', () => {
      const request = new NextRequest('http://localhost:3000/api/test')
      const headers = new Headers()
      headers.set('x-real-ip', '192.168.1.13')

      Object.defineProperty(request, 'headers', {
        value: headers,
        writable: true,
      })

      const config = { maxRequests: 1, windowMs: 60000 }
      rateLimit(request, config)

      const stats = getRateLimitStats('192.168.1.13')
      expect(stats.attempts).toBe(1)
    })
  })

  // Note: Le nettoyage automatique est testé indirectement par les autres tests
  // qui vérifient que les anciennes tentatives sont filtrées après la fenêtre de temps
})
