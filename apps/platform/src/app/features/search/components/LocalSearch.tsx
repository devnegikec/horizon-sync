/**
 * LocalSearch Component
 * Embedded search input for filtering data tables and lists
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useLocalSearch } from '../hooks/useLocalSearch';
import type { SearchResult } from '../types/search.types';

export interface LocalSearchProps {
  entityType: string;
  onResultsChange: (results: SearchResult[]) => void;
  placeholder?: string;
  className?: string;
}

/**
 * LocalSearch component for filtering data tables
 * 
 * @example
 * ```tsx
 * <LocalSearch
 *   entityType="items"
 *   onResultsChange={(results) => setFilteredItems(results)}
 *   placeholder="Search items..."
 * />
 * ```
 */
export const LocalSearch: React.FC<LocalSearchProps> = ({
  entityType,
  onResultsChange,
  placeholder = 'Search...',
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading, isError, error } = useLocalSearch(entityType, searchQuery);
  
  // Use ref to store the latest callback without causing re-renders
  const onResultsChangeRef = useRef(onResultsChange);
  
  // Update ref when callback changes
  useEffect(() => {
    onResultsChangeRef.current = onResultsChange;
  }, [onResultsChange]);

  // Call onResultsChange when data changes
  useEffect(() => {
    if (data?.results) {
      onResultsChangeRef.current(data.results);
    } else if (searchQuery.length === 0) {
      // When search is cleared, pass empty array to show all records
      onResultsChangeRef.current([]);
    }
  }, [data, searchQuery]);

  // Handle clear button click
  const handleClear = () => {
    setSearchQuery('');
    onResultsChangeRef.current([]);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search input container */}
      <div className="relative">
        {/* Search icon */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search 
            className="w-4 h-4 md:w-4 md:h-4 text-gray-400 dark:text-gray-500" 
            aria-hidden="true"
          />
        </div>

        {/* Input field */}
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          placeholder={placeholder}
          aria-label={`Search ${entityType}`}
          aria-describedby={isError ? `${entityType}-search-error` : undefined}
          className={`
            w-full pl-10 pr-10 py-2 
            text-sm text-gray-900 dark:text-gray-100
            bg-white dark:bg-gray-800
            border border-gray-300 dark:border-gray-600
            rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            dark:focus:ring-blue-400 dark:focus:border-blue-400
            placeholder-gray-400 dark:placeholder-gray-500
            transition-colors duration-150
            ${isError ? 'border-red-500 dark:border-red-400' : ''}
            max-md:min-h-[44px] max-md:text-base max-md:pl-12 max-md:pr-12
          `}
        />

        {/* Right side icons (loading or clear button) */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 max-md:pr-2">
          {isLoading ? (
            <Loader2 
              className="w-4 h-4 md:w-4 md:h-4 text-blue-500 dark:text-blue-400 animate-spin max-md:w-5 max-md:h-5" 
              aria-label="Loading search results"
              role="status"
            />
          ) : searchQuery.length > 0 ? (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className="
                text-gray-400 hover:text-gray-600 
                dark:text-gray-500 dark:hover:text-gray-300
                transition-colors duration-150
                focus:outline-none focus:ring-2 focus:ring-blue-500 rounded
                max-md:min-w-[44px] max-md:min-h-[44px] max-md:flex max-md:items-center max-md:justify-center
              "
            >
              <X className="w-4 h-4 max-md:w-5 max-md:h-5" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Error message */}
      {isError && error && (
        <div 
          id={`${entityType}-search-error`}
          className="mt-2 text-sm text-red-600 dark:text-red-400 max-md:text-base"
          role="alert"
        >
          {error.message}
        </div>
      )}
    </div>
  );
};

export default LocalSearch;
