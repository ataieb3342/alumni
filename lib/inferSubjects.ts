/**
 * Déduit les matières d'un profil à partir de son parcours.
 *
 * Sert à pré-remplir les profils existants (scripts/backfill-subjects.ts) :
 * chaque formation et expérience est comparée à des mots-clés, et les
 * matières qui reviennent le plus sont retenues. Les membres peuvent ensuite
 * corriger depuis leur profil.
 */
import { normalize, type DirectoryMember } from './directorySearch'
import { MAX_SUBJECTS, type SubjectValue } from './subjects'

// Motifs appliqués au texte normalisé (minuscules, sans accents ni ponctuation).
// Les exclusions viennent de faux positifs relevés sur les vrais profils.
const RULES: Record<SubjectValue, RegExp> = {
  maths: /\bmath|\bmpsi\b|\bmp2i\b|\bmpi\b|\bstatisti|\bactuari/,
  // « activités physiques et sportives », « éducation physique » : c'est du sport
  physique: /(?<!\beducation )\bphysi(?!ques? et sporti)|\bpcsi\b|\bpsi\b|\bfluides?\b|\baero(nauti|spati|techni)|\bsupaero\b|\bensma\b|\bastro/,
  chimie: /\bchimi|\bcpe lyon\b|\bpharma/,
  biologie: /\bbio|\bsvt\b|\bgenom|\bgeneti|\bmicrobio|\becolog|\bagro|\bbcpst\b|\binfectieu|\bvivant\b/,
  sante: /\bmedeci|\bmedica|\bsante\b|\binfirmi|\bpharma|\bkine|\bdentaire|\bsage femme|\bchu\b|\bchru\b|\bifsi\b|\bifps\b|\bhopita|\bbloc operatoire|\bpaces\b|\bpass\b|\blas\b|\bbiomedic/,
  // « développement durable », « réseaux d'énergie » ne sont pas de l'informatique
  informatique: /\binformati|\bnumerique|\bdata\b|\bia\b|\bintelligence artificielle|\bdeveloppeu|\bdeveloppement (web|logiciel|informatique|mobile)|\blogiciel|\bfull stack|\btelecom|\bcyber|\bnsi\b|\bsio\b|\befrei\b|\bepita\b|\bsoftware|\bcomputer/,
  ingenierie: /\bingenie|\bengineer|\bmecaniq|\bautomobile|\bisat\b|\bindustri|\bcentrale|\bsupelec|\benseeiht\b|\bensta\b|\bensem\b|\besirem\b|\bmines\b|\bpolytechni|\bgenie\b|\belectroni|\belectrotech|\benergi|\bnucleaire|\bedf\b|\bairbus\b|\bthales\b|\bnaval group\b|\bbtp\b|\barts et metiers\b/,
  economie: /\beconom|\bgestion|\bcommerc|\bmanagement|\bmarketing|\bfinanc|\bbanq|\bbancaire|\bcomptab|\baudit|\bbusiness|\becs\b|\becg\b|\bhec\b|\bessec\b|\bescp\b|\bemlyon\b|\bkedge\b|\bneoma\b|\bskema\b|\biae\b|\bgrande ecole\b|\bses\b|\bassuranc|\bcredit\b|\bentrepri/,
  // « bras droit du CEO » n'a rien de juridique
  droit: /(?<!\bbras )\bdroit|\bjuridi|\bjuriste|\bavocat|\bnotai|\btribunal|\bmagistra|\bsciences po\b|\bpolitiq|\bparlement|\bsjepg\b|\binsp\b|\bena\b|\bcollectivit|\bfonction publique/,
  histoire: /\bhistoi|\bgeograph|\bgeopoliti|\bhggsp\b|\barcheolog|\bpatrimoin|\brelations internationales/,
  psychologie: /\bpsycho|\bsociolog|\banthropolog|\bsciences sociales\b|\bsciences humaines\b|\bsciences de l education\b|\beducateu|\btravail social/,
  litterature: /\blitter|\blettres?\b|\bhlp\b|\bkhagne|\bhypokhagne|\bedition|\bjournalis/,
  philosophie: /\bphilo/,
  langues: /\blangues?\b|\banglais|\ballemand|\bespagnol|\bitalien|\bchinois|\bjaponais|\brusse\b|\barabe\b|\bllcer\b|\blea\b|\btraduct|\binterpret/,
  // « Bachelor of Arts » est un intitulé de diplôme, « Arts et Métiers » une école d'ingénieurs
  arts: /(?<!\bof )\barts?\b(?! et metiers)|\bmusiq|\bconservatoire|\bcrr\b|\btheatre|\bcinema|(?<!\bsoftware )\bdesign|\bbeaux arts|\barchitect|\bdanse\b|\bgraphis|\bphotograph|\baudiovisuel/,
  sport: /\bsport|\bstaps\b|\beps\b|\bentraineu|\bcoach/,
}

