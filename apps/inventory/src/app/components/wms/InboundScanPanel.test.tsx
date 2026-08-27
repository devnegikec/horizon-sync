import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { useInboundSession } from '../../hooks/useWMS';
import { asnOrderApi } from '../../utility/api/asn-orders';

import { InboundScanPanel } from './InboundScanPanel';

jest.mock('@horizon-sync/store', () => ({
  useUserStore: jest.fn((selector: (state: { accessToken: string }) => string) => selector({ accessToken: 'test-token' })),
}));

jest.mock('@horizon-sync/ui/hooks', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

jest.mock('../../hooks/useWMS', () => ({
  useInboundSession: jest.fn(),
}));

jest.mock('../../utility/api/asn-orders', () => ({
  asnOrderApi: {
    list: jest.fn(),
    getReceivingSummary: jest.fn(),
  },
}));

const mockUseInboundSession = useInboundSession as unknown as { mockReturnValue: (value: unknown) => void };
const mockGetReceivingSummary = asnOrderApi.getReceivingSummary as unknown as { mockResolvedValue: (value: unknown) => void };

describe('InboundScanPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseInboundSession.mockReturnValue({
      session: {
        id: 'session-1',
        organization_id: 'org-1',
        session_type: 'inbound',
        worker_id: 'worker-1',
        warehouse_id: 'warehouse-1',
        dock_location: 'Dock A',
        asn_order_id: 'asn-1',
        asn_order_no: 'ASN-2026-00001',
        status: 'open',
        total_boxes_scanned: 10,
        started_at: null,
        ended_at: null,
        created_at: null,
      },
      loading: false,
      error: null,
      startSession: jest.fn(),
      recordScan: jest.fn(),
      endSession: jest.fn(),
      getSummary: jest.fn(),
    });
  });

  it('shows a reconciled ASN as ready for a receipt note', async () => {
    mockGetReceivingSummary.mockResolvedValue({
      asn_order_id: 'asn-1',
      asn_order_no: 'ASN-2026-00001',
      asn_status: 'confirmed',
      expected_total_qty: 10,
      scanned_total_qty: 10,
      accepted_total_qty: 0,
      rejected_total_qty: 0,
      short_total_qty: 0,
      excess_total_qty: 0,
      damaged_total_qty: 0,
      hold_total_qty: 0,
      pending_total_qty: 10,
      over_total_qty: 0,
      total_line_items: 1,
      matched_items: 1,
      partial_items: 0,
      not_received_items: 0,
      over_items: 0,
      reconciliation_status: 'reconciled',
      ready_for_receipt_note: true,
      is_partial_receipt: false,
      unresolved_exception_count: 0,
      active_session_id: 'session-1',
      linked_slips: [],
      line_items: [
        {
          asn_item_id: 'asn-line-1',
          item_id: 'item-1',
          sku: 'SKU-1',
          item_name: 'Item one',
          expected_qty: 10,
          scanned_qty: 10,
          accepted_qty: 0,
          rejected_qty: 0,
          short_qty: 0,
          excess_qty: 0,
          damaged_qty: 0,
          hold_qty: 0,
          pending_qty: 10,
          over_qty: 0,
          status: 'matched',
        },
      ],
    });

    render(<InboundScanPanel warehouseId="warehouse-1" />);

    expect(await screen.findByText('Reconciled — Ready for Receipt Note')).toBeInTheDocument();
    expect(screen.getByText('SKU-1')).toBeInTheDocument();
    expect(mockGetReceivingSummary).toHaveBeenCalledWith('test-token', 'asn-1', 'session-1');
  });
});
