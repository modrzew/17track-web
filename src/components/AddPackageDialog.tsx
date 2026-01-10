import { useState, useEffect } from 'react';
import { useCarriers } from '@/hooks/useCarriers';
import type { Carrier, TrackingCustomFields } from '@/lib/types';
import { getCarrierCustomFields, type CustomFieldDefinition } from '@/lib/carrierFields';
import { XIcon, SearchIcon, SpinnerIcon } from './icons';

// Convert YYYYMMDD to YYYY-MM-DD for date input
function formatDateForInput(dateStr: string): string {
  if (dateStr.length !== 8) return '';
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}

interface AddPackageDialogProps {
  onClose: () => void;
  onAdd: (
    trackingNumber: string,
    carrierCode: number,
    title?: string,
    customFields?: TrackingCustomFields
  ) => Promise<void>;
}

export function AddPackageDialog({ onClose, onAdd }: AddPackageDialogProps) {
  const { popularCarriers, searchCarriers } = useCarriers();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [title, setTitle] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
  const [carrierSearch, setCarrierSearch] = useState('');
  const [showCarrierSearch, setShowCarrierSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customFieldValues, setCustomFieldValues] = useState<TrackingCustomFields>({});
  const [carrierFields, setCarrierFields] = useState<CustomFieldDefinition[]>([]);

  const searchResults = carrierSearch ? searchCarriers(carrierSearch).slice(0, 20) : [];

  // Update carrier fields when carrier is selected
  useEffect(() => {
    if (selectedCarrier) {
      const fields = getCarrierCustomFields(selectedCarrier.key);
      setCarrierFields(fields);
      // Reset custom field values when carrier changes
      setCustomFieldValues({});
    } else {
      setCarrierFields([]);
      setCustomFieldValues({});
    }
  }, [selectedCarrier]);

  const handleCustomFieldChange = (fieldName: string, value: string) => {
    setCustomFieldValues(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const areRequiredFieldsFilled = () => {
    return carrierFields
      .filter(field => field.required)
      .every(field => {
        const value = customFieldValues[field.name as keyof TrackingCustomFields];
        return value && value.trim() !== '';
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim() || !selectedCarrier) return;
    if (!areRequiredFieldsFilled()) return;

    setLoading(true);
    setError(null);

    try {
      // Only pass custom fields if there are values
      const hasCustomFields = Object.keys(customFieldValues).length > 0;
      await onAdd(
        trackingNumber.trim(),
        selectedCarrier.key,
        title.trim() || undefined,
        hasCustomFields ? customFieldValues : undefined
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add package');
      setLoading(false);
    }
  };

  const canSubmit =
    trackingNumber.trim() && selectedCarrier && areRequiredFieldsFilled() && !loading;

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

            {/* Custom Fields for selected carrier */}
            {carrierFields.length > 0 && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-700">
                  Additional information required for {selectedCarrier?._name}
                </p>
                {carrierFields.map(field => (
                  <div key={field.name}>
                    <label
                      htmlFor={field.name}
                      className="block text-sm font-medium text-gray-900 mb-1"
                    >
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.type === 'date' ? (
                      <input
                        id={field.name}
                        type="date"
                        value={
                          customFieldValues[field.name as keyof TrackingCustomFields]
                            ? formatDateForInput(
                                customFieldValues[field.name as keyof TrackingCustomFields]!
                              )
                            : ''
                        }
                        onChange={e => {
                          // Convert from YYYY-MM-DD to YYYYMMDD
                          const value = e.target.value.replace(/-/g, '');
                          handleCustomFieldChange(field.name, value);
                        }}
                        className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                        required={field.required}
                      />
                    ) : (
                      <input
                        id={field.name}
                        type="text"
                        value={customFieldValues[field.name as keyof TrackingCustomFields] || ''}
                        onChange={e => handleCustomFieldChange(field.name, e.target.value)}
                        className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    )}
                    {field.helpText && (
                      <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
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
            disabled={!canSubmit}
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
