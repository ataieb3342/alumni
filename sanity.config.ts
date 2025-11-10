import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schema } from './sanity/schemaTypes'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!

export default defineConfig({
  name: 'default',
  title: 'Mon Site',

  projectId,
  dataset,

  plugins: [
    structureTool(),
    visionTool(),
  ],

  basePath: '/studio',

  schema: {
    types: schema.types,
  },

  cors: {
    allowOrigins: [
      'http://localhost:3000',
      'https://alumni-gjvf5z012-ataieb3342s-projects.vercel.app',
      // Ajoutez votre domaine de production ici
    ],
  },
})