/**
 * Matières auxquelles un membre rattache son parcours.
 *
 * Pensées pour les lycéens : ils ne connaissent pas encore les écoles ni les
 * métiers, mais savent s'ils aiment les maths ou la bio. En cochant « Maths »
 * et « Biologie » dans l'annuaire, ils tombent sur les anciens dont le
 * parcours part de là.
 */
export const SUBJECTS = [
  { value: 'maths', label: 'Mathématiques', short: 'Maths', emoji: '📐' },
  { value: 'physique', label: 'Physique', short: 'Physique', emoji: '⚛️' },
  { value: 'chimie', label: 'Chimie', short: 'Chimie', emoji: '🧪' },
  { value: 'biologie', label: 'Biologie & SVT', short: 'Biologie', emoji: '🧬' },
  { value: 'sante', label: 'Santé & médecine', short: 'Santé', emoji: '🩺' },
  { value: 'informatique', label: 'Informatique & numérique', short: 'Informatique', emoji: '💻' },
  { value: 'ingenierie', label: "Sciences de l'ingénieur", short: 'Ingénierie', emoji: '⚙️' },
  { value: 'economie', label: 'Économie, gestion & commerce', short: 'Éco & commerce', emoji: '📈' },
  { value: 'droit', label: 'Droit & sciences politiques', short: 'Droit & politique', emoji: '⚖️' },
  { value: 'histoire', label: 'Histoire-géo & géopolitique', short: 'Histoire-géo', emoji: '🏛️' },
  { value: 'psychologie', label: 'Psychologie & sciences sociales', short: 'Psycho & socio', emoji: '🧠' },
  { value: 'litterature', label: 'Littérature', short: 'Littérature', emoji: '📚' },
  { value: 'philosophie', label: 'Philosophie', short: 'Philo', emoji: '💭' },
  { value: 'langues', label: 'Langues étrangères', short: 'Langues', emoji: '🌍' },
  { value: 'arts', label: 'Arts & culture', short: 'Arts', emoji: '🎨' },
  { value: 'sport', label: 'Sport', short: 'Sport', emoji: '⚽' },
] as const

export type SubjectValue = (typeof SUBJECTS)[number]['value']

export const SUBJECT_VALUES = SUBJECTS.map((s) => s.value) as [SubjectValue, ...SubjectValue[]]

/** Au-delà de trois, tout le monde coche tout et le filtre ne trie plus rien */
export const MAX_SUBJECTS = 3

const SUBJECTS_BY_VALUE = new Map<string, (typeof SUBJECTS)[number]>(SUBJECTS.map((s) => [s.value, s]))

export function getSubject(value: string) {
  return SUBJECTS_BY_VALUE.get(value)
}
