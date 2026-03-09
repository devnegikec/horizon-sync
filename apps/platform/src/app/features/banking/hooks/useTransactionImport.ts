import { useCallback } from 'react';

interface ImportResult {
    imported_count: number;
    skipped_count: number;
    failed_count: number;
    errors: string[];
    warnings: string[];
    batch_id: string;
}

type ImportFormat = 'csv' | 'pdf' | 'mt940';

// API Base URL - should come from environment config
const API_BASE_URL = process.env['NX_API_BASE_URL'] || 'http://localhost:8000/api/v1';

export function useTransactionImport(bankAccountId: string) {
    const getAuthToken = useCallback((): string => {
        // Get token from your auth system (localStorage, Zustand store, etc.)
        return localStorage.getItem('auth_token') || '';
    }, []);

    const importTransactions = useCallback(
        async (file: File, format: ImportFormat, forceImport: boolean = false): Promise<ImportResult> => {
            const formData = new FormData();
            formData.append('file', file);

            const url = `${API_BASE_URL}/bank-accounts/${bankAccountId}/import/${format}${
                forceImport ? '?force_import=true' : ''
            }`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getAuthToken()}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Import failed: ${response.status}`;
                
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.detail || errorMessage;
                } catch {
                    errorMessage = errorText || errorMessage;
                }
                
                throw new Error(errorMessage);
            }

            const result = await response.json();
            return result as ImportResult;
        },
        [bankAccountId, getAuthToken]
    );

    return {
        importTransactions,
    };
}
