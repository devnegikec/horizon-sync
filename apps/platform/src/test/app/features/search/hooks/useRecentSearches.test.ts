import { renderHook, act } from '@testing-library/react';
import { useRecentSearches } from '../../../../../app/features/search/../../../../app/features/search/hooks/useRecentSearches';

describe('useRecentSearches', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with empty array when localStorage is empty', () => {
      const { result } = renderHook(() => useRecentSearches());
      expect(result.current.recentSearches).toEqual([]);
    });

    it('should load existing searches from localStorage on mount', () => {
      const existingSearches = [
        { query: 'test query', timestamp: Date.now() },
        { query: 'another search', timestamp: Date.now() - 1000 },
      ];
      localStorage.setItem('erp_recent_searches', JSON.stringify(existingSearches));

      const { result } = renderHook(() => useRecentSearches());
      expect(result.current.recentSearches).toEqual(existingSearches);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('erp_recent_searches', 'invalid json');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useRecentSearches());
      expect(result.current.recentSearches).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('addSearch', () => {
    it('should add a new search to the top of the list', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addSearch('first search');
      });

      expect(result.current.recentSearches).toHaveLength(1);
      expect(result.current.recentSearches[0].query).toBe('first search');
    });

    it('should trim whitespace from queries', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addSearch('  test query  ');
      });

      expect(result.current.recentSearches[0].query).toBe('test query');
    });

    it('should ignore empty or whitespace-only queries', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addSearch('');
      });
      expect(result.current.recentSearches).toHaveLength(0);

      act(() => {
        result.current.addSearch('   ');
      });
      expect(result.current.recentSearches).toHaveLength(0);
    });

    it('should maintain maximum of 5 searches', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addSearch('search 1');
        result.current.addSearch('search 2');
        result.current.addSearch('search 3');
        result.current.addSearch('search 4');
        result.current.addSearch('search 5');
        result.current.addSearch('search 6');
      });

      expect(result.current.recentSearches).toHaveLength(5);
      expect(result.current.recentSearches[0].query).toBe('search 6');
      expect(result.current.recentSearches[4].query).toBe('search 2');
    });

    it('should remove oldest search when limit is exceeded', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addSearch('oldest');
        result.current.addSearch('search 2');
        result.current.addSearch('search 3');
        result.current.addSearch('search 4');
        result.current.addSearch('search 5');
        result.current.addSearch('newest');
      });

      const queries = result.current.recentSearches.map((s) => s.query);
      expect(queries).not.toContain('oldest');
      expect(queries).toContain('newest');
    });

    it('should move duplicate search to top of list', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addSearch('first');
        result.current.addSearch('second');
        result.current.addSearch('third');
      });

      expect(result.current.recentSearches[0].query).toBe('third');
      expect(result.current.recentSearches[1].query).toBe('second');
      expect(result.current.recentSearches[2].query).toBe('first');

      act(() => {
        result.current.addSearch('first');
      });

      expect(result.current.recentSearches).toHaveLength(3);
      expect(result.current.recentSearches[0].query).toBe('first');
      expect(result.current.recentSearches[1].query).toBe('third');
      expect(result.current.recentSearches[2].query).toBe('second');
    });

    it('should not create duplicate entries', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addSearch('duplicate');
        result.current.addSearch('other');
        result.current.addSearch('duplicate');
      });

      const queries = result.current.recentSearches.map((s) => s.query);
      const duplicateCount = queries.filter((q) => q === 'duplicate').length;
      expect(duplicateCount).toBe(1);
    });

    it('should persist searches to localStorage', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addSearch('test query');
      });

      const stored = localStorage.getItem('erp_recent_searches');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].query).toBe('test query');
    });

    it('should include timestamp when adding search', () => {
      const { result } = renderHook(() => useRecentSearches());
      const beforeTime = Date.now();

      act(() => {
        result.current.addSearch('test');
      });

      const afterTime = Date.now();
      const timestamp = result.current.recentSearches[0].timestamp;
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should handle localStorage errors gracefully', () => {
      const { result } = renderHook(() => useRecentSearches());
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock localStorage.setItem to throw an error
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      act(() => {
        result.current.addSearch('test');
      });

      expect(consoleSpy).toHaveBeenCalled();
      expect(result.current.recentSearches).toHaveLength(1);

      // Restore
      Storage.prototype.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });
  });

  describe('clearSearches', () => {
    it('should clear all searches from state', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addSearch('search 1');
        result.current.addSearch('search 2');
      });

      expect(result.current.recentSearches).toHaveLength(2);

      act(() => {
        result.current.clearSearches();
      });

      expect(result.current.recentSearches).toHaveLength(0);
    });

    it('should remove searches from localStorage', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addSearch('test');
      });

      expect(localStorage.getItem('erp_recent_searches')).toBeTruthy();

      act(() => {
        result.current.clearSearches();
      });

      expect(localStorage.getItem('erp_recent_searches')).toBeNull();
    });

    it('should handle localStorage errors gracefully', () => {
      const { result } = renderHook(() => useRecentSearches());
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock localStorage.removeItem to throw an error
      const originalRemoveItem = Storage.prototype.removeItem;
      Storage.prototype.removeItem = jest.fn(() => {
        throw new Error('Storage error');
      });

      act(() => {
        result.current.addSearch('test');
        result.current.clearSearches();
      });

      expect(consoleSpy).toHaveBeenCalled();
      expect(result.current.recentSearches).toHaveLength(0);

      // Restore
      Storage.prototype.removeItem = originalRemoveItem;
      consoleSpy.mockRestore();
    });
  });

  describe('Requirements validation', () => {
    it('should validate Requirement 8.1: Store query in localStorage', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addSearch('test query');
      });

      const stored = localStorage.getItem('erp_recent_searches');
      expect(stored).toBeTruthy();
    });

    it('should validate Requirement 8.2: Maintain maximum of 5 searches', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        for (let i = 1; i <= 10; i++) {
          result.current.addSearch(`search ${i}`);
        }
      });

      expect(result.current.recentSearches.length).toBeLessThanOrEqual(5);
    });

    it('should validate Requirement 8.3: Remove oldest when limit exceeded', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addSearch('oldest');
        result.current.addSearch('search 2');
        result.current.addSearch('search 3');
        result.current.addSearch('search 4');
        result.current.addSearch('search 5');
        result.current.addSearch('newest');
      });

      const queries = result.current.recentSearches.map((s) => s.query);
      expect(queries).not.toContain('oldest');
    });

    it('should validate Requirement 8.4: Move duplicate to top', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addSearch('first');
        result.current.addSearch('second');
        result.current.addSearch('first');
      });

      expect(result.current.recentSearches[0].query).toBe('first');
      expect(result.current.recentSearches).toHaveLength(2);
    });

    it('should validate Requirement 8.7: Provide way to clear searches', () => {
      const { result } = renderHook(() => useRecentSearches());

      act(() => {
        result.current.addSearch('test');
        result.current.clearSearches();
      });

      expect(result.current.recentSearches).toHaveLength(0);
      expect(localStorage.getItem('erp_recent_searches')).toBeNull();
    });
  });
});
