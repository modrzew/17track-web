import { useMemo } from 'react';
import additionalParamsData from '@/lib/additional-params.json';
import type { CarrierAdditionalParams, CarrierParam } from '@/lib/types';

export function useCarrierParams() {
  const paramsData = useMemo(() => additionalParamsData as CarrierAdditionalParams[], []);

  // Map of carrier key to their additional parameters
  const paramsMap = useMemo(() => {
    const map = new Map<number, CarrierParam[]>();
    paramsData.forEach(carrier => {
      if (carrier.parameters && carrier.parameters.length > 0) {
        map.set(carrier.key, carrier.parameters);
      }
    });
    return map;
  }, [paramsData]);

  // Get parameters for a specific carrier
  const getParamsForCarrier = useMemo(() => {
    return (carrierKey: number): CarrierParam[] => {
      return paramsMap.get(carrierKey) || [];
    };
  }, [paramsMap]);

  // Check if a carrier has required parameters
  const hasRequiredParams = useMemo(() => {
    return (carrierKey: number): boolean => {
      const params = paramsMap.get(carrierKey);
      if (!params) return false;
      return params.some(p => p.require);
    };
  }, [paramsMap]);

  // Check if a carrier has any additional parameters
  const hasParams = useMemo(() => {
    return (carrierKey: number): boolean => {
      return paramsMap.has(carrierKey);
    };
  }, [paramsMap]);

  return {
    getParamsForCarrier,
    hasRequiredParams,
    hasParams,
  };
}
