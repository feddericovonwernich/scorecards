/**
 * Checks API
 * Functions for loading and working with check metadata
 */

import { fetchWithHybridAuth } from './registry.js';
import type { CheckMetadata, AllChecksResponse } from '../types/index.js';

// Cache for checks metadata
let checksCache: AllChecksResponse | null = null;
let checksTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Load all checks metadata
 */
export async function loadChecks(): Promise<AllChecksResponse> {
  // Return cached if valid
  const now = Date.now();
  if (checksCache && now - checksTimestamp < CACHE_TTL) {
    return checksCache;
  }

  try {
    const { response } = await fetchWithHybridAuth('all-checks.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch all-checks.json: ${response.status}`);
    }
    checksCache = await response.json();
    checksTimestamp = now;
    return checksCache!;
  } catch (error) {
    console.warn('Failed to load checks metadata:', error);
    // Return default empty structure
    return {
      version: '1.0.0',
      checks: [],
      categories: [],
      count: 0,
    };
  }
}

/**
 * Get a check by its ID
 */
export function getCheckById(checkId: string): CheckMetadata | null {
  if (!checksCache) {return null;}
  return checksCache.checks.find((c) => c.id === checkId) || null;
}

/**
 * Get all checks
 */
export function getAllChecks(): CheckMetadata[] {
  return checksCache?.checks || [];
}

/**
 * Get checks grouped by category
 */
export function getChecksByCategory(): Record<string, CheckMetadata[]> {
  if (!checksCache) {return {};}

  const grouped: Record<string, CheckMetadata[]> = {};
  for (const check of checksCache.checks) {
    const category = check.category || 'Other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(check);
  }

  // Sort by category order
  const orderedCategories = checksCache.categories || [];
  const result: Record<string, CheckMetadata[]> = {};

  // Add categories in order
  for (const category of orderedCategories) {
    if (grouped[category]) {
      result[category] = grouped[category];
    }
  }

  // Add any remaining categories
  for (const category of Object.keys(grouped)) {
    if (!result[category]) {
      result[category] = grouped[category];
    }
  }

  return result;
}

/**
 * Get the list of categories
 */
export function getCategories(): string[] {
  return checksCache?.categories || [];
}

/**
 * Clear the checks cache
 */
export function clearChecksCache(): void {
  checksCache = null;
  checksTimestamp = 0;
}
