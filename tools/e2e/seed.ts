/**
 * Base des tests de bout en bout : PGlite neuve, contenus par défaut et
 * membres FICTIFS. Les mots de passe sont tirés au hasard à chaque lancement
 * et écrits dans E2E_DIR/accounts.json (non versionné).
 *
 * Ne tourne que sur une base PGlite située dans .data/ : elle est effacée.
 * Usage (lancé par playwright.config.ts) : tsx tools/e2e/seed.ts
 */
import fs from 'node:fs'
import path from 'node:path'
import { databaseUrl, getDb } from '@/db'
import { users, type NewUser, type UserType } from '@/db/schema'
import { hashPassword } from '@/lib/auth/password'
import { newId, newSecretToken } from '@/lib/ids'
import { seedDefaultContent } from '@/lib/content/seed'
import { createAnnouncement } from '@/lib/data/announcements'
import { createPost, editableContent, getPostById, publishPost } from '@/lib/data/posts'
import { createTestimonial } from '@/lib/data/testimonials'

const E2E_DIR = path.resolve(process.env.E2E_DIR ?? '.data/e2e')

export interface E2EAccounts {
  admin: { email: string; password: string; name: string }
  member: { email: string; password: string; name: string }
  pending: { email: string; password: string; name: string }
  forgetful: { email: string; password: string; name: string }
  student: { email: string; password: string; name: string }
  leaving: { email: string; password: string; name: string }
  changer: { email: string; password: string; name: string }
  ghost: { email: string; password: string; name: string }
}

