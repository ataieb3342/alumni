// Configuration tenant - Isoler toutes les données spécifiques à l'organisation
// Pour une future évolution SaaS, ce fichier sera remplacé par une config dynamique

export const tenant = {
  // Identité
  name: 'VH Besançon Alumni',
  shortName: 'VH Alumni',
  tagline: 'Réseau des anciens',
  description: 'Association des anciens élèves et personnels du Lycée Victor Hugo de Besançon',

  // Logo
  logo: {
    src: '/logo.png',
    alt: 'VH Besançon Alumni Logo',
  },

  // Contact
  email: 'contact@vh-besancon-alumni.fr',
  address: {
    name: 'Lycée Victor Hugo',
    street: '1 rue Rembrandt',
    city: 'Besançon',
    zip: '25000',
  },

  // Réseaux sociaux
  social: {
    linkedin: 'https://linkedin.com/company/vh-besancon-alumni/',
    instagram: 'https://www.instagram.com/vh_besancon_alumni/',
  },

  // HelloAsso (dons/adhésions)
  helloAsso: {
    baseUrl: 'https://www.helloasso.com/associations/vh-besancon-alumni',
  },

  // Logique métier spécifique
  staffDefaults: {
    company: 'Lycée Victor Hugo',
    city: 'Besançon',
  },

  // Développeur (footer)
  developer: {
    name: 'Adam Taieb',
    url: 'https://ataieb-dev.fr',
    email: 'contact@ataieb-dev.fr',
  },
} as const

export type TenantConfig = typeof tenant
