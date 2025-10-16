import { useState } from 'react';
import type { Package } from '@/lib/types';
import { PackageStatus } from '@/lib/types';
import { useCarriers } from '@/hooks/useCarriers';
import {
  PlusIcon,
  RefreshIcon,
  TrashIcon,
  PackageIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  SpinnerIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from './icons';

interface PackageListProps {
  packages: Package[];
  selectedPackage: string | null;
  onSelectPackage: (trackingNumber: string) => void;
  onAddPackage: () => void;
  onDeletePackage: (trackingNumber: string) => void;
  onRefresh: () => void;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
}

export function PackageList({
  packages,
  selectedPackage,
  onSelectPackage,
  onAddPackage,
  onDeletePackage,
  onRefresh,
  loading,
  error,
  refreshing,
}: PackageListProps) {
  const { getCarrierById } = useCarriers();
  const [showDelivered, setShowDelivered] = useState(false);

  // Categorize packages into sections
  const categorizedPackages = {
    active: packages.filter(pkg => pkg.lastEvent && pkg.status !== PackageStatus.Delivered),
    inactive: packages.filter(pkg => !pkg.lastEvent && pkg.status !== PackageStatus.Delivered),
    delivered: packages.filter(pkg => pkg.status === PackageStatus.Delivered),
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
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

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Packages</h1>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            title="Refresh"
          >
            <RefreshIcon className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onAddPackage}
            className="p-2 text-gray-900 hover:bg-gray-100 rounded-lg"
            title="Add package"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Package List */}
      <div className="flex-1 overflow-y-auto">
        {packages.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <PackageIcon className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-sm text-gray-500 mb-4">No packages yet</p>
            <button
              onClick={onAddPackage}
              className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              Add your first package
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {/* Active packages */}
            {categorizedPackages.active.map(pkg => (
              <PackageItem
                key={pkg.trackingNumber}
                pkg={pkg}
                isSelected={selectedPackage === pkg.trackingNumber}
                onSelectPackage={onSelectPackage}
                onDeletePackage={onDeletePackage}
                getCarrierById={getCarrierById}
              />
            ))}

            {/* Inactive section divider */}
            {categorizedPackages.inactive.length > 0 && (
              <SectionDivider label="No updates / Status unknown" />
            )}

            {/* Inactive packages */}
            {categorizedPackages.inactive.map(pkg => (
              <PackageItem
                key={pkg.trackingNumber}
                pkg={pkg}
                isSelected={selectedPackage === pkg.trackingNumber}
                onSelectPackage={onSelectPackage}
                onDeletePackage={onDeletePackage}
                getCarrierById={getCarrierById}
              />
            ))}

            {/* Delivered section toggle divider */}
            {categorizedPackages.delivered.length > 0 && (
              <ToggleDivider
                label="Delivered"
                count={categorizedPackages.delivered.length}
                isOpen={showDelivered}
                onToggle={() => setShowDelivered(!showDelivered)}
              />
            )}

            {/* Delivered packages (collapsible) */}
            {showDelivered &&
              categorizedPackages.delivered.map(pkg => (
                <PackageItem
                  key={pkg.trackingNumber}
                  pkg={pkg}
                  isSelected={selectedPackage === pkg.trackingNumber}
                  onSelectPackage={onSelectPackage}
                  onDeletePackage={onDeletePackage}
                  getCarrierById={getCarrierById}
                />
              ))}
          </ul>
        )}
      </div>
    </>
  );
}

// Section divider component (static)
function SectionDivider({ label }: { label: string }) {
  return (
    <li className="bg-gray-50 border-t border-b border-gray-200">
      <div className="py-2 px-4">
        <p className="text-xs font-medium text-gray-500 text-center">{label}</p>
      </div>
    </li>
  );
}

// Toggle divider component (interactive)
function ToggleDivider({
  label,
  count,
  isOpen,
  onToggle,
}: {
  label: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="bg-gray-50 border-t border-b border-gray-200">
      <button onClick={onToggle} className="w-full py-2 px-4 hover:bg-gray-100 transition-colors">
        <div className="flex items-center justify-center gap-2">
          <p className="text-xs font-medium text-gray-500">
            {isOpen ? 'Hide' : 'Show'} {label} ({count})
          </p>
          {isOpen ? (
            <ChevronUpIcon className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDownIcon className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </button>
    </li>
  );
}

// Package item component
function PackageItem({
  pkg,
  isSelected,
  onSelectPackage,
  onDeletePackage,
  getCarrierById,
}: {
  pkg: Package;
  isSelected: boolean;
  onSelectPackage: (trackingNumber: string) => void;
  onDeletePackage: (trackingNumber: string) => void;
  getCarrierById: (id: number) => { _name: string } | undefined;
}) {
  const carrier = getCarrierById(pkg.carrierCode);

  return (
    <li>
      <div
        onClick={() => onSelectPackage(pkg.trackingNumber)}
        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
          isSelected ? 'bg-gray-50' : ''
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <StatusIcon status={pkg.status} />
              <span className="text-base font-bold text-gray-900 truncate">
                {pkg.title || carrier?._name || 'Unknown Carrier'}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono truncate mb-1">{pkg.trackingNumber}</p>
            {pkg.lastEvent && (
              <p className="text-xs text-gray-600 line-clamp-2">{pkg.lastEvent.a}</p>
            )}
          </div>
          <button
            onClick={e => {
              e.stopPropagation();
              onDeletePackage(pkg.trackingNumber);
            }}
            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
            title="Delete package"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </li>
  );
}

function StatusIcon({ status }: { status: PackageStatus }) {
  const className = 'w-5 h-5';

  switch (status) {
    case PackageStatus.Delivered:
      return <CheckCircleIcon className={`${className} text-green-600`} />;
    case PackageStatus.InTransit:
      return <TruckIcon className={`${className} text-blue-600`} />;
    case PackageStatus.PickUp:
      return <TruckIcon className={`${className} text-orange-600`} />;
    case PackageStatus.Alert:
    case PackageStatus.Undelivered:
      return <ExclamationCircleIcon className={`${className} text-red-600`} />;
    case PackageStatus.Expired:
      return <ClockIcon className={`${className} text-gray-400`} />;
    default:
      return <PackageIcon className={`${className} text-gray-400`} />;
  }
}