// Le bac compte moins qu'une formation choisie ensuite (une prépa au lycée
// compte comme une formation) : c'est la suite du parcours qui dit ce qu'un
// ancien est devenu
const WEIGHTS = { education: 3, bac: 1, currentExperience: 3, experience: 2, staff: 3, bio: 1 }

const BAC_LEVEL = /\bbac\b|\bbaccalaureat|\blycee\b|\bseconde\b|\bterminale\b/

/** Score minimal pour retenir une matière : une seule mention au bac ne suffit pas */
const MIN_SCORE = 2

type Scores = Partial<Record<SubjectValue, number>>

export interface SubjectGuess {
  subjects: SubjectValue[]
  /** Détail des scores, pour relire les propositions avant de les écrire */
  scores: Scores
}

function topSubjects(scores: Scores, minScore: number): SubjectValue[] {
  return (Object.entries(scores) as [SubjectValue, number][])
    .filter(([, value]) => value >= minScore)
    .sort(([, a], [, b]) => b - a)
    .slice(0, MAX_SUBJECTS)
    .map(([subject]) => subject)
}

export function inferSubjects(member: DirectoryMember): SubjectGuess {
  const scores: Scores = {}
  const bacScores: Scores = {}

  const score = (target: Scores, raw: (string | undefined)[], weight: number) => {
    const text = normalize(raw.filter(Boolean).join(' '))
    if (!text) return
    for (const [subject, pattern] of Object.entries(RULES) as [SubjectValue, RegExp][]) {
      if (pattern.test(text)) target[subject] = (target[subject] ?? 0) + weight
    }
  }

  // Du plus ancien au plus récent : à égalité, la dernière étape l'emporte
  const education = [...(member.education ?? [])].sort((a, b) => (a.startYear ?? 0) - (b.startYear ?? 0))
  education.forEach((edu, index) => {
    const recency = index * 0.01
    if (BAC_LEVEL.test(normalize(`${edu.degree ?? ''} ${edu.field ?? ''}`))) {
      score(bacScores, [edu.degree, edu.field], WEIGHTS.bac)
    } else {
      score(scores, [edu.degree, edu.field, edu.school], WEIGHTS.education + recency)
    }
  })

  const experience = [...(member.experience ?? [])].sort((a, b) => (a.startDate ?? '').localeCompare(b.startDate ?? ''))
  experience.forEach((exp, index) => {
    const weight = exp.current ? WEIGHTS.currentExperience : WEIGHTS.experience
    score(scores, [exp.position, exp.company], weight + index * 0.01)
  })

  if (member.userType === 'staff') score(scores, [member.staffDetails], WEIGHTS.staff)
  score(scores, [member.currentStudies], WEIGHTS.education)
  score(scores, [member.bio, member.description], WEIGHTS.bio)

  for (const [subject, value] of Object.entries(bacScores) as [SubjectValue, number][]) {
    scores[subject] = (scores[subject] ?? 0) + value
  }

  // Seul le bac est renseigné (« spé maths, physique, SI ») : c'est déjà une
  // indication utile pour un lycéen qui a les mêmes spécialités
  const subjects = topSubjects(scores, MIN_SCORE)
  return { subjects: subjects.length > 0 ? subjects : topSubjects(bacScores, 1), scores }
}
