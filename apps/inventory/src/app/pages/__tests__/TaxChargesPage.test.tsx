import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock lazy-loaded components
jest.mock('../../components/tax-templates', () => ({
  TaxTemplateManagement: () => <div data-testid="tax-template-management">Tax Templates Content</div>,
}));

jest.mock('../../components/charge-templates', () => ({
  ChargeTemplateManagement: () => <div data-testid="charge-template-management">Charge Templates Content</div>,
}));

import { TaxChargesPage } from '../TaxChargesPage';

describe('TaxChargesPage', () => {
  it('renders the navigation bar with both tabs', () => {
    render(<TaxChargesPage />);

    expect(screen.getByText('Tax Templates')).toBeInTheDocument();
    expect(screen.getByText('Charge Templates')).toBeInTheDocument();
  });

  it('shows Tax Templates view by default', async () => {
    render(<TaxChargesPage />);
    expect(await screen.findByTestId('tax-template-management')).toBeInTheDocument();
  });

  it('switches to Charge Templates view when clicked', async () => {
    render(<TaxChargesPage />);

    await userEvent.click(screen.getByText('Charge Templates'));

    expect(await screen.findByTestId('charge-template-management')).toBeInTheDocument();
  });

  it('switches back to Tax Templates view', async () => {
    render(<TaxChargesPage />);

    await userEvent.click(screen.getByText('Charge Templates'));
    await userEvent.click(screen.getByText('Tax Templates'));

    expect(await screen.findByTestId('tax-template-management')).toBeInTheDocument();
  });
});
