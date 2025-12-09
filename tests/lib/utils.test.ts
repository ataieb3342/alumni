import { describe, it, expect } from 'vitest'
import { generateSlug } from '@/lib/utils'

describe('generateSlug', () => {
  it('converts text to lowercase', () => {
    expect(generateSlug('Hello World')).toBe('hello-world')
  })

  it('removes accents from text', () => {
    expect(generateSlug('Café Français')).toBe('cafe-francais')
    expect(generateSlug('Emploi à Paris')).toBe('emploi-a-paris')
    expect(generateSlug('Développeur Backend')).toBe('developpeur-backend')
  })

  it('replaces spaces with hyphens', () => {
    expect(generateSlug('Multiple   Spaces   Here')).toBe('multiple-spaces-here')
  })

  it('removes special characters', () => {
    expect(generateSlug('Hello! World? #Test')).toBe('hello-world-test')
    expect(generateSlug('Test@Example.com')).toBe('testexamplecom')
    expect(generateSlug('Price: $100 (New!)')).toBe('price-100-new')
  })

  it('trims whitespace', () => {
    expect(generateSlug('  Trimmed Text  ')).toBe('trimmed-text')
  })

  it('replaces multiple hyphens with single hyphen', () => {
    expect(generateSlug('Test---Multiple---Hyphens')).toBe('test-multiple-hyphens')
  })

  it('limits slug to 96 characters', () => {
    const longTitle = 'A'.repeat(150)
    const slug = generateSlug(longTitle)
    expect(slug.length).toBeLessThanOrEqual(96)
    expect(slug).toBe('a'.repeat(96))
  })

  it('handles empty string', () => {
    expect(generateSlug('')).toBe('')
  })

  it('handles string with only special characters', () => {
    expect(generateSlug('!@#$%^&*()')).toBe('')
  })

  it('preserves numbers', () => {
    expect(generateSlug('Stage 2024 CDI')).toBe('stage-2024-cdi')
  })

  it('handles real-world examples', () => {
    expect(generateSlug('Recherche Développeur Full-Stack à Lyon')).toBe(
      'recherche-developpeur-full-stack-a-lyon'
    )
    expect(generateSlug('Stage Marketing Digital - Paris (H/F)')).toBe(
      'stage-marketing-digital-paris-hf'
    )
    expect(generateSlug('Ingénieur DevOps - Remote possible')).toBe(
      'ingenieur-devops-remote-possible'
    )
  })

  it('handles consecutive special characters', () => {
    expect(generateSlug('Test!!!Multiple???Special***Chars')).toBe(
      'testmultiplespecialchars'
    )
  })

  it('handles mixed case with accents', () => {
    expect(generateSlug('ÉvÉnement SpÉcial 2024')).toBe('evenement-special-2024')
  })
})
