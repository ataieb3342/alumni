import { groq } from 'next-sanity'

// Récupérer tous les articles (filtre selon visibilité)
export const postsQuery = groq`*[_type == "post"] | order(publishedAt desc) {
  _id,
  title,
  slug,
  publishedAt,
  excerpt,
  visibility,
  mainImage {
    asset->{
      _id,
      url
    },
    alt
  }
}`

// Récupérer tous les articles publics
export const publicPostsQuery = groq`*[_type == "post" && visibility == "public"] | order(publishedAt desc) {
  _id,
  title,
  slug,
  publishedAt,
  excerpt,
  visibility,
  mainImage {
    asset->{
      _id,
      url
    },
    alt
  }
}`

// Récupérer les 6 derniers articles pour la page d'accueil
export const recentPostsQuery = groq`*[_type == "post"] | order(publishedAt desc) [0...6] {
  _id,
  title,
  slug,
  publishedAt,
  excerpt,
  visibility,
  mainImage {
    asset->{
      _id,
      url
    },
    alt
  }
}`

// Récupérer un article par son slug
export const postQuery = groq`*[_type == "post" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  publishedAt,
  excerpt,
  visibility,
  mainImage {
    asset->{
      _id,
      url
    },
    alt
  },
  body
}`

// Récupérer tous les utilisateurs visibles dans l'annuaire
// Les lycéens sont exclus car ils ont un profil restreint (nom, prénom, email uniquement)
export const directoryUsersQuery = groq`*[
  _type == "user" &&
  isVisibleInDirectory == true &&
  (userType == "alumni" || userType == "bts" || userType == "prepa" || userType == "staff")
] | order(lastName asc) {
  _id,
  firstName,
  lastName,
  email,
  userType,
  promotionYear,
  linkedIn,
  bio,
  description,
  education,
  experience,
  roleAssociation,
  personnelMetier,
  profileImage {
    asset->{
      _id,
      url
    }
  },
  coverImage {
    asset->{
      _id,
      url
    }
  }
}`

// Récupérer un utilisateur par son ID
export const userByIdQuery = groq`*[_type == "user" && _id == $userId][0] {
  _id,
  firstName,
  lastName,
  email,
  userType,
  promotionYear,
  currentStudies,
  linkedIn,
  bio,
  description,
  education,
  experience,
  roleAssociation,
  personnelMetier,
  profileImage {
    asset->{
      _id,
      url
    }
  },
  coverImage {
    asset->{
      _id,
      url
    }
  }
}`

// ========================================
// QUERIES POUR LES ANNONCES
// ========================================

// Récupérer toutes les annonces publiées et non expirées
export const announcementsQuery = groq`*[
  _type == "announcement" &&
  status == "published" &&
  (expiresAt == null || expiresAt > now())
] | order(publishedAt desc) {
  _id,
  title,
  slug,
  type,
  company,
  location,
  description,
  contactEmail,
  contactPhone,
  externalLink,
  publishedAt,
  expiresAt,
  author->{
    _id,
    firstName,
    lastName,
    userType,
    profileImage {
      asset->{
        _id,
        url
      }
    }
  }
}`

// Récupérer les 6 dernières annonces pour la page d'accueil
export const recentAnnouncementsQuery = groq`*[
  _type == "announcement" &&
  status == "published" &&
  (expiresAt == null || expiresAt > now())
] | order(publishedAt desc) [0...6] {
  _id,
  title,
  slug,
  type,
  company,
  location,
  description,
  contactEmail,
  externalLink,
  publishedAt,
  expiresAt,
  author->{
    _id,
    firstName,
    lastName,
    userType,
    profileImage {
      asset->{
        _id,
        url
      }
    }
  }
}`

// Récupérer une annonce par son slug
export const announcementQuery = groq`*[_type == "announcement" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  type,
  company,
  location,
  description,
  contactEmail,
  contactPhone,
  externalLink,
  publishedAt,
  expiresAt,
  status,
  author->{
    _id,
    firstName,
    lastName,
    email,
    phone,
    userType,
    linkedIn,
    experience,
    profileImage {
      asset->{
        _id,
        url
      }
    }
  }
}`

// Récupérer les annonces par type
export const announcementsByTypeQuery = groq`*[
  _type == "announcement" &&
  status == "published" &&
  type == $type &&
  (expiresAt == null || expiresAt > now())
] | order(publishedAt desc) {
  _id,
  title,
  slug,
  type,
  company,
  location,
  description,
  contactEmail,
  externalLink,
  publishedAt,
  author->{
    _id,
    firstName,
    lastName
  }
}`

// Récupérer les annonces d'un utilisateur
export const userAnnouncementsQuery = groq`*[
  _type == "announcement" &&
  author._ref == $userId
] | order(publishedAt desc) {
  _id,
  title,
  slug,
  type,
  company,
  location,
  status,
  publishedAt,
  expiresAt
}`

// ========================================
// QUERIES POUR LES NEWSLETTERS
// ========================================

// Récupérer l'abonnement newsletter d'un utilisateur
export const newsletterSubscriptionQuery = groq`*[
  _type == "newsletterSubscription" &&
  user._ref == $userId
][0] {
  _id,
  generalNewsletter,
  announcementsNewsletter,
  subscribedAt,
  updatedAt,
  user->{
    _id,
    email,
    firstName,
    lastName
  }
}`

