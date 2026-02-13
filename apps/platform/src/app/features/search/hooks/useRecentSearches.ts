import { useState, useEffect, useCallback } from 'react';
import { RecentSearch } from '../types/search.types';

const STORAGE_KEY = 'erp_recent_searches';
const MAX_RECENT_SEARCHES = 5;

/**
 * Custom hook for managing recent search history in localStorage
 * 
 * Features:
 * - Maintains a maximum of 5 recent searches
 * - Deduplicates searches (moves duplicates to top)
 * - Persists searches in localStorage
 * - Provides functions to add and clear searches
 * 
 * @returns Object containing recentSearches array and management functions
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.7
 */
export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentSearch[];
        setRecentSearches(parsed);
      }
    } catch (error) {
      console.error('Failed to load recent searches from localStorage:', error);
      setRecentSearches([]);
    }
  }, []);

  /**
   * Add a search query to recent searches
   * - Removes duplicate if exists
   * - Adds new search to the top
   * - Maintains maximum of 5 searches
   * - Persists to localStorage
   * 
   * @param query - The search query to add
   */
  const addSearch = useCallback((query: string) => {
    if (!query || query.trim().length === 0) {
      return;
    }

    const trimmedQuery = query.trim();

    setRecentSearches((prev) => {
      // Remove duplicate if exists
      const filtered = prev.filter((search) => search.query !== trimmedQuery);

      // Add new search to the top
      const newSearch: RecentSearch = {
        query: trimmedQuery,
        timestamp: Date.now(),
      };

      // Maintain maximum of 5 searches
      const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES);

      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save recent searches to localStorage:', error);
      }

      return updated;
    });
  }, []);

  /**
   * Clear all recent searches
   * - Removes all searches from state
   * - Removes from localStorage
   */
  const clearSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear recent searches from localStorage:', error);
    }
  }, []);

  return {
    recentSearches,
    addSearch,
    clearSearches,
  };
}
