import { render, screen } from '@testing-library/react';

import { ItemStats } from '../../../../app/components/items/ItemStats';

describe('ItemStats', () => {
  it('should render all stat cards with correct values', () => {
    render(<ItemStats totalItems={150} activeItems={120} />);

    expect(screen.getByText('Total Items')).toBeTruthy();
    expect(screen.getByText('150')).toBeTruthy();
    
    expect(screen.getByText('Active Items')).toBeTruthy();
    expect(screen.getByText('120')).toBeTruthy();
    
    expect(screen.getByText('Inventory Value')).toBeTruthy();
    expect(screen.getByText('Low Stock Alerts')).toBeTruthy();
  });
});
