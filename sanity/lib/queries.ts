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
export const directoryUsersQuery = groq`*[
  _type == "user" &&
  isVisibleInDirectory == true &&
  (userType == "alumni" || userType == "staff")
] | order(lastName asc) {
  _id,
  firstName,
  lastName,
  email,
  userType,
  promotionYear,
  currentCity,
  currentJob,
  company,
  phone,
  linkedIn,
  website,
  github,
  twitter,
  facebook,
  instagram,
  bio,
  description,
  education,
  experience,
  roleAssociation,
  personnelMetier,
  anneesLvh,
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
  currentCity,
  currentStudies,
  currentJob,
  company,
  phone,
  linkedIn,
  website,
  github,
  twitter,
  facebook,
  instagram,
  bio,
  description,
  education,
  experience,
  roleAssociation,
  personnelMetier,
  anneesLvh,
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
    company,
    currentJob,
    linkedIn,
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