/**
 * Utilitaire pour extraire les informations les plus récentes d'un utilisateur
 * (expérience professionnelle ou formation)
 */

interface Experience {
  company: string
  position: string
  location?: string
  startDate: string
  endDate?: string
  current?: boolean
  description?: string
}

interface Education {
  school: string
  degree: string
  field?: string
  startYear: number
  endYear?: number
  description?: string
}

interface User {
  experience?: Experience[]
  education?: Education[]
}

interface MostRecentInfo {
  currentJob?: string
  company?: string
  currentCity?: string
  isEducation: boolean
}

/**
 * Extrait les informations les plus récentes d'un utilisateur
 * Priorité : expérience actuelle > formation/expérience la plus récente
 */
export function getMostRecentActivity(user: User): MostRecentInfo {
  // 1. D'abord, chercher une expérience actuelle
  const currentExperience = user.experience?.find((exp) => exp.current)

  if (currentExperience) {
    return {
      currentJob: currentExperience.position,
      company: currentExperience.company,
      currentCity: currentExperience.location,
      isEducation: false,
    }
  }

  // 2. Sinon, trouver la dernière formation et dernière expérience
  let latestEducation: Education | undefined
  let latestExperience: Experience | undefined

  // Trouver la formation la plus récente
  if (user.education && user.education.length > 0) {
    latestEducation = [...user.education].sort((a, b) => {
      const currentYear = new Date().getFullYear()
      const yearA = a.endYear || currentYear
      const yearB = b.endYear || currentYear

      if (yearA === yearB) {
        return (b.startYear || 0) - (a.startYear || 0)
      }
      return yearB - yearA
    })[0]
  }

  // Trouver l'expérience la plus récente
  if (user.experience && user.experience.length > 0) {
    latestExperience = [...user.experience].sort((a, b) => {
      const dateA = a.current ? new Date() : (a.endDate ? new Date(a.endDate) : new Date(a.startDate))
      const dateB = b.current ? new Date() : (b.endDate ? new Date(b.endDate) : new Date(b.startDate))
      return dateB.getTime() - dateA.getTime()
    })[0]
  }

  // 3. Comparer les deux et prendre la plus récente
  if (!latestEducation && !latestExperience) {
    return { isEducation: false }
  }

  if (!latestEducation && latestExperience) {
    return {
      currentJob: latestExperience.position,
      company: latestExperience.company,
      currentCity: latestExperience.location,
      isEducation: false,
    }
  }

  if (latestEducation && !latestExperience) {
    return {
      currentJob: latestEducation.degree,
      company: latestEducation.school,
      currentCity: latestEducation.field,
      isEducation: true,
    }
  }

  // Les deux existent, comparer les dates
  if (latestEducation && latestExperience) {
    const currentYear = new Date().getFullYear()
    const educationYear = latestEducation.endYear || currentYear
    const experienceDate = latestExperience.endDate
      ? new Date(latestExperience.endDate)
      : new Date(latestExperience.startDate)
    const experienceYear = experienceDate.getFullYear()

    // Si la formation est plus récente ou en cours
    if (educationYear >= experienceYear) {
      return {
        currentJob: latestEducation.degree,
        company: latestEducation.school,
        currentCity: latestEducation.field,
        isEducation: true,
      }
    } else {
      return {
        currentJob: latestExperience.position,
        company: latestExperience.company,
        currentCity: latestExperience.location,
        isEducation: false,
      }
    }
  }

  return { isEducation: false }
}
