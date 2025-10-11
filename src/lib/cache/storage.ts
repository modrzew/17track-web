import type { Package, PackageDetails } from '../types';

const DB_NAME = 'track17_cache';
const DB_VERSION = 1;
const PACKAGES_STORE = 'packages';
const PACKAGE_DETAILS_STORE = 'packageDetails';

class PackageStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private async init(): Promise<void> {
    if (this.db) return;

    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('IndexedDB not available on server'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create packages store
        if (!db.objectStoreNames.contains(PACKAGES_STORE)) {
          const packagesStore = db.createObjectStore(PACKAGES_STORE, {
            keyPath: 'trackingNumber',
          });
          packagesStore.createIndex('status', 'status', { unique: false });
          packagesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Create package details store
        if (!db.objectStoreNames.contains(PACKAGE_DETAILS_STORE)) {
          db.createObjectStore(PACKAGE_DETAILS_STORE, {
            keyPath: 'trackingNumber',
          });
        }
      };
    });

    await this.initPromise;
  }

  async savePackages(packages: Package[]): Promise<void> {
    await this.init();
    if (!this.db) return;

    const transaction = this.db.transaction([PACKAGES_STORE], 'readwrite');
    const store = transaction.objectStore(PACKAGES_STORE);

    for (const pkg of packages) {
      store.put(pkg);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getPackages(): Promise<Package[]> {
    await this.init();
    if (!this.db) return [];

    const transaction = this.db.transaction([PACKAGES_STORE], 'readonly');
    const store = transaction.objectStore(PACKAGES_STORE);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getPackage(trackingNumber: string): Promise<Package | null> {
    await this.init();
    if (!this.db) return null;

    const transaction = this.db.transaction([PACKAGES_STORE], 'readonly');
    const store = transaction.objectStore(PACKAGES_STORE);
    const request = store.get(trackingNumber);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async deletePackage(trackingNumber: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    const transaction = this.db.transaction([PACKAGES_STORE, PACKAGE_DETAILS_STORE], 'readwrite');

    transaction.objectStore(PACKAGES_STORE).delete(trackingNumber);
    transaction.objectStore(PACKAGE_DETAILS_STORE).delete(trackingNumber);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async savePackageDetails(details: PackageDetails): Promise<void> {
    await this.init();
    if (!this.db) return;

    const transaction = this.db.transaction([PACKAGE_DETAILS_STORE], 'readwrite');
    const store = transaction.objectStore(PACKAGE_DETAILS_STORE);
    store.put(details);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getPackageDetails(trackingNumber: string): Promise<PackageDetails | null> {
    await this.init();
    if (!this.db) return null;

    const transaction = this.db.transaction([PACKAGE_DETAILS_STORE], 'readonly');
    const store = transaction.objectStore(PACKAGE_DETAILS_STORE);
    const request = store.get(trackingNumber);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async updatePackage(trackingNumber: string, updates: Partial<Package>): Promise<void> {
    await this.init();
    if (!this.db) return;

    const transaction = this.db.transaction([PACKAGES_STORE], 'readwrite');
    const store = transaction.objectStore(PACKAGES_STORE);

    const getRequest = store.get(trackingNumber);

    return new Promise((resolve, reject) => {
      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (existing) {
          const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
          const putRequest = store.put(updated);

          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Package not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async clear(): Promise<void> {
    await this.init();
    if (!this.db) return;

    const transaction = this.db.transaction([PACKAGES_STORE, PACKAGE_DETAILS_STORE], 'readwrite');

    transaction.objectStore(PACKAGES_STORE).clear();
    transaction.objectStore(PACKAGE_DETAILS_STORE).clear();

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

// Export singleton instance
export const packageStorage = new PackageStorage();
