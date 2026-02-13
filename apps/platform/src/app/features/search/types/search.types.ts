/**
 * Search feature type definitions
 * Matches the backend search-service API schemas
 */

/**
 * Search request payload
 */
export interface SearchRequest {
  query: string;
  entity_types?: string[];
  filters?: Record<string, unknown>;
  page?: number;
  page_size?: number;
  sort?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Individual search result item
 */
export interface SearchResult {
  entity_id: string;
  entity_type: string;
  title: string;
  snippet: string;
  relevance_score: number;
  metadata: Record<string, unknown>;
}

/**
 * Search response from API
 */
export interface SearchResponse {
  results: SearchResult[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next_page: boolean;
  has_previous_page: boolean;
  query_time_ms: number;
  suggestions?: string[];
}

/**
 * Entity type configuration for UI display
 */
export interface EntityTypeConfig {
  type: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  route: string;
}

/**
 * Recent search item stored in localStorage
 */
export interface RecentSearch {
  query: string;
  timestamp: number;
}
