import { describe, expect, it } from 'vitest'
import { htmlToText, parsePlainText, portableTextToHtml, portableTextToPlainText, readingTimeMinutes, sanitizeRichText } from '@/lib/richtext'

describe('Texte riche', () => {
  it('convertit le Portable Text des articles Sanity en HTML (titres, listes, gras, liens)', () => {
    const html = portableTextToHtml([
      { _type: 'block', style: 'h2', children: [{ _type: 'span', text: 'Titre' }] },
      { _type: 'block', style: 'normal', markDefs: [{ _key: 'l1', _type: 'link', href: 'https://example.org' }], children: [{ _type: 'span', text: 'gras', marks: ['strong'] }, { _type: 'span', text: ' lien', marks: ['l1'] }] },
      { _type: 'block', style: 'normal', listItem: 'bullet', children: [{ _type: 'span', text: 'un' }] },
      { _type: 'block', style: 'normal', listItem: 'bullet', children: [{ _type: 'span', text: 'deux' }] },
    ])
    expect(html).toBe('<h2>Titre</h2>\n<p><strong>gras</strong><a href="https://example.org"> lien</a></p>\n<ul>\n<li>un</li>\n<li>deux</li>\n</ul>')
  })

  it('échappe le texte des blocs', () => {
    expect(portableTextToHtml([{ _type: 'block', children: [{ _type: 'span', text: '<script>x</script>' }] }])).toContain('&lt;script&gt;')
  })

  it('convertit la description d’une annonce en texte avec puces', () => {
    const text = portableTextToPlainText([
      { _type: 'block', children: [{ _type: 'span', text: 'Au programme :' }] },
      { _type: 'block', listItem: 'bullet', children: [{ _type: 'span', text: 'apéritif' }] },
      { _type: 'block', listItem: 'bullet', children: [{ _type: 'span', text: 'conférence' }] },
    ])
    expect(text).toBe('Au programme :\n\n• apéritif\n• conférence')
    expect(parsePlainText(text)).toEqual([
      { kind: 'paragraph', lines: ['Au programme :'] },
      { kind: 'list', items: ['apéritif', 'conférence'] },
    ])
  })

  it('assainit le HTML : liste blanche de balises, liens sûrs, images du site uniquement', () => {
    const clean = sanitizeRichText('<h1>x</h1><p style="color:red" onmouseover="x()">ok</p><a href="https://a.org">a</a><img src="/media/uploads/a.webp" alt="ok"><iframe src="https://x"></iframe>')
    expect(clean).not.toMatch(/h1|style|onmouseover|iframe/)
    expect(clean).toContain('<a href="https://a.org" target="_blank" rel="noopener noreferrer">a</a>')
    expect(clean).toContain('<img src="/media/uploads/a.webp" alt="ok" />')
  })

  it('calcule un temps de lecture', () => {
    expect(readingTimeMinutes('<p>' + 'mot '.repeat(450) + '</p>')).toBe(3)
    expect(htmlToText('<p>a</p><p>b</p>')).toBe('a\nb')
  })
})
