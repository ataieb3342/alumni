import type { ReactNode } from 'react'
import { Compass, MapPin, Users } from 'lucide-react'

/**
 * Mise en page des écrans de connexion : formulaire à droite, rappel de ce
 * que le réseau apporte à gauche (desktop seulement : en mobile, le formulaire d'abord).
 */
export function AuthLayout({ title, lead, children, aside = true }: { title: string; lead?: ReactNode; children: ReactNode; aside?: boolean }) {
  return (
    <div className="bg-seyes">
      <div className={aside ? 'container-page grid gap-10 py-10 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center' : 'container-page py-10 sm:py-16'}>
        {aside && (
          <aside className="bg-wash hidden rounded-[var(--radius-lg)] p-10 lg:block">
            <p className="font-hand text-3xl text-highlight">Bienvenue dans le réseau</p>
            <ul className="mt-8 space-y-6 text-on-wash">
              {[
                { icon: Compass, title: 'Des parcours à explorer', text: 'Écoles, métiers, villes : ce que sont devenus les anciens du lycée.' },
                { icon: MapPin, title: 'Partout en France et ailleurs', text: 'Cherchez « Lyon » ou « Montréal » et trouvez qui y est passé.' },
                { icon: Users, title: 'Une communauté qui s’entraide', text: 'Stages, conseils d’orientation, événements entre anciens.' },
              ].map(({ icon: Icon, title: itemTitle, text }) => (
                <li key={itemTitle} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-highlight">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-display text-lg">{itemTitle}</p>
                    <p className="text-sm text-on-wash-soft">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        )}
        <div className={aside ? 'mx-auto w-full max-w-lg' : 'mx-auto w-full max-w-lg'}>
          <div className="rounded-[var(--radius-lg)] border border-line bg-paper-raised p-6 shadow-[var(--shadow-md)] sm:p-9">
            <h1 className="font-display-tight text-[2.25rem] text-ink">{title}</h1>
            {lead && <div className="mt-2 text-ink-soft">{lead}</div>}
            <div className="mt-7">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
