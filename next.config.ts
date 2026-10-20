import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  // Pilotes de base de données et traitement d'images : chargés depuis node_modules, pas empaquetés
  serverExternalPackages: ["@electric-sql/pglite", "postgres", "sharp"],
  images: {
    remotePatterns: [
      // Images téléversées (Vercel Blob, magasin public)
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com", pathname: "/**" },
    ],
  },
};

// Configuration Sentry
const sentryOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Seul le code déployé en production aura les source maps uploadées
  silent: !process.env.CI,
  widenClientFileUpload: true,
  // Route les logs Sentry via un tunnel pour éviter les ad-blockers
  tunnelRoute: "/monitoring",
};

export default withSentryConfig(nextConfig, sentryOptions);
