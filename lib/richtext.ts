/**
 * Texte riche des articles (HTML assaini) et texte simple des annonces.
 *
 * Le HTML n'est jamais rendu tel que saisi : il passe par `sanitizeRichText`
 * à l'écriture (API d'administration, import) avec une liste blanche stricte.
 */
import sanitizeHtml from 'sanitize-html'

const ALLOWED_TAGS = [
  'p', 'br', 'h2', 'h3', 'h4', 'blockquote', 'ul', 'ol', 'li',
  'strong', 'b', 'em', 'i', 'u', 's', 'code', 'a', 'figure', 'img', 'figcaption', 'hr',
]

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    allowProtocolRelative: false,
    transformTags: {
      b: 'strong',
      i: 'em',
      a: (tagName, attribs) => {
        const external = /^https?:\/\//.test(attribs.href ?? '')
        const blank = attribs.target === '_blank' || external
        return {
          tagName,
          attribs: {
            href: attribs.href ?? '#',
            ...(blank ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
          },
        }
      },
    },
    // Les images n'acceptent que nos médias (stockage local ou Vercel Blob)
    exclusiveFilter: (frame) =>
      frame.tag === 'img' && !/^(\/media\/|https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/)/.test(frame.attribs.src ?? ''),
  }).trim()
}

/** Texte brut (sans balises) d'un HTML : temps de lecture, extraits, recherche */
export function htmlToText(html: string): string {
  return sanitizeHtml(html.replace(/<\/(p|h[2-4]|li|blockquote)>/g, '\n'), { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function readingTimeMinutes(html: string): number {
  const words = htmlToText(html).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ---------------------------------------------------------------------------
// Texte simple (annonces) : paragraphes séparés par une ligne vide, lignes
// commençant par « • » ou « - » rendues en liste à puces
// ---------------------------------------------------------------------------

export type PlainBlock = { kind: 'paragraph'; lines: string[] } | { kind: 'list'; items: string[] }

const BULLET = /^\s*[•\-*]\s+/

export function parsePlainText(text: string): PlainBlock[] {
  const blocks: PlainBlock[] = []
  for (const chunk of text.replace(/\r\n/g, '\n').split(/\n{2,}/)) {
    const lines = chunk.split('\n').filter((line) => line.trim())
    if (lines.length === 0) continue
    let paragraph: string[] = []
    let list: string[] = []
    const flush = () => {
      if (paragraph.length) blocks.push({ kind: 'paragraph', lines: paragraph })
      if (list.length) blocks.push({ kind: 'list', items: list })
      paragraph = []
      list = []
    }
    for (const line of lines) {
      if (BULLET.test(line)) {
        if (paragraph.length) {
          blocks.push({ kind: 'paragraph', lines: paragraph })
          paragraph = []
        }
        list.push(line.replace(BULLET, '').trim())
      } else {
        if (list.length) {
          blocks.push({ kind: 'list', items: list })
          list = []
        }
        paragraph.push(line.trim())
      }
    }
    flush()
  }
  return blocks
}

// ---------------------------------------------------------------------------
// Conversion Portable Text → HTML / texte (import depuis Sanity uniquement)
// ---------------------------------------------------------------------------

interface PtSpan {
  _type: string
  text?: string
  marks?: string[]
}

interface PtBlock {
  _type: string
  _key?: string
  style?: string
  listItem?: 'bullet' | 'number'
  level?: number
  children?: PtSpan[]
  markDefs?: { _key: string; _type: string; href?: string; target?: string; blank?: boolean }[]
  url?: string
  alt?: string
  caption?: string
  asset?: { _ref: string }
}

const DECORATORS: Record<string, [string, string]> = {
  strong: ['<strong>', '</strong>'],
  em: ['<em>', '</em>'],
  underline: ['<u>', '</u>'],
  'strike-through': ['<s>', '</s>'],
  code: ['<code>', '</code>'],
}

function spanToHtml(span: PtSpan, markDefs: PtBlock['markDefs'] = []): string {
  let html = escapeHtml(span.text ?? '').replace(/\n/g, '<br>')
  for (const mark of span.marks ?? []) {
    const decorator = DECORATORS[mark]
    if (decorator) {
      html = `${decorator[0]}${html}${decorator[1]}`
      continue
    }
    const def = markDefs.find((d) => d._key === mark)
    if (def?._type === 'link' && def.href) {
      const blank = def.target === '_blank' || def.blank
      html = `<a href="${escapeHtml(def.href)}"${blank ? ' target="_blank" rel="noopener noreferrer"' : ''}>${html}</a>`
    }
  }
  return html
}

/**
 * `resolveImage` renvoie l'URL d'une image de corps d'article (asset Sanity
 * déjà migré, ou URL externe) ; une image introuvable est ignorée.
 */
export function portableTextToHtml(blocks: PtBlock[] = [], resolveImage?: (block: PtBlock) => string | undefined): string {
  const out: string[] = []
  let openList: 'ul' | 'ol' | null = null
  const closeList = () => {
    if (openList) out.push(`</${openList}>`)
    openList = null
  }

  for (const block of blocks) {
    if (block._type === 'image') {
      closeList()
      const src = resolveImage?.(block)
      if (!src) continue
      const caption = block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ''
      out.push(`<figure><img src="${escapeHtml(src)}" alt="${escapeHtml(block.alt ?? '')}">${caption}</figure>`)
      continue
    }
    if (block._type !== 'block') continue
    const inner = (block.children ?? []).map((span) => spanToHtml(span, block.markDefs)).join('')
    if (block.listItem) {
      const tag = block.listItem === 'number' ? 'ol' : 'ul'
      if (openList !== tag) {
        closeList()
        out.push(`<${tag}>`)
        openList = tag
      }
      out.push(`<li>${inner}</li>`)
      continue
    }
    closeList()
    const tag = ['h2', 'h3', 'h4', 'blockquote'].includes(block.style ?? '') ? block.style! : 'p'
    if (tag === 'p' && !inner.trim()) continue
    out.push(`<${tag}>${inner}</${tag}>`)
  }
  closeList()
  return out.join('\n')
}

export function portableTextToPlainText(blocks: PtBlock[] = []): string {
  const parts: string[] = []
  let previousWasList = false
  for (const block of blocks) {
    if (block._type !== 'block') continue
    const text = (block.children ?? []).map((span) => span.text ?? '').join('').trim()
    if (!text) continue
    if (block.listItem) {
      const line = `• ${text}`
      if (previousWasList) parts[parts.length - 1] += `\n${line}`
      else parts.push(line)
      previousWasList = true
    } else {
      parts.push(text)
      previousWasList = false
    }
  }
  return parts.join('\n\n')
}
