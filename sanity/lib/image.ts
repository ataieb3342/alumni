import createImageUrlBuilder from '@sanity/image-url'
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

import { dataset, projectId } from '../env'

// https://www.sanity.io/docs/image-url
const builder = createImageUrlBuilder({ projectId, dataset })

export const urlFor = (source: SanityImageSource) => {
  return builder.image(source)
}

/**
 * Génère un blur placeholder pour une image Sanity
 * Utilise une version très basse qualité de l'image (10x10) encodée en base64
 */
export const getBlurDataUrl = (source: SanityImageSource): string => {
  if (!source) return ''

  try {
    // Génère une tiny image (10x10 pixels) avec qualité très basse pour le blur
    const url = builder
      .image(source)
      .width(10)
      .height(10)
      .blur(50)
      .quality(10)
      .url()

    return url
  } catch {
    return ''
  }
}

/**
 * Retourne les props nécessaires pour une image Next.js avec blur placeholder
 */
export const getImageProps = (
  source: SanityImageSource,
  width: number,
  height: number
) => {
  const url = urlFor(source).width(width).height(height).url()
  const blurDataURL = getBlurDataUrl(source)

  return {
    src: url,
    blurDataURL,
    placeholder: blurDataURL ? ('blur' as const) : undefined,
  }
}
