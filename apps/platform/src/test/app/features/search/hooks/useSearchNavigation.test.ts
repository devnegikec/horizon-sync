/**
 * useSearchNavigation Hook Unit Tests
 * Tests for keyboard navigation through search results
 */

import { renderHook, act } from '@testing-library/react';
import { useSearchNavigation } from '../../../../../app/features/search/../../../../app/features/search/hooks/useSearchNavigation';
import { SearchResult } from '../../../../../app/features/search/types/search.types';

describe('useSearchNavigation', () => {
  // Mock search results for testing
  const mockResults: SearchResult[] = [
    {
      entity_id: '1',
      entity_type: 'items',
      title: 'Item 1',
      snippet: 'First item',
      relevance_score: 0.9,
      metadata: {},
    },
    {
      entity_id: '2',
      entity_type: 'items',
      title: 'Item 2',
      snippet: 'Second item',
      relevance_score: 0.8,
      metadata: {},
    },
    {
      entity_id: '3',
      entity_type: 'items',
      title: 'Item 3',
      snippet: 'Third item',
      relevance_score: 0.7,
      metadata: {},
    },
  ];

  it('should initialize with selectedIndex at 0', () => {
    const onSelect = jest.fn();
    const { result } = renderHook(() => useSearchNavigation(mockResults, onSelect));

    expect(result.current.selectedIndex).toBe(0);
  });

  it('should increment index when Arrow Down is pressed', () => {
    const onSelect = jest.fn();
    const { result } = renderHook(() => useSearchNavigation(mockResults, onSelect));

    // Create a mock keyboard event for Arrow Down
    const event = {
      key: 'ArrowDown',
      preventDefault: jest.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(event);
    });

    expect(result.current.selectedIndex).toBe(1);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should decrement index when Arrow Up is pressed', () => {
    const onSelect = jest.fn();
    const { result } = renderHook(() => useSearchNavigation(mockResults, onSelect));

    // First move to index 1
    const downEvent = {
      key: 'ArrowDown',
      preventDefault: jest.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(downEvent);
    });

    expect(result.current.selectedIndex).toBe(1);

    // Now press Arrow Up
    const upEvent = {
      key: 'ArrowUp',
      preventDefault: jest.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(upEvent);
    });

    expect(result.current.selectedIndex).toBe(0);
    expect(upEvent.preventDefault).toHaveBeenCalled();
  });

  it('should wrap to start when Arrow Down is pressed at the end', () => {
    const onSelect = jest.fn();
    const { result } = renderHook(() => useSearchNavigation(mockResults, onSelect));

    // Move to the last item (index 2)
    act(() => {
      result.current.setSelectedIndex(2);
    });

    expect(result.current.selectedIndex).toBe(2);

    // Press Arrow Down - should wrap to 0
    const event = {
      key: 'ArrowDown',
      preventDefault: jest.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(event);
    });

    expect(result.current.selectedIndex).toBe(0);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should wrap to end when Arrow Up is pressed at the start', () => {
    const onSelect = jest.fn();
    const { result } = renderHook(() => useSearchNavigation(mockResults, onSelect));

    // Start at index 0
    expect(result.current.selectedIndex).toBe(0);

    // Press Arrow Up - should wrap to last index (2)
    const event = {
      key: 'ArrowUp',
      preventDefault: jest.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(event);
    });

    expect(result.current.selectedIndex).toBe(2);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should call onSelect with current result when Enter is pressed', () => {
    const onSelect = jest.fn();
    const { result } = renderHook(() => useSearchNavigation(mockResults, onSelect));

    // Move to index 1
    act(() => {
      result.current.setSelectedIndex(1);
    });

    // Press Enter
    const event = {
      key: 'Enter',
      preventDefault: jest.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(event);
    });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(mockResults[1]);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should call onSelect with first result when Enter is pressed at index 0', () => {
    const onSelect = jest.fn();
    const { result } = renderHook(() => useSearchNavigation(mockResults, onSelect));

    // Press Enter at index 0
    const event = {
      key: 'Enter',
      preventDefault: jest.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(event);
    });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(mockResults[0]);
  });

  it('should not call onSelect when Enter is pressed with empty results', () => {
    const onSelect = jest.fn();
    const { result } = renderHook(() => useSearchNavigation([], onSelect));

    const event = {
      key: 'Enter',
      preventDefault: jest.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(event);
    });

    expect(onSelect).not.toHaveBeenCalled();
    // preventDefault is not called when results array is empty (early return)
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('should not navigate when results array is empty', () => {
    const onSelect = jest.fn();
    const { result } = renderHook(() => useSearchNavigation([], onSelect));

    const initialIndex = result.current.selectedIndex;

    // Try Arrow Down
    const downEvent = {
      key: 'ArrowDown',
      preventDefault: jest.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(downEvent);
    });

    expect(result.current.selectedIndex).toBe(initialIndex);
    expect(downEvent.preventDefault).not.toHaveBeenCalled();

    // Try Arrow Up
    const upEvent = {
      key: 'ArrowUp',
      preventDefault: jest.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(upEvent);
    });

    expect(result.current.selectedIndex).toBe(initialIndex);
    expect(upEvent.preventDefault).not.toHaveBeenCalled();
  });

  it('should ignore other keys', () => {
    const onSelect = jest.fn();
    const { result } = renderHook(() => useSearchNavigation(mockResults, onSelect));

    const initialIndex = result.current.selectedIndex;

    // Press a random key
    const event = {
      key: 'a',
      preventDefault: jest.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(event);
    });

    expect(result.current.selectedIndex).toBe(initialIndex);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('should allow manual setting of selectedIndex', () => {
    const onSelect = jest.fn();
    const { result } = renderHook(() => useSearchNavigation(mockResults, onSelect));

    act(() => {
      result.current.setSelectedIndex(2);
    });

    expect(result.current.selectedIndex).toBe(2);
  });

  it('should handle multiple Arrow Down presses correctly', () => {
    const onSelect = jest.fn();
    const { result } = renderHook(() => useSearchNavigation(mockResults, onSelect));

    // Press Arrow Down three times
    for (let i = 0; i < 3; i++) {
      const event = {
        key: 'ArrowDown',
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handleKeyDown(event);
      });
    }

    // Should wrap back to 0 (started at 0, moved to 1, 2, then wrapped to 0)
    expect(result.current.selectedIndex).toBe(0);
  });

  it('should handle multiple Arrow Up presses correctly', () => {
    const onSelect = jest.fn();
    const { result } = renderHook(() => useSearchNavigation(mockResults, onSelect));

    // Press Arrow Up three times
    for (let i = 0; i < 3; i++) {
      const event = {
        key: 'ArrowUp',
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handleKeyDown(event);
      });
    }

    // Should wrap: 0 -> 2 -> 1 -> 0
    expect(result.current.selectedIndex).toBe(0);
  });

  it('should update navigation when results change', () => {
    const onSelect = jest.fn();
    const { result, rerender } = renderHook(
      ({ results }) => useSearchNavigation(results, onSelect),
      { initialProps: { results: mockResults } }
    );

    // Move to index 1
    act(() => {
      result.current.setSelectedIndex(1);
    });

    expect(result.current.selectedIndex).toBe(1);

    // Update with new results (only 2 items)
    const newResults = mockResults.slice(0, 2);
    rerender({ results: newResults });

    // Press Arrow Down - should wrap to 0 (since we only have 2 items now)
    const event = {
      key: 'ArrowDown',
      preventDefault: jest.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(event);
    });

    expect(result.current.selectedIndex).toBe(0);
  });

  it('should prevent default behavior for navigation keys', () => {
    const onSelect = jest.fn();
    const { result } = renderHook(() => useSearchNavigation(mockResults, onSelect));

    const keys = ['ArrowDown', 'ArrowUp', 'Enter'];

    keys.forEach((key) => {
      const event = {
        key,
        preventDefault: jest.fn(),
      } as unknown as React.KeyboardEvent;

      act(() => {
        result.current.handleKeyDown(event);
      });

      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  it('should handle single result correctly', () => {
    const onSelect = jest.fn();
    const singleResult = [mockResults[0]];
    const { result } = renderHook(() => useSearchNavigation(singleResult, onSelect));

    // Arrow Down should wrap to 0
    const downEvent = {
      key: 'ArrowDown',
      preventDefault: jest.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(downEvent);
    });

    expect(result.current.selectedIndex).toBe(0);

    // Arrow Up should also stay at 0
    const upEvent = {
      key: 'ArrowUp',
      preventDefault: jest.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(upEvent);
    });

    expect(result.current.selectedIndex).toBe(0);

    // Enter should call onSelect with the single result
    const enterEvent = {
      key: 'Enter',
      preventDefault: jest.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(enterEvent);
    });

    expect(onSelect).toHaveBeenCalledWith(singleResult[0]);
  });
});
