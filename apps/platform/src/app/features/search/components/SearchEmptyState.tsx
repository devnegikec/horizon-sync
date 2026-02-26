/**
 * SearchEmptyState Component
 * Displays a message when no search results are found
 */

import React from 'react';
import { SearchX } from 'lucide-react';

export interface SearchEmptyStateProps {
  query: string;
  suggestions?: string[];
}

/**
 * SearchEmptyState component
 */
export const SearchEmptyState: React.FC<SearchEmptyStateProps> = ({
  query,
  suggestions,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Icon */}
      <div className="mb-4">
        <SearchX className="w-16 h-16 text-gray-400 dark:text-gray-600" />
      </div>

      {/* Message */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        No results found
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        No results found for <span className="font-medium">"{query}"</span>.
        Try different keywords or check spelling.
      </p>

      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="w-full max-w-md">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Suggestions:
          </p>
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded px-3 py-2"
              >
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchEmptyState;
