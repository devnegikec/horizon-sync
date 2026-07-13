import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight } from 'lucide-react';

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
import { AdminOrganizationService } from '../services/admin-organization.service';
import type { AuditLogEntry, AuditLogFilters, AuditLogListResponse } from '../types/audit.types';
import type { PaginationMeta } from '../types/common.types';
import type { AdminOrgListItem } from '../types';

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

const EVENT_TYPE_OPTIONS = [
  'invoices', 'invoice_items', 'payments', 'payment_entries',
  'customers', 'suppliers', 'journal_entries', 'sales_orders',
  'quotations', 'items', 'warehouses_extended', 'purchase_receipts',
  'organizations', 'users',
];

export function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [orgOptions, setOrgOptions] = useState<Array<{ id: string; name: string }>>([]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [actionFilter, setActionFilter] = useState('all');
  const [orgFilter, setOrgFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Reset to first page when any filter changes
  useEffect(() => { setPage(1); }, [actionFilter, orgFilter, eventTypeFilter, dateFrom, dateTo]);

  const filters: AuditLogFilters = useMemo(() => ({
    page,
    page_size: pageSize,
    ...(orgFilter !== 'all' ? { organization_id: orgFilter } : {}),
    ...(actionFilter !== 'all' ? { action: actionFilter } : {}),
    ...(eventTypeFilter !== 'all' ? { table_name: eventTypeFilter } : {}),
    ...(dateFrom ? { date_from: dateFrom } : {}),
    ...(dateTo ? { date_to: dateTo } : {}),
  }), [page, pageSize, orgFilter, actionFilter, eventTypeFilter, dateFrom, dateTo]);

  useEffect(() => {
    AdminOrganizationService.list({ page: 1, page_size: 100 })
      .then((res) => setOrgOptions(res.organizations.map((o: AdminOrgListItem) => ({ id: o.id, name: o.name }))))
      .catch(() => setOrgOptions([]));
  }, []);

  const fetchLogs = useCallback(async (f: AuditLogFilters) => {
    setLoading(true);
    try {
      const res: AuditLogListResponse = await AdminAuditLogService.getAuditLogs(f);
      setAuditLogs(res.audit_logs);
      setPagination(res.pagination);
    } catch { /* handled by service */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLogs(filters); }, [filters, fetchLogs]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const formatDateTime = (ts: string) => new Date(ts).toLocaleString();
  const toggleRow = (id: string) => setExpandedRow((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">View field-level change history across all organizations</p>
      </div>

      {/* Filters: Organization, Action, Event Type, Date From, Date To, Filter button */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-5">
            <Select value={orgFilter} onValueChange={setOrgFilter}>
              <SelectTrigger><SelectValue placeholder="Organization" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {orgOptions.map((org) => (
                  <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger><SelectValue placeholder="Action" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
              </SelectContent>
            </Select>
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger><SelectValue placeholder="Event Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Event Types</SelectItem>
                {EVENT_TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" placeholder="From" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <Input type="date" placeholder="To" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
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
                <TableHead>Date & Time</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Changed Fields</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Loading audit logs...</TableCell></TableRow>
              ) : auditLogs.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">No audit logs found</TableCell></TableRow>
              ) : (
                auditLogs.map((log) => (
                  <>
                    <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50" onClick={() => toggleRow(log.id)}>
                      <TableCell>
                        {expandedRow === log.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatDateTime(log.created_at)}</TableCell>
                      <TableCell>
                        {log.user_name || log.user_email ? (
                          <div className="flex flex-col">
                            <span className="font-medium">{log.user_name || log.user_email}</span>
                            {log.user_email_address && <span className="text-xs text-muted-foreground">{log.user_email_address}</span>}
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell><ActionBadge action={log.action} /></TableCell>
                      <TableCell>{log.table_name?.replace(/_/g, ' ') || '—'}</TableCell>
                      <TableCell>{log.changed_fields ? log.changed_fields.join(', ') : '—'}</TableCell>
                    </TableRow>
                    {expandedRow === log.id && (
                      <TableRow key={`${log.id}-detail`}>
                        <TableCell colSpan={6} className="bg-muted/30 p-4">
                          {log.action === 'UPDATE' ? (
                            <div>
                              <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-muted-foreground mb-2">
                                <span>Field</span><span>Old Value</span><span>New Value</span>
                              </div>
                              <DiffView oldValues={log.old_values} newValues={log.new_values} changedFields={log.changed_fields} />
                            </div>
                          ) : log.action === 'CREATE' ? (
                            <div>
                              <p className="text-sm font-medium mb-2">New Values:</p>
                              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-48">{JSON.stringify(log.new_values, null, 2)}</pre>
                            </div>
                          ) : (
                            <div>
                              <p className="text-sm font-medium mb-2">Deleted Values:</p>
                              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-48">{JSON.stringify(log.old_values, null, 2)}</pre>
                            </div>
                          )}
                          <div className="mt-3 text-xs text-muted-foreground space-y-1">
                            <p>IP: {log.ip_address || '—'}</p>
                            <p>User ID: {log.user_id || '—'}</p>
                            <p>Org: {log.organization_name || log.organization_id || '—'}</p>
                            <p>Record ID: {log.record_id || '—'}</p>
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

      {/* Pagination — same style as Organizations DataTable */}
      {pagination && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
            {pagination.total_items} total records
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <Select
                value={`${pageSize}`}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 50, 100].map((size) => (
                    <SelectItem key={size} value={`${size}`}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {pagination.page} of {pagination.total_pages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => handlePageChange(1)}
                disabled={pagination.page <= 1}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => handlePageChange((page) - 1)}
                disabled={pagination.page <= 1}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => handlePageChange((page) + 1)}
                disabled={pagination.page >= pagination.total_pages}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => handlePageChange(pagination.total_pages)}
                disabled={pagination.page >= pagination.total_pages}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
