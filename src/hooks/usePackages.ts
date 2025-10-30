'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Package } from '@/lib/types';
import { track17Api, Track17Api, Track17ApiError } from '@/lib/api/track17';
import { packageStorage } from '@/lib/cache/storage';
import { hasAnyCacheFresh } from '@/lib/cache/ttl';

export function usePackages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadPackages = useCallback(async (showLoader = true, forceRefresh = false) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);

      // 1. Load from cache immediately
      const cachedPackages = await packageStorage.getPackages();
      if (cachedPackages.length > 0) {
        setPackages(sortPackages(cachedPackages));
        if (showLoader) setLoading(false);
      }

      // 2. Check if cache is fresh (< 30 minutes old)
      const cacheFresh = hasAnyCacheFresh(cachedPackages);

      // 3. Only fetch from API if cache is stale or force refresh
      if (!cacheFresh || forceRefresh || cachedPackages.length === 0) {
        try {
          const response = await track17Api.getTrackList({
            page: 1,
            page_size: 40,
          });

          if (response.accepted && response.accepted.length > 0) {
            // Convert API response to Package objects
            const freshPackages: Package[] = response.accepted.map(item => {
              const pkg = Track17Api.convertTrackListItemToPackage(item);
              // Try to preserve user-defined title and createdAt from cache
              const cached = cachedPackages.find(p => p.trackingNumber === pkg.trackingNumber);
              if (cached && !pkg.title) {
                pkg.title = cached.title;
              }
              return pkg;
            });

            // Save to cache
            await packageStorage.savePackages(freshPackages);
            setPackages(sortPackages(freshPackages));
          }
        } catch (apiError) {
          // If we have cached data, continue using it
          if (cachedPackages.length > 0) {
            console.warn('API fetch failed, using cached data:', apiError);
          } else {
            throw apiError;
          }
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Track17ApiError
          ? `API Error (${err.code}): ${err.message}`
          : err instanceof Error
            ? err.message
            : 'Failed to load packages';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadPackages(false, true); // Force refresh
  }, [loadPackages]);

  const addPackage = useCallback(
    async (trackingNumber: string, carrierCode: number, title?: string) => {
      try {
        setError(null);

        // Register with API
        const response = await track17Api.registerTracking({
          number: trackingNumber,
          carrier: carrierCode,
          tag: title,
        });

        if (response.rejected.length > 0) {
          const rejected = response.rejected[0];
          throw new Error(rejected.error.message);
        }

        // Fetch fresh data to update the list (force refresh)
        await loadPackages(false, true);
      } catch (err) {
        const errorMessage =
          err instanceof Track17ApiError
            ? `Failed to add package: ${err.message}`
            : err instanceof Error
              ? err.message
              : 'Failed to add package';
        setError(errorMessage);
        throw err;
      }
    },
    [loadPackages]
  );

  const deletePackage = useCallback(async (trackingNumber: string) => {
    try {
      setError(null);

      // Delete from API
      await track17Api.deleteTracking([trackingNumber]);

      // Delete from cache
      await packageStorage.deletePackage(trackingNumber);

      // Update local state
      setPackages(prev => prev.filter(p => p.trackingNumber !== trackingNumber));
    } catch (err) {
      const errorMessage =
        err instanceof Track17ApiError
          ? `Failed to delete package: ${err.message}`
          : err instanceof Error
            ? err.message
            : 'Failed to delete package';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updatePackageTitle = useCallback(async (trackingNumber: string, title: string) => {
    try {
      setError(null);

      // Get the current package to get carrier code
      const currentPackage = await packageStorage.getPackage(trackingNumber);
      if (!currentPackage) {
        throw new Error('Package not found');
      }

      // Update on 17Track API
      await track17Api.changePackageInfo(trackingNumber, currentPackage.carrierCode, {
        tag: title,
      });

      // Update in both caches (list and details)
      await packageStorage.updatePackage(trackingNumber, { title });

      // Also update package details if it exists
      try {
        await packageStorage.updatePackageDetails(trackingNumber, { title });
      } catch (detailsErr) {
        // Details might not exist yet, that's okay
        console.debug('Package details not yet cached:', detailsErr);
      }

      // Update local state
      setPackages(prev =>
        prev.map(p => (p.trackingNumber === trackingNumber ? { ...p, title } : p))
      );
    } catch (err) {
      const errorMessage =
        err instanceof Track17ApiError
          ? `Failed to update package: ${err.message}`
          : err instanceof Error
            ? err.message
            : 'Failed to update package';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updatePackageCarrier = useCallback(async (trackingNumber: string, carrierCode: number) => {
    try {
      setError(null);

      // Update on 17Track API
      await track17Api.changeCarrier(trackingNumber, carrierCode);

      // Update in both caches (list and details)
      await packageStorage.updatePackage(trackingNumber, { carrierCode });

      // Also update package details if it exists
      try {
        await packageStorage.updatePackageDetails(trackingNumber, { carrierCode });
      } catch (detailsErr) {
        // Details might not exist yet, that's okay
        console.debug('Package details not yet cached:', detailsErr);
      }

      // Update local state
      setPackages(prev =>
        prev.map(p => (p.trackingNumber === trackingNumber ? { ...p, carrierCode } : p))
      );
    } catch (err) {
      const errorMessage =
        err instanceof Track17ApiError
          ? `Failed to update carrier: ${err.message}`
          : err instanceof Error
            ? err.message
            : 'Failed to update carrier';
      setError(errorMessage);
      throw err;
    }
  }, []);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  return {
    packages,
    loading,
    error,
    refreshing,
    refresh,
    addPackage,
    deletePackage,
    updatePackageTitle,
    updatePackageCarrier,
  };
}

// Helper function to sort packages by createdAt (most recent first)
function sortPackages(packages: Package[]): Package[] {
  return [...packages].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
