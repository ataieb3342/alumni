import { describe, it, expect } from 'vitest'
import { inferSubjects } from '@/lib/inferSubjects'
import type { DirectoryMember } from '@/lib/directorySearch'

const member = (parts: Partial<DirectoryMember>): DirectoryMember => ({
  firstName: 'Camille',
  lastName: 'Martin',
  userType: 'alumni',
  ...parts,
})

const edu = (degree: string, school: string, startYear: number, field?: string) => ({ degree, school, startYear, field })

describe('inferSubjects', () => {
  it('retient les matières de la suite du parcours plutôt que celles du bac', () => {
    const { subjects } = inferSubjects(member({
      education: [
        edu('Bac', 'Lycée Victor Hugo', 2014, 'Littéraire'),
        edu('Licence de droit', 'UFR SJEPG - Besançon', 2017),
      ],
      experience: [{ position: 'Stagiaire', company: 'Tribunal judiciaire de Besançon', startDate: '2022-01-01', current: true }],
    }))
    expect(subjects).toEqual(['droit'])
  })

  it('compte une prépa faite au lycée comme une vraie formation', () => {
    const { subjects } = inferSubjects(member({
      education: [
        edu('CPGE : PCSI - PSI', 'Lycée Victor Hugo', 2015),
        edu("Diplôme d'ingénieur", 'ISAT', 2017, 'Ingénierie automobile'),
      ],
    }))
    expect(subjects).toEqual(expect.arrayContaining(['physique', 'ingenierie']))
  })

  it('se rabat sur les spécialités du bac quand il n’y a rien d’autre', () => {
    const { subjects } = inferSubjects(member({
      education: [edu('Lycée (spé maths, physique, sciences de l’ingénieur)', 'Lycée Victor Hugo', 2021)],
    }))
    expect(subjects).toEqual(expect.arrayContaining(['maths', 'physique', 'ingenierie']))
  })

  it('évite les faux amis relevés sur les vrais profils', () => {
    const { subjects } = inferSubjects(member({
      education: [
        edu('Bachelor of Arts', 'Sciences Po Paris', 2014, 'Sciences sociales'),
        edu('Licence STAPS', 'Université de Franche-Comté', 2016, 'Sciences et techniques des activités physiques et sportives'),
      ],
      experience: [
        { position: 'Bras droit du CEO', company: 'LocExpat', startDate: '2020-01-01' },
        { position: 'Software Designer', company: 'Alstom', startDate: '2021-01-01' },
        { position: 'Ingénieure développement durable', company: 'Egis', startDate: '2022-01-01' },
      ],
    }))
    expect(subjects).not.toContain('arts')
    expect(subjects).not.toContain('physique')
    expect(inferSubjects(member({ experience: [{ position: 'Bras droit du CEO', company: 'LocExpat', startDate: '2020-01-01' }] })).subjects).not.toContain('droit')
  })

  it('ne dépasse jamais trois matières', () => {
    const { subjects } = inferSubjects(member({
      education: [
        edu('Licence de mathématiques', 'Université', 2015),
        edu('Master de chimie', 'Université', 2018),
        edu('Doctorat de biologie', 'Université', 2020),
        edu('DU de philosophie', 'Université', 2023),
      ],
    }))
    expect(subjects).toHaveLength(3)
  })

  it('ne propose rien sans parcours', () => {
    expect(inferSubjects(member({})).subjects).toEqual([])
  })
})
