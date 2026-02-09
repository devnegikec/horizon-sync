import { renderHook, act } from '@testing-library/react';

import { useItemGroups } from '../../../../app/hooks/useItemGroups';
import { useItemManagement } from '../../../../app/hooks/useItemManagement';
import { useItems } from '../../../../app/hooks/useItems';


// Mock the dependency hooks
jest.mock('../../../../app/hooks/useItems');
jest.mock('../../../../app/hooks/useItemGroups');

describe('useItemManagement', () => {
  const mockRefetch = jest.fn();
  const mockSetPage = jest.fn();
  const mockSetPageSize = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useItems as jest.Mock).mockReturnValue({
      items: [],
      pagination: { total_items: 0 },
      loading: false,
      error: null,
      refetch: mockRefetch,
      setPage: mockSetPage,
      setPageSize: mockSetPageSize,
      currentPage: 1,
      currentPageSize: 20,
    });

    (useItemGroups as jest.Mock).mockReturnValue({
      itemGroups: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it('should initialize with default filters', () => {
    const { result } = renderHook(() => useItemManagement());

    expect(result.current.filters).toEqual({
      search: '',
      groupId: 'all',
      status: 'all',
    });
  });

  it('should update filters and reset page when setFilters is called', () => {
    const { result } = renderHook(() => useItemManagement());

    act(() => {
      result.current.setFilters({
        search: 'test',
        groupId: 'g1',
        status: 'active',
      });
    });

    expect(result.current.filters).toEqual({
      search: 'test',
      groupId: 'g1',
      status: 'active',
    });
    expect(mockSetPage).toHaveBeenCalledWith(1);
  });

  it('should handle create item', () => {
    const { result } = renderHook(() => useItemManagement());

    act(() => {
      result.current.handleCreateItem();
    });

    expect(result.current.itemDialogOpen).toBe(true);
    expect(result.current.selectedItem).toBeNull();
  });

  it('should handle edit item', () => {
    const { result } = renderHook(() => useItemManagement());
    const mockItem = { id: '1', item_name: 'Item 1' } as any;

    act(() => {
      result.current.handleEditItem(mockItem);
    });

    expect(result.current.itemDialogOpen).toBe(true);
    expect(result.current.selectedItem).toEqual(mockItem);
  });

  it('should handle view item', () => {
    const { result } = renderHook(() => useItemManagement());
    const mockItem = { id: '1', item_name: 'Item 1' } as any;

    act(() => {
      result.current.handleViewItem(mockItem);
    });

    expect(result.current.detailDialogOpen).toBe(true);
    expect(result.current.selectedItem).toEqual(mockItem);
  });
});
