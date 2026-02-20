/**
 * React Query key factory functions for search queries
 * Provides consistent query key generation for caching and invalidation
 */

/**
 * Search query keys factory
 */
export const searchKeys = {
  /**
   * Base key for all search queries
   */
  all: ['search'] as const,

  /**
   * Key for global search queries
   * @param query - Search query string
   */
  global: (query: string) => [...searchKeys.all, 'global', query] as const,

  /**
   * Key for local (entity-specific) search queries
   * @param entityType - Entity type to search within
   * @param query - Search query string
   */
  local: (entityType: string, query: string) =>
    [...searchKeys.all, 'local', entityType, query] as const,
};
