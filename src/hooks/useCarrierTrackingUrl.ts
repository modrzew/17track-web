'use client';

import { useMemo, useCallback } from 'react';
import carrierTrackingUrls from '@/lib/carrier-tracking-urls.json';

type CarrierTrackingUrls = Record<string, string>;

export function useCarrierTrackingUrl() {
  const trackingUrls = useMemo(() => carrierTrackingUrls as CarrierTrackingUrls, []);

  const getTrackingUrl = useCallback(
    (carrierCode: number, trackingNumber: string): string | null => {
      const template = trackingUrls[String(carrierCode)];
      if (!template) {
        return null;
      }
      return template.replace('{trackingNumber}', encodeURIComponent(trackingNumber));
    },
    [trackingUrls]
  );

  const hasTrackingUrl = useCallback(
    (carrierCode: number): boolean => {
      return String(carrierCode) in trackingUrls;
    },
    [trackingUrls]
  );

  return {
    getTrackingUrl,
    hasTrackingUrl,
  };
}
