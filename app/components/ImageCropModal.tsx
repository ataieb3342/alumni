'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { Point, Area } from 'react-easy-crop'

interface ImageCropModalProps {
  image: string
  onComplete: (croppedImage: Blob) => void
  onCancel: () => void
  aspectRatio?: number
  title?: string
}

/**
 * Fonction utilitaire pour créer une image à partir de l'URL
 */
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

/**
 * Fonction pour obtenir l'image recadrée à partir de la zone de recadrage
 */
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Impossible de créer le contexte canvas')
  }

  // Définir les dimensions du canvas final
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // Dessiner la zone recadrée
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  // Convertir le canvas en Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Impossible de créer le blob'))
        return
      }
      resolve(blob)
    }, 'image/jpeg', 0.95)
  })
}

export default function ImageCropModal({
  image,
  onComplete,
  onCancel,
  aspectRatio = 1,
  title = 'Recadrer l\'image'
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [loading, setLoading] = useState(false)

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleComplete = async () => {
    if (!croppedAreaPixels) return

    try {
      setLoading(true)
      const croppedImage = await getCroppedImg(image, croppedAreaPixels)
      onComplete(croppedImage)
    } catch (error) {
      // Erreur silencieuse
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* En-tête */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600 mt-1">
            Glissez pour repositionner • Molette ou pincement pour zoomer
          </p>
        </div>

        {/* Zone de recadrage */}
        <div className="relative flex-1 min-h-[400px] bg-gray-100">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            style={{
              containerStyle: {
                backgroundColor: '#f3f4f6'
              }
            }}
          />
        </div>

        {/* Boutons d'action */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleComplete}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Traitement...' : 'Valider'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
