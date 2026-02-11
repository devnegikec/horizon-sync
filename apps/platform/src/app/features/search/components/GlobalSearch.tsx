/**
 * GlobalSearch Component
 * Command palette-style modal for searching across all entity types
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Command } from 'lucide-react';
import { useGlobalSearch } from '../hooks/useGlobalSearch';
import { useRecentSearches } from '../hooks/useRecentSearches';
import { useSearchNavigation } from '../hooks/useSearchNavigation';
import { SearchResultItem } from './SearchResultItem';
import { SearchLoadingState } from './SearchLoadingState';
import { SearchEmptyState } from './SearchEmptyState';
import { SearchErrorState } from './SearchErrorState';
import { getEntityTypeConfig } from '../constants/entityTypes';
import type { SearchResult } from '../types/search.types';

export interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (entityType: string, entityId: string) => void;
}

/**
 * Group search results by entity type
 */
function groupResultsByEntityType(results: SearchResult[]): Record<string, SearchResult[]> {
  return results.reduce((groups, result) => {
    const entityType = result.entity_type;
    if (!groups[entityType]) {
      groups[entityType] = [];
    }
    groups[entityType].push(result);
    return groups;
  }, {} as Record<string, SearchResult[]>);
}

/**
 * GlobalSearch component
 * 
 * @example
 * ```tsx
 * const [isSearchOpen, setIsSearchOpen] = useState(false);
 * 
 * <GlobalSearch
 *   isOpen={isSearchOpen}
 *   onClose={() => setIsSearchOpen(false)}
 *   onNavigate={(entityType, entityId) => navigate(`/${entityType}/${entityId}`)}
 * />
 * ```
 */
export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useGlobalSearch(searchQuery, currentPage);
  const { recentSearches, addSearch, clearSearches } = useRecentSearches();
  
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Flatten results for navigation
  const allResults = data?.results || [];

  // Handle result selection
  const handleSelectResult = (result: SearchResult) => {
    // Add to recent searches
    addSearch(searchQuery);

    // Navigate to entity detail page
    if (onNavigate) {
      onNavigate(result.entity_type, result.entity_id);
    }

    // Close modal
    onClose();
  };

  // Use search navigation hook
  const { selectedIndex, setSelectedIndex, handleKeyDown } = useSearchNavigation(
    allResults,
    handleSelectResult
  );

  // Handle recent search click
  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    // The search will be executed automatically via useGlobalSearch
  };

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store the element that had focus before opening
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus the search input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      // Return focus to the element that triggered the modal
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen]);

  // Focus trap within modal
  useEffect(() => {
    if (!isOpen) return;

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const modal = modalRef.current;
      if (!modal) return;

      const focusableElements = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

  // Reset search query when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      setCurrentPage(1);
    }
  }, [isOpen, setSelectedIndex]);

  // Reset page to 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  // Group results by entity type
  const groupedResults = groupResultsByEntityType(allResults);
  const entityTypes = Object.keys(groupedResults);

  // Determine if we should show recent searches
  const showRecentSearches = searchQuery.length === 0 && recentSearches.length > 0;

  // Render modal content
  const modalContent = (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Global search"
        className="fixed inset-0 z-[9999] flex items-start justify-center md:pt-[10vh] md:px-4 pointer-events-none"
      >
        <div
          className="w-full max-w-2xl bg-white dark:bg-gray-900 md:rounded-lg shadow-2xl pointer-events-auto overflow-hidden flex flex-col md:max-h-[80vh] h-full md:h-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search input header */}
          <div className="flex items-center gap-3 px-4 py-4 md:py-3 border-b border-gray-200 dark:border-gray-700">
            <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" aria-hidden="true" />
            
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search items, customers, suppliers, invoices..."
              aria-label="Search input"
              className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-base min-h-[44px]"
            />

            {/* Keyboard shortcut hint (hidden on mobile) */}
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">
              <Command className="w-3 h-3" aria-hidden="true" />
              <span>K</span>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close search"
              className="flex-shrink-0 p-2 md:p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
            </button>
          </div>

          {/* Results area */}
          <div className="flex-1 overflow-y-auto">
            {/* Loading state */}
            {isLoading && <SearchLoadingState />}

            {/* Error state */}
            {isError && error && (
              <SearchErrorState error={error} onRetry={() => refetch()} />
            )}

            {/* Empty state */}
            {!isLoading && !isError && searchQuery.length >= 2 && allResults.length === 0 && (
              <SearchEmptyState query={searchQuery} suggestions={data?.suggestions} />
            )}

            {/* Recent searches */}
            {showRecentSearches && (
              <div className="py-4">
                <div className="flex items-center justify-between px-4 mb-3">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Recent Searches
                  </h3>
                  <button
                    onClick={clearSearches}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-3 py-2 min-h-[44px]"
                    aria-label="Clear recent searches"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(search.query)}
                      className="w-full text-left px-4 py-3 min-h-[44px] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-800"
                      aria-label={`Recent search: ${search.query}`}
                    >
                      <div className="flex items-center gap-3">
                        <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {search.query}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search results grouped by entity type */}
            {!isLoading && !isError && allResults.length > 0 && (
              <div className="py-2">
                {/* Total count */}
                <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400" role="status" aria-live="polite">
                  Found {data?.total_count || 0} result{data?.total_count !== 1 ? 's' : ''}
                </div>

                {/* Grouped results */}
                {entityTypes.map((entityType) => {
                  const entityConfig = getEntityTypeConfig(entityType);
                  const results = groupedResults[entityType];
                  
                  return (
                    <div key={entityType} className="mb-4">
                      {/* Entity type header */}
                      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50">
                        <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          {entityConfig?.label || entityType} ({results.length})
                        </h3>
                      </div>

                      {/* Results for this entity type */}
                      <div>
                        {results.map((result) => {
                          // Calculate global index for navigation
                          const globalIndex = allResults.findIndex(r => r === result);
                          
                          return (
                            <SearchResultItem
                              key={result.entity_id}
                              result={result}
                              isHighlighted={globalIndex === selectedIndex}
                              onClick={() => handleSelectResult(result)}
                              onMouseEnter={() => setSelectedIndex(globalIndex)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Pagination controls */}
                {data && data.total_count > 20 && (
                  <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      {/* Page info */}
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Page {data.page} of {data.total_pages}
                      </div>

                      {/* Navigation buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={!data.has_previous_page}
                          aria-label="Previous page"
                          className="px-4 py-2 min-h-[44px] min-w-[44px] text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => prev + 1)}
                          disabled={!data.has_next_page}
                          aria-label="Next page"
                          className="px-4 py-2 min-h-[44px] min-w-[44px] text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Prompt to start searching */}
            {!isLoading && !isError && searchQuery.length < 2 && !showRecentSearches && (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Search className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" aria-hidden="true" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Start typing to search across all entity types
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  // Use React Portal to render modal at document.body level
  // This ensures the modal appears above all other content regardless of parent z-index
  return createPortal(modalContent, document.body);
};

export default GlobalSearch;
