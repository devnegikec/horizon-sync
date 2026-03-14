/**
 * SearchableSelect Component Tests
 * Comprehensive test suite for the SearchableSelect component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SearchableSelect } from './SearchableSelect';
import { useLocalSearch } from '../hooks/useLocalSearch';

// Mock the useLocalSearch hook
jest.mock('../hooks/useLocalSearch');

const mockUseLocalSearch = useLocalSearch as jest.MockedFunction<typeof useLocalSearch>;

// Mock data
const mockItems = [
    { id: '1', item_name: 'Widget A', item_sku: 'WID-001' },
    { id: '2', item_name: 'Widget B', item_sku: 'WID-002' },
    { id: '3', item_name: 'Gadget C', item_sku: 'GAD-001' },
];

const mockSearchResults = {
    results: [
        { entity_id: '1', entity_type: 'items', title: 'Widget A', snippet: 'WID-001', relevance_score: 0.9, metadata: {} },
    ],
    total_count: 1,
    page: 1,
    page_size: 20,
    total_pages: 1,
    has_next_page: false,
    has_previous_page: false,
    query_time_ms: 10,
};

// Test wrapper with QueryClient
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });

    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

describe('SearchableSelect', () => {
    const mockListFetcher = jest.fn();
    const mockOnValueChange = jest.fn();
    const mockLabelFormatter = (item: typeof mockItems[0]) => `${item.item_name} (${item.item_sku})`;

    beforeEach(() => {
        jest.clearAllMocks();
        mockListFetcher.mockResolvedValue(mockItems);
        mockUseLocalSearch.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: false,
            error: null,
            refetch: jest.fn(),
        });
    });

    describe('Rendering', () => {
        it('should render with placeholder when no value selected', () => {
            render(
                <SearchableSelect
                    entityType="items"
                    value={undefined}
                    onValueChange={mockOnValueChange}
                    listFetcher={mockListFetcher}
                    labelFormatter={mockLabelFormatter}
                    placeholder="Select an item..."
                />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByText('Select an item...')).toBeInTheDocument();
        });

        it('should render with selected value label', () => {
            render(
                <SearchableSelect
                    entityType="items"
                    value="1"
                    onValueChange={mockOnValueChange}
                    listFetcher={mockListFetcher}
                    labelFormatter={mockLabelFormatter}
                    items={mockItems}
                />,
                { wrapper: createWrapper() }
            );

            expect(screen.getByText('Widget A (WID-001)')).toBeInTheDocument();
        });

        it('should be disabled when disabled prop is true', () => {
            render(
                <SearchableSelect
                    entityType="items"
                    value={undefined}
                    onValueChange={mockOnValueChange}
                    listFetcher={mockListFetcher}
                    labelFormatter={mockLabelFormatter}
                    disabled={true}
                />,
                { wrapper: createWrapper() }
            );

            const button = screen.getByRole('button');
            expect(button).toBeDisabled();
        });
    });

    describe('Dropdown Interaction', () => {
        it('should open dropdown when clicked', async () => {
            render(
                <SearchableSelect
                    entityType="items"
                    value={undefined}
                    onValueChange={mockOnValueChange}
                    listFetcher={mockListFetcher}
                    labelFormatter={mockLabelFormatter}
                    items={mockItems}
                />,
                { wrapper: createWrapper() }
            );

            const button = screen.getByRole('button');
            fireEvent.click(button);

            await waitFor(() => {
                expect(screen.getByRole('listbox')).toBeInTheDocument();
            });
        });

        it('should display all items in dropdown', async () => {
            render(
                <SearchableSelect
                    entityType="items"
                    value={undefined}
                    onValueChange={mockOnValueChange}
                    listFetcher={mockListFetcher}
                    labelFormatter={mockLabelFormatter}
                    items={mockItems}
                />,
                { wrapper: createWrapper() }
            );

            const button = screen.getByRole('button');
            fireEvent.click(button);

            await waitFor(() => {
                expect(screen.getByText('Widget A (WID-001)')).toBeInTheDocument();
                expect(screen.getByText('Widget B (WID-002)')).toBeInTheDocument();
                expect(screen.getByText('Gadget C (GAD-001)')).toBeInTheDocument();
            });
        });

        it('should close dropdown when clicking outside', async () => {
            render(
                <div>
                    <SearchableSelect
                        entityType="items"
                        value={undefined}
                        onValueChange={mockOnValueChange}
                        listFetcher={mockListFetcher}
                        labelFormatter={mockLabelFormatter}
                        items={mockItems}
                    />
                    <div data-testid="outside">Outside</div>
                </div>,
                { wrapper: createWrapper() }
            );

            const button = screen.getByRole('button');
            fireEvent.click(button);

            await waitFor(() => {
                expect(screen.getByRole('listbox')).toBeInTheDocument();
            });

            const outside = screen.getByTestId('outside');
            fireEvent.mouseDown(outside);

            await waitFor(() => {
                expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
            });
        });
    });

    describe('Search Functionality', () => {
        it('should filter items based on search query', async () => {
            mockUseLocalSearch.mockReturnValue({
                data: mockSearchResults,
                isLoading: false,
                isError: false,
                error: null,
                refetch: jest.fn(),
            });

            render(
                <SearchableSelect
                    entityType="items"
                    value={undefined}
                    onValueChange={mockOnValueChange}
                    listFetcher={mockListFetcher}
                    labelFormatter={mockLabelFormatter}
                    items={mockItems}
                />,
                { wrapper: createWrapper() }
            );

            const button = screen.getByRole('button');
            fireEvent.click(button);

            await waitFor(() => {
                expect(screen.getByRole('listbox')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search items...');
            await userEvent.type(searchInput, 'Widget A');

            await waitFor(() => {
                expect(screen.getByText('Widget A (WID-001)')).toBeInTheDocument();
                expect(screen.queryByText('Widget B (WID-002)')).not.toBeInTheDocument();
                expect(screen.queryByText('Gadget C (GAD-001)')).not.toBeInTheDocument();
            });
        });

        it('should show loading state while searching', async () => {
            mockUseLocalSearch.mockReturnValue({
                data: undefined,
                isLoading: true,
                isError: false,
                error: null,
                refetch: jest.fn(),
            });

            render(
                <SearchableSelect
                    entityType="items"
                    value={undefined}
                    onValueChange={mockOnValueChange}
                    listFetcher={mockListFetcher}
                    labelFormatter={mockLabelFormatter}
                    items={mockItems}
                />,
                { wrapper: createWrapper() }
            );

            const button = screen.getByRole('button');
            fireEvent.click(button);

            await waitFor(() => {
                expect(screen.getByText('Loading...')).toBeInTheDocument();
            });
        });

        it('should clear search when X button is clicked', async () => {
            render(
                <SearchableSelect
                    entityType="items"
                    value={undefined}
                    onValueChange={mockOnValueChange}
                    listFetcher={mockListFetcher}
                    labelFormatter={mockLabelFormatter}
                    items={mockItems}
                />,
                { wrapper: createWrapper() }
            );

            const button = screen.getByRole('button');
            fireEvent.click(button);

            await waitFor(() => {
                expect(screen.getByRole('listbox')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search items...');
            await userEvent.type(searchInput, 'Widget');

            const clearButton = screen.getByRole('button', { name: '' });
            fireEvent.click(clearButton);

            expect(searchInput).toHaveValue('');
        });
    });

    describe('Selection', () => {
        it('should call onValueChange when item is selected', async () => {
            render(
                <SearchableSelect
                    entityType="items"
                    value={undefined}
                    onValueChange={mockOnValueChange}
                    listFetcher={mockListFetcher}
                    labelFormatter={mockLabelFormatter}
                    items={mockItems}
                />,
                { wrapper: createWrapper() }
            );

            const button = screen.getByRole('button');
            fireEvent.click(button);

            await waitFor(() => {
                expect(screen.getByRole('listbox')).toBeInTheDocument();
            });

            const item = screen.getByText('Widget A (WID-001)');
            fireEvent.click(item);

            expect(mockOnValueChange).toHaveBeenCalledWith('1');
        });

        it('should close dropdown after selection', async () => {
            render(
                <SearchableSelect
                    entityType="items"
                    value={undefined}
                    onValueChange={mockOnValueChange}
                    listFetcher={mockListFetcher}
                    labelFormatter={mockLabelFormatter}
                    items={mockItems}
                />,
                { wrapper: createWrapper() }
            );

            const button = screen.getByRole('button');
            fireEvent.click(button);

            await waitFor(() => {
                expect(screen.getByRole('listbox')).toBeInTheDocument();
            });

            const item = screen.getByText('Widget A (WID-001)');
            fireEvent.click(item);

            await waitFor(() => {
                expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
            });
        });

        it('should show check mark for selected item', async () => {
            render(
                <SearchableSelect
                    entityType="items"
                    value="1"
                    onValueChange={mockOnValueChange}
                    listFetcher={mockListFetcher}
                    labelFormatter={mockLabelFormatter}
                    items={mockItems}
                />,
                { wrapper: createWrapper() }
            );

            const button = screen.getByRole('button');
            fireEvent.click(button);

            await waitFor(() => {
                const listbox = screen.getByRole('listbox');
                const selectedOption = within(listbox).getByRole('option', { selected: true });
                expect(selectedOption).toBeInTheDocument();
            });
        });
    });

    describe('Keyboard Navigation', () => {
        it('should close dropdown when Escape is pressed', async () => {
            render(
                <SearchableSelect
                    entityType="items"
                    value={undefined}
                    onValueChange={mockOnValueChange}
                    listFetcher={mockListFetcher}
                    labelFormatter={mockLabelFormatter}
                    items={mockItems}
                />,
                { wrapper: createWrapper() }
            );

            const button = screen.getByRole('button');
            fireEvent.click(button);

            await waitFor(() => {
                expect(screen.getByRole('listbox')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search items...');
            fireEvent.keyDown(searchInput, { key: 'Escape' });

            await waitFor(() => {
                expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
            });
        });
    });

    describe('Loading States', () => {
        it('should show loading state when fetching list', async () => {
            render(
                <SearchableSelect
                    entityType="items"
                    value={undefined}
                    onValueChange={mockOnValueChange}
                    listFetcher={mockListFetcher}
                    labelFormatter={mockLabelFormatter}
                    isLoading={true}
                />,
                { wrapper: createWrapper() }
            );

            const button = screen.getByRole('button');
            fireEvent.click(button);

            await waitFor(() => {
                expect(screen.getByText('Loading...')).toBeInTheDocument();
            });
        });
    });

    describe('Error States', () => {
        it('should show error message when list fetching fails', async () => {
            const errorMessage = 'Failed to fetch items';
            mockListFetcher.mockRejectedValue(new Error(errorMessage));

            render(
                <SearchableSelect
                    entityType="items"
                    value={undefined}
                    onValueChange={mockOnValueChange}
                    listFetcher={mockListFetcher}
                    labelFormatter={mockLabelFormatter}
                />,
                { wrapper: createWrapper() }
            );

            const button = screen.getByRole('button');
            fireEvent.click(button);

            await waitFor(() => {
                expect(screen.getByText(/Error loading items/i)).toBeInTheDocument();
            });
        });
    });

    describe('Empty States', () => {
        it('should show "no items found" when search returns no results', async () => {
            mockUseLocalSearch.mockReturnValue({
                data: { ...mockSearchResults, results: [] },
                isLoading: false,
                isError: false,
                error: null,
                refetch: jest.fn(),
            });

            render(
                <SearchableSelect
                    entityType="items"
                    value={undefined}
                    onValueChange={mockOnValueChange}
                    listFetcher={mockListFetcher}
                    labelFormatter={mockLabelFormatter}
                    items={mockItems}
                />,
                { wrapper: createWrapper() }
            );

            const button = screen.getByRole('button');
            fireEvent.click(button);

            await waitFor(() => {
                expect(screen.getByRole('listbox')).toBeInTheDocument();
            });

            const searchInput = screen.getByPlaceholderText('Search items...');
            await userEvent.type(searchInput, 'NonExistent');

            await waitFor(() => {
                expect(screen.getByText('No items found')).toBeInTheDocument();
            });
        });
    });
});
