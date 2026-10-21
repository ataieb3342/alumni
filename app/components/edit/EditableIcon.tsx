'use client'

import { ICON_NAMES } from '@/lib/content/definitions'
import { ContentIcon } from '@/app/components/ui/icons'
import { useEditor, useFieldValue } from './EditorShell'

const ICON_LABELS: Record<string, string> = {
  users: 'Personnes',
  briefcase: 'Mallette',
  newspaper: 'Journal',
  compass: 'Boussole',
  'graduation-cap': 'Diplôme',
  'map-pin': 'Lieu',
  'heart-handshake': 'Entraide',
  sparkles: 'Étincelles',
  calendar: 'Calendrier',
  mail: 'Courrier',
  megaphone: 'Mégaphone',
  'book-open': 'Livre',
  landmark: 'Monument',
  target: 'Cible',
  handshake: 'Poignée de main',
  lightbulb: 'Ampoule',
  'message-circle': 'Bulle',
  rocket: 'Fusée',
  globe: 'Globe',
  'pen-line': 'Plume',
}

/** Icône d'une carte : choisie dans le jeu d'icônes du design system */
export function EditableIcon({ docKey, path, initial, className }: { docKey: string; path: string; initial: string; className?: string }) {
  const editor = useEditor()
  const [value, setValue] = useFieldValue<string>(docKey, path, initial)
  if (!editor?.editMode) return <ContentIcon name={value} className={className} />
  return (
    <span className="relative inline-flex">
      <ContentIcon name={value} className={className} />
      <label className="absolute inset-0 cursor-pointer">
        <span className="sr-only">Icône</span>
        <select
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          {ICON_NAMES.map((name) => (
            <option key={name} value={name}>
              {ICON_LABELS[name] ?? name}
            </option>
          ))}
        </select>
      </label>
    </span>
  )
}
