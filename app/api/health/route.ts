/**
 * Health check endpoint
 * Vérifie l'état de santé de l'application et de ses dépendances
 */

import { NextResponse } from "next/server";
import { performHealthCheck } from "@/lib/monitoring";
import { createClient } from "@sanity/client";

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await performHealthCheck({
    // Check Sanity
    sanity: async () => {
      const client = createClient({
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
        dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
        apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION!,
        useCdn: false,
      });

      // Requête simple pour vérifier la connectivité
      await client.fetch('*[_type == "user"][0]');
    },

    // Check Database/Storage
    database: async () => {
      // Simuler un check DB si vous avez une base de données
      // Pour l'instant, on vérifie juste que l'env est configurée
      if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
        throw new Error('Sanity project ID not configured');
      }
    },

    // Check Email service
    email: async () => {
      if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
        throw new Error('Email service not configured');
      }
      // On ne teste pas l'envoi réel pour éviter de spammer
    },
  });

  // Retourner le status HTTP approprié
  const statusCode = result.status === 'healthy' ? 200 : result.status === 'degraded' ? 503 : 503;

  return NextResponse.json(result, { status: statusCode });
}
