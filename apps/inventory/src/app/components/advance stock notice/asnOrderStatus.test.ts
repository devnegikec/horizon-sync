import { describe, expect, it } from '@jest/globals';

import { ASN_CLOSABLE_STATUSES, ASN_TERMINAL_STATUSES, canAttachVehicle, canCloseAsn } from '../../types/asn-order.types';
import type { AsnOrderStatus } from '../../types/asn-order.types';

const ALL_STATUSES: AsnOrderStatus[] = ['draft', 'confirmed', 'partially_delivered', 'delivered', 'closed', 'cancelled'];

describe('ASN close / vehicle status rules', () => {
  it('only allows closing a partially delivered or delivered ASN', () => {
    const closable = ALL_STATUSES.filter((status) => canCloseAsn({ status }));
    expect(closable).toEqual([...ASN_CLOSABLE_STATUSES]);
  });

  it('refuses to close an ASN that was already short-closed', () => {
    expect(canCloseAsn({ status: 'delivered', short_closed: true })).toBe(false);
    expect(canCloseAsn({ status: 'delivered', short_closed: false })).toBe(true);
  });

  it('accepts a vehicle on every non-terminal ASN', () => {
    const attachable = ALL_STATUSES.filter((status) => canAttachVehicle(status));
    expect(attachable).toEqual(ALL_STATUSES.filter((status) => !ASN_TERMINAL_STATUSES.includes(status)));
    expect(canAttachVehicle('closed')).toBe(false);
    expect(canAttachVehicle('cancelled')).toBe(false);
  });
});
