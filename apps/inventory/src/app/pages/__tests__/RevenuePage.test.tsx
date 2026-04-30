import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock all lazy-loaded and heavy components
jest.mock('../../components/customers', () => ({
  CustomerManagement: () => <div data-testid="customer-management">Customers</div>,
}));
jest.mock('../../components/quotations', () => ({
  QuotationManagement: () => <div data-testid="quotation-management">Quotations</div>,
}));
jest.mock('../../components/sales-orders', () => ({
  SalesOrderManagement: () => <div data-testid="sales-order-management">Sales Orders</div>,
}));
jest.mock('../../components/picklist', () => ({
  PickListManagement: () => <div data-testid="picklist-management">Pick Lists</div>,
}));
jest.mock('../../components/delivery-notes', () => ({
  DeliveryNoteManagement: () => <div data-testid="delivery-note-management">Delivery Notes</div>,
}));
jest.mock('../../components/invoices', () => ({
  InvoiceManagement: () => <div data-testid="invoice-management">Invoices</div>,
}));
jest.mock('../../components/payments', () => ({
  PaymentManagement: () => <div data-testid="payment-management">Payments</div>,
}));
jest.mock('@horizon-sync/ui/hooks', () => ({
  useFeatureVisibility: jest.fn(() => ({ visible: true, loading: false })),
  useFeatureVisibilities: jest.fn(() => ({
    'invoices-enabled': { visible: true, loading: false },
  })),
}));
jest.mock('@horizon-sync/ui', () => ({
  INVOICES_ENABLED: 'invoices-enabled',
}));

import { RevenuePage } from '../RevenuePage';

describe('RevenuePage', () => {
  it('renders navigation with all tabs', () => {
    render(<RevenuePage />);

    expect(screen.getByText('Customers')).toBeInTheDocument();
    expect(screen.getByText('Quotations')).toBeInTheDocument();
    expect(screen.getByText('Sales Orders')).toBeInTheDocument();
    expect(screen.getByText('Pick Lists')).toBeInTheDocument();
    expect(screen.getByText('Delivery Notes')).toBeInTheDocument();
    expect(screen.getByText('Payments')).toBeInTheDocument();
  });

  it('shows Customers view by default', async () => {
    render(<RevenuePage />);
    expect(await screen.findByTestId('customer-management')).toBeInTheDocument();
  });

  it('switches to Quotations view', async () => {
    render(<RevenuePage />);
    await userEvent.click(screen.getByText('Quotations'));
    expect(await screen.findByTestId('quotation-management')).toBeInTheDocument();
  });

  it('switches to Sales Orders view', async () => {
    render(<RevenuePage />);
    await userEvent.click(screen.getByText('Sales Orders'));
    expect(await screen.findByTestId('sales-order-management')).toBeInTheDocument();
  });

  it('switches to Pick Lists view', async () => {
    render(<RevenuePage />);
    await userEvent.click(screen.getByText('Pick Lists'));
    expect(await screen.findByTestId('picklist-management')).toBeInTheDocument();
  });

  it('switches to Delivery Notes view', async () => {
    render(<RevenuePage />);
    await userEvent.click(screen.getByText('Delivery Notes'));
    expect(await screen.findByTestId('delivery-note-management')).toBeInTheDocument();
  });

  it('switches to Payments view', async () => {
    render(<RevenuePage />);
    await userEvent.click(screen.getByText('Payments'));
    expect(await screen.findByTestId('payment-management')).toBeInTheDocument();
  });

  it('shows Invoices tab when feature flag is enabled', () => {
    render(<RevenuePage />);
    expect(screen.getByText('Invoices')).toBeInTheDocument();
  });
});
