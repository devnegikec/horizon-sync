import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AccountTreeView } from './AccountTreeView';

// Mock fetch
global.fetch = jest.fn();

describe('AccountTreeView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<AccountTreeView />);
    // Check for loading spinner
    const loader = document.querySelector('[class*="animate-spin"]');
    expect(loader).toBeInTheDocument();
  });

  it('renders tree structure with accounts', async () => {
    const mockTreeData = [
      {
        id: '1',
        account_code: '1000',
        account_name: 'Assets',
        account_type: 'ASSET',
        level: 0,
        is_group: true,
        is_active: true,
        children: [
          {
            id: '2',
            account_code: '1100',
            account_name: 'Current Assets',
            account_type: 'ASSET',
            level: 1,
            is_group: false,
            is_active: true,
            children: [],
          },
        ],
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTreeData,
    });

    render(<AccountTreeView />);

    await waitFor(() => {
      expect(screen.getByText('Assets')).toBeInTheDocument();
      expect(screen.getByText('1000')).toBeInTheDocument();
    });
  });

  it('expands and collapses nodes', async () => {
    const mockTreeData = [
      {
        id: '1',
        account_code: '1000',
        account_name: 'Assets',
        account_type: 'ASSET',
        level: 0,
        is_group: true,
        is_active: true,
        children: [
          {
            id: '2',
            account_code: '1100',
            account_name: 'Current Assets',
            account_type: 'ASSET',
            level: 1,
            is_group: false,
            is_active: true,
            children: [],
          },
        ],
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTreeData,
    });

    render(<AccountTreeView />);

    await waitFor(() => {
      expect(screen.getByText('Assets')).toBeInTheDocument();
    });

    // Child should be visible initially (root nodes auto-expand)
    expect(screen.getByText('Current Assets')).toBeInTheDocument();

    // Click to collapse
    const assetsNode = screen.getByText('Assets').closest('div');
    if (assetsNode) {
      fireEvent.click(assetsNode);
    }

    // Child should not be visible after clicking (node collapsed)
    await waitFor(() => {
      expect(screen.queryByText('Current Assets')).not.toBeInTheDocument();
    });

    // Click again to expand
    if (assetsNode) {
      fireEvent.click(assetsNode);
    }

    // Child should be visible again
    await waitFor(() => {
      expect(screen.getByText('Current Assets')).toBeInTheDocument();
    });
  });

  it('calls onAccountSelect when account is clicked', async () => {
    const mockTreeData = [
      {
        id: '1',
        account_code: '1000',
        account_name: 'Assets',
        account_type: 'ASSET',
        level: 0,
        is_group: true,
        is_active: true,
        children: [],
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTreeData,
    });

    const onAccountSelect = jest.fn();
    render(<AccountTreeView onAccountSelect={onAccountSelect} />);

    await waitFor(() => {
      expect(screen.getByText('Assets')).toBeInTheDocument();
    });

    const assetsNode = screen.getByText('Assets').closest('div');
    if (assetsNode) {
      fireEvent.click(assetsNode);
    }
    expect(onAccountSelect).toHaveBeenCalledWith('1');
  });

  it('displays error message when fetch fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    render(<AccountTreeView />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch account tree/i)).toBeInTheDocument();
    });
  });

  it('displays empty state when no accounts exist', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<AccountTreeView />);

    await waitFor(() => {
      expect(screen.getByText(/No accounts found/i)).toBeInTheDocument();
    });
  });

  it('highlights selected account', async () => {
    const mockTreeData = [
      {
        id: '1',
        account_code: '1000',
        account_name: 'Assets',
        account_type: 'ASSET',
        level: 0,
        is_group: true,
        is_active: true,
        children: [],
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTreeData,
    });

    render(<AccountTreeView selectedAccountId="1" />);

    await waitFor(() => {
      const accountElement = screen.getByText('Assets').closest('div');
      expect(accountElement).toHaveClass('bg-primary/10');
    });
  });

  it('shows inactive badge for inactive accounts', async () => {
    const mockTreeData = [
      {
        id: '1',
        account_code: '1000',
        account_name: 'Assets',
        account_type: 'ASSET',
        level: 0,
        is_group: true,
        is_active: false,
        children: [],
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTreeData,
    });

    render(<AccountTreeView />);

    await waitFor(() => {
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });

  it('expands all nodes when Expand All is clicked', async () => {
    const mockTreeData = [
      {
        id: '1',
        account_code: '1000',
        account_name: 'Assets',
        account_type: 'ASSET',
        level: 0,
        is_group: true,
        is_active: true,
        children: [
          {
            id: '2',
            account_code: '1100',
            account_name: 'Current Assets',
            account_type: 'ASSET',
            level: 1,
            is_group: true,
            is_active: true,
            children: [
              {
                id: '3',
                account_code: '1110',
                account_name: 'Cash',
                account_type: 'ASSET',
                level: 2,
                is_group: false,
                is_active: true,
                children: [],
              },
            ],
          },
        ],
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTreeData,
    });

    render(<AccountTreeView />);

    await waitFor(() => {
      expect(screen.getByText('Assets')).toBeInTheDocument();
    });

    // Click Expand All
    const expandAllButton = screen.getByText('Expand All');
    fireEvent.click(expandAllButton);

    // All nodes should be visible
    await waitFor(() => {
      expect(screen.getByText('Cash')).toBeInTheDocument();
    });
  });

  it('collapses all nodes when Collapse All is clicked', async () => {
    const mockTreeData = [
      {
        id: '1',
        account_code: '1000',
        account_name: 'Assets',
        account_type: 'ASSET',
        level: 0,
        is_group: true,
        is_active: true,
        children: [
          {
            id: '2',
            account_code: '1100',
            account_name: 'Current Assets',
            account_type: 'ASSET',
            level: 1,
            is_group: false,
            is_active: true,
            children: [],
          },
        ],
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockTreeData,
    });

    render(<AccountTreeView />);

    await waitFor(() => {
      expect(screen.getByText('Assets')).toBeInTheDocument();
    });

    // Initially, child should be visible (root nodes auto-expand)
    expect(screen.getByText('Current Assets')).toBeInTheDocument();

    // Click Collapse All
    const collapseAllButton = screen.getByText('Collapse All');
    fireEvent.click(collapseAllButton);

    // Child should not be visible
    await waitFor(() => {
      expect(screen.queryByText('Current Assets')).not.toBeInTheDocument();
    });
  });
});
