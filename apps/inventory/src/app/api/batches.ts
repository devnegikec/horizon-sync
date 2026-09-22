/**
 * Batches API service
 * Endpoints: /api/v1/batches
 */

import type { Batch, BatchCreatePayload, BatchListResponse } from '../types/batch.types';
import { apiRequest, buildPaginationParams } from '../utility/api/core';

export interface BatchListFilters {
  search?: string;
  status?: string;
  item_id?: string;
}

export const batchApi = {
  list(accessToken: string, page = 1, pageSize = 20, filters?: BatchListFilters): Promise<BatchListResponse> {
    const params: Record<string, string | number | boolean | undefined> = {
      ...buildPaginationParams(page, pageSize),
      search: filters?.search || undefined,
      status: filters?.status || undefined,
      item_id: filters?.item_id || undefined,
    };
    return apiRequest<BatchListResponse>('/batches', accessToken, { params });
  },

  get(accessToken: string, batchId: string): Promise<Batch> {
    return apiRequest<Batch>(`/batches/${batchId}`, accessToken);
  },

  create(accessToken: string, data: BatchCreatePayload): Promise<Batch> {
    return apiRequest<Batch>('/batches', accessToken, {
      method: 'POST',
      body: data,
    });
  },

  update(accessToken: string, batchId: string, data: Partial<BatchCreatePayload>): Promise<Batch> {
    return apiRequest<Batch>(`/batches/${batchId}`, accessToken, {
      method: 'PUT',
      body: data,
    });
  },

  remove(accessToken: string, batchId: string): Promise<void> {
    return apiRequest<void>(`/batches/${batchId}`, accessToken, {
      method: 'DELETE',
    });
  },
};
