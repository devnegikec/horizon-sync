import { apiRequest, type ApiError } from './core';

// Bulk Import API helpers
export const bulkImportApi = {
  upload: async (accessToken: string, file: File): Promise<unknown> => {
    const formData = new FormData();
    formData.append('file', file);

    return apiRequest<unknown>('/bulk-import/upload', accessToken, {
      method: 'POST',
      body: formData,
    });
  },
};

// Bulk Export API helpers
export interface BulkExportPayload {
  file_format: 'csv' | 'xlsx' | 'json' | 'pdf';
  file_name: string;
  filters?: {
    item_type?: string;
    status?: string;
  } | null;
  selected_columns?: string[] | null;
}

export interface BulkExportResponse {
  id: string;
  organization_id: string;
  created_by_id: string;
  file_name: string;
  file_format: string;
  status: string;
  total_rows: number;
  filters: unknown;
  selected_columns: string[] | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  expires_at: string | null;
  file_content?: string;
}

export const bulkExportApi = {
  export: async (accessToken: string, payload: BulkExportPayload): Promise<Blob> => {
    console.log('[bulkExportApi] Sending export request:', { payload });

    // Step 1: Create export job
    const data = await apiRequest<BulkExportResponse>('/bulk-export', accessToken, {
      method: 'POST',
      body: payload,
    });

    console.log('[bulkExportApi] Job created:', data);

    // Check if export completed
    if (data.status !== 'COMPLETED') {
      console.error('[bulkExportApi] Export not completed, status:', data.status);
      throw {
        message: `Export status: ${data.status}`,
        status: 500,
        details: data,
      } as ApiError;
    }

    // Step 2: Download the exported file
    console.log('[bulkExportApi] Downloading file for job:', data.id);

    const blob = await apiRequest<Blob>(`/bulk-export/${data.id}/download`, accessToken, {
      method: 'GET',
      responseType: 'blob',
    });

    console.log('[bulkExportApi] File downloaded, size:', blob.size);
    return blob;
  },
};
