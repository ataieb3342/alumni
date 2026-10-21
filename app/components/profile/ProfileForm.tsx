'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Briefcase, Camera, Eye, GraduationCap, Plus, Trash2, PenLine, Check } from 'lucide-react'
import { toast } from 'sonner'
import type { Education, Experience, ImageRef } from '@/db/schema'
import { api, ApiError } from '@/lib/client/api'
import { MAX_SUBJECTS } from '@/lib/subjects'
import { cn, USER_TYPE_LABELS } from '@/lib/utils'
import { updateProfileSchema } from '@/lib/validations'
import { Alert } from '@/app/components/ui/Alert'
import { Button, buttonClasses } from '@/app/components/ui/Button'
import { useConfirm } from '@/app/components/ui/Dialog'
import { CharCount, Checkbox, Field, Input, Select, Textarea } from '@/app/components/ui/Field'
import SubjectCheckboxes from '@/app/components/directory/SubjectCheckboxes'
import { ImageCropDialog } from './ImageCropDialog'

export interface ProfileData {
  id: string
  email: string
  firstName: string
  lastName: string
  userType: string
  promotionYear: number | null
  currentStudies: string | null
  linkedIn: string | null
  bio: string | null
  city: string | null
  subjects: string[]
  isVisibleInDirectory: boolean
  staffCategory: string | null
  staffDetails: string | null
  education: Education[]
  experience: Experience[]
  profileImage: ImageRef | null
  coverImage: ImageRef | null
}

type ImageSlot = { url: string | null; file: Blob | null; removed: boolean }

const STAFF_CATEGORIES = [
  ['direction', 'Direction'],
  ['enseignant', 'Enseignant'],
  ['vie_scolaire', 'Vie scolaire'],
  ['administratif', 'Administratif'],
  ['autre', 'Autre'],
]

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']
const thisYear = new Date().getFullYear()

