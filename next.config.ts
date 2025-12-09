import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'vh-besancon-alumni.fr',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

// Configuration Sentry
const sentryOptions = {
  // Pour plus d'options : https://github.com/getsentry/sentry-webpack-plugin#options
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Seul le code déployé en production aura les source maps uploadées
  silent: !process.env.CI,

  // Upload des source maps
  widenClientFileUpload: true,

  // Route les logs Sentry via un tunnel pour éviter les ad-blockers
  tunnelRoute: "/monitoring",

  // Cache les source maps des dossiers de build
  hideSourceMaps: true,

  // Désactiver automatiquement l'upload des source maps en dev
  disableLogger: true,

  // Génération automatique des release
  automaticVercelMonitors: true,
};

export default withSentryConfig(nextConfig, sentryOptions);
