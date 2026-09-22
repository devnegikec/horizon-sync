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

  it('shows live reconciliation totals and per-line statuses (IN-WF-011)', async () => {
    mockGetReceivingSummary.mockResolvedValue({
      asn_order_id: 'asn-1',
      asn_order_no: 'ASN-2026-00001',
      asn_status: 'confirmed',
      expected_total_qty: 15,
      scanned_total_qty: 13,
      accepted_total_qty: 13,
      rejected_total_qty: 0,
      short_total_qty: 0,
      excess_total_qty: 0,
      damaged_total_qty: 2,
      hold_total_qty: 0,
      pending_total_qty: 0,
      over_total_qty: 0,
      total_line_items: 2,
      matched_items: 1,
      partial_items: 0,
      not_received_items: 0,
      over_items: 0,
      reconciliation_status: 'exception',
      ready_for_receipt_note: false,
      is_partial_receipt: false,
      unresolved_exception_count: 1,
      active_session_id: 'session-1',
      linked_slips: [],
      line_items: [
        {
          asn_item_id: 'asn-line-1',
          item_id: 'item-1',
          sku: 'SKU-A',
          item_name: 'Widget A',
          expected_qty: 10,
          scanned_qty: 8,
          accepted_qty: 8,
          rejected_qty: 0,
          short_qty: 0,
          excess_qty: 0,
          damaged_qty: 2,
          hold_qty: 0,
          pending_qty: 0,
          over_qty: 0,
          status: 'exception',
        },
        {
          asn_item_id: 'asn-line-2',
          item_id: 'item-2',
          sku: 'SKU-B',
          item_name: 'Widget B',
          expected_qty: 5,
          scanned_qty: 5,
          accepted_qty: 5,
          rejected_qty: 0,
          short_qty: 0,
          excess_qty: 0,
          damaged_qty: 0,
          hold_qty: 0,
          pending_qty: 0,
          over_qty: 0,
          status: 'matched',
        },
      ],
    });

    render(<InboundScanPanel warehouseId="warehouse-1" />);

    expect(await screen.findByText('Exception requires review')).toBeInTheDocument();

    // Live reconciliation totals (also appear as table headers).
    for (const label of ['Expected', 'Scanned', 'Accepted', 'Short', 'Excess', 'Damaged', 'Hold', 'Rejected']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }

    // Per-line SKUs and their reconciliation status.
    expect(screen.getByText('SKU-A')).toBeInTheDocument();
    expect(screen.getByText('SKU-B')).toBeInTheDocument();
    expect(screen.getByText('exception')).toBeInTheDocument();
    expect(screen.getByText('matched')).toBeInTheDocument();
  });

  it('shows the remaining balance for a partial receipt (IN-WF-013)', async () => {
    mockGetReceivingSummary.mockResolvedValue({
      asn_order_id: 'asn-1',
      asn_order_no: 'ASN-2026-00001',
      asn_status: 'partially_delivered',
      expected_total_qty: 10,
      scanned_total_qty: 4,
      accepted_total_qty: 4,
      rejected_total_qty: 0,
      short_total_qty: 6,
      excess_total_qty: 0,
      damaged_total_qty: 0,
      hold_total_qty: 0,
      pending_total_qty: 6,
      over_total_qty: 0,
      total_line_items: 1,
      matched_items: 0,
      partial_items: 1,
      not_received_items: 0,
      over_items: 0,
      reconciliation_status: 'partial',
      ready_for_receipt_note: false,
      is_partial_receipt: true,
      unresolved_exception_count: 0,
      active_session_id: 'session-1',
      linked_slips: [],
      line_items: [
        {
          asn_item_id: 'asn-line-1',
          item_id: 'item-1',
          sku: 'SKU-A',
          item_name: 'Widget A',
          expected_qty: 10,
          scanned_qty: 4,
          accepted_qty: 4,
          rejected_qty: 0,
          short_qty: 6,
          excess_qty: 0,
          damaged_qty: 0,
          hold_qty: 0,
          pending_qty: 6,
          over_qty: 0,
          status: 'partial',
        },
      ],
    });

    render(<InboundScanPanel warehouseId="warehouse-1" />);

    expect(await screen.findByText('Partial receipt — 6 units remaining')).toBeInTheDocument();
    expect(screen.queryByText('Reconciled — Ready for Receipt Note')).not.toBeInTheDocument();
    expect(screen.getByText('partial')).toBeInTheDocument();
  });
});
