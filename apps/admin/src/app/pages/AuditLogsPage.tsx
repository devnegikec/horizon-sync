import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';

import {
  Card,
  CardContent,
  Button,
  Input,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@horizon-sync/ui/components';

import { AdminAuditLogService } from '../services/admin-audit-log.service';
import type { AuditLogEntry, AuditLogFilters, AuditLogListResponse } from '../types/audit.types';
import type { PaginationMeta } from '../types/common.types';

function ActionBadge({ action }: { action: string }) {
  const config: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
    CREATE: { variant: 'default', label: 'Create' },
    UPDATE: { variant: 'secondary', label: 'Update' },
    DELETE: { variant: 'destructive', label: 'Delete' },
  };
  const c = config[action] || { variant: 'secondary' as const, label: action };
  return <Badge variant={c.variant}>{c.label}</Badge>;
}

function DiffView({ oldValues, newValues, changedFields }: {
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  changedFields: string[] | null;
}) {
  if (!changedFields || changedFields.length === 0) {
    return <p className="text-sm text-muted-foreground">No field changes recorded.</p>;
  }

  return (
    <div className="space-y-2">
      {changedFields.map((field) => (
        <div key={field} className="grid grid-cols-3 gap-2 text-sm border-b pb-2 last:border-0">
          <span className="font-medium text-muted-foreground">{field}</span>
          <span className="text-red-600 dark:text-red-400 break-all">
            {oldValues?.[field] != null ? String(oldValues[field]) : '—'}
          </span>
          <span className="text-green-600 dark:text-green-400 break-all">
            {newValues?.[field] != null ? String(newValues[field]) : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    page_size: 20,
  });
  const [actionFilter, setActionFilter] = useState('all');
  const [tableNameFilter, setTableNameFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchLogs = useCallback(async (f: AuditLogFilters) => {
    setLoading(true);
    try {
      const res: AuditLogListResponse = await AdminAuditLogService.getAuditLogs(f);
      setAuditLogs(res.audit_logs);
      setPagination(res.pagination);
    } catch {
      // error handled by service
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(filters);
  }, [filters, fetchLogs]);

  const handleSearch = () => {
    setFilters({
      ...filters,
      action: actionFilter === 'all' ? undefined : actionFilter,
      table_name: tableNameFilter || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page: 1,
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString();
  };

  const toggleRow = (id: string) => {
    setExpandedRow((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">
          View field-level change history across all organizations
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-5">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Table name..."
              value={tableNameFilter}
              onChange={(e) => setTableNameFilter(e.target.value)}
            />
            <Input
              type="date"
              placeholder="From"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <Input
              type="date"
              placeholder="To"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Record ID</TableHead>
                <TableHead>Changed Fields</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading audit logs...
                  </TableCell>
                </TableRow>
              ) : auditLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No audit logs found
                  </TableCell>
                </TableRow>
              ) : (
                auditLogs.map((log) => (
                  <>
                    <TableRow
                      key={log.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleRow(log.id)}
                    >
                      <TableCell>
                        {expandedRow === log.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatTimestamp(log.created_at)}
                      </TableCell>
                      <TableCell>{log.user_email || '—'}</TableCell>
                      <TableCell>
                        <ActionBadge action={log.action} />
                      </TableCell>
                      <TableCell>{log.table_name}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.record_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        {log.changed_fields
                          ? log.changed_fields.join(', ')
                          : '—'}
                      </TableCell>
                    </TableRow>
                    {expandedRow === log.id && (
                      <TableRow key={`${log.id}-detail`}>
                        <TableCell colSpan={7} className="bg-muted/30 p-4">
                          {log.action === 'UPDATE' ? (
                            <div>
                              <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-muted-foreground mb-2">
                                <span>Field</span>
                                <span>Old Value</span>
                                <span>New Value</span>
                              </div>
                              <DiffView
                                oldValues={log.old_values}
                                newValues={log.new_values}
                                changedFields={log.changed_fields}
                              />
                            </div>
                          ) : log.action === 'CREATE' ? (
                            <div>
                              <p className="text-sm font-medium mb-2">New Values:</p>
                              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-48">
                                {JSON.stringify(log.new_values, null, 2)}
                              </pre>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm font-medium mb-2">Deleted Values:</p>
                              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-48">
                                {JSON.stringify(log.old_values, null, 2)}
                              </pre>
                            </div>
                          )}
                          <div className="mt-3 text-xs text-muted-foreground space-y-1">
                            <p>IP: {log.ip_address || '—'}</p>
                            <p>User ID: {log.user_id || '—'}</p>
                            <p>Org ID: {log.organization_id || '—'}</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.total_pages} ({pagination.total_items} total)
          </p>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.has_prev}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.has_next}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
