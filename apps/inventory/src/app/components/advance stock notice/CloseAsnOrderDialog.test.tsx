import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { useQuery } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { useExceptionReasons } from '../../hooks/useExceptionReasons';
import type { AsnOrder, AsnOrderClosePayload } from '../../types/asn-order.types';
import type { AsnReceivingSummary } from '../../types/wms.types';

import { CloseAsnOrderDialog } from './CloseAsnOrderDialog';

jest.mock('@horizon-sync/store', () => ({
  useUserStore: jest.fn((selector: (state: { accessToken: string }) => string) => selector({ accessToken: 'test-token' })),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('../../hooks/useExceptionReasons', () => ({
  useExceptionReasons: jest.fn(),
}));

const mockUseQuery = useQuery as unknown as { mockReturnValue: (value: unknown) => void };
const mockUseExceptionReasons = useExceptionReasons as unknown as { mockReturnValue: (value: unknown) => void };

const reload = jest.fn();

/** The dialog prop the assertions care about, typed so `jest.fn()` stays assignable. */
type CloseHandler = (id: string, payload: AsnOrderClosePayload) => Promise<AsnOrder>;
type CloseMock = jest.MockedFunction<CloseHandler>;

function closeMock(): CloseMock {
  return jest.fn<ReturnType<CloseHandler>, Parameters<CloseHandler>>();
}

function asnOrder(override: Partial<AsnOrder> = {}): AsnOrder {
  return {
    id: 'asn-1',
    organization_id: 'org-1',
    asn_order_no: 'ASN-2026-00001',
    warehouse_id_from: 'warehouse-from',
    warehouse_id_to: 'warehouse-to',
    order_date: '2026-09-01T00:00:00Z',
    grand_total: 100,
    status: 'partially_delivered',
    items: [],
    vehicle_arrivals: [],
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
    ...override,
  };
}

/** Only the fields the dialog renders matter here. */
function summary(shortQty: number): Partial<AsnReceivingSummary> {
  return {
    asn_order_id: 'asn-1',
    asn_order_no: 'ASN-2026-00001',
    reconciliation_status: shortQty > 0 ? 'partial' : 'reconciled',
    expected_total_qty: 10,
    accepted_total_qty: 10 - shortQty,
    short_total_qty: shortQty,
  };
}

const shortReasons = {
  reasons: [{ code: 'SHORT_PHYSICAL', name: 'Short physical', category: 'short', default_destination: null }],
  loading: false,
  error: null,
  reload,
};

/**
 * A fully delivered ASN needs no reason, so these cases submit without having to
 * drive the Radix reason picker.
 */
function renderDelivered(onClose: CloseMock, onStale?: jest.Mock) {
  mockUseQuery.mockReturnValue({ data: summary(0), isLoading: false, error: null });
  mockUseExceptionReasons.mockReturnValue({ reasons: [], loading: false, error: null, reload });
  return render(
    <CloseAsnOrderDialog order={asnOrder({ status: 'delivered' })}
      onOpenChange={jest.fn()}
      onClose={onClose}
      onStale={onStale} />,
  );
}

describe('CloseAsnOrderDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseExceptionReasons.mockReturnValue(shortReasons);
  });

  it('refuses to close a short delivery until a reason is chosen', async () => {
    mockUseQuery.mockReturnValue({ data: summary(4), isLoading: false, error: null });
    const onClose = closeMock();

    render(<CloseAsnOrderDialog order={asnOrder()} onOpenChange={jest.fn()} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: /close asn order/i }));

    expect(onClose).not.toHaveBeenCalled();
    expect(await screen.findByText(/still outstanding — select a reason/i)).toBeInTheDocument();
  });

  it('closes a fully delivered ASN with an empty payload and no reason', async () => {
    const onClose = closeMock().mockResolvedValue(asnOrder({ status: 'closed' }));
    const onClosed = jest.fn();
    const onOpenChange = jest.fn();

    mockUseQuery.mockReturnValue({ data: summary(0), isLoading: false, error: null });
    mockUseExceptionReasons.mockReturnValue({ reasons: [], loading: false, error: null, reload });

    render(
      <CloseAsnOrderDialog order={asnOrder({ status: 'delivered' })}
        onOpenChange={onOpenChange}
        onClose={onClose}
        onClosed={onClosed} />,
    );

    await userEvent.click(screen.getByRole('button', { name: /close asn order/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalledWith('asn-1', { reason_code: null, note: null }));
    expect(onClosed).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('tells the operator to fetch a manager when the API requires approval', async () => {
    const onClose = closeMock().mockRejectedValue({
      status: 409,
      message: 'Conflict',
      details: { error: 'ASN_CLOSE_APPROVAL_REQUIRED', message: 'requires a manager' },
    });

    renderDelivered(onClose);
    await userEvent.click(screen.getByRole('button', { name: /close asn order/i }));

    expect(await screen.findByText(/warehouse manager must close this ASN/i)).toBeInTheDocument();
  });

  it('reloads the reason list when the API rejects a retired reason code', async () => {
    const onClose = closeMock().mockRejectedValue({
      status: 400,
      message: 'Bad Request',
      details: { error: 'SHORTAGE_REASON_INVALID', message: 'unknown code' },
    });

    renderDelivered(onClose);
    await userEvent.click(screen.getByRole('button', { name: /close asn order/i }));

    await waitFor(() => expect(reload).toHaveBeenCalled());
    expect(await screen.findByText(/unknown code/i)).toBeInTheDocument();
  });

  it('flags the ASN as stale when the API reports it was already closed', async () => {
    const onStale = jest.fn();
    const onClose = closeMock().mockRejectedValue({
      status: 409,
      message: 'Conflict',
      details: { error: 'ASN_ALREADY_CLOSED', message: 'already closed' },
    });

    renderDelivered(onClose, onStale);
    await userEvent.click(screen.getByRole('button', { name: /close asn order/i }));

    await waitFor(() => expect(onStale).toHaveBeenCalled());
  });
});
