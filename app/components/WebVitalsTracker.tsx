'use client';

/**
 * Composant pour tracker les Web Vitals
 * À inclure une seule fois au niveau du layout root
 */

import { useEffect } from 'react';
import { reportWebVitals } from '@/lib/web-vitals';

export default function WebVitalsTracker() {
  useEffect(() => {
    reportWebVitals();
  }, []);

  // Ce composant ne rend rien
  return null;
}
