'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function TestimonialForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    type: 'studies',
    excerpt: '',
    rating: '',
    tags: '',

    // Études
    studies_school: '',
    studies_program: '',
    studies_year: '',
    studies_why: '',
    studies_strengths: '',
    studies_challenges: '',
    studies_advice: '',

    // Entreprise
    company_name: '',
    company_position: '',
    company_duration: '',
    company_context: '',
    company_missions: '',
    company_learnings: '',
    company_how: '',

    // Parcours
    career_journey: '',
    career_transition: '',
    career_turning_point: '',
    career_advice: '',

    // International
    international_location: '',
    international_duration: '',
    international_why: '',
    international_daily_life: '',
    international_best_memory: '',
    international_challenges: '',

    // Mentorat
    mentoring_topic: '',
    mentoring_context: '',
    mentoring_advice: '',
    mentoring_mistakes: '',

    // Projet
    project_name: '',
    project_description: '',
    project_role: '',
    project_challenges: '',
    project_outcome: '',
    project_learnings: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/testimonials/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erreur lors de la création du témoignage')
      }

      const data = await response.json()
      toast.success('Témoignage créé avec succès !')
      router.push(`/temoignages/${data.slug}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(errorMessage)
      toast.error(errorMessage)
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-red-50 text-red-800 border border-red-200">
          {error}
        </div>
      )}

      {/* Informations générales */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h2>
        <div className="space-y-6">
          {/* Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Type de témoignage <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              name="type"
              required
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900"
            >
              <option value="studies">🎓 Études & Formation</option>
              <option value="company">💼 Entreprise & Stage</option>
              <option value="career">🚀 Parcours Professionnel</option>
              <option value="international">🌍 Vie à l&apos;international</option>
              <option value="mentoring">💡 Conseil & Mentorat</option>
              <option value="project">🎯 Projet & Réalisation</option>
            </select>
          </div>

          {/* Titre */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Titre du témoignage <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              maxLength={120}
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
              placeholder="Ex: Mon stage chez Google, Ma vie à Tokyo..."
            />
            <p className="mt-1 text-sm text-gray-500">{formData.title.length}/120 caractères</p>
          </div>

          {/* Résumé */}
          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
              Résumé (2-3 phrases) <span className="text-red-500">*</span>
            </label>
            <textarea
              id="excerpt"
              name="excerpt"
              required
              rows={3}
              maxLength={300}
              value={formData.excerpt}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
              placeholder="Un court résumé qui donnera envie de lire votre témoignage..."
            />
            <p className="mt-1 text-sm text-gray-500">{formData.excerpt.length}/300 caractères</p>
          </div>

          {/* Rating et Tags */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-2">
                Note d&apos;expérience (1-5)
              </label>
              <select
                id="rating"
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900"
              >
                <option value="">Pas de note</option>
                <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                <option value="4">⭐⭐⭐⭐ (4/5)</option>
                <option value="3">⭐⭐⭐ (3/5)</option>
                <option value="2">⭐⭐ (2/5)</option>
                <option value="1">⭐ (1/5)</option>
              </select>
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags (séparés par des virgules)
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
                placeholder="startup, tech, expatriation..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Questions spécifiques : Études */}
      {formData.type === 'studies' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📚 Votre expérience d&apos;études</h2>
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="studies_school" className="block text-sm font-medium text-gray-700 mb-2">
                  École / Université
                </label>
                <input
                  type="text"
                  id="studies_school"
                  name="studies_school"
                  value={formData.studies_school}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
                  placeholder="UTBM, Université..."
                />
              </div>
              <div>
                <label htmlFor="studies_program" className="block text-sm font-medium text-gray-700 mb-2">
                  Formation
                </label>
                <input
                  type="text"
                  id="studies_program"
                  name="studies_program"
                  value={formData.studies_program}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
                  placeholder="Master Data Science..."
                />
              </div>
              <div>
                <label htmlFor="studies_year" className="block text-sm font-medium text-gray-700 mb-2">
                  Année(s)
                </label>
                <input
                  type="text"
                  id="studies_year"
                  name="studies_year"
                  value={formData.studies_year}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
                  placeholder="2018-2021"
                />
              </div>
            </div>

            <div>
              <label htmlFor="studies_why" className="block text-sm font-medium text-gray-700 mb-2">
                Pourquoi ce choix ?
              </label>
              <textarea
                id="studies_why"
                name="studies_why"
                rows={3}
                value={formData.studies_why}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="studies_strengths" className="block text-sm font-medium text-gray-700 mb-2">
                Les points forts
              </label>
              <textarea
                id="studies_strengths"
                name="studies_strengths"
                rows={3}
                value={formData.studies_strengths}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="studies_challenges" className="block text-sm font-medium text-gray-700 mb-2">
                Les défis rencontrés
              </label>
              <textarea
                id="studies_challenges"
                name="studies_challenges"
                rows={3}
                value={formData.studies_challenges}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="studies_advice" className="block text-sm font-medium text-gray-700 mb-2">
                Ton conseil aux futurs étudiants
              </label>
              <textarea
                id="studies_advice"
                name="studies_advice"
                rows={3}
                value={formData.studies_advice}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Questions spécifiques : Entreprise */}
      {formData.type === 'company' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">💼 Votre expérience en entreprise</h2>
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l&apos;entreprise
                </label>
                <input
                  type="text"
                  id="company_name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <div>
                <label htmlFor="company_position" className="block text-sm font-medium text-gray-700 mb-2">
                  Poste occupé
                </label>
                <input
                  type="text"
                  id="company_position"
                  name="company_position"
                  value={formData.company_position}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="company_duration" className="block text-sm font-medium text-gray-700 mb-2">
                  Durée & période
                </label>
                <input
                  type="text"
                  id="company_duration"
                  name="company_duration"
                  value={formData.company_duration}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
                  placeholder="6 mois, été 2023"
                />
              </div>
              <div>
                <label htmlFor="company_context" className="block text-sm font-medium text-gray-700 mb-2">
                  Contexte
                </label>
                <input
                  type="text"
                  id="company_context"
                  name="company_context"
                  value={formData.company_context}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
                  placeholder="Stage, CDI, alternance..."
                />
              </div>
            </div>

            <div>
              <label htmlFor="company_missions" className="block text-sm font-medium text-gray-700 mb-2">
                Missions principales
              </label>
              <textarea
                id="company_missions"
                name="company_missions"
                rows={3}
                value={formData.company_missions}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="company_learnings" className="block text-sm font-medium text-gray-700 mb-2">
                Ce que tu as appris
              </label>
              <textarea
                id="company_learnings"
                name="company_learnings"
                rows={3}
                value={formData.company_learnings}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="company_how" className="block text-sm font-medium text-gray-700 mb-2">
                Comment tu as décroché cette opportunité
              </label>
              <textarea
                id="company_how"
                name="company_how"
                rows={3}
                value={formData.company_how}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Questions spécifiques : Parcours */}
      {formData.type === 'career' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🚀 Votre parcours professionnel</h2>
          <div className="space-y-6">
            <div>
              <label htmlFor="career_journey" className="block text-sm font-medium text-gray-700 mb-2">
                Ton parcours en quelques mots
              </label>
              <textarea
                id="career_journey"
                name="career_journey"
                rows={4}
                value={formData.career_journey}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="career_transition" className="block text-sm font-medium text-gray-700 mb-2">
                Les transitions clés
              </label>
              <textarea
                id="career_transition"
                name="career_transition"
                rows={3}
                value={formData.career_transition}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="career_turning_point" className="block text-sm font-medium text-gray-700 mb-2">
                Le moment décisif
              </label>
              <textarea
                id="career_turning_point"
                name="career_turning_point"
                rows={3}
                value={formData.career_turning_point}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="career_advice" className="block text-sm font-medium text-gray-700 mb-2">
                Ton meilleur conseil
              </label>
              <textarea
                id="career_advice"
                name="career_advice"
                rows={3}
                value={formData.career_advice}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Questions spécifiques : International */}
      {formData.type === 'international' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🌍 Votre expérience internationale</h2>
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="international_location" className="block text-sm font-medium text-gray-700 mb-2">
                  Ville / Pays
                </label>
                <input
                  type="text"
                  id="international_location"
                  name="international_location"
                  value={formData.international_location}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <div>
                <label htmlFor="international_duration" className="block text-sm font-medium text-gray-700 mb-2">
                  Durée
                </label>
                <input
                  type="text"
                  id="international_duration"
                  name="international_duration"
                  value={formData.international_duration}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
                  placeholder="2 ans, 2020-2022"
                />
              </div>
            </div>

            <div>
              <label htmlFor="international_why" className="block text-sm font-medium text-gray-700 mb-2">
                Pourquoi cette destination ?
              </label>
              <textarea
                id="international_why"
                name="international_why"
                rows={3}
                value={formData.international_why}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="international_daily_life" className="block text-sm font-medium text-gray-700 mb-2">
                Le quotidien là-bas
              </label>
              <textarea
                id="international_daily_life"
                name="international_daily_life"
                rows={3}
                value={formData.international_daily_life}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="international_best_memory" className="block text-sm font-medium text-gray-700 mb-2">
                Le meilleur souvenir
              </label>
              <textarea
                id="international_best_memory"
                name="international_best_memory"
                rows={3}
                value={formData.international_best_memory}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="international_challenges" className="block text-sm font-medium text-gray-700 mb-2">
                Les défis de l&apos;expatriation
              </label>
              <textarea
                id="international_challenges"
                name="international_challenges"
                rows={3}
                value={formData.international_challenges}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Questions spécifiques : Mentorat */}
      {formData.type === 'mentoring' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">💡 Vos conseils</h2>
          <div className="space-y-6">
            <div>
              <label htmlFor="mentoring_topic" className="block text-sm font-medium text-gray-700 mb-2">
                Sujet du conseil
              </label>
              <input
                type="text"
                id="mentoring_topic"
                name="mentoring_topic"
                value={formData.mentoring_topic}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
                placeholder="Orientation, Réseau, Reconversion..."
              />
            </div>

            <div>
              <label htmlFor="mentoring_context" className="block text-sm font-medium text-gray-700 mb-2">
                Contexte
              </label>
              <textarea
                id="mentoring_context"
                name="mentoring_context"
                rows={3}
                value={formData.mentoring_context}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="mentoring_advice" className="block text-sm font-medium text-gray-700 mb-2">
                Tes conseils
              </label>
              <textarea
                id="mentoring_advice"
                name="mentoring_advice"
                rows={5}
                value={formData.mentoring_advice}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="mentoring_mistakes" className="block text-sm font-medium text-gray-700 mb-2">
                Les erreurs à éviter
              </label>
              <textarea
                id="mentoring_mistakes"
                name="mentoring_mistakes"
                rows={3}
                value={formData.mentoring_mistakes}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Questions spécifiques : Projet */}
      {formData.type === 'project' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🎯 Votre projet</h2>
          <div className="space-y-6">
            <div>
              <label htmlFor="project_name" className="block text-sm font-medium text-gray-700 mb-2">
                Nom du projet
              </label>
              <input
                type="text"
                id="project_name"
                name="project_name"
                value={formData.project_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="project_description" className="block text-sm font-medium text-gray-700 mb-2">
                Description du projet
              </label>
              <textarea
                id="project_description"
                name="project_description"
                rows={4}
                value={formData.project_description}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="project_role" className="block text-sm font-medium text-gray-700 mb-2">
                Ton rôle
              </label>
              <textarea
                id="project_role"
                name="project_role"
                rows={2}
                value={formData.project_role}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="project_challenges" className="block text-sm font-medium text-gray-700 mb-2">
                Les défis (techniques/humains)
              </label>
              <textarea
                id="project_challenges"
                name="project_challenges"
                rows={3}
                value={formData.project_challenges}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="project_outcome" className="block text-sm font-medium text-gray-700 mb-2">
                Le résultat
              </label>
              <textarea
                id="project_outcome"
                name="project_outcome"
                rows={3}
                value={formData.project_outcome}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="project_learnings" className="block text-sm font-medium text-gray-700 mb-2">
                Ce que tu en retiens
              </label>
              <textarea
                id="project_learnings"
                name="project_learnings"
                rows={3}
                value={formData.project_learnings}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex justify-end gap-4 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSubmitting && (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {isSubmitting ? 'Publication...' : 'Publier le témoignage'}
        </button>
      </div>
    </form>
  )
}
