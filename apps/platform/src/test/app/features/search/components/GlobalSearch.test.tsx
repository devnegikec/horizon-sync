/**
 * Unit Tests for GlobalSearch Component
 * 
 * Tests specific examples, edge cases, and user interactions
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GlobalSearch } from '../../../../../app/features/search/components/GlobalSearch';
import { SearchService } from '../../../../../app/features/search/services/search.service';
import type { SearchResponse } from '../../../../../app/features/search/types/search.types';

// Mock the SearchService
jest.mock('../../../../../app/features/search/services/search.service');

describe('GlobalSearch - Unit Tests', () => {
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
    localStorage.clear();
  });

  afterEach(() => {
    queryClient.clear();
  });

  /**
   * Test: Modal does not render when isOpen is false
   */
  it('should not render when isOpen is false', () => {
    const onCloseMock = jest.fn();

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <GlobalSearch
          isOpen={false}
          onClose={onCloseMock}
        />
      </QueryClientProvider>
    );

    // Modal should not be in the document
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).not.toBeInTheDocument();
  });

  /**
   * Test: Modal renders when isOpen is true
   */
  it('should render when isOpen is true', () => {
    const onCloseMock = jest.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <GlobalSearch
          isOpen={true}
          onClose={onCloseMock}
        />
      </QueryClientProvider>
    );

    // Modal should be in the document
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });

  /**
   * Test: Escape key closes modal
   * Requirements: 1.6
   */
  it('should close modal when Escape key is pressed', () => {
    const onCloseMock = jest.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <GlobalSearch
          isOpen={true}
          onClose={onCloseMock}
        />
      </QueryClientProvider>
    );

    // Press Escape key
    fireEvent.keyDown(document, { key: 'Escape' });

    // onClose should be called
    expect(onCloseMock).toHaveBeenCalled();
  });

  /**
   * Test: Clicking backdrop closes modal
   */
  it('should close modal when backdrop is clicked', () => {
    const onCloseMock = jest.fn();

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <GlobalSearch
          isOpen={true}
          onClose={onCloseMock}
        />
      </QueryClientProvider>
    );

    // Click on the backdrop
    const backdrop = container.querySelector('.fixed.inset-0.bg-black\\/50');
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    // onClose should be called
    expect(onCloseMock).toHaveBeenCalled();
  });

  /**
   * Test: Close button closes modal
   */
  it('should close modal when close button is clicked', () => {
    const onCloseMock = jest.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <GlobalSearch
          isOpen={true}
          onClose={onCloseMock}
        />
      </QueryClientProvider>
    );

    // Click the close button
    const closeButton = screen.getByLabelText('Close search');
    fireEvent.click(closeButton);

    // onClose should be called
    expect(onCloseMock).toHaveBeenCalled();
  });

  /**
   * Test: Recent searches display when input is empty
   * Requirements: 1.7
   */
  it('should display recent searches when input is empty', async () => {
    // Set up recent searches in localStorage
    const recentSearches = [
      { query: 'test query 1', timestamp: Date.now() },
      { query: 'test query 2', timestamp: Date.now() - 1000 },
    ];
    localStorage.setItem('erp_recent_searches', JSON.stringify(recentSearches));

    const onCloseMock = jest.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <GlobalSearch
          isOpen={true}
          onClose={onCloseMock}
        />
      </QueryClientProvider>
    );

    // Wait for recent searches to be displayed
    await waitFor(() => {
      const recentSearchesHeader = screen.getByText(/Recent Searches/i);
      expect(recentSearchesHeader).toBeInTheDocument();
    });

    // Verify recent searches are displayed
    expect(screen.getByText('test query 1')).toBeInTheDocument();
    expect(screen.getByText('test query 2')).toBeInTheDocument();
  });

  /**
   * Test: Clear button clears recent searches
   * Requirements: 8.7
   */
  it('should clear recent searches when clear button is clicked', async () => {
    // Set up recent searches in localStorage
    const recentSearches = [
      { query: 'test query 1', timestamp: Date.now() },
      { query: 'test query 2', timestamp: Date.now() - 1000 },
    ];
    localStorage.setItem('erp_recent_searches', JSON.stringify(recentSearches));

    const onCloseMock = jest.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <GlobalSearch
          isOpen={true}
          onClose={onCloseMock}
        />
      </QueryClientProvider>
    );

    // Wait for recent searches to be displayed
    await waitFor(() => {
      const recentSearchesHeader = screen.getByText(/Recent Searches/i);
      expect(recentSearchesHeader).toBeInTheDocument();
    });

    // Click the clear button
    const clearButton = screen.getByLabelText('Clear recent searches');
    fireEvent.click(clearButton);

    // Verify recent searches are cleared
    await waitFor(() => {
      expect(screen.queryByText('test query 1')).not.toBeInTheDocument();
      expect(screen.queryByText('test query 2')).not.toBeInTheDocument();
    });

    // Verify localStorage is cleared
    const stored = localStorage.getItem('erp_recent_searches');
    expect(stored).toBeNull();
  });

  /**
   * Test: Focus is set to search input when modal opens
   * Requirements: 5.6
   */
  it('should focus search input when modal opens', async () => {
    const onCloseMock = jest.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <GlobalSearch
          isOpen={true}
          onClose={onCloseMock}
        />
      </QueryClientProvider>
    );

    // Wait for input to be focused
    await waitFor(() => {
      const input = screen.getByLabelText('Search input');
      expect(input).toHaveFocus();
    }, { timeout: 500 });
  });

  /**
   * Test: Search is triggered when typing
   * Requirements: 1.3
   */
  it('should trigger search when typing in input', async () => {
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

    (SearchService.globalSearch as jest.Mock).mockResolvedValue(mockResponse);

    const onCloseMock = jest.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <GlobalSearch
          isOpen={true}
          onClose={onCloseMock}
        />
      </QueryClientProvider>
    );

    // Type in the search input
    const input = screen.getByLabelText('Search input');
    fireEvent.change(input, { target: { value: 'test query' } });

    // Wait for search to be called
    await waitFor(() => {
      expect(SearchService.globalSearch).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'test query' })
      );
    }, { timeout: 1000 });

    // Wait for results to be displayed
    await waitFor(() => {
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });
  });

  /**
   * Test: Results are grouped by entity type
   * Requirements: 1.4, 6.2
   */
  it('should group results by entity type', async () => {
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
        {
          entity_id: '2',
          entity_type: 'customers',
          title: 'Test Customer',
          snippet: 'Test snippet',
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

    (SearchService.globalSearch as jest.Mock).mockResolvedValue(mockResponse);

    const onCloseMock = jest.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <GlobalSearch
          isOpen={true}
          onClose={onCloseMock}
        />
      </QueryClientProvider>
    );

    // Type in the search input
    const input = screen.getByLabelText('Search input');
    fireEvent.change(input, { target: { value: 'test' } });

    // Wait for results to be displayed
    await waitFor(() => {
      expect(screen.getByText('Test Item')).toBeInTheDocument();
      expect(screen.getByText('Test Customer')).toBeInTheDocument();
    });

    // Verify entity type headers are present
    expect(screen.getByText(/Items.*\(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Customers.*\(1\)/i)).toBeInTheDocument();
  });

  /**
   * Test: Empty state is displayed when no results
   * Requirements: 1.9
   */
  it('should display empty state when no results are found', async () => {
    const mockResponse: SearchResponse = {
      results: [],
      total_count: 0,
      page: 1,
      page_size: 20,
      total_pages: 0,
      has_next_page: false,
      has_previous_page: false,
      query_time_ms: 50,
      suggestions: ['Try different keywords'],
    };

    (SearchService.globalSearch as jest.Mock).mockResolvedValue(mockResponse);

    const onCloseMock = jest.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <GlobalSearch
          isOpen={true}
          onClose={onCloseMock}
        />
      </QueryClientProvider>
    );

    // Type in the search input
    const input = screen.getByLabelText('Search input');
    fireEvent.change(input, { target: { value: 'nonexistent query' } });

    // Wait for empty state to be displayed
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /No results found/i })).toBeInTheDocument();
    });

    // Verify suggestions are displayed
    await waitFor(() => {
      expect(screen.getByText('Try different keywords')).toBeInTheDocument();
    });
  });

  /**
   * Test: Error state is displayed when search fails
   * Requirements: 1.10
   */
  it('should display error state when search fails', async () => {
    const errorMessage = 'Search service unavailable. Please try again later.';
    (SearchService.globalSearch as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const onCloseMock = jest.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <GlobalSearch
          isOpen={true}
          onClose={onCloseMock}
        />
      </QueryClientProvider>
    );

    // Type in the search input
    const input = screen.getByLabelText('Search input');
    fireEvent.change(input, { target: { value: 'test query' } });

    // Wait for error state to be displayed
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Verify retry button is present
    expect(screen.getByLabelText('Retry search')).toBeInTheDocument();
  });

  /**
   * Test: Loading state is displayed during search
   * Requirements: 7.1
   */
  it('should display loading state while search is in progress', async () => {
    // Create a promise that we can control
    let resolveSearch: (value: SearchResponse) => void;
    const searchPromise = new Promise<SearchResponse>((resolve) => {
      resolveSearch = resolve;
    });

    (SearchService.globalSearch as jest.Mock).mockReturnValue(searchPromise);

    const onCloseMock = jest.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <GlobalSearch
          isOpen={true}
          onClose={onCloseMock}
        />
      </QueryClientProvider>
    );

    // Type in the search input
    const input = screen.getByLabelText('Search input');
    fireEvent.change(input, { target: { value: 'test query' } });

    // Wait for debounce delay
    await new Promise(resolve => setTimeout(resolve, 350));

    // Verify loading state is displayed
    await waitFor(() => {
      expect(screen.getByText('Searching...')).toBeInTheDocument();
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

    // Verify loading state disappears
    await waitFor(() => {
      expect(screen.queryByText('Searching...')).not.toBeInTheDocument();
    });
  });

  /**
   * Test: Keyboard shortcut hint is visible on desktop
   * Requirements: 1.1
   */
  it('should display keyboard shortcut hint on desktop', () => {
    const onCloseMock = jest.fn();

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <GlobalSearch
          isOpen={true}
          onClose={onCloseMock}
        />
      </QueryClientProvider>
    );

    // Verify keyboard shortcut hint is present (hidden on mobile with sm: class)
    const shortcutHint = container.querySelector('.hidden.sm\\:flex');
    expect(shortcutHint).toBeInTheDocument();
  });

  /**
   * Test: Total count is displayed
   * Requirements: 6.6
   */
  it('should display total count of results', async () => {
    const mockResponse: SearchResponse = {
      results: [
        {
          entity_id: '1',
          entity_type: 'items',
          title: 'Test Item 1',
          snippet: 'Test snippet',
          relevance_score: 0.9,
          metadata: {},
        },
        {
          entity_id: '2',
          entity_type: 'items',
          title: 'Test Item 2',
          snippet: 'Test snippet',
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

    (SearchService.globalSearch as jest.Mock).mockResolvedValue(mockResponse);

    const onCloseMock = jest.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <GlobalSearch
          isOpen={true}
          onClose={onCloseMock}
        />
      </QueryClientProvider>
    );

    // Type in the search input
    const input = screen.getByLabelText('Search input');
    fireEvent.change(input, { target: { value: 'test' } });

    // Wait for results to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Found 2 results/i)).toBeInTheDocument();
    });
  });

  /**
   * Test: Search query is reset when modal closes
   */
  it('should reset search query when modal closes', async () => {
    const onCloseMock = jest.fn();

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <GlobalSearch
          isOpen={true}
          onClose={onCloseMock}
        />
      </QueryClientProvider>
    );

    // Type in the search input
    const input = screen.getByLabelText('Search input');
    fireEvent.change(input, { target: { value: 'test query' } });

    // Verify input has value
    expect(input).toHaveValue('test query');

    // Close the modal
    rerender(
      <QueryClientProvider client={queryClient}>
        <GlobalSearch
          isOpen={false}
          onClose={onCloseMock}
        />
      </QueryClientProvider>
    );

    // Reopen the modal
    rerender(
      <QueryClientProvider client={queryClient}>
        <GlobalSearch
          isOpen={true}
          onClose={onCloseMock}
        />
      </QueryClientProvider>
    );

    // Verify input is cleared
    const newInput = screen.getByLabelText('Search input');
    expect(newInput).toHaveValue('');
  });

  /**
   * Test: Pagination controls are displayed when total_count > 20
   * Requirements: 6.5
   */
  it('should display pagination controls when total_count > 20', async () => {
    const mockResponse: SearchResponse = {
      results: Array.from({ length: 20 }, (_, i) => ({
        entity_id: `${i + 1}`,
        entity_type: 'items',
        title: `Test Item ${i + 1}`,
        snippet: 'Test snippet',
        relevance_score: 0.9,
        metadata: {},
      })),
      total_count: 50,
      page: 1,
      page_size: 20,
      total_pages: 3,
      has_next_page: true,
      has_previous_page: false,
      query_time_ms: 50,
    };

    (SearchService.globalSearch as jest.Mock).mockResolvedValue(mockResponse);

    const onCloseMock = jest.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <GlobalSearch
          isOpen={true}
          onClose={onCloseMock}
        />
      </QueryClientProvider>
    );

    // Type in the search input
    const input = screen.getByLabelText('Search input');
    fireEvent.change(input, { target: { value: 'test' } });

    // Wait for results to be displayed
    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    // Verify pagination controls are displayed
    expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
    expect(screen.getByLabelText('Next page')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });

  /**
   * Test: Pagination controls are not displayed when total_count <= 20
   * Requirements: 6.5
   */
  it('should not display pagination controls when total_count <= 20', async () => {
    const mockResponse: SearchResponse = {
      results: Array.from({ length: 10 }, (_, i) => ({
        entity_id: `${i + 1}`,
        entity_type: 'items',
        title: `Test Item ${i + 1}`,
        snippet: 'Test snippet',
        relevance_score: 0.9,
        metadata: {},
      })),
      total_count: 10,
      page: 1,
      page_size: 20,
      total_pages: 1,
      has_next_page: false,
      has_previous_page: false,
      query_time_ms: 50,
    };

    (SearchService.globalSearch as jest.Mock).mockResolvedValue(mockResponse);

    const onCloseMock = jest.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <GlobalSearch
          isOpen={true}
          onClose={onCloseMock}
        />
      </QueryClientProvider>
    );

    // Type in the search input
    const input = screen.getByLabelText('Search input');
    fireEvent.change(input, { target: { value: 'test' } });

    // Wait for results to be displayed
    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    // Verify pagination controls are not displayed
    expect(screen.queryByLabelText('Previous page')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Next page')).not.toBeInTheDocument();
  });

  /**
   * Test: Next button navigates to next page
   * Requirements: 6.4
   */
  it('should navigate to next page when next button is clicked', async () => {
    const mockPage1Response: SearchResponse = {
      results: Array.from({ length: 20 }, (_, i) => ({
        entity_id: `${i + 1}`,
        entity_type: 'items',
        title: `Test Item ${i + 1}`,
        snippet: 'Test snippet',
        relevance_score: 0.9,
        metadata: {},
      })),
      total_count: 50,
      page: 1,
      page_size: 20,
      total_pages: 3,
      has_next_page: true,
      has_previous_page: false,
      query_time_ms: 50,
    };

    const mockPage2Response: SearchResponse = {
      results: Array.from({ length: 20 }, (_, i) => ({
        entity_id: `${i + 21}`,
        entity_type: 'items',
        title: `Test Item ${i + 21}`,
        snippet: 'Test snippet',
        relevance_score: 0.9,
        metadata: {},
      })),
      total_count: 50,
      page: 2,
      page_size: 20,
      total_pages: 3,
      has_next_page: true,
      has_previous_page: true,
      query_time_ms: 50,
    };

    (SearchService.globalSearch as jest.Mock)
      .mockResolvedValueOnce(mockPage1Response)
      .mockResolvedValueOnce(mockPage2Response);

    const onCloseMock = jest.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <GlobalSearch
          isOpen={true}
          onClose={onCloseMock}
        />
      </QueryClientProvider>
    );

    // Type in the search input
    const input = screen.getByLabelText('Search input');
    fireEvent.change(input, { target: { value: 'test' } });

    // Wait for page 1 results to be displayed
    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });

    // Click next button
    const nextButton = screen.getByLabelText('Next page');
    fireEvent.click(nextButton);

    // Wait for page 2 results to be displayed
    await waitFor(() => {
      expect(screen.getByText('Test Item 21')).toBeInTheDocument();
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    });
  });

  /**
   * Test: Previous button navigates to previous page
   * Requirements: 6.4
   */
  it('should navigate to previous page when previous button is clicked', async () => {
    const mockPage2Response: SearchResponse = {
      results: Array.from({ length: 20 }, (_, i) => ({
        entity_id: `${i + 21}`,
        entity_type: 'items',
        title: `Test Item ${i + 21}`,
        snippet: 'Test snippet',
        relevance_score: 0.9,
        metadata: {},
      })),
      total_count: 50,
      page: 2,
      page_size: 20,
      total_pages: 3,
      has_next_page: true,
      has_previous_page: true,
      query_time_ms: 50,
    };

    const mockPage1Response: SearchResponse = {
      results: Array.from({ length: 20 }, (_, i) => ({
        entity_id: `${i + 1}`,
        entity_type: 'items',
        title: `Test Item ${i + 1}`,
        snippet: 'Test snippet',
        relevance_score: 0.9,
        metadata: {},
      })),
      total_count: 50,
      page: 1,
      page_size: 20,
      total_pages: 3,
      has_next_page: true,
      has_previous_page: false,
      query_time_ms: 50,
    };

    (SearchService.globalSearch as jest.Mock)
      .mockResolvedValueOnce(mockPage2Response)
      .mockResolvedValueOnce(mockPage1Response);

    const onCloseMock = jest.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <GlobalSearch
          isOpen={true}
          onClose={onCloseMock}
        />
      </QueryClientProvider>
    );

    // Type in the search input
    const input = screen.getByLabelText('Search input');
    fireEvent.change(input, { target: { value: 'test' } });

    // Wait for page 2 results to be displayed
    await waitFor(() => {
      expect(screen.getByText('Test Item 21')).toBeInTheDocument();
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    });

    // Click previous button
    const previousButton = screen.getByLabelText('Previous page');
    fireEvent.click(previousButton);

    // Wait for page 1 results to be displayed
    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    });
  });

  /**
   * Test: Previous button is disabled on first page
   * Requirements: 6.4
   */
  it('should disable previous button on first page', async () => {
    const mockResponse: SearchResponse = {
      results: Array.from({ length: 20 }, (_, i) => ({
        entity_id: `${i + 1}`,
        entity_type: 'items',
        title: `Test Item ${i + 1}`,
        snippet: 'Test snippet',
        relevance_score: 0.9,
        metadata: {},
      })),
      total_count: 50,
      page: 1,
      page_size: 20,
      total_pages: 3,
      has_next_page: true,
      has_previous_page: false,
      query_time_ms: 50,
    };

    (SearchService.globalSearch as jest.Mock).mockResolvedValue(mockResponse);

    const onCloseMock = jest.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <GlobalSearch
          isOpen={true}
          onClose={onCloseMock}
        />
      </QueryClientProvider>
    );

    // Type in the search input
    const input = screen.getByLabelText('Search input');
    fireEvent.change(input, { target: { value: 'test' } });

    // Wait for results to be displayed
    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    });

    // Verify previous button is disabled
    const previousButton = screen.getByLabelText('Previous page');
    expect(previousButton).toBeDisabled();
  });

  /**
   * Test: Next button is disabled on last page
   * Requirements: 6.4
   */
  it('should disable next button on last page', async () => {
    const mockResponse: SearchResponse = {
      results: Array.from({ length: 10 }, (_, i) => ({
        entity_id: `${i + 41}`,
        entity_type: 'items',
        title: `Test Item ${i + 41}`,
        snippet: 'Test snippet',
        relevance_score: 0.9,
        metadata: {},
      })),
      total_count: 50,
      page: 3,
      page_size: 20,
      total_pages: 3,
      has_next_page: false,
      has_previous_page: true,
      query_time_ms: 50,
    };

    (SearchService.globalSearch as jest.Mock).mockResolvedValue(mockResponse);

    const onCloseMock = jest.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <GlobalSearch
          isOpen={true}
          onClose={onCloseMock}
        />
      </QueryClientProvider>
    );

    // Type in the search input
    const input = screen.getByLabelText('Search input');
    fireEvent.change(input, { target: { value: 'test' } });

    // Wait for results to be displayed
    await waitFor(() => {
      expect(screen.getByText('Test Item 41')).toBeInTheDocument();
    });

    // Verify next button is disabled
    const nextButton = screen.getByLabelText('Next page');
    expect(nextButton).toBeDisabled();
  });

  /**
   * Test: Page resets to 1 when search query changes
   * Requirements: 6.4
   */
  it('should reset to page 1 when search query changes', async () => {
    const mockResponse1: SearchResponse = {
      results: Array.from({ length: 20 }, (_, i) => ({
        entity_id: `${i + 21}`,
        entity_type: 'items',
        title: `Test Item ${i + 21}`,
        snippet: 'Test snippet',
        relevance_score: 0.9,
        metadata: {},
      })),
      total_count: 50,
      page: 2,
      page_size: 20,
      total_pages: 3,
      has_next_page: true,
      has_previous_page: true,
      query_time_ms: 50,
    };

    const mockResponse2: SearchResponse = {
      results: Array.from({ length: 20 }, (_, i) => ({
        entity_id: `${i + 1}`,
        entity_type: 'customers',
        title: `Test Customer ${i + 1}`,
        snippet: 'Test snippet',
        relevance_score: 0.9,
        metadata: {},
      })),
      total_count: 30,
      page: 1,
      page_size: 20,
      total_pages: 2,
      has_next_page: true,
      has_previous_page: false,
      query_time_ms: 50,
    };

    (SearchService.globalSearch as jest.Mock)
      .mockResolvedValueOnce(mockResponse1)
      .mockResolvedValueOnce(mockResponse2);

    const onCloseMock = jest.fn();

    render(
      <QueryClientProvider client={queryClient}>
        <GlobalSearch
          isOpen={true}
          onClose={onCloseMock}
        />
      </QueryClientProvider>
    );

    // Type in the search input
    const input = screen.getByLabelText('Search input');
    fireEvent.change(input, { target: { value: 'test' } });

    // Wait for page 2 results to be displayed
    await waitFor(() => {
      expect(screen.getByText('Test Item 21')).toBeInTheDocument();
      expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    });

    // Change the search query
    fireEvent.change(input, { target: { value: 'customer' } });

    // Wait for new results on page 1
    await waitFor(() => {
      expect(screen.getByText('Test Customer 1')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    });
  });
});