export function ProfileForm({ user }: { user: ProfileData }) {
  const router = useRouter()
  const confirm = useConfirm()
  const isLyceen = user.userType === 'lyceen'
  const isStaff = user.userType === 'staff'
  const fullProfile = user.userType === 'alumni' || isStaff

  const initialFields = {
    firstName: user.firstName,
    lastName: user.lastName,
    promotionYear: user.promotionYear ? String(user.promotionYear) : '',
    currentStudies: user.currentStudies ?? '',
    linkedIn: user.linkedIn ?? '',
    bio: user.bio ?? '',
    city: user.city ?? '',
    subjects: user.subjects,
    isVisibleInDirectory: user.isVisibleInDirectory,
    staffCategory: user.staffCategory ?? '',
    staffDetails: user.staffDetails ?? '',
  }
  const [fields, setFields] = useState(initialFields)
  const [education, setEducation] = useState<Education[]>(user.education)
  const [experience, setExperience] = useState<Experience[]>(user.experience)
  const [profileImage, setProfileImage] = useState<ImageSlot>({ url: user.profileImage?.url ?? null, file: null, removed: false })
  const [coverImage, setCoverImage] = useState<ImageSlot>({ url: user.coverImage?.url ?? null, file: null, removed: false })
  const [crop, setCrop] = useState<{ slot: 'profile' | 'cover'; src: string } | null>(null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ kind: 'education' | 'experience'; index: number } | null>(null)

  const snapshot = JSON.stringify({ fields, education, experience })
  const [saved, setSaved] = useState(snapshot)
  const dirty = snapshot !== saved || !!profileImage.file || !!coverImage.file || profileImage.removed || coverImage.removed

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const payload = useMemo(
    () => ({
      firstName: fields.firstName,
      lastName: fields.lastName,
      // Seuls les champs affichés sont envoyés : une ancienne valeur invalide
      // dans un champ masqué bloquerait l'enregistrement sans qu'on la voie.
      ...(isLyceen
        ? {}
        : {
            bio: fields.bio,
            subjects: fields.subjects,
            isVisibleInDirectory: fields.isVisibleInDirectory,
          }),
      ...(!isLyceen && !isStaff ? { promotionYear: fields.promotionYear, city: fields.city } : {}),
      ...(!isLyceen && !fullProfile ? { currentStudies: fields.currentStudies } : {}),
      ...(fullProfile ? { linkedIn: fields.linkedIn.trim(), education, experience } : {}),
      ...(isStaff ? { staffCategory: fields.staffCategory, staffDetails: fields.staffDetails } : {}),
    }),
    [fields, education, experience, isLyceen, isStaff, fullProfile]
  )

  const errors = useMemo(() => {
    const result = updateProfileSchema.safeParse(payload)
    const map: Record<string, string> = {}
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path.join('.')
        if (!map[key]) map[key] = issue.message
      }
    }
    return map
  }, [payload])
  const errorFor = (key: string) => (touched[key] || submitted ? errors[key] ?? null : null)
  const set = <K extends keyof typeof fields>(key: K, value: (typeof fields)[K]) => setFields((current) => ({ ...current, [key]: value }))
  const bind = (key: 'firstName' | 'lastName' | 'promotionYear' | 'currentStudies' | 'linkedIn' | 'city' | 'staffDetails') => ({
    value: fields[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => set(key, event.target.value),
    onBlur: () => setTouched((current) => ({ ...current, [key]: true })),
  })

  const pickImage = (slot: 'profile' | 'cover', file: File | undefined) => {
    if (!file) return
    if (!ACCEPTED.includes(file.type)) return toast.error('Choisissez une image JPG, PNG ou WEBP')
    if (file.size > 5 * 1024 * 1024) return toast.error("L'image ne doit pas dépasser 5 Mo")
    setCrop({ slot, src: URL.createObjectURL(file) })
  }

  const upload = async (file: Blob) => {
    const data = new FormData()
    data.append('file', new File([file], 'photo.jpg', { type: 'image/jpeg' }))
    const result = await api<{ mediaId: string }>('/api/upload-image', { formData: data })
    return result.mediaId
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    setServerError(null)
    const firstError = Object.keys(errors)[0]
    if (firstError) {
      // Une erreur dans une formation ou une expérience repliée : on l'ouvre pour la montrer
      const [kind, index] = firstError.split('.')
      if ((kind === 'education' || kind === 'experience') && index !== undefined) {
        setEditing({ kind, index: Number(index) })
        toast.error(`${kind === 'education' ? 'Formation' : 'Expérience'} n°${Number(index) + 1} : ${errors[firstError]}`)
      } else {
        toast.error(errors[firstError])
      }
      return
    }
    setLoading(true)
    try {
      const body: Record<string, unknown> = { ...payload }
      if (profileImage.file) body.profileImageId = await upload(profileImage.file)
      else if (profileImage.removed) body.profileImageId = null
      if (coverImage.file) body.coverImageId = await upload(coverImage.file)
      else if (coverImage.removed) body.coverImageId = null
      await api('/api/profile/update', { body })
      setSaved(snapshot)
      setProfileImage((current) => ({ ...current, file: null, removed: false }))
      setCoverImage((current) => ({ ...current, file: null, removed: false }))
      setEditing(null)
      toast.success('Profil mis à jour')
      router.refresh()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Erreur lors de la mise à jour du profil'
      setServerError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {serverError && <Alert tone="error">{serverError}</Alert>}

      <Section title="Type de profil">
        <p className="text-ink">
          <strong>{USER_TYPE_LABELS[user.userType] ?? 'Membre'}</strong>
          <span className="text-ink-muted"> — {isLyceen ? 'profil simplifié : nom, prénom et e-mail' : 'profil complet, visible dans l’annuaire'}</span>
        </p>
      </Section>

      {!isLyceen && (
        <Section title="Photos" description="Une photo aide les lycéens à vous reconnaître lors des événements.">
          <div className="space-y-5">
            <div className="relative h-36 overflow-hidden rounded-[var(--radius-md)] border border-line bg-wash sm:h-44">
              {coverImage.url && <Image src={coverImage.url} alt="" fill sizes="(min-width: 768px) 700px, 100vw" className="object-cover" unoptimized={coverImage.url.startsWith('blob:')} />}
              <div className="absolute right-3 bottom-3 flex gap-2">
                <ImageButton label={coverImage.url ? 'Changer la couverture' : 'Ajouter une couverture'} onPick={(file) => pickImage('cover', file)} />
                {coverImage.url && (
                  <button type="button" onClick={() => setCoverImage({ url: null, file: null, removed: true })} className={buttonClasses('secondary', 'sm')} aria-label="Retirer la photo de couverture">
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-full border-4 border-paper-raised bg-blue-soft shadow-[var(--shadow-md)]">
                {profileImage.url ? (
                  <Image src={profileImage.url} alt="Votre photo de profil" fill sizes="96px" className="object-cover" unoptimized={profileImage.url.startsWith('blob:')} />
                ) : (
                  <span className="grid size-full place-items-center font-display text-3xl text-blue" aria-hidden="true">
                    {fields.firstName.charAt(0)}
                    {fields.lastName.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <ImageButton label={profileImage.url ? 'Changer la photo' : 'Ajouter une photo'} onPick={(file) => pickImage('profile', file)} />
                {profileImage.url && (
                  <Button variant="ghost" size="sm" onClick={() => setProfileImage({ url: null, file: null, removed: true })}>
                    Retirer
                  </Button>
                )}
              </div>
              <p className="w-full text-sm text-ink-muted">JPG, PNG ou WEBP, 5 Mo maximum. Recadrage à l’étape suivante.</p>
            </div>
          </div>
        </Section>
      )}

      <Section title="Informations de base">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Prénom" required error={errorFor('firstName')}>
            <Input autoComplete="given-name" {...bind('firstName')} />
          </Field>
          <Field label="Nom" required error={errorFor('lastName')}>
            <Input autoComplete="family-name" {...bind('lastName')} />
          </Field>
          {!isLyceen && !isStaff && (
            <Field
              label={user.userType === 'alumni' ? 'Année du baccalauréat' : 'Année du baccalauréat (prévue)'}
              error={errorFor('promotionYear')}
              hint={user.userType === 'alumni' ? 'Votre promotion au lycée' : 'L’année prévue d’obtention du bac'}
            >
              <Input type="number" inputMode="numeric" min={1950} max={thisYear + 10} placeholder={String(thisYear)} {...bind('promotionYear')} />
            </Field>
          )}
          {fullProfile && (
            <Field label="LinkedIn" error={errorFor('linkedIn')} hint="Ex. linkedin.com/in/prenom-nom">
              <Input inputMode="url" {...bind('linkedIn')} />
            </Field>
          )}
          {!isLyceen && !fullProfile && (
            <Field label="Classe / formation actuelle" error={errorFor('currentStudies')} hint="Votre classe ou formation actuelle">
              <Input placeholder={user.userType === 'bts' ? 'BTS SIO, BTS MCO…' : 'MPSI, PCSI, ECG…'} {...bind('currentStudies')} />
            </Field>
          )}
          {!isLyceen && !isStaff && (
            <Field label="Ville actuelle" error={errorFor('city')} hint="Permet aux membres de vous trouver en cherchant une ville">
              <Input autoComplete="address-level2" placeholder="Lyon, Paris, Montréal…" {...bind('city')} />
            </Field>
          )}
          <Field label="E-mail" hint="Pour le modifier, écrivez à l’association">
            <Input value={user.email} disabled readOnly />
          </Field>
        </div>
      </Section>

      {!isLyceen && (
        <Section title="Matières" description={`Quelles matières ont compté dans votre parcours ? Jusqu’à ${MAX_SUBJECTS} : les lycéens s’en servent pour trouver les profils qui leur ressemblent.`}>
          <SubjectCheckboxes legend="Matières de votre parcours" selected={fields.subjects} onChange={(subjects) => set('subjects', subjects)} max={MAX_SUBJECTS} />
          <p className="mt-2 text-sm text-ink-muted" aria-live="polite">
            {fields.subjects.length}/{MAX_SUBJECTS} sélectionnées
          </p>
        </Section>
      )}

      {isStaff && (
        <Section title="Fonction au lycée Victor Hugo">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Catégorie" required error={errorFor('staffCategory')}>
              <Select value={fields.staffCategory} onChange={(event) => set('staffCategory', event.target.value)}>
                <option value="">Choisir…</option>
                {STAFF_CATEGORIES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Poste" required error={errorFor('staffDetails')} hint="Ex. Professeur de mathématiques, CPE, Proviseur">
              <Input {...bind('staffDetails')} />
            </Field>
          </div>
        </Section>
      )}

      {!isLyceen && (
        <Section title="Présentation">
          <Field label="Quelques mots sur vous" error={errorFor('bio')} labelExtra={<CharCount value={fields.bio} max={1000} />} hint="Votre parcours, ce que vous aimez, ce que vous pouvez apporter aux lycéens">
            <Textarea rows={5} value={fields.bio} onChange={(event) => set('bio', event.target.value)} onBlur={() => setTouched((t) => ({ ...t, bio: true }))} />
          </Field>
        </Section>
      )}

      {fullProfile && (
        <>
          <Section title="Formations" description={education.length === 0 ? 'Ajoutez vos études après le lycée (prépa, université, école…) : c’est ce que les lycéens cherchent le plus.' : undefined}>
            <EntryList
              kind="education"
              entries={education}
              editing={editing}
              setEditing={setEditing}
              errorFor={(index, key) => errorFor(`education.${index}.${key}`)}
              onChange={setEducation}
              onRemove={async (index) => {
                if (await confirm({ title: 'Supprimer cette formation ?', body: 'Elle sera retirée de votre profil à l’enregistrement.', confirmLabel: 'Supprimer' }))
                  setEducation((items) => items.filter((_, i) => i !== index))
              }}
              newEntry={{ school: '', degree: '', field: '', location: '', startYear: thisYear, description: '' }}
            />
          </Section>
          <Section title="Expériences professionnelles">
            <EntryList
              kind="experience"
              entries={experience}
              editing={editing}
              setEditing={setEditing}
              errorFor={(index, key) => errorFor(`experience.${index}.${key}`)}
              onChange={setExperience}
              onRemove={async (index) => {
                if (await confirm({ title: 'Supprimer cette expérience ?', body: 'Elle sera retirée de votre profil à l’enregistrement.', confirmLabel: 'Supprimer' }))
                  setExperience((items) => items.filter((_, i) => i !== index))
              }}
              newEntry={{ company: '', position: '', location: '', startDate: `${thisYear}-01`, current: false, description: '' }}
            />
          </Section>
        </>
      )}

      {!isLyceen && (
        <Section title="Visibilité">
          <Checkbox
            label="Apparaître dans l’annuaire"
            description="Si vous décochez, votre profil n’apparaît plus dans les recherches des membres."
            checked={fields.isVisibleInDirectory}
            onChange={(event) => set('isVisibleInDirectory', event.target.checked)}
          />
        </Section>
      )}

      <div className={cn('sticky bottom-3 z-30 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border p-3 shadow-[var(--shadow-lg)] backdrop-blur transition-colors', dirty ? 'border-ink bg-wash text-on-wash' : 'border-line bg-paper-raised/95 text-ink')}>
        <p className="pl-2 text-sm font-semibold" aria-live="polite">
          {dirty ? 'Modifications non enregistrées' : (
            <span className="inline-flex items-center gap-1.5 text-success">
              <Check className="size-4" aria-hidden="true" /> Profil à jour
            </span>
          )}
        </p>
        <div className="flex gap-2">
          <Link href={`/annuaire/${user.id}`} className={buttonClasses(dirty ? 'on-wash' : 'ghost', 'md')}>
            <Eye className="size-4" aria-hidden="true" /> Voir mon profil public
          </Link>
          <Button type="submit" variant={dirty ? 'highlight' : 'primary'} loading={loading} loadingLabel="Enregistrement…" disabled={!dirty && !loading}>
            Enregistrer
          </Button>
        </div>
      </div>

      {crop && (
        <ImageCropDialog
          image={crop.src}
          aspect={crop.slot === 'profile' ? 1 : 3}
          title={crop.slot === 'profile' ? 'Recadrer la photo de profil' : 'Recadrer la photo de couverture'}
          onCancel={() => setCrop(null)}
          onDone={(blob) => {
            const slot = { url: URL.createObjectURL(blob), file: blob, removed: false }
            if (crop.slot === 'profile') setProfileImage(slot)
            else setCoverImage(slot)
            setCrop(null)
          }}
        />
      )}
    </form>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-line bg-paper-raised p-5 sm:p-7">
      <h2 className="text-2xl text-ink">{title}</h2>
      {description && <p className="mt-1 text-ink-soft">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

function ImageButton({ label, onPick }: { label: string; onPick: (file: File | undefined) => void }) {
  return (
    <label className={cn(buttonClasses('secondary', 'sm'), 'cursor-pointer has-[:focus-visible]:shadow-[var(--focus-ring)]')}>
      <Camera className="size-4" aria-hidden="true" />
      {label}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          onPick(event.target.files?.[0])
          event.target.value = ''
        }}
      />
    </label>
  )
}

type Entry = Education | Experience

function EntryList<T extends Entry>({
  kind,
  entries,
  editing,
  setEditing,
  onChange,
  onRemove,
  newEntry,
  errorFor,
}: {
  kind: 'education' | 'experience'
  entries: T[]
  editing: { kind: 'education' | 'experience'; index: number } | null
  setEditing: (value: { kind: 'education' | 'experience'; index: number } | null) => void
  onChange: (entries: T[]) => void
  onRemove: (index: number) => void
  newEntry: T
  errorFor: (index: number, key: string) => string | null
}) {
  const Icon = kind === 'education' ? GraduationCap : Briefcase
  const update = (index: number, patch: Partial<T>) => onChange(entries.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)))
  return (
    <div className="space-y-3">
      {entries.map((entry, index) => {
        const open = editing?.kind === kind && editing.index === index
        const edu = entry as Education
        const exp = entry as Experience
        const title = kind === 'education' ? edu.degree || 'Diplôme à préciser' : exp.position || 'Poste à préciser'
        const subtitle = kind === 'education' ? [edu.school, edu.location].filter(Boolean).join(' · ') : [exp.company, exp.location].filter(Boolean).join(' · ')
        const period = kind === 'education' ? `${edu.startYear || '?'} – ${edu.endYear || 'en cours'}` : `${exp.startDate?.slice(0, 7) || '?'} – ${exp.current ? 'aujourd’hui' : exp.endDate?.slice(0, 7) || '?'}`
        return (
          <div key={entry._key ?? index} className={cn('rounded-[var(--radius-md)] border', open ? 'border-blue bg-blue-soft/40' : 'border-line')}>
            <div className="flex items-start gap-3 p-4">
              <Icon className="mt-0.5 size-5 shrink-0 text-blue" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="font-bold break-words text-ink">{title}</p>
                {subtitle && <p className="text-sm text-ink-soft">{subtitle}</p>}
                <p className="text-sm text-ink-muted">{period}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button type="button" onClick={() => setEditing(open ? null : { kind, index })} aria-expanded={open} className={buttonClasses('ghost', 'sm')}>
                  <PenLine className="size-4" aria-hidden="true" />
                  {open ? 'Terminer' : 'Modifier'}
                </button>
                <button type="button" onClick={() => onRemove(index)} aria-label={`Supprimer : ${title}`} className={buttonClasses('ghost', 'sm', 'text-red hover:bg-red-soft hover:text-red')}>
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            {open && (
              <div className="grid gap-4 border-t border-line p-4 sm:grid-cols-2">
                {kind === 'education' ? (
                  <>
                    <Field label="École / université" required error={errorFor(index, 'school')}>
                      <Input value={edu.school} onChange={(e) => update(index, { school: e.target.value } as unknown as Partial<T>)} />
                    </Field>
                    <Field label="Diplôme" required error={errorFor(index, 'degree')} hint="Ex. Licence, Master, BTS, Prépa MPSI">
                      <Input value={edu.degree} onChange={(e) => update(index, { degree: e.target.value } as unknown as Partial<T>)} />
                    </Field>
                    <Field label="Domaine" error={errorFor(index, 'field')}>
                      <Input value={edu.field ?? ''} onChange={(e) => update(index, { field: e.target.value } as unknown as Partial<T>)} />
                    </Field>
                    <Field label="Ville" error={errorFor(index, 'location')}>
                      <Input value={edu.location ?? ''} onChange={(e) => update(index, { location: e.target.value } as unknown as Partial<T>)} />
                    </Field>
                    <Field label="Année de début" required error={errorFor(index, 'startYear')}>
                      <Input type="number" inputMode="numeric" value={edu.startYear || ''} onChange={(e) => update(index, { startYear: Number(e.target.value) } as unknown as Partial<T>)} />
                    </Field>
                    <Field label="Année de fin" error={errorFor(index, 'endYear')} hint="Vide si en cours">
                      <Input type="number" inputMode="numeric" value={edu.endYear ?? ''} onChange={(e) => update(index, { endYear: e.target.value ? Number(e.target.value) : undefined } as unknown as Partial<T>)} />
                    </Field>
                  </>
                ) : (
                  <>
                    <Field label="Poste" required error={errorFor(index, 'position')}>
                      <Input value={exp.position} onChange={(e) => update(index, { position: e.target.value } as unknown as Partial<T>)} />
                    </Field>
                    <Field label="Entreprise" required error={errorFor(index, 'company')}>
                      <Input value={exp.company} onChange={(e) => update(index, { company: e.target.value } as unknown as Partial<T>)} />
                    </Field>
                    <Field label="Lieu" error={errorFor(index, 'location')}>
                      <Input value={exp.location ?? ''} onChange={(e) => update(index, { location: e.target.value } as unknown as Partial<T>)} />
                    </Field>
                    <Field label="Début" required error={errorFor(index, 'startDate')}>
                      <Input type="month" value={exp.startDate?.slice(0, 7) ?? ''} onChange={(e) => update(index, { startDate: e.target.value } as unknown as Partial<T>)} />
                    </Field>
                    <Checkbox label="Poste actuel" checked={!!exp.current} onChange={(e) => update(index, { current: e.target.checked, endDate: e.target.checked ? undefined : exp.endDate } as unknown as Partial<T>)} />
                    {!exp.current && (
                      <Field label="Fin" error={errorFor(index, 'endDate')}>
                        <Input type="month" value={exp.endDate?.slice(0, 7) ?? ''} onChange={(e) => update(index, { endDate: e.target.value || undefined } as unknown as Partial<T>)} />
                      </Field>
                    )}
                  </>
                )}
                <Field label="Description" className="sm:col-span-2" error={errorFor(index, 'description')}>
                  <Textarea rows={3} value={entry.description ?? ''} onChange={(e) => update(index, { description: e.target.value } as unknown as Partial<T>)} />
                </Field>
              </div>
            )}
          </div>
        )
      })}
      <button
        type="button"
        onClick={() => {
          onChange([...entries, { ...newEntry, _key: Math.random().toString(36).slice(2, 12) }])
          setEditing({ kind, index: entries.length })
        }}
        className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border-2 border-dashed border-blue/40 py-4 font-semibold text-blue hover:border-blue hover:bg-blue-soft"
      >
        <Plus className="size-5" aria-hidden="true" />
        {kind === 'education' ? 'Ajouter une formation' : 'Ajouter une expérience'}
      </button>
    </div>
  )
}
