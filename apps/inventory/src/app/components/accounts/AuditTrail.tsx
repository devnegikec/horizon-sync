import React, { useState, useEffect } from 'react';
import { Badge, Button, Card, CardContent, Input, Label } from '@horizon-sync/ui/components';
import { useUserStore } from '@horizon-sync/store';
import { accountApi } from '../../utility/api/accounts';
import type { AuditLogEntry, AuditAction, AuditTrailResponse } from '../../types/account.types';

interface AuditTrailProps {
  accountId: string;
}

const actionColors: Record<AuditAction, 'success' | 'info' | 'error' | 'warning'> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'error',
  STATUS_CHANGE: 'warning',
};

const actionLabels: Record<AuditAction, string> = {
  CREATE: 'Created',
  UPDATE: 'Updated',
  DELETE: 'Deleted',
  STATUS_CHANGE: 'Status Changed',
};

export const AuditTrail: React.FC<AuditTrailProps> = ({ accountId }) => {
  const { accessToken } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auditData, setAuditData] = useState<AuditTrailResponse | null>(null);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState(1);

  const fetchAuditTrail = async () => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const filters: {
        action?: string;
        start_date?: string;
        end_date?: string;
        page: number;
        page_size: number;
      } = {
        page,
        page_size: 20,
      };

      if (actionFilter) {
        filters.action = actionFilter;
      }
      if (startDate) {
        filters.start_date = new Date(startDate).toISOString();
      }
      if (endDate) {
        filters.end_date = new Date(endDate).toISOString();
      }

      const response = await accountApi.getAuditTrail(accessToken, accountId, filters);
      setAuditData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditTrail();
  }, [accountId, accessToken, actionFilter, startDate, endDate, page]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const renderChanges = (entry: AuditLogEntry) => {
    const { changes } = entry;

    // Handle CREATE action (only new values)
    if ('new' in changes && changes.new) {
      return (
        <div>
          <p className="mb-2 text-sm text-muted-foreground">
            Initial values:
          </p>
          {Object.entries(changes.new).map(([field, value]) => (
            <div key={field} className="mb-1 ml-2 text-sm">
              <strong>{field}:</strong> {formatValue(value)}
            </div>
          ))}
        </div>
      );
    }

    // Handle DELETE action (only old values)
    if ('old' in changes && changes.old) {
      return (
        <div>
          <p className="mb-2 text-sm text-muted-foreground">
            Deleted values:
          </p>
          {Object.entries(changes.old).map(([field, value]) => (
            <div key={field} className="mb-1 ml-2 text-sm">
              <strong>{field}:</strong> {formatValue(value)}
            </div>
          ))}
        </div>
      );
    }

    // Handle UPDATE and STATUS_CHANGE (old and new values)
    return (
      <div>
        {Object.entries(changes).map(([field, change]) => {
          if (typeof change === 'object' && change !== null && 'oldValue' in change) {
            const { oldValue, newValue } = change as { oldValue?: unknown; newValue?: unknown };
            return (
              <div key={field} className="mb-2">
                <p className="text-sm">
                  <strong>{field}:</strong>
                </p>
                <div className="ml-2 flex items-center gap-2">
                  <Badge variant="outline" className="border-red-300 text-red-700 dark:border-red-800 dark:text-red-300">
                    {formatValue(oldValue)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">→</span>
                  <Badge variant="outline" className="border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300">
                    {formatValue(newValue)}
                  </Badge>
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return 'null';
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  if (loading && !auditData) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Loading audit trail...</div>;
  }

  if (error) {
    return <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>;
  }

  const actionBadgeClass: Record<AuditAction, string> = {
    CREATE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
    UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    STATUS_CHANGE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
  };

  return (
    <Card>
      <CardContent>
        <h3 className="mb-4 text-lg font-semibold">Audit Trail</h3>

        {/* Filters */}
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="audit-action-filter">Action Type</Label>
            <select
              id="audit-action-filter"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={actionFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Actions</option>
              <option value="CREATE">Created</option>
              <option value="UPDATE">Updated</option>
              <option value="DELETE">Deleted</option>
              <option value="STATUS_CHANGE">Status Changed</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="audit-start-date">Start Date</Label>
            <Input
              id="audit-start-date"
              type="date"
              value={startDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audit-end-date">End Date</Label>
            <Input
              id="audit-end-date"
              type="date"
              value={endDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Audit entries */}
        {auditData && auditData.items.length > 0 ? (
          <>
            <div className="mb-3 space-y-2">
              {auditData.items.map((entry) => (
                <details key={entry.id} className="rounded-md border p-3">
                  <summary className="flex cursor-pointer list-none items-center gap-2">
                    <Badge variant="secondary" className={actionBadgeClass[entry.action]}>
                      {actionLabels[entry.action]}
                    </Badge>
                    <span className="flex-1 text-sm text-muted-foreground">{formatTimestamp(entry.timestamp)}</span>
                    <span className="text-sm text-muted-foreground">by {entry.user_id}</span>
                  </summary>
                  <div className="mt-3">{renderChanges(entry)}</div>
                </details>
              ))}
            </div>

            {/* Pagination */}
            {auditData.total_pages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={!auditData.has_prev}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {auditData.page} of {auditData.total_pages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.min(auditData.total_pages, prev + 1))}
                  disabled={!auditData.has_next}
                >
                  Next
                </Button>
              </div>
            )}

            <p className="mt-3 text-center text-sm text-muted-foreground">
              Showing {auditData.items.length} of {auditData.total} entries
            </p>
          </>
        ) : (
          <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            No audit trail entries found for this account.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
