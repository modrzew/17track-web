import { useState, useEffect } from 'react';
import { useCarriers } from '@/hooks/useCarriers';
import { useCarrierParams } from '@/hooks/useCarrierParams';
import type { Carrier, AdditionalParamValues } from '@/lib/types';
import { XIcon, SearchIcon, SpinnerIcon } from './icons';

interface AddPackageDialogProps {
  onClose: () => void;
  onAdd: (
    trackingNumber: string,
    carrierCode: number,
    title?: string,
    additionalParams?: AdditionalParamValues
  ) => Promise<void>;
}

export function AddPackageDialog({ onClose, onAdd }: AddPackageDialogProps) {
  const { popularCarriers, searchCarriers } = useCarriers();
  const { getParamsForCarrier, hasRequiredParams } = useCarrierParams();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [title, setTitle] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
  const [carrierSearch, setCarrierSearch] = useState('');
  const [showCarrierSearch, setShowCarrierSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [additionalParams, setAdditionalParams] = useState<AdditionalParamValues>({});

  const searchResults = carrierSearch ? searchCarriers(carrierSearch).slice(0, 20) : [];

  // Get additional parameters for the selected carrier
  const carrierParams = selectedCarrier ? getParamsForCarrier(selectedCarrier.key) : [];

  // Reset additional params when carrier changes
  useEffect(() => {
    setAdditionalParams({});
  }, [selectedCarrier?.key]);

  // Check if all required fields are filled
  const requiredParamsFilled = carrierParams
    .filter(p => p.require)
    .every(p => additionalParams[p.paramKey]?.trim());

  const canSubmit =
    trackingNumber.trim() &&
    selectedCarrier &&
    (!hasRequiredParams(selectedCarrier.key) || requiredParamsFilled);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim() || !selectedCarrier) return;

    setLoading(true);
    setError(null);

    try {
      // Only pass non-empty additional params
      const filledParams: AdditionalParamValues = {};
      Object.entries(additionalParams).forEach(([key, value]) => {
        if (value.trim()) {
          filledParams[key] = value.trim();
        }
      });

      await onAdd(
        trackingNumber.trim(),
        selectedCarrier.key,
        title.trim() || undefined,
        Object.keys(filledParams).length > 0 ? filledParams : undefined
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add package');
      setLoading(false);
    }
  };

  const handleParamChange = (paramKey: string, value: string) => {
    setAdditionalParams(prev => ({
      ...prev,
      [paramKey]: value,
    }));
  };

  // Format param key to human-readable label
  const formatParamLabel = (paramKey: string, description: string): string => {
    // Use description if it's meaningful, otherwise format the key
    if (description && description !== paramKey && !description.includes('_')) {
      return description.charAt(0).toUpperCase() + description.slice(1);
    }
    // Convert snake_case to Title Case
    return paramKey
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Package</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Tracking Number */}
            <div>
              <label
                htmlFor="tracking-number"
                className="block text-sm font-medium text-gray-900 mb-1"
              >
                Tracking Number
              </label>
              <input
                id="tracking-number"
                type="text"
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Enter tracking number"
                required
              />
            </div>

            {/* Title (optional) */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-900 mb-1">
                Title (optional)
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="e.g., New shoes, Birthday gift"
              />
            </div>

            {/* Carrier Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Carrier</label>
              {selectedCarrier ? (
                <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedCarrier._name}</p>
                    <p className="text-xs text-gray-500">{selectedCarrier._country_iso}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCarrier(null)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Change
                  </button>
                </div>
              ) : showCarrierSearch ? (
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={carrierSearch}
                      onChange={e => setCarrierSearch(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder="Search carriers..."
                      autoFocus
                    />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  {searchResults.length > 0 && (
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                      {searchResults.map(carrier => (
                        <button
                          key={carrier.key}
                          type="button"
                          onClick={() => {
                            setSelectedCarrier(carrier);
                            setShowCarrierSearch(false);
                            setCarrierSearch('');
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <p className="text-sm font-medium text-gray-900">{carrier._name}</p>
                          <p className="text-xs text-gray-500">{carrier._country_iso}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowCarrierSearch(false)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Show popular carriers
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 mb-2">Popular carriers:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {popularCarriers.map(carrier => (
                      <button
                        key={carrier.key}
                        type="button"
                        onClick={() => setSelectedCarrier(carrier)}
                        className="text-left px-3 py-2 border border-gray-200 rounded-lg hover:border-gray-900 hover:bg-gray-50"
                      >
                        <p className="text-sm font-medium text-gray-900">{carrier._name}</p>
                        <p className="text-xs text-gray-500">{carrier._country_iso}</p>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCarrierSearch(true)}
                    className="w-full mt-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:border-gray-900 hover:bg-gray-50"
                  >
                    Search all carriers
                  </button>
                </div>
              )}
            </div>

            {/* Additional Parameters */}
            {selectedCarrier && carrierParams.length > 0 && (
              <div className="space-y-4 pt-2 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700">
                  Additional fields for {selectedCarrier._name}
                </p>
                {carrierParams.map(param => (
                  <div key={param.paramKey}>
                    <label
                      htmlFor={`param-${param.paramKey}`}
                      className="block text-sm font-medium text-gray-900 mb-1"
                    >
                      {formatParamLabel(param.paramKey, param.description)}
                      {param.require && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {param.options ? (
                      <select
                        id={`param-${param.paramKey}`}
                        value={additionalParams[param.paramKey] || ''}
                        onChange={e => handleParamChange(param.paramKey, e.target.value)}
                        className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                        required={param.require}
                      >
                        <option value="">Select an option</option>
                        {Object.entries(param.options).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={`param-${param.paramKey}`}
                        type="text"
                        value={additionalParams[param.paramKey] || ''}
                        onChange={e => handleParamChange(param.paramKey, e.target.value)}
                        className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                        placeholder={param.sample ? `e.g., ${param.sample}` : ''}
                        required={param.require}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <SpinnerIcon className="w-4 h-4 animate-spin" />}
            {loading ? 'Adding...' : 'Add Package'}
          </button>
        </div>
      </div>
    </div>
  );
}
