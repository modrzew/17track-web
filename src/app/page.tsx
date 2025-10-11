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

  const handleCloseDetails = () => {
    window.history.pushState(null, '', '/');
    setSelectedPackage(null);
  };

  return (
    <main className="flex h-screen bg-white overflow-hidden">
      {/* Desktop: sidebar + main panel */}
      {/* Mobile: bottom sheet when package selected */}
      <div className="flex flex-col md:flex-row w-full h-full">
        {/* Sidebar / List Panel */}
        <div className="w-full md:w-80 lg:w-96 md:border-r md:border-gray-200 flex flex-col h-full">
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

        {/* Desktop: Main Content / Details Panel */}
        <div className="hidden md:flex md:flex-1 flex-col">
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

      {/* Mobile: Bottom Sheet with Overlay */}
      {selectedPackage && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop Overlay */}
          <div
            className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm"
            onClick={handleCloseDetails}
          />

          {/* Bottom Sheet */}
          <div className="absolute inset-x-0 bottom-0 top-16 bg-white rounded-t-2xl shadow-2xl flex flex-col">
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
      )}

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
