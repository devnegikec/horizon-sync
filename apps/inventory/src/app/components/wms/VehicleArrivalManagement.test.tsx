import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { useVehicleArrivals } from '../../hooks/useWMS';
import type { PaginatedVehicleArrivals, VehicleArrivalListItem } from '../../types/wms.types';
import { asnOrderApi } from '../../utility/api/asn-orders';

import { VehicleArrivalManagement } from './VehicleArrivalManagement';

const mockToast = jest.fn();

jest.mock('@horizon-sync/store', () => ({
  useUserStore: jest.fn((selector: (state: { accessToken: string }) => string) => selector({ accessToken: 'test-token' })),
}));

jest.mock('@horizon-sync/ui/hooks', () => ({
  useToast: () => ({ toast: mockToast }),
}));

jest.mock('../../hooks/useWMS', () => ({
  useVehicleArrivals: jest.fn(),
}));

jest.mock('../../utility/api/asn-orders', () => ({
  asnOrderApi: {
    list: jest.fn(),
  },
}));

jest.mock('../../utility', () => ({
  formatDate: () => '24-Aug-26 16:01',
}));

const mockAsnOrderList = asnOrderApi.list as unknown as {
  mockResolvedValue: (value: unknown) => void;
};
const mockUseVehicleArrivals = useVehicleArrivals as unknown as {
  mockReturnValue: (value: unknown) => void;
};

const pagination = {
  page: 1,
  page_size: 50,
  total_items: 0,
  total_pages: 0,
  has_next: false,
  has_prev: false,
};

const asnOptions = [
  { id: 'asn-1', asn_order_no: 'ASN-2026-00001', status: 'confirmed' },
  { id: 'asn-2', asn_order_no: 'ASN-2026-00002', status: 'confirmed' },
];

function vehicleArrival(override: Partial<VehicleArrivalListItem> = {}): VehicleArrivalListItem {
  return {
    id: 'arrival-1',
    vehicle_no: 'KA01MP3776',
    driver_name: 'Ram Kumar',
    driver_contact: '9879872399',
    transporter: 'TVK Transport',
    warehouse_id: 'warehouse-1',
    dock: 'Dock-A',
    notes: null,
    status: 'arrived',
    arrived_at: '2026-08-24T16:01:50.459720Z',
    asn_order_count: 1,
    receiving_slip_count: 0,
    ...override,
  };
}

function arrivalsData(arrivals: VehicleArrivalListItem[] = []): PaginatedVehicleArrivals {
  return {
    vehicle_arrivals: arrivals,
    pagination: { ...pagination, total_items: arrivals.length },
  };
}

describe('VehicleArrivalManagement', () => {
  const register = jest.fn();
  const linkAsns = jest.fn();
  const unlinkAsn = jest.fn();
  const update = jest.fn();
  const refetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAsnOrderList.mockResolvedValue({ asn_orders: asnOptions });
    mockUseVehicleArrivals.mockReturnValue({
      data: arrivalsData(),
      loading: false,
      error: null,
      refetch,
      register,
      linkAsns,
      unlinkAsn,
      update,
    });
  });

  it('renders registered vehicle arrivals with their inbound details', () => {
    mockUseVehicleArrivals.mockReturnValue({
      data: arrivalsData([vehicleArrival()]),
      loading: false,
      error: null,
      refetch,
      register,
      linkAsns,
      unlinkAsn,
      update,
    });

    render(<VehicleArrivalManagement warehouseId="warehouse-1" />);

    expect(screen.getByText('KA01MP3776')).not.toBeNull();
    expect(screen.getByText('Ram Kumar')).not.toBeNull();
    expect(screen.getByText('Dock-A')).not.toBeNull();
    expect(screen.getByText('24-Aug-26 16:01')).not.toBeNull();
  });

  it('registers one vehicle arrival against multiple selected ASNs', async () => {
    const user = userEvent.setup();
    render(<VehicleArrivalManagement warehouseId="warehouse-1" />);

    await user.click(screen.getByRole('button', { name: 'Register Arrival' }));
    await user.type(screen.getByLabelText('Vehicle Number *'), ' KA01MP3776 ');
    await user.type(screen.getByLabelText('Driver Name'), 'Ram Kumar');
    await user.type(screen.getByLabelText('Transporter'), 'TVK Transport');
    await user.click(screen.getByRole('button', { name: 'Select ASN(s)' }));

    await screen.findByText('ASN-2026-00001');
    await user.click(screen.getByLabelText('ASN-2026-00001'));
    await user.click(screen.getByLabelText('ASN-2026-00002'));
    await user.click(screen.getByRole('button', { name: 'Register Arrival' }));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith({
        vehicle_no: 'KA01MP3776',
        driver_name: 'Ram Kumar',
        driver_contact: null,
        transporter: 'TVK Transport',
        warehouse_id: 'warehouse-1',
        dock: null,
        notes: null,
        asn_order_ids: ['asn-1', 'asn-2'],
      });
    });
  });

  it('links an additional ASN to an existing vehicle arrival', async () => {
    const user = userEvent.setup();
    mockUseVehicleArrivals.mockReturnValue({
      data: arrivalsData([vehicleArrival()]),
      loading: false,
      error: null,
      refetch,
      register,
      linkAsns,
      unlinkAsn,
      update,
    });
    render(<VehicleArrivalManagement warehouseId="warehouse-1" />);

    await user.click(screen.getByRole('button', { name: 'Link ASN' }));
    await screen.findByText('ASN-2026-00001');
    await user.click(screen.getByLabelText('ASN-2026-00001'));
    await user.click(screen.getByRole('button', { name: 'Link (1)' }));

    await waitFor(() => {
      expect(linkAsns).toHaveBeenCalledWith('arrival-1', ['asn-1']);
    });
  });

  it('requires a vehicle number before registering an arrival', async () => {
    const user = userEvent.setup();
    render(<VehicleArrivalManagement warehouseId="warehouse-1" />);

    await user.click(screen.getByRole('button', { name: 'Register Arrival' }));
    await user.click(screen.getByRole('button', { name: 'Register Arrival' }));

    expect(register).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Error',
      description: 'Vehicle number is required',
      variant: 'destructive',
    });
  });
});
