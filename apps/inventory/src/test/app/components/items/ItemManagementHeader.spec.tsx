import { render, screen, fireEvent } from '@testing-library/react';

import { ItemManagementHeader } from '../../../../app/components/items/ItemManagementHeader';

describe('ItemManagementHeader', () => {
  it('should render title and buttons', () => {
    const onCreateItem = jest.fn();
    render(<ItemManagementHeader onCreateItem={onCreateItem} />);

    expect(screen.getByText('Item Management')).toBeTruthy();
    expect(screen.getByText('Add Item')).toBeTruthy();
    expect(screen.getByText('Export')).toBeTruthy();
  });

  it('should call onCreateItem when Add Item button is clicked', () => {
    const onCreateItem = jest.fn();
    render(<ItemManagementHeader onCreateItem={onCreateItem} />);

    const addButton = screen.getByText('Add Item');
    fireEvent.click(addButton);

    expect(onCreateItem).toHaveBeenCalledTimes(1);
  });
});