async function main() {
  const url = databaseUrl()
  const location = url.startsWith('pglite:') ? path.resolve(url.slice('pglite:'.length)) : ''
  if (!location || !location.startsWith(path.resolve('.data') + path.sep)) {
    console.error('Refusé : la base e2e doit être une base PGlite dans .data/ (elle est effacée).')
    process.exit(1)
  }
  fs.rmSync(location, { recursive: true, force: true })
  fs.rmSync(path.join(E2E_DIR, 'outbox'), { recursive: true, force: true })
  fs.rmSync(path.join(E2E_DIR, 'media'), { recursive: true, force: true })
  fs.mkdirSync(E2E_DIR, { recursive: true })

  const db = await getDb()
  await seedDefaultContent(db)

  const password = () => `Aa1!${newSecretToken().slice(0, 20)}`
  const accounts: E2EAccounts = {
    admin: { email: 'alex.admin@e2e.test', password: password(), name: 'Alex Admin' },
    member: { email: 'camille.martin@e2e.test', password: password(), name: 'Camille Martin' },
    pending: { email: 'paul.attente@e2e.test', password: password(), name: 'Paul Attente' },
    forgetful: { email: 'remi.oubli@e2e.test', password: password(), name: 'Rémi Oubli' },
    student: { email: 'zoe.lyceenne@e2e.test', password: password(), name: 'Zoé Lycéenne' },
    leaving: { email: 'marc.depart@e2e.test', password: password(), name: 'Marc Départ' },
    changer: { email: 'nina.change@e2e.test', password: password(), name: 'Nina Change' },
    ghost: { email: 'gaspard.fantome@e2e.test', password: password(), name: 'Gaspard Fantôme' },
  }

  const insert = async (values: Omit<NewUser, 'id' | 'userType'> & { userType?: UserType; password?: string }) => {
    const { password: plain, ...rest } = values
    const [user] = await db
      .insert(users)
      .values({ id: newId(), accountStatus: 'active', role: 'member', ...rest, userType: rest.userType ?? 'alumni', passwordHash: plain ? await hashPassword(plain) : null })
      .returning()
    return user
  }

  const admin = await insert({ email: accounts.admin.email, password: accounts.admin.password, firstName: 'Alex', lastName: 'Admin', role: 'admin', isVisibleInDirectory: false })
  await insert({
    email: accounts.member.email,
    password: accounts.member.password,
    firstName: 'Camille',
    lastName: 'Martin',
    promotionYear: 2016,
    city: 'Lyon',
    subjects: ['maths', 'informatique'],
    education: [{ school: 'INSA Lyon', degree: 'Diplôme d’ingénieur', field: 'Informatique', startYear: 2016, endYear: 2021 }],
  })
  await insert({ email: accounts.pending.email, password: accounts.pending.password, firstName: 'Paul', lastName: 'Attente', accountStatus: 'pending' })
  await insert({ email: accounts.forgetful.email, password: accounts.forgetful.password, firstName: 'Rémi', lastName: 'Oubli', promotionYear: 2010, city: 'Dijon' })
  await insert({ email: accounts.student.email, password: accounts.student.password, firstName: 'Zoé', lastName: 'Lycéenne', userType: 'lyceen', promotionYear: 2027 })
  const leaving = await insert({ email: accounts.leaving.email, password: accounts.leaving.password, firstName: 'Marc', lastName: 'Départ', promotionYear: 2011, city: 'Nancy', subjects: ['economie'] })
  await insert({ email: accounts.changer.email, password: accounts.changer.password, firstName: 'Nina', lastName: 'Change', promotionYear: 2013, city: 'Rennes' })
  await insert({ email: accounts.ghost.email, password: accounts.ghost.password, firstName: 'Gaspard', lastName: 'Fantôme', promotionYear: 2009, city: 'Metz' })

  const lea = await insert({
    email: 'lea.bernard@e2e.test',
    firstName: 'Léa',
    lastName: 'Bernard',
    promotionYear: 2012,
    city: 'Paris',
    subjects: ['physique'],
    experience: [{ company: 'Laboratoire d’optique', position: 'Chercheuse en physique', location: 'Paris', startDate: '2020-09-01', current: true }],
  })
  const hugo = await insert({
    email: 'hugo.petit@e2e.test',
    firstName: 'Hugo',
    lastName: 'Petit',
    promotionYear: 2014,
    city: 'Besançon',
    subjects: ['sante', 'biologie'],
    experience: [{ company: 'Centre hospitalier', position: 'Interne en médecine', location: 'Besançon', startDate: '2022-11-01', current: true }],
  })
  await insert({ email: 'ines.moreau@e2e.test', firstName: 'Inès', lastName: 'Moreau', promotionYear: 2018, city: 'Bruxelles', subjects: ['droit'], currentStudies: 'Master de droit européen' })
  await insert({ email: 'yanis.roux@e2e.test', firstName: 'Yanis', lastName: 'Roux', promotionYear: 2019, city: 'Toulouse', subjects: ['informatique', 'ingenierie'], currentStudies: 'École d’ingénieurs en aéronautique' })
  await insert({ email: 'sarah.fontaine@e2e.test', firstName: 'Sarah', lastName: 'Fontaine', userType: 'staff', staffCategory: 'enseignant', city: 'Besançon', subjects: ['langues'], staffDetails: 'Professeure d’anglais' })

  await createAnnouncement(lea.id, {
    title: 'Conférence sur la lumière et les lasers',
    type: 'event',
    company: 'Laboratoire d’optique',
    location: 'Besançon',
    description: 'Une heure pour découvrir la recherche en optique.\n\n- démonstrations\n- questions-réponses',
    contactEmail: 'lea.bernard@e2e.test',
    eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  })

  await createAnnouncement(leaving.id, {
    title: 'Vente de calculatrices graphiques',
    type: 'school_supplies',
    location: 'Nancy',
    description: 'Deux calculatrices en très bon état, idéales pour la prépa.',
    contactEmail: 'marc.depart@e2e.test',
  })

  await createTestimonial(hugo.id, {
    title: 'De la prépa aux études de médecine',
    type: 'studies',
    excerpt: 'Après le bac, j’ai choisi la voie médicale : voici ce que j’aurais aimé savoir avant de me lancer dans ces études exigeantes.',
    rating: 5,
    tags: ['médecine', 'conseils'],
    answers: { studies_school: 'Université de Franche-Comté', studies_why: 'Le goût des sciences du vivant et du contact humain.' },
  })

  const publicPost = await createPost({ title: 'Bienvenue sur le nouveau site des anciens' }, admin.id)
  await publishPost(publicPost.id, admin.id, {
    ...editableContent((await getPostById(publicPost.id))!),
    excerpt: 'Annuaire, annonces et témoignages : tout ce qu’il faut savoir.',
    bodyHtml: '<p>Le site fait peau neuve.</p>',
  })
  const membersPost = await createPost({ title: 'Compte rendu réservé aux membres' }, admin.id)
  await publishPost(membersPost.id, admin.id, {
    ...editableContent((await getPostById(membersPost.id))!),
    visibility: 'members',
    bodyHtml: '<p>Les décisions de l’assemblée générale.</p>',
  })

  fs.writeFileSync(path.join(E2E_DIR, 'accounts.json'), JSON.stringify(accounts, null, 2), { mode: 0o600 })
  console.log(`Base e2e prête (${location}) : comptes dans ${path.relative(process.cwd(), path.join(E2E_DIR, 'accounts.json'))}`)
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
