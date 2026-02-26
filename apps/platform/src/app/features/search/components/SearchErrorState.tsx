/**
 * SearchErrorState Component
 * Displays error messages and retry button when search fails
 */

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export interface SearchErrorStateProps {
  error: Error;
  onRetry: () => void;
}

/**
 * Get user-friendly error message based on error type
 */
function getErrorMessage(error: Error): string {
  const message = error.message.toLowerCase();

  if (message.includes('session expired') || message.includes('log in again')) {
    return 'Session expired. Please log in again.';
  }

  if (message.includes('service unavailable') || message.includes('try again later')) {
    return 'Search service unavailable. Please try again later.';
  }

  if (message.includes('connection') || message.includes('network')) {
    return 'Unable to connect. Please check your connection and try again.';
  }

  // Default error message
  return 'An error occurred while searching. Please try again.';
}

/**
 * SearchErrorState component
 */
export const SearchErrorState: React.FC<SearchErrorStateProps> = ({
  error,
  onRetry,
}) => {
  const errorMessage = getErrorMessage(error);

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Icon */}
      <div className="mb-4">
        <AlertCircle className="w-16 h-16 text-red-500 dark:text-red-400" />
      </div>

      {/* Error Message */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Search Error
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        {errorMessage}
      </p>

      {/* Retry Button */}
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Retry search"
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </button>
    </div>
  );
};

export default SearchErrorState;
