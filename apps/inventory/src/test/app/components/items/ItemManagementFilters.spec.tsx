import { render, screen } from '@testing-library/react';

import { ItemManagementFilters } from '../../../../app/components/items/ItemManagementFilters';

describe('ItemManagementFilters', () => {
  const mockFilters = {
    search: '',
    groupId: 'all',
    status: 'all',
  };
  const mockSetFilters = jest.fn();
  const mockItemGroups = [
    { id: '1', name: 'Group 1' },
    { id: '2', name: 'Group 2' },
  ];

  it('should render search input and select filters', () => {
    render(
      <ItemManagementFilters filters={mockFilters}
        setFilters={mockSetFilters}
        itemGroups={mockItemGroups}
        tableInstance={null}/>
    );

    expect(screen.getByPlaceholderText(/Search/i)).toBeTruthy();
    expect(screen.getByText('All Groups')).toBeTruthy();
    expect(screen.getByText('All Status')).toBeTruthy();
  });
});
