import { buildUrl, type ApiError } from './core';

// Bulk Import API helpers
export const bulkImportApi = {
  upload: async (accessToken: string, file: File): Promise<unknown> => {
    const url = buildUrl('/bulk-import/upload');
    
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      const error: ApiError = {
        message: errorText || `HTTP ${response.status}`,
        status: response.status,
      };
      try {
        error.details = JSON.parse(errorText);
      } catch {
        // Text is not JSON
      }
      throw error;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {};
    }

    return response.json();
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
    const url = buildUrl('/bulk-export');

    console.log('[bulkExportApi] Sending export request:', { url, payload });

    // Step 1: Create export job
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    console.log('[bulkExportApi] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[bulkExportApi] Error response:', errorText);
      const error: ApiError = {
        message: errorText || `HTTP ${response.status}`,
        status: response.status,
      };
      try {
        error.details = JSON.parse(errorText);
      } catch {
        // Text is not JSON
      }
      throw error;
    }

    // Parse JSON response from backend
    const data: BulkExportResponse = await response.json();
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
    const downloadUrl = buildUrl(`/bulk-export/${data.id}/download`);
    console.log('[bulkExportApi] Downloading file from:', downloadUrl);

    const downloadResponse = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log('[bulkExportApi] Download response status:', downloadResponse.status);

    if (!downloadResponse.ok) {
      const errorText = await downloadResponse.text();
      console.error('[bulkExportApi] Download error:', errorText);
      throw {
        message: `Failed to download file: ${errorText || downloadResponse.status}`,
        status: downloadResponse.status,
      } as ApiError;
    }

    const blob = await downloadResponse.blob();
    console.log('[bulkExportApi] File downloaded, size:', blob.size);
    return blob;
  },
};
