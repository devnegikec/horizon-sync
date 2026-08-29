import * as React from 'react';

import { AlertTriangle, CheckCircle2, RefreshCw, X } from 'lucide-react';
import { useUserStore } from '@horizon-sync/store';
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';

import type { PickException, PickExceptionSeverity, PickExceptionStatus } from '../../types/pick-exception.types';
import { pickExceptionApi } from '../../utility/api/pick-exceptions';
import { hasPermission } from '../../utils/permissions';

const SEVERITY_STYLES: Record<PickExceptionSeverity, string> = {
    info: 'bg-blue-500/10 text-blue-600',
    warning: 'bg-amber-500/10 text-amber-600',
    error: 'bg-orange-500/10 text-orange-600',
    critical: 'bg-red-500/10 text-red-600',
};

const STATUS_STYLES: Record<PickExceptionStatus, string> = {
    open: 'bg-muted text-muted-foreground',
    approved: 'bg-emerald-500/10 text-emerald-600',
    rejected: 'bg-red-500/10 text-red-600',
    resolved: 'bg-blue-500/10 text-blue-600',
    cancelled: 'bg-muted text-muted-foreground',
};

function SeverityBadge({ severity }: { severity: string }) {
    const style = SEVERITY_STYLES[(severity as PickExceptionSeverity)] ?? 'bg-muted text-muted-foreground';
    return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${style}`}>{severity}</span>;
}

function StatusBadge({ status }: { status: string }) {
    const style = STATUS_STYLES[(status as PickExceptionStatus)] ?? 'bg-muted text-muted-foreground';
    return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${style}`}>{status.replace(/_/g, ' ')}</span>;
}

export function PickExceptionQueue({ warehouseId }: { warehouseId?: string }) {
    const token = useUserStore((state) => state.accessToken);
    const permissions = useUserStore((state) => state.permissions.permissions);
    const canManage = hasPermission(permissions, 'warehouse.manage');

    const [exceptions, setExceptions] = React.useState<PickException[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [severity, setSeverity] = React.useState<string>('all');
    const [status, setStatus] = React.useState<string>('all');
    const [resolution, setResolution] = React.useState('');
    const [activeId, setActiveId] = React.useState<string | null>(null);

    const load = React.useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const res = await pickExceptionApi.list(token, 1, 100, {
                severity: severity === 'all' ? undefined : severity,
                status: status === 'all' ? undefined : status,
            });
            setExceptions(res.exceptions ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load exceptions');
        } finally {
            setLoading(false);
        }
    }, [token, severity, status]);

    React.useEffect(() => { load(); }, [load]);

    const resolve = async (exception: PickException) => {
        if (!token || !resolution.trim()) return;
        setActiveId(exception.id);
        try {
            await pickExceptionApi.resolve(token, exception.id, resolution.trim());
            setResolution('');
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Resolve failed');
        } finally {
            setActiveId(null);
        }
    };

    const decide = async (exception: PickException, decision: 'approved' | 'rejected') => {
        if (!token) return;
        setActiveId(exception.id);
        try {
            await pickExceptionApi.approve(token, exception.id, decision);
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Action failed');
        } finally {
            setActiveId(null);
        }
    };

    const actionable = (exception: PickException) =>
        exception.status === 'open' || exception.status === 'approved';

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold">Pick Exception Queue</h2>
                    <p className="text-sm text-muted-foreground">
                        Discrepancies, damage and short-picks reported during picking.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={load} disabled={loading}>
                    <RefreshCw className="mr-1 h-3.5 w-3.5" />
                    Refresh
                </Button>
            </div>

            <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 md:grid-cols-2">
                <div>
                    <Label htmlFor="exc-severity">Severity</Label>
                    <Select value={severity} onValueChange={setSeverity}>
                        <SelectTrigger id="exc-severity">
                            <SelectValue placeholder="All severities" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All severities</SelectItem>
                            <SelectItem value="info">Info</SelectItem>
                            <SelectItem value="warning">Warning</SelectItem>
                            <SelectItem value="error">Error</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="exc-status">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger id="exc-status">
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {canManage && (
                <div className="grid gap-3 rounded-lg border bg-muted/20 p-3">
                    <Label htmlFor="exc-resolution">Resolution note (for the selected exception)</Label>
                    <Input
                        id="exc-resolution"
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        placeholder="e.g. Damaged unit moved to quarantine"
                    />
                </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
            {loading && <p className="text-sm text-muted-foreground">Loading exception queue…</p>}
            {!loading && exceptions.length === 0 && (
                <p className="rounded-lg border py-8 text-center text-sm text-muted-foreground">No pick exceptions.</p>
            )}

            <div className="grid gap-3">
                {exceptions.map((exception) => (
                    <article key={exception.id} className="rounded-lg border p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="flex items-center gap-2 font-medium">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    {exception.reason_code.replace(/_/g, ' ')}
                                </p>
                                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                    <SeverityBadge severity={exception.severity} />
                                    <StatusBadge status={exception.status} />
                                    {exception.quantity != null && <span>Qty {exception.quantity}</span>}
                                </p>
                                {exception.note && <p className="mt-2 text-sm">{exception.note}</p>}
                                {exception.resolution && (
                                    <p className="mt-2 text-sm text-muted-foreground">Resolution: {exception.resolution}</p>
                                )}
                            </div>
                            {canManage && actionable(exception) && (
                                <div className="flex flex-wrap gap-2">
                                    <Button size="sm" onClick={() => resolve(exception)} disabled={activeId === exception.id || !resolution.trim()}>
                                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                        Resolve
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => decide(exception, 'approved')} disabled={activeId === exception.id}>
                                        Approve
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => decide(exception, 'rejected')} disabled={activeId === exception.id}>
                                        <X className="mr-1 h-3.5 w-3.5" />
                                        Reject
                                    </Button>
                                </div>
                            )}
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}
