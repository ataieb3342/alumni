import type { ImageRef } from '@/db/schema'
import { cn } from '@/lib/utils'
import { Picture } from './Picture'

// Teintes d'initiales : variées pour éviter un mur de pastilles identiques
const TINTS = [
  'bg-blue-soft text-blue',
  'bg-red-soft text-red',
  'bg-success-soft text-success',
  'bg-warning-soft text-warning',
  'bg-highlight-soft text-ink',
  'bg-paper-sunken text-ink-soft',
]

function tintFor(seed: string) {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return TINTS[Math.abs(hash) % TINTS.length]
}

const SIZES = {
  xs: 'size-8 text-xs',
  sm: 'size-10 text-sm',
  md: 'size-14 text-lg',
  lg: 'size-24 text-3xl',
  xl: 'size-32 text-4xl',
} as const

const PIXELS = { xs: 32, sm: 40, md: 56, lg: 96, xl: 128 } as const

export function Avatar({
  firstName,
  lastName,
  image,
  seed,
  size = 'md',
  className,
  decorative = true,
}: {
  firstName: string
  lastName: string
  image?: ImageRef | null
  seed?: string
  size?: keyof typeof SIZES
  className?: string
  /** Le nom est déjà écrit à côté : l'image n'apporte rien aux lecteurs d'écran */
  decorative?: boolean
}) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  return (
    <span
      className={cn('relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-display font-semibold', SIZES[size], !image && tintFor(seed ?? initials), className)}
      aria-hidden={decorative && !image ? true : undefined}
    >
      {image ? (
        <Picture image={image} alt={decorative ? '' : `${firstName} ${lastName}`} sizes={`${PIXELS[size] * 2}px`} />
      ) : (
        initials
      )}
    </span>
  )
}
