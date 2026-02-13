/**
 * Search feature exports
 * Central export point for all search-related functionality
 */

// Types
export type {
  SearchRequest,
  SearchResult,
  SearchResponse,
  EntityTypeConfig,
  RecentSearch,
} from './types/search.types';

// Constants
export {
  ENTITY_TYPE_CONFIGS,
  getEntityTypeConfig,
  getAllEntityTypes,
  isValidEntityType,
} from './constants/entityTypes';

export { searchKeys } from './constants/searchKeys';

// Components
export {
  GlobalSearch,
  LocalSearch,
  SearchResultItem,
  SearchEmptyState,
  SearchErrorState,
  SearchLoadingState,
} from './components';

export type {
  GlobalSearchProps,
  LocalSearchProps,
  SearchResultItemProps,
  SearchEmptyStateProps,
  SearchErrorStateProps,
} from './components';

// Hooks
export { useGlobalSearch } from './hooks/useGlobalSearch';
export { useLocalSearch } from './hooks/useLocalSearch';
export { useDebouncedValue } from './hooks/useDebouncedValue';
export { useKeyboardShortcut } from './hooks/useKeyboardShortcut';
export { useRecentSearches } from './hooks/useRecentSearches';
export { useSearchNavigation } from './hooks/useSearchNavigation';
export type { UseSearchNavigationReturn } from './hooks/useSearchNavigation';

// Services
export { SearchService } from './services/search.service';

// Config
export { queryClient } from './config/queryClient';
