/**
 * SearchResultItem Component
 * Displays an individual search result with entity type badge, title, snippet, and metadata
 */

import React from 'react';
import { SearchResult } from '../types/search.types';
import { getEntityTypeConfig } from '../constants/entityTypes';

export interface SearchResultItemProps {
  result: SearchResult;
  isHighlighted: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

/**
 * Color mapping for entity type badges
 */
const COLOR_CLASSES: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  teal: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
};

/**
 * Format metadata value based on type
 */
function formatMetadataValue(key: string, value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  // Date formatting
  if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
    try {
      const date = new Date(value as string);
      if (!isNaN(date.getTime())) {
        return new Intl.DateTimeFormat(navigator.language, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }).format(date);
      }
    } catch {
      // Fall through to default formatting
    }
  }

  // Currency formatting
  if (key.toLowerCase().includes('price') || key.toLowerCase().includes('amount') || key.toLowerCase().includes('cost')) {
    const num = Number(value);
    if (!isNaN(num)) {
      return new Intl.NumberFormat(navigator.language, {
        style: 'currency',
        currency: 'USD', // Default to USD, could be made configurable
      }).format(num);
    }
  }

  // Number formatting
  if (typeof value === 'number') {
    return new Intl.NumberFormat(navigator.language).format(value);
  }

  return String(value);
}

/**
 * SearchResultItem component
 */
export const SearchResultItem: React.FC<SearchResultItemProps> = ({
  result,
  isHighlighted,
  onClick,
  onMouseEnter,
}) => {
  const entityConfig = getEntityTypeConfig(result.entity_type);
  const Icon = entityConfig?.icon;
  const colorClass = entityConfig?.color ? COLOR_CLASSES[entityConfig.color] : COLOR_CLASSES.blue;

  // Format metadata for display
  const metadataEntries = Object.entries(result.metadata)
    .filter(([_, value]) => value !== null && value !== undefined)
    .slice(0, 3); // Limit to 3 metadata items

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${entityConfig?.label || result.entity_type}: ${result.title}`}
      className={`
        px-4 py-3 min-h-[44px] cursor-pointer transition-colors duration-150
        ${isHighlighted 
          ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' 
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-l-4 border-transparent'
        }
      `}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Entity type badge and title */}
      <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-3 mb-2">
        {Icon && (
          <div className="flex-shrink-0 md:mt-0.5">
            <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}
              aria-label={`Entity type: ${entityConfig?.label || result.entity_type}`}
            >
              {entityConfig?.label || result.entity_type}
            </span>
          </div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
            {result.title}
          </h3>
        </div>
      </div>

      {/* Snippet with highlighted query terms */}
      {result.snippet && (
        <div
          className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2"
          dangerouslySetInnerHTML={{ __html: result.snippet }}
          aria-label={`Description: ${result.snippet.replace(/<[^>]*>/g, '')}`}
        />
      )}

      {/* Metadata - stack vertically on mobile */}
      {metadataEntries.length > 0 && (
        <div className="flex flex-col md:flex-row md:flex-wrap gap-2 md:gap-3 text-xs text-gray-500 dark:text-gray-500">
          {metadataEntries.map(([key, value]) => (
            <span key={key} className="flex items-center gap-1">
              <span className="font-medium capitalize">
                {key.replace(/_/g, ' ')}:
              </span>
              <span>{formatMetadataValue(key, value)}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResultItem;
