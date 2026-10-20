import Image from 'next/image'
import type { ImageRef } from '@/db/schema'
import { cn } from '@/lib/utils'

/**
 * Image d'un contenu (profil, article, page) : point focal respecté,
 * vignette floue pendant le chargement, texte alternatif obligatoire
 * (vide pour une image décorative).
 */
export function Picture({
  image,
  alt,
  sizes,
  fill = true,
  priority,
  className,
  width,
  height,
}: {
  image: ImageRef
  alt?: string
  sizes: string
  fill?: boolean
  priority?: boolean
  className?: string
  width?: number
  height?: number
}) {
  const position =
    image.focalX !== undefined && image.focalY !== undefined ? `${Math.round(image.focalX * 100)}% ${Math.round(image.focalY * 100)}%` : undefined
  const common = {
    src: image.url,
    alt: alt ?? image.alt ?? '',
    sizes,
    priority,
    className: cn('object-cover', className),
    style: position ? { objectPosition: position } : undefined,
    ...(image.blurDataUrl ? { placeholder: 'blur' as const, blurDataURL: image.blurDataUrl } : {}),
  }
  if (fill) return <Image {...common} fill alt={common.alt} />
  return <Image {...common} alt={common.alt} width={width ?? image.width ?? 800} height={height ?? image.height ?? 600} />
}