// Récupérer tous les utilisateurs abonnés à la newsletter générale
export const generalNewsletterSubscribersQuery = groq`*[
  _type == "newsletterSubscription" &&
  generalNewsletter == true
] {
  _id,
  user->{
    _id,
    email,
    firstName,
    lastName
  }
}`

// Récupérer tous les utilisateurs abonnés aux notifications d'annonces
export const announcementsNewsletterSubscribersQuery = groq`*[
  _type == "newsletterSubscription" &&
  announcementsNewsletter == true
] {
  _id,
  user->{
    _id,
    email,
    firstName,
    lastName
  }
}`

// ========================================
// QUERIES POUR LES TÉMOIGNAGES
// ========================================

// Récupérer tous les témoignages publiés
export const testimonialsQuery = groq`*[
  _type == "testimonial" &&
  status == "published"
] | order(publishedAt desc) {
  _id,
  title,
  slug,
  type,
  excerpt,
  rating,
  likes,
  tags,
  publishedAt,
  featuredImage {
    asset->{
      _id,
      url
    }
  },
  author->{
    _id,
    firstName,
    lastName,
    userType,
    promotionYear,
    profileImage {
      asset->{
        _id,
        url
      }
    }
  }
}`

// Récupérer les témoignages les plus populaires pour la page d'accueil
export const popularTestimonialsQuery = groq`*[
  _type == "testimonial" &&
  status == "published"
] | order(likes desc, publishedAt desc) [0...6] {
  _id,
  title,
  slug,
  type,
  excerpt,
  rating,
  likes,
  tags,
  publishedAt,
  featuredImage {
    asset->{
      _id,
      url
    }
  },
  author->{
    _id,
    firstName,
    lastName,
    userType,
    promotionYear,
    profileImage {
      asset->{
        _id,
        url
      }
    }
  }
}`

// Récupérer un témoignage par son slug avec tous les détails
export const testimonialQuery = groq`*[_type == "testimonial" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  type,
  excerpt,
  rating,
  likes,
  tags,
  publishedAt,
  createdAt,
  featuredImage {
    asset->{
      _id,
      url
    }
  },
  author->{
    _id,
    firstName,
    lastName,
    email,
    userType,
    promotionYear,
    bio,
    linkedIn,
    profileImage {
      asset->{
        _id,
        url
      }
    }
  },

  // Champs spécifiques études
  studies_school,
  studies_program,
  studies_year,
  studies_why,
  studies_strengths,
  studies_challenges,
  studies_advice,

  // Champs spécifiques entreprise
  company_name,
  company_position,
  company_duration,
  company_context,
  company_missions,
  company_learnings,
  company_how,

  // Champs spécifiques parcours
  career_journey,
  career_transition,
  career_turning_point,
  career_advice,

  // Champs spécifiques international
  international_location,
  international_duration,
  international_why,
  international_daily_life,
  international_best_memory,
  international_challenges,

  // Champs spécifiques mentorat
  mentoring_topic,
  mentoring_context,
  mentoring_advice,
  mentoring_mistakes,

  // Champs spécifiques projet
  project_name,
  project_description,
  project_role,
  project_challenges,
  project_outcome,
  project_learnings
}`

// Récupérer les témoignages par type
export const testimonialsByTypeQuery = groq`*[
  _type == "testimonial" &&
  status == "published" &&
  type == $type
] | order(publishedAt desc) {
  _id,
  title,
  slug,
  type,
  excerpt,
  rating,
  likes,
  publishedAt,
  author->{
    _id,
    firstName,
    lastName,
    profileImage {
      asset->{
        _id,
        url
      }
    }
  }
}`

// Récupérer les témoignages d'un utilisateur
export const userTestimonialsQuery = groq`*[
  _type == "testimonial" &&
  author._ref == $userId
] | order(publishedAt desc) {
  _id,
  title,
  slug,
  type,
  status,
  rating,
  likes,
  publishedAt,
  createdAt
}`

// Récupérer les témoignages publiés d'un utilisateur pour affichage public
export const userPublishedTestimonialsQuery = groq`*[
  _type == "testimonial" &&
  author._ref == $userId &&
  status == "published"
] | order(publishedAt desc) {
  _id,
  title,
  slug,
  type,
  excerpt,
  rating,
  likes,
  tags,
  publishedAt,
  featuredImage {
    asset->{
      _id,
      url
    }
  },
  author->{
    _id,
    firstName,
    lastName,
    userType,
    promotionYear,
    profileImage {
      asset->{
        _id,
        url
      }
    }
  }
}`

// ========================================
// QUERIES POUR LES NOUVEAUX MEMBRES
// ========================================

// Récupérer les derniers inscrits avec un profil "présentable" pour la page d'accueil
// Un profil est considéré comme présentable s'il a au moins :
// - Une photo de profil OU
// - Une expérience professionnelle OU
// - Une formation OU
// - Une bio
export const recentMembersQuery = groq`*[
  _type == "user" &&
  isVisibleInDirectory == true &&
  (userType == "alumni" || userType == "bts" || userType == "prepa" || userType == "staff") &&
  (
    defined(profileImage.asset) ||
    count(experience) > 0 ||
    count(education) > 0 ||
    defined(bio)
  )
] | order(_createdAt desc) [0...6] {
  _id,
  firstName,
  lastName,
  email,
  userType,
  promotionYear,
  linkedIn,
  bio,
  experience,
  education,
  profileImage {
    asset->{
      _id,
      url
    }
  },
  coverImage {
    asset->{
      _id,
      url
    }
  },
  _createdAt
}`