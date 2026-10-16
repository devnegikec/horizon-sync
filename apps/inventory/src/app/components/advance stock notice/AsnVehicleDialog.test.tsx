import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import type { AsnOrder } from '../../types/asn-order.types';
import { vehicleArrivalApi } from '../../utility/api/wms';

import { AsnVehicleDialog } from './AsnVehicleDialog';

jest.mock('@horizon-sync/store', () => ({
  useUserStore: jest.fn((selector: (state: { accessToken: string }) => string) => selector({ accessToken: 'test-token' })),
}));

jest.mock('@horizon-sync/ui/hooks', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock('../../utility/api/wms', () => ({
  vehicleArrivalApi: {
    register: jest.fn(),
    linkAsns: jest.fn(),
    unlinkAsn: jest.fn(),
    list: jest.fn(),
  },
}));

interface MockedFn {
  mockResolvedValue: (value: unknown) => void;
  mockRejectedValue: (value: unknown) => void;
  mock: { calls: unknown[][] };
}

const mockRegister = vehicleArrivalApi.register as unknown as MockedFn;
const mockUnlinkAsn = vehicleArrivalApi.unlinkAsn as unknown as MockedFn;
const mockList = vehicleArrivalApi.list as unknown as MockedFn;

const pagination = { page: 1, page_size: 50, total_items: 0, total_pages: 0, has_next: false, has_prev: false };

function asnOrder(override: Partial<AsnOrder> = {}): AsnOrder {
  return {
    id: 'asn-1',
    organization_id: 'org-1',
    asn_order_no: 'ASN-2026-00001',
    warehouse_id_from: 'warehouse-from',
    warehouse_id_to: 'warehouse-to',
    order_date: '2026-09-01T00:00:00Z',
    grand_total: 100,
    status: 'confirmed',
    items: [],
    vehicle_arrivals: [],
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
    ...override,
  };
}

function renderDialog(order: AsnOrder) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AsnVehicleDialog order={order} warehouseId="warehouse-to" onOpenChange={jest.fn()} />
    </QueryClientProvider>,
  );
}

describe('AsnVehicleDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockList.mockResolvedValue({ vehicle_arrivals: [], pagination });
    mockRegister.mockResolvedValue({});
    mockUnlinkAsn.mockResolvedValue({});
  });

  it('hides the attach controls once the ASN is closed', () => {
    renderDialog(asnOrder({ status: 'closed' }));

    expect(screen.queryByRole('button', { name: /new arrival/i })).not.toBeInTheDocument();
    expect(screen.getByText(/closed and final, so no further vehicle/i)).toBeInTheDocument();
  });

  it('registers a new arrival already linked to this ASN', async () => {
    renderDialog(asnOrder());

    await userEvent.type(screen.getByLabelText(/vehicle no/i), 'KA01AB1234');
    await userEvent.click(screen.getByRole('button', { name: /attach vehicle/i }));

    await waitFor(() => expect(mockRegister.mock.calls.length).toBe(1));
    expect(mockRegister.mock.calls[0][0]).toBe('test-token');
    expect(mockRegister.mock.calls[0][1]).toMatchObject({
      vehicle_no: 'KA01AB1234',
      warehouse_id: 'warehouse-to',
      asn_order_ids: ['asn-1'],
    });
  });

  it('unlinks a vehicle already attached to the ASN', async () => {
    renderDialog(
      asnOrder({
        vehicle_arrivals: [
          {
            id: 'arrival-1',
            vehicle_no: 'KA01MP3776',
            driver_name: 'Ram Kumar',
            transporter: 'TVK Transport',
            dock: 'Dock-A',
            status: 'arrived',
            arrived_at: '2026-09-01T10:00:00Z',
          },
        ],
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: /KA01MP3776/i }));

    await waitFor(() => expect(mockUnlinkAsn.mock.calls.length).toBe(1));
    expect(mockUnlinkAsn.mock.calls[0]).toEqual(['test-token', 'arrival-1', 'asn-1']);
  });
});
