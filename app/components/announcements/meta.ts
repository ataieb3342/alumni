import { Briefcase, CalendarDays, GraduationCap, Megaphone, Package, Sparkles, type LucideIcon } from 'lucide-react'
import type { AnnouncementType } from '@/db/schema'

export const ANNOUNCEMENT_TYPES_META: Record<AnnouncementType, { label: string; plural: string; icon: LucideIcon; tone: 'blue' | 'red' | 'green' | 'amber' | 'highlight' | 'neutral' }> = {
  job_offer: { label: "Offre d'emploi", plural: 'Emplois', icon: Briefcase, tone: 'blue' },
  internship: { label: 'Stage', plural: 'Stages', icon: GraduationCap, tone: 'green' },
  opportunity: { label: 'Opportunité', plural: 'Opportunités', icon: Sparkles, tone: 'amber' },
  event: { label: 'Événement', plural: 'Événements', icon: CalendarDays, tone: 'red' },
  school_supplies: { label: 'Vente de matériel scolaire', plural: 'Vente de matériel', icon: Package, tone: 'neutral' },
  other: { label: 'Autre', plural: 'Autres', icon: Megaphone, tone: 'neutral' },
}
