import { useMemo } from 'react';
import type { CarrierAdditionalParameters } from '@/lib/types';
import additionalParametersData from '@/lib/additional_parameters.json';

/**
 * Hook to access additional parameters required by specific carriers
 * @param carrierKey - The carrier key/ID to get parameters for
 * @returns Array of additional parameters required by the carrier, or undefined if none
 */
export function useAdditionalParameters(
  carrierKey: number | null
): CarrierAdditionalParameters | undefined {
  const carrierParams = useMemo(() => {
    if (carrierKey === null) return undefined;

    const params = (
      additionalParametersData as CarrierAdditionalParameters[]
    ).find((carrier) => carrier.key === carrierKey);

    return params;
  }, [carrierKey]);

  return carrierParams;
}

/**
 * Hook to check if a carrier requires additional parameters
 * @param carrierKey - The carrier key/ID to check
 * @returns true if the carrier has required parameters
 */
export function useHasRequiredParameters(
  carrierKey: number | null
): boolean {
  const params = useAdditionalParameters(carrierKey);
  return params?.parameters.some((p) => p.require) ?? false;
}
