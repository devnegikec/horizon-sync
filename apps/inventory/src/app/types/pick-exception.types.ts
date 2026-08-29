/**
 * Pick Exception Types (PR-03 / T-02 + T-05)
 * Based on API endpoint: /api/v1/pick-exceptions
 */

export type PickExceptionSeverity = 'info' | 'warning' | 'error' | 'critical';

export type PickExceptionStatus =
    | 'open'
    | 'approved'
    | 'rejected'
    | 'resolved'
    | 'cancelled';

export interface PickException {
    id: string;
    organization_id: string;
    pick_list_id: string;
    pick_list_item_id: string;
    reason_code: string;
    severity: PickExceptionSeverity;
    reported_by: string | null;
    status: PickExceptionStatus;
    resolution: string | null;
    approver: string | null;
    approved_at: string | null;
    quantity: string | null;
    note: string | null;
    details: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
}

export interface PickExceptionAuditItem {
    id: string;
    exception_id: string;
    event_type: string;
    actor_id: string | null;
    from_state: string | null;
    to_state: string | null;
    details: Record<string, unknown> | null;
    created_at: string;
}

export interface PickExceptionAuditResponse {
    exception_id: string;
    events: PickExceptionAuditItem[];
}

export interface PickExceptionPagination {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
}

export interface PickExceptionListResponse {
    exceptions: PickException[];
    pagination: PickExceptionPagination;
}

export interface PickReasonCodesResponse {
    reason_codes: string[];
}

export interface PickExceptionCreateInput {
    pick_list_item_id: string;
    reason_code: string;
    severity?: PickExceptionSeverity;
    quantity?: number | null;
    note?: string | null;
    details?: Record<string, unknown>;
}
