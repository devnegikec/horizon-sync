/**
 * Journal Entries API Utilities
 * 
 * API functions for journal entry operations
 */

import { apiRequest, getAccessToken, buildPaginationParams } from './core';

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
  page = 1,
  pageSize = 20,
  status?: string,
  sortBy = 'posting_date',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<JournalEntriesResponse> {
  const accessToken = getAccessToken();
  return apiRequest<JournalEntriesResponse>('/journal-entries', accessToken, {
    params: {
      ...buildPaginationParams(page, pageSize, sortBy, sortOrder),
      ...(status && { status }),
    },
  });
}

/**
 * Fetch a single journal entry by ID
 */
export async function fetchJournalEntryById(entryId: string): Promise<JournalEntry> {
  const accessToken = getAccessToken();
  return apiRequest<JournalEntry>(`/journal-entries/${entryId}`, accessToken);
}

export const journalEntriesApi = {
  fetchJournalEntries: (page?: number, pageSize?: number, status?: string, sortBy?: string, sortOrder?: 'asc' | 'desc') =>
    fetchJournalEntries(page, pageSize, status, sortBy, sortOrder),
  fetchJournalEntryById: (entryId: string) =>
    fetchJournalEntryById(entryId),
};
