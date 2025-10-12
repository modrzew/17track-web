import { useState } from 'react';
import type { PackageDetails as PackageDetailsType } from '@/lib/types';
import { useCarriers } from '@/hooks/useCarriers';
import { RefreshIcon, PencilIcon, ExclamationCircleIcon, SpinnerIcon, PackageIcon, CopyIcon } from './icons';

interface PackageDetailsProps {
  details: PackageDetailsType | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  onRefresh: () => void;
  onUpdateTitle: (title: string) => void;
}

export function PackageDetails({
  details,
  loading,
  error,
  refreshing,
  onRefresh,
  onUpdateTitle,
}: PackageDetailsProps) {
  const { getCarrierById } = useCarriers();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [copied, setCopied] = useState(false);

  if (!details && !loading && !error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <PackageIcon className="w-20 h-20 text-gray-200 mb-4" />
        <p className="text-gray-500">Select a parcel from the list</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <SpinnerIcon className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <ExclamationCircleIcon className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-sm text-gray-600 text-center">{error}</p>
        <button
          onClick={onRefresh}
          className="mt-4 px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!details) return null;

  const carrier = getCarrierById(details.carrierCode);

  const handleSaveTitle = () => {
    if (titleInput.trim()) {
      onUpdateTitle(titleInput.trim());
    }
    setEditingTitle(false);
  };

  const handleCopyTrackingNumber = async () => {
    if (!details) return;

    try {
      await navigator.clipboard.writeText(details.trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy tracking number:', err);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={titleInput}
                  onChange={e => setTitleInput(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') setEditingTitle(false);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  autoFocus
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-gray-900">
                  {details.title || carrier?._name || 'Package'}
                </h2>
                <button
                  onClick={() => {
                    setTitleInput(details.title || carrier?._name || '');
                    setEditingTitle(true);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded"
                  title="Edit title"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-gray-500 font-mono">{details.trackingNumber}</p>
              <button
                onClick={handleCopyTrackingNumber}
                className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded"
                title={copied ? 'Copied!' : 'Copy tracking number'}
              >
                <CopyIcon className={`w-4 h-4 ${copied ? 'text-green-600' : ''}`} />
              </button>
            </div>
            {carrier && <p className="text-sm text-gray-600 mt-1">{carrier._name}</p>}
          </div>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-50 flex-shrink-0"
            title="Refresh"
          >
            <RefreshIcon className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tracking History */}
      <div className="flex-1 overflow-y-auto p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Tracking History</h3>
        {details.trackingHistory.length === 0 ? (
          <p className="text-sm text-gray-500">No tracking events yet</p>
        ) : (
          <ol className="relative border-l border-gray-200">
            {details.trackingHistory.map((event, index) => {
              const date = new Date(parseInt(event.d) * 1000);
              const isLatest = index === 0;
              const uniqueKey = `${event.d}-${event.a}-${index}`;

              return (
                <li key={uniqueKey} className="mb-8 ml-6">
                  <span
                    className={`absolute flex items-center justify-center w-3 h-3 rounded-full -left-1.5 ${
                      isLatest ? 'bg-gray-900' : 'bg-gray-300'
                    }`}
                  />
                  <div>
                    <time className="block mb-1 text-xs font-medium text-gray-900">
                      {date.toLocaleDateString()} {date.toLocaleTimeString()}
                    </time>
                    <p className="text-sm text-gray-900">{event.a}</p>
                    {event.c && <p className="text-xs text-gray-500 mt-1">{event.c}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
