import { groq } from 'next-sanity'

// Récupérer tous les articles
export const postsQuery = groq`*[_type == "post"] | order(publishedAt desc) {
  _id,
  title,
  slug,
  publishedAt,
  excerpt,
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
  phone,
  promotionYear,
  currentJob,
  company,
  linkedIn,
  bio,
  profileImage {
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
  phone,
  promotionYear,
  currentStudies,
  currentJob,
  company,
  linkedIn,
  bio,
  profileImage {
    asset->{
      _id,
      url
    }
  }
}`  