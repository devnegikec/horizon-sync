import { render, screen } from '@testing-library/react';

import { ItemManagement } from '../../../../app/components/items/ItemManagement';
import { useItemManagement } from '../../../../app/hooks/useItemManagement';

// Mock the hook
jest.mock('../../../../app/hooks/useItemManagement');

// Mock child components
jest.mock('../../../../app/components/items/ItemManagementHeader', () => ({
  ItemManagementHeader: ({ onCreateItem }: any) => (
    <div data-testid="mock-header">
      <button onClick={onCreateItem}>Add Item</button>
    </div>
  ),
}));

jest.mock('../../../../app/components/items/ItemStats', () => ({
  ItemStats: () => <div data-testid="mock-stats">Stats</div>,
}));

jest.mock('../../../../app/components/items/ItemManagementFilters', () => ({
  ItemManagementFilters: () => <div data-testid="mock-filters">Filters</div>,
}));

jest.mock('../../../../app/components/items/ItemsTable', () => ({
  ItemsTable: () => <div data-testid="mock-table">Table</div>,
}));

jest.mock('../../../../app/components/items/ItemDialog', () => ({
  ItemDialog: () => <div data-testid="mock-dialog">Dialog</div>,
}));

jest.mock('../../../../app/components/items/ItemDetailDialog', () => ({
  ItemDetailDialog: () => <div data-testid="mock-detail-dialog">Detail Dialog</div>,
}));

describe('ItemManagement', () => {
  beforeEach(() => {
    (useItemManagement as jest.Mock).mockReturnValue({
      filters: { search: '', groupId: 'all', status: 'all' },
      setFilters: jest.fn(),
      items: [],
      itemGroups: [],
      loading: false,
      error: null,
      refetch: jest.fn(),
      stats: { totalItems: 0, activeItems: 0 },
      itemDialogOpen: false,
      setItemDialogOpen: jest.fn(),
      detailDialogOpen: false,
      setDetailDialogOpen: jest.fn(),
      selectedItem: null,
      tableInstance: null,
      handleCreateItem: jest.fn(),
      handleEditItem: jest.fn(),
      handleViewItem: jest.fn(),
      handleToggleStatus: jest.fn(),
      handleSaveItem: jest.fn(),
      handleTableReady: jest.fn(),
      serverPaginationConfig: {},
    });
  });

  it('should render all sub-components', () => {
    render(<ItemManagement />);

    expect(screen.getByTestId('mock-header')).toBeTruthy();
    expect(screen.getByTestId('mock-stats')).toBeTruthy();
    expect(screen.getByTestId('mock-filters')).toBeTruthy();
    expect(screen.getByTestId('mock-table')).toBeTruthy();
    expect(screen.getByTestId('mock-dialog')).toBeTruthy();
    expect(screen.getByTestId('mock-detail-dialog')).toBeTruthy();
  });
});
