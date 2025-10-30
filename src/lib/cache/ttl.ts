// Cache TTL in milliseconds (30 minutes)
export const CACHE_TTL = 30 * 60 * 1000;

/**
 * Check if cached data is still fresh (within TTL)
 * @param lastFetchedAt ISO date string of when we last fetched this data from the API
 * @returns true if cache is fresh, false if expired
 */
export function isCacheFresh(lastFetchedAt: string | undefined): boolean {
  if (!lastFetchedAt) return false;

  const lastFetch = new Date(lastFetchedAt).getTime();
  const now = Date.now();
  const age = now - lastFetch;

  return age < CACHE_TTL;
}

/**
 * Check if any item in an array has fresh cache
 */
export function hasAnyCacheFresh(items: Array<{ lastFetchedAt: string }>): boolean {
  if (items.length === 0) return false;

  // Check the most recently fetched item
  const mostRecent = items.reduce((latest, item) => {
    const latestTime = new Date(latest.lastFetchedAt).getTime();
    const itemTime = new Date(item.lastFetchedAt).getTime();
    return itemTime > latestTime ? item : latest;
  });

  return isCacheFresh(mostRecent.lastFetchedAt);
}
