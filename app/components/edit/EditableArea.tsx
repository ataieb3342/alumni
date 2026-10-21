import type { ReactNode } from 'react'
import type { DocDescriptor } from './EditorShell'
import { EditRoot } from './lazy'

/** Enveloppe une page : n'ajoute rien pour un visiteur, enregistre les documents en mode édition */
export function EditableArea({ docs, children }: { docs: (DocDescriptor | null | undefined)[]; children: ReactNode }) {
  const present = docs.filter((doc): doc is DocDescriptor => !!doc)
  if (present.length === 0) return <>{children}</>
  return <EditRoot docs={present}>{children}</EditRoot>
}
