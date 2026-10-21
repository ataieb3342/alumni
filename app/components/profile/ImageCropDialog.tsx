'use client'

import { useCallback, useState } from 'react'
import Cropper, { type Area, type Point } from 'react-easy-crop'
import { Button } from '@/app/components/ui/Button'
import { Dialog } from '@/app/components/ui/Dialog'

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', reject)
    image.src = url
  })
}

async function cropToBlob(src: string, area: Area): Promise<Blob> {
  const image = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width = area.width
  canvas.height = area.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Recadrage impossible')
  context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height)
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Recadrage impossible'))), 'image/jpeg', 0.92))
}

/** Recadrage avant envoi : carré pour la photo, 3:1 pour la couverture */
export function ImageCropDialog({ image, aspect, title, onCancel, onDone }: { image: string; aspect: number; title: string; onCancel: () => void; onDone: (blob: Blob) => void }) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)
  const onCropComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), [])

  return (
    <Dialog
      open
      onClose={onCancel}
      title={title}
      description="Faites glisser l’image pour la cadrer, ajustez le zoom."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            loading={busy}
            onClick={async () => {
              if (!area) return
              setBusy(true)
              try {
                onDone(await cropToBlob(image, area))
              } finally {
                setBusy(false)
              }
            }}
          >
            Valider le cadrage
          </Button>
        </>
      }
    >
      <div className="relative h-[min(60vh,26rem)] overflow-hidden rounded-[var(--radius-md)] bg-wash">
        <Cropper image={image} crop={crop} zoom={zoom} aspect={aspect} cropShape={aspect === 1 ? 'round' : 'rect'} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
      </div>
      <label className="mt-4 flex items-center gap-3 text-sm font-semibold text-ink">
        Zoom
        <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="flex-1 accent-[var(--blue)]" />
      </label>
    </Dialog>
  )
}
