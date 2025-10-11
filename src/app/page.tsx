'use client';

import { useState, useEffect } from 'react';
import { usePackages } from '@/hooks/usePackages';
import { usePackageDetails } from '@/hooks/usePackageDetails';
import { PackageList } from '@/components/PackageList';
import { PackageDetails } from '@/components/PackageDetails';
import { AddPackageDialog } from '@/components/AddPackageDialog';

export default function Home() {
  // Get initial tracking number from URL on mount
  const getTrackingNumberFromUrl = () => {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname;
    return path === '/' ? null : path.slice(1);
  };

  const [selectedPackage, setSelectedPackage] = useState<string | null>(getTrackingNumberFromUrl);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Listen to browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setSelectedPackage(getTrackingNumberFromUrl());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const {
    packages,
    loading,
    error,
    refreshing,
    refresh,
    addPackage,
    deletePackage,
    updatePackageTitle,
  } = usePackages();

  const {
    details,
    loading: detailsLoading,
    error: detailsError,
    refreshing: detailsRefreshing,
    refresh: refreshDetails,
  } = usePackageDetails(selectedPackage);

  const handleSelectPackage = (trackingNumber: string) => {
    // Update URL without navigation (no component remount)
    window.history.pushState(null, '', `/${trackingNumber}`);
    setSelectedPackage(trackingNumber);
  };

  const handleDeletePackage = async (trackingNumber: string) => {
    // If deleting the currently selected package, go back to home
    if (trackingNumber === selectedPackage) {
      window.history.pushState(null, '', '/');
      setSelectedPackage(null);
    }
    await deletePackage(trackingNumber);
  };

  return (
    <main className="flex h-screen bg-white">
      {/* Desktop: sidebar + main panel */}
      {/* Mobile: stack layout */}
      <div className="flex flex-col md:flex-row w-full">
        {/* Sidebar / List Panel */}
        <div className="w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col">
          <PackageList
            packages={packages}
            selectedPackage={selectedPackage}
            onSelectPackage={handleSelectPackage}
            onAddPackage={() => setShowAddDialog(true)}
            onDeletePackage={handleDeletePackage}
            onRefresh={refresh}
            loading={loading}
            error={error}
            refreshing={refreshing}
          />
        </div>

        {/* Main Content / Details Panel */}
        <div className="flex-1 flex flex-col">
          <PackageDetails
            details={details}
            loading={detailsLoading}
            error={detailsError}
            refreshing={detailsRefreshing}
            onRefresh={refreshDetails}
            onUpdateTitle={title => {
              if (selectedPackage) {
                updatePackageTitle(selectedPackage, title);
              }
            }}
          />
        </div>
      </div>

      {/* Add Package Dialog */}
      {showAddDialog && (
        <AddPackageDialog
          onClose={() => setShowAddDialog(false)}
          onAdd={async (trackingNumber, carrierCode, title) => {
            await addPackage(trackingNumber, carrierCode, title);
            setShowAddDialog(false);
          }}
        />
      )}
    </main>
  );
}
