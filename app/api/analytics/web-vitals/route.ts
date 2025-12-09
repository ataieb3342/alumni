/**
 * Endpoint pour recevoir les Web Vitals depuis le client
 * Optionnel - les métriques sont déjà envoyées à Sentry
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      name,
      value,
      rating,
      url,
      userAgent,
      timestamp,
    } = body;

    // Logger les Web Vitals
    logger.info(`Web Vital: ${name}`, {
      metric: name,
      value,
      rating,
      url,
      userAgent,
      timestamp,
    });

    // Vous pouvez ici envoyer vers une base de données ou un service d'analytics
    // Exemple : stockage dans Sanity, PostgreSQL, etc.

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to process web vitals', error as Error);
    return NextResponse.json(
      { error: 'Failed to process metrics' },
      { status: 500 }
    );
  }
}
