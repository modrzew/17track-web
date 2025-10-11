// Cache TTL in milliseconds (30 minutes)
export const CACHE_TTL = 30 * 60 * 1000;

/**
 * Check if cached data is still fresh (within TTL)
 * @param updatedAt ISO date string of when data was last updated
 * @returns true if cache is fresh, false if expired
 */
export function isCacheFresh(updatedAt: string | undefined): boolean {
  if (!updatedAt) return false;

  const lastUpdate = new Date(updatedAt).getTime();
  const now = Date.now();
  const age = now - lastUpdate;

  return age < CACHE_TTL;
}

/**
 * Check if any item in an array has fresh cache
 */
export function hasAnyCacheFresh(items: Array<{ updatedAt: string }>): boolean {
  if (items.length === 0) return false;

  // Check the most recent item
  const mostRecent = items.reduce((latest, item) => {
    const latestTime = new Date(latest.updatedAt).getTime();
    const itemTime = new Date(item.updatedAt).getTime();
    return itemTime > latestTime ? item : latest;
  });

  return isCacheFresh(mostRecent.updatedAt);
}
