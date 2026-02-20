/**
 * useSearchNavigation Hook
 * Handles keyboard navigation through search results
 */

import { useState, useCallback } from 'react';
import { SearchResult } from '../types/search.types';

/**
 * Return type for useSearchNavigation hook
 */
export interface UseSearchNavigationReturn {
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  handleKeyDown: (event: React.KeyboardEvent) => void;
}

/**
 * Custom hook for managing keyboard navigation through search results
 * 
 * Features:
 * - Tracks currently selected result index
 * - Handles Arrow Up/Down for navigation
 * - Wraps selection at list boundaries
 * - Handles Enter key to select current result
 * 
 * @param results - Array of search results to navigate through
 * @param onSelect - Callback function called when a result is selected (Enter key)
 * @returns Object containing selectedIndex, setSelectedIndex, and handleKeyDown
 * 
 * @example
 * ```tsx
 * const { selectedIndex, handleKeyDown } = useSearchNavigation(
 *   searchResults,
 *   (result) => navigate(`/items/${result.entity_id}`)
 * );
 * 
 * return (
 *   <div onKeyDown={handleKeyDown}>
 *     {searchResults.map((result, index) => (
 *       <ResultItem
 *         key={result.entity_id}
 *         result={result}
 *         isHighlighted={index === selectedIndex}
 *       />
 *     ))}
 *   </div>
 * );
 * ```
 * 
 * Requirements: 5.1, 5.2
 */
export function useSearchNavigation(
  results: SearchResult[],
  onSelect: (result: SearchResult) => void
): UseSearchNavigationReturn {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  /**
   * Handle keyboard events for navigation
   * - Arrow Down: Move to next result (wrap to start at end)
   * - Arrow Up: Move to previous result (wrap to end at start)
   * - Enter: Select current result and call onSelect callback
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Only handle navigation if there are results
      if (results.length === 0) {
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex((prevIndex) => {
            // Wrap to start if at end
            return prevIndex >= results.length - 1 ? 0 : prevIndex + 1;
          });
          break;

        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex((prevIndex) => {
            // Wrap to end if at start
            return prevIndex <= 0 ? results.length - 1 : prevIndex - 1;
          });
          break;

        case 'Enter':
          event.preventDefault();
          // Call onSelect with the currently selected result
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            const selectedResult = results[selectedIndex];
            onSelect(selectedResult);
          }
          break;

        default:
          // Ignore other keys
          break;
      }
    },
    [results, selectedIndex, onSelect]
  );

  return {
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
  };
}
