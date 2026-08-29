import type {
    PickException,
    PickExceptionAuditResponse,
    PickExceptionCreateInput,
    PickExceptionListResponse,
    PickReasonCodesResponse,
} from '../../types/pick-exception.types';

import { apiRequest, buildPaginationParams } from './core';

// Pick Exceptions API helpers
export const pickExceptionApi = {
    reasonCodes: (accessToken: string) =>
        apiRequest<PickReasonCodesResponse>('/pick-exceptions/reason-codes', accessToken),

    capture: (accessToken: string, data: PickExceptionCreateInput) =>
        apiRequest<PickException>('/pick-exceptions', accessToken, {
            method: 'POST',
            body: data,
        }),

    list: (
        accessToken: string,
        page = 1,
        pageSize = 20,
        filters?: {
            pick_list_id?: string;
            pick_list_item_id?: string;
            reason_code?: string;
            severity?: string;
            status?: string;
        },
    ) =>
        apiRequest<PickExceptionListResponse>('/pick-exceptions', accessToken, {
            params: {
                ...buildPaginationParams(page, pageSize, 'created_at', 'desc'),
                pick_list_id: filters?.pick_list_id,
                pick_list_item_id: filters?.pick_list_item_id,
                reason_code: filters?.reason_code,
                severity: filters?.severity,
                status: filters?.status,
            },
        }),

    get: (accessToken: string, id: string) =>
        apiRequest<PickException>(`/pick-exceptions/${id}`, accessToken),

    getAudit: (accessToken: string, id: string) =>
        apiRequest<PickExceptionAuditResponse>(`/pick-exceptions/${id}/audit`, accessToken),

    resolve: (accessToken: string, id: string, resolution: string) =>
        apiRequest<PickException>(`/pick-exceptions/${id}/resolve`, accessToken, {
            method: 'POST',
            body: { resolution },
        }),

    approve: (accessToken: string, id: string, decision: 'approved' | 'rejected') =>
        apiRequest<PickException>(`/pick-exceptions/${id}/approve`, accessToken, {
            method: 'POST',
            body: { decision },
        }),
};
