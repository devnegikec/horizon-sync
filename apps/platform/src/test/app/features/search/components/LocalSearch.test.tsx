/**
 * Unit Tests for LocalSearch Component
 * 
 * Tests specific examples, edge cases, and user interactions
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocalSearch } from '../../../../../app/features/search/../../../../app/features/search/components/LocalSearch';
import { SearchService } from '../../../../../app/features/search/services/search.service';
import type { SearchResponse } from '../../../../../app/features/search/types/search.types';

// Mock the SearchService
jest.mock('../../../../../app/features/search/services/search.service');

describe('LocalSearch - Unit Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  /**
   * Test: Clear button clears input
   * Requirements: 2.3, 2.4
   */
  it('should clear input when clear button is clicked', async () => {
    const onResultsChangeMock = jest.fn();

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <LocalSearch
          entityType="items"
          onResultsChange={onResultsChangeMock}
          placeholder="Search items..."
        />
      </QueryClientProvider>
    );

    // Type in the search input
    const input = screen.getByLabelText('Search items');
    fireEvent.change(input, { target: { value: 'test query' } });

    // Verify input has value
    expect(input).toHaveValue('test query');

    // Wait for clear button to appear
    await waitFor(() => {
      const clearButton = screen.getByLabelText('Clear search');
      expect(clearButton).toBeInTheDocument();
    });

    // Click the clear button
    const clearButton = screen.getByLabelText('Clear search');
    fireEvent.click(clearButton);

    // Verify input is cleared
    expect(input).toHaveValue('');

    // Verify clear button is no longer visible
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });

  /**
   * Test: Clear button calls onResultsChange with empty array
   * Requirements: 2.3, 2.4
   */
  it('should call onResultsChange with empty array when clear button is clicked', async () => {
    const onResultsChangeMock = jest.fn();

    const mockResponse: SearchResponse = {
      results: [
        {
          entity_id: '1',
          entity_type: 'items',
          title: 'Test Item',
          snippet: 'Test snippet',
          relevance_score: 0.9,
          metadata: {},
        },
      ],
      total_count: 1,
      page: 1,
      page_size: 20,
      total_pages: 1,
      has_next_page: false,
      has_previous_page: false,
      query_time_ms: 50,
    };

    (SearchService.localSearch as jest.Mock).mockResolvedValue(mockResponse);

    render(
      <QueryClientProvider client={queryClient}>
        <LocalSearch
          entityType="items"
          onResultsChange={onResultsChangeMock}
          placeholder="Search items..."
        />
      </QueryClientProvider>
    );

    // Type in the search input
    const input = screen.getByLabelText('Search items');
    fireEvent.change(input, { target: { value: 'test' } });

    // Wait for search to complete
    await waitFor(() => {
      expect(SearchService.localSearch).toHaveBeenCalled();
    });

    // Wait for onResultsChange to be called with results
    await waitFor(() => {
      expect(onResultsChangeMock).toHaveBeenCalledWith(mockResponse.results);
    });

    // Clear the mock to track new calls
    onResultsChangeMock.mockClear();

    // Click the clear button
    const clearButton = screen.getByLabelText('Clear search');
    fireEvent.click(clearButton);

    // Verify onResultsChange is called with empty array
    await waitFor(() => {
      expect(onResultsChangeMock).toHaveBeenCalledWith([]);
    });
  });

  /**
   * Test: ARIA labels are present
   * Requirements: 5.5
   */
  it('should have proper ARIA labels for accessibility', () => {
    const onResultsChangeMock = jest.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <LocalSearch
          entityType="customers"
          onResultsChange={onResultsChangeMock}
          placeholder="Search customers..."
        />
      </QueryClientProvider>
    );

    // Verify search input has aria-label
    const input = screen.getByLabelText('Search customers');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-label', 'Search customers');

    // Verify search icon is hidden from screen readers
    const searchIcon = document.querySelector('[aria-hidden="true"]');
    expect(searchIcon).toBeInTheDocument();
  });

  /**
   * Test: Loading indicator displays during search
   * Requirements: 2.5
   */
  it('should display loading indicator while search is in progress', async () => {
    // Create a promise that we can control
    let resolveSearch: (value: SearchResponse) => void;
    const searchPromise = new Promise<SearchResponse>((resolve) => {
      resolveSearch = resolve;
    });

    (SearchService.localSearch as jest.Mock).mockReturnValue(searchPromise);

    const onResultsChangeMock = jest.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <LocalSearch
          entityType="items"
          onResultsChange={onResultsChangeMock}
          placeholder="Search items..."
        />
      </QueryClientProvider>
    );

    // Type in the search input
    const input = screen.getByLabelText('Search items');
    fireEvent.change(input, { target: { value: 'test query' } });

    // Wait for debounce delay
    await new Promise(resolve => setTimeout(resolve, 350));

    // Verify loading indicator is visible
    await waitFor(() => {
      const loadingIndicator = screen.getByLabelText('Loading search results');
      expect(loadingIndicator).toBeInTheDocument();
    });

    // Resolve the search
    const mockResponse: SearchResponse = {
      results: [],
      total_count: 0,
      page: 1,
      page_size: 20,
      total_pages: 0,
      has_next_page: false,
      has_previous_page: false,
      query_time_ms: 50,
    };
    resolveSearch!(mockResponse);

    // Verify loading indicator disappears
    await waitFor(() => {
      expect(screen.queryByLabelText('Loading search results')).not.toBeInTheDocument();
    });
  });

  /**
   * Test: Error message displays on search failure
   * Requirements: 2.7
   */
  it('should display error message when search fails', async () => {
    const errorMessage = 'Search service unavailable. Please try again later.';
    (SearchService.localSearch as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const onResultsChangeMock = jest.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <LocalSearch
          entityType="items"
          onResultsChange={onResultsChangeMock}
          placeholder="Search items..."
        />
      </QueryClientProvider>
    );

    // Type in the search input
    const input = screen.getByLabelText('Search items');
    fireEvent.change(input, { target: { value: 'test query' } });

    // Wait for search to fail
    await waitFor(() => {
      expect(SearchService.localSearch).toHaveBeenCalled();
    });

    // Verify error message is displayed
    await waitFor(() => {
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent(errorMessage);
    });

    // Verify input has error styling (aria-describedby points to error)
    expect(input).toHaveAttribute('aria-describedby', 'items-search-error');
  });

  /**
   * Test: Custom placeholder is used
   */
  it('should use custom placeholder when provided', () => {
    const onResultsChangeMock = jest.fn();
    const customPlaceholder = 'Find your items...';

    render(
      <QueryClientProvider client={queryClient}>
        <LocalSearch
          entityType="items"
          onResultsChange={onResultsChangeMock}
          placeholder={customPlaceholder}
        />
      </QueryClientProvider>
    );

    const input = screen.getByPlaceholderText(customPlaceholder);
    expect(input).toBeInTheDocument();
  });

  /**
   * Test: Custom className is applied
   */
  it('should apply custom className when provided', () => {
    const onResultsChangeMock = jest.fn();
    const customClassName = 'my-custom-class';

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <LocalSearch
          entityType="items"
          onResultsChange={onResultsChangeMock}
          className={customClassName}
        />
      </QueryClientProvider>
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass(customClassName);
  });

  /**
   * Test: Clear button is not visible when input is empty
   */
  it('should not show clear button when input is empty', () => {
    const onResultsChangeMock = jest.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <LocalSearch
          entityType="items"
          onResultsChange={onResultsChangeMock}
          placeholder="Search items..."
        />
      </QueryClientProvider>
    );

    // Verify clear button is not visible
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });

  /**
   * Test: Search is not triggered for queries shorter than 2 characters
   */
  it('should not trigger search for queries shorter than 2 characters', async () => {
    const onResultsChangeMock = jest.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <LocalSearch
          entityType="items"
          onResultsChange={onResultsChangeMock}
          placeholder="Search items..."
        />
      </QueryClientProvider>
    );

    // Type a single character
    const input = screen.getByLabelText('Search items');
    fireEvent.change(input, { target: { value: 'a' } });

    // Wait for debounce delay
    await new Promise(resolve => setTimeout(resolve, 350));

    // Verify SearchService was not called
    expect(SearchService.localSearch).not.toHaveBeenCalled();
  });

  /**
   * Test: onResultsChange is called when data changes
   */
  it('should call onResultsChange when search results are received', async () => {
    const mockResponse: SearchResponse = {
      results: [
        {
          entity_id: '1',
          entity_type: 'items',
          title: 'Test Item 1',
          snippet: 'Test snippet 1',
          relevance_score: 0.9,
          metadata: {},
        },
        {
          entity_id: '2',
          entity_type: 'items',
          title: 'Test Item 2',
          snippet: 'Test snippet 2',
          relevance_score: 0.8,
          metadata: {},
        },
      ],
      total_count: 2,
      page: 1,
      page_size: 20,
      total_pages: 1,
      has_next_page: false,
      has_previous_page: false,
      query_time_ms: 50,
    };

    (SearchService.localSearch as jest.Mock).mockResolvedValue(mockResponse);

    const onResultsChangeMock = jest.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <LocalSearch
          entityType="items"
          onResultsChange={onResultsChangeMock}
          placeholder="Search items..."
        />
      </QueryClientProvider>
    );

    // Type in the search input
    const input = screen.getByLabelText('Search items');
    fireEvent.change(input, { target: { value: 'test' } });

    // Wait for search to complete
    await waitFor(() => {
      expect(SearchService.localSearch).toHaveBeenCalled();
    });

    // Verify onResultsChange was called with the results
    await waitFor(() => {
      expect(onResultsChangeMock).toHaveBeenCalledWith(mockResponse.results);
    });
  });
});
