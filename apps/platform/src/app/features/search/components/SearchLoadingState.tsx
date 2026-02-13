/**
 * SearchLoadingState Component
 * Displays a loading spinner while search is in progress
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * SearchLoadingState component
 */
export const SearchLoadingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Animated Spinner */}
      <Loader2 
        className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" 
        aria-label="Loading search results"
      />
      
      {/* Loading Text */}
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        Searching...
      </p>
    </div>
  );
};

export default SearchLoadingState;
