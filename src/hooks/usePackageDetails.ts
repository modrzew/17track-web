'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PackageDetails } from '@/lib/types';
import { track17Api, Track17Api, Track17ApiError } from '@/lib/api/track17';
import { packageStorage } from '@/lib/cache/storage';
import { isCacheFresh } from '@/lib/cache/ttl';

export function usePackageDetails(trackingNumber: string | null) {
  const [details, setDetails] = useState<PackageDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let isActive = true; // Track if this effect is still active

    const loadDetails = async (showLoader = true, forceRefresh = false) => {
      if (!trackingNumber) {
        setDetails(null);
        setLoading(false);
        return;
      }

      const currentTrackingNumber = trackingNumber;

      try {
        if (showLoader) setLoading(true);
        setError(null);

        // 1. Load from cache immediately
        const cached = await packageStorage.getPackageDetails(currentTrackingNumber);

        // Check if effect is still active and tracking number hasn't changed
        if (!isActive) return;

        if (cached) {
          setDetails(cached);
          if (showLoader) setLoading(false);
        }

        // 2. Check if cache is fresh (< 30 minutes old)
        const cacheFresh = isCacheFresh(cached?.lastFetchedAt);

        // 3. Only fetch from API if cache is stale or force refresh
        if (!cacheFresh || forceRefresh || !cached) {
          try {
            const response = await track17Api.getTrackInfo([currentTrackingNumber]);

            // Check if effect is still active
            if (!isActive) return;

            if (response.accepted.length > 0) {
              const trackInfo = response.accepted[0];
              const freshDetails = Track17Api.convertToPackageDetails(trackInfo);

              // Preserve user-defined fields from cache
              if (cached) {
                freshDetails.title = cached.title;
                freshDetails.createdAt = cached.createdAt;
              }

              // Save to cache
              await packageStorage.savePackageDetails(freshDetails);
              setDetails(freshDetails);
            } else if (response.rejected.length > 0) {
              const rejected = response.rejected[0];
              throw new Error(rejected.error.message);
            }
          } catch (apiError) {
            // Check if effect is still active
            if (!isActive) return;

            // If we have cached data, continue using it
            if (cached) {
              console.warn('API fetch failed, using cached data:', apiError);
            } else {
              throw apiError;
            }
          }
        }
      } catch (err) {
        // Check if effect is still active
        if (!isActive) return;

        const errorMessage =
          err instanceof Track17ApiError
            ? `API Error (${err.code}): ${err.message}`
            : err instanceof Error
              ? err.message
              : 'Failed to load package details';
        setError(errorMessage);
      } finally {
        if (isActive) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    loadDetails();

    // Cleanup function to mark effect as inactive
    return () => {
      isActive = false;
    };
  }, [trackingNumber]);

  const refresh = useCallback(async () => {
    if (!trackingNumber) return;

    setRefreshing(true);
    const currentTrackingNumber = trackingNumber;

    try {
      const response = await track17Api.getTrackInfo([currentTrackingNumber]);

      // Only update if still viewing the same package
      if (trackingNumber !== currentTrackingNumber) return;

      if (response.accepted.length > 0) {
        const trackInfo = response.accepted[0];
        const freshDetails = Track17Api.convertToPackageDetails(trackInfo);

        // Get cached version for user fields
        const cached = await packageStorage.getPackageDetails(currentTrackingNumber);
        if (cached) {
          freshDetails.title = cached.title;
          freshDetails.createdAt = cached.createdAt;
        }

        await packageStorage.savePackageDetails(freshDetails);
        setDetails(freshDetails);
      }
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      if (trackingNumber === currentTrackingNumber) {
        setRefreshing(false);
      }
    }
  }, [trackingNumber]);

  const updateTitle = useCallback((title: string) => {
    setDetails(prev => {
      if (!prev) return prev;
      return { ...prev, title };
    });
  }, []);

  const updateCarrier = useCallback((carrierCode: number) => {
    setDetails(prev => {
      if (!prev) return prev;
      return { ...prev, carrierCode };
    });
  }, []);

  return {
    details,
    loading,
    error,
    refreshing,
    refresh,
    updateTitle,
    updateCarrier,
  };
}
