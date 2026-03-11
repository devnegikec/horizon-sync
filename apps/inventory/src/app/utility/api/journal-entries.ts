/**
 * Journal Entries API Utilities
 * 
 * API functions for journal entry operations
 */

import { useUserStore } from '@horizon-sync/store';

const API_BASE_URL = process.env.NX_API_CORE_URL || 'http://localhost:8001';

function getAccessToken(): string {
  const fromStore = useUserStore.getState().accessToken;
  if (fromStore) return fromStore;
  const fromStorage = typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (fromStorage) return fromStorage;
  throw new Error('No access token found');
}

export interface JournalEntryLine {
  id: string;
  account_id: string;
  account_code: string | null;
  account_name: string | null;
  debit: number;
  credit: number;
  remarks: string | null;
}

export interface JournalEntry {
  id: string;
  entry_no: string;
  posting_date: string;
  voucher_type: string | null;
  reference_type: string;
  reference_id: string;
  total_debit: number;
  total_credit: number;
  remarks: string | null;
  status: string;
  created_at: string;
  lines: JournalEntryLine[];
}

export interface JournalEntriesResponse {
  journal_entries: JournalEntry[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

/**
 * Fetch journal entries with pagination
 */
export async function fetchJournalEntries(
  page: number = 1,
  pageSize: number = 20,
  status?: string,
  sortBy: string = 'posting_date',
  sortOrder: string = 'desc'
): Promise<JournalEntriesResponse> {
  const accessToken = getAccessToken();

  const params = new URLSearchParams();
  params.append('page', String(page));
  params.append('page_size', String(pageSize));
  params.append('sort_by', sortBy);
  params.append('sort_order', sortOrder);
  if (status) params.append('status', status);

  const response = await fetch(
    `${API_BASE_URL}/api/v1/journal-entries?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch journal entries: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch a single journal entry by ID
 */
export async function fetchJournalEntryById(entryId: string): Promise<JournalEntry> {
  const accessToken = getAccessToken();

  const response = await fetch(
    `${API_BASE_URL}/api/v1/journal-entries/${entryId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch journal entry: ${response.statusText}`);
  }

  return response.json();
}

export const journalEntriesApi = {
  fetchJournalEntries,
  fetchJournalEntryById,
};
