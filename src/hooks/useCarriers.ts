'use client';

import { useMemo } from 'react';
import type { Carrier } from '@/lib/types';
import carriersData from '@/lib/carriers.json';

export function useCarriers() {
  const carriers = useMemo(() => carriersData as Carrier[], []);

  const getCarrierById = useMemo(() => {
    const carrierMap = new Map<number, Carrier>();
    carriers.forEach(carrier => {
      carrierMap.set(carrier.key, carrier);
    });
    return (id: number): Carrier | undefined => carrierMap.get(id);
  }, [carriers]);

  const searchCarriers = useMemo(() => {
    return (query: string): Carrier[] => {
      if (!query) return carriers;

      const lowerQuery = query.toLowerCase();
      return carriers.filter(carrier => {
        return (
          carrier._name.toLowerCase().includes(lowerQuery) ||
          carrier._country_iso.toLowerCase().includes(lowerQuery) ||
          carrier._name_zh_cn?.toLowerCase().includes(lowerQuery) ||
          carrier._name_zh_hk?.toLowerCase().includes(lowerQuery)
        );
      });
    };
  }, [carriers]);

  const getPopularCarriers = useMemo(() => {
    // Return a subset of commonly used carriers for quick selection
    const popularCarrierIds = [
      1151, // Australia Post
      3041, // Canada Post
      3011, // China Post
      7041, // DHL
      6051, // La Poste (France)
      7041, // Deutsche Post
      11031, // Royal Mail (UK)
      16071, // USPS
      19131, // Singapore Post
      10021, // Japan Post
    ];

    return popularCarrierIds
      .map(id => carriers.find(c => c.key === id))
      .filter((c): c is Carrier => c !== undefined);
  }, [carriers]);

  return {
    carriers,
    getCarrierById,
    searchCarriers,
    popularCarriers: getPopularCarriers,
  };
}
