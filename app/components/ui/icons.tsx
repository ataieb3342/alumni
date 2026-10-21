import {
  Atom,
  BookOpen,
  Brain,
  Briefcase,
  Calendar,
  ChartNoAxesCombined,
  Code2,
  Cog,
  Compass,
  Dna,
  Dumbbell,
  FlaskConical,
  Globe,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Landmark,
  Languages,
  Lightbulb,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  Newspaper,
  Palette,
  PenLine,
  Rocket,
  Scale,
  Sigma,
  Sparkles,
  Stethoscope,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { IconName } from '@/lib/content/definitions'

export const CONTENT_ICONS: Record<IconName, LucideIcon> = {
  users: Users,
  briefcase: Briefcase,
  newspaper: Newspaper,
  compass: Compass,
  'graduation-cap': GraduationCap,
  'map-pin': MapPin,
  'heart-handshake': HeartHandshake,
  sparkles: Sparkles,
  calendar: Calendar,
  mail: Mail,
  megaphone: Megaphone,
  'book-open': BookOpen,
  landmark: Landmark,
  target: Target,
  handshake: Handshake,
  lightbulb: Lightbulb,
  'message-circle': MessageCircle,
  rocket: Rocket,
  globe: Globe,
  'pen-line': PenLine,
}

export function ContentIcon({ name, className }: { name: string; className?: string }) {
  const Icon = CONTENT_ICONS[name as IconName] ?? Sparkles
  return <Icon className={className} aria-hidden="true" />
}

/** Une icône par matière, à la place des émojis : même trait que le reste de l'interface */
export const SUBJECT_ICONS: Record<string, LucideIcon> = {
  maths: Sigma,
  physique: Atom,
  chimie: FlaskConical,
  biologie: Dna,
  sante: Stethoscope,
  informatique: Code2,
  ingenierie: Cog,
  economie: ChartNoAxesCombined,
  droit: Scale,
  histoire: Landmark,
  psychologie: Brain,
  litterature: BookOpen,
  philosophie: Lightbulb,
  langues: Languages,
  arts: Palette,
  sport: Dumbbell,
}

export function SubjectIcon({ value, className }: { value: string; className?: string }) {
  const Icon = SUBJECT_ICONS[value] ?? Sparkles
  return <Icon className={className} aria-hidden="true" />
}
