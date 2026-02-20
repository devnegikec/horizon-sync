import { render, screen } from '@testing-library/react';
import { Package } from 'lucide-react';

import { StatCard } from '../../../../app/components/shared/StatCard';

describe('StatCard', () => {
  it('should render title and value correctly', () => {
    render(
      <StatCard title="Total Items"
        value={100}
        icon={Package}
        iconBg="bg-slate-100"
        iconColor="text-slate-600" />
    );

    expect(screen.getByText('Total Items')).toBeTruthy();
    expect(screen.getByText('100')).toBeTruthy();
  });

  it('should render with string value', () => {
    render(
      <StatCard title="Inventory Value"
        value="$1,000"
        icon={Package}
        iconBg="bg-slate-100"
        iconColor="text-slate-600"/>
    );

    expect(screen.getByText('$1,000')).toBeTruthy();
  });
});
