import { useState, useEffect } from 'react';
import {
    Activity,
    Calendar,
    User,
    Building2,
    Search,
    Filter,
    Download,
    RefreshCw
} from 'lucide-react';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Button,
    Input,
    Badge,
    DataTable,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    DatePicker,
} from '@horizon-sync/ui/components';
import { toast } from '@horizon-sync/ui';

// Add convenience methods for toast
const showToast = {
    success: (message: string) => toast({ title: 'Success', description: message, variant: 'default' }),
    error: (message: string) => toast({ title: 'Error', description: message, variant: 'destructive' })
};

import { SystemAdminPermissionsService } from '../../services/system-admin-permissions.service';
import type { SystemAdminAuditLog } from '../../types';

interface AuditLogModalProps {
    isOpen: boolean;
    onClose: () => void;
    adminUserId?: string;
    organizationId?: string;
}

export function AuditLogModal({
    isOpen,
    onClose,
    adminUserId,
    organizationId
}: AuditLogModalProps) {
    const [auditLogs, setAuditLogs] = useState<SystemAdminAuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionTypeFilter, setActionTypeFilter] = useState<string>('all');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [page, setPage] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);

    const PAGE_SIZE = 50;

    useEffect(() => {
        if (isOpen) {
            loadAuditLogs();
        }
    }, [isOpen, page, actionTypeFilter, startDate, endDate]);

    const loadAuditLogs = async () => {
        try {
            setLoading(true);

            const params: any = {
                page,
                page_size: PAGE_SIZE,
            };

            if (adminUserId) params.admin_user_id = adminUserId;
            if (organizationId) params.target_organization_id = organizationId;
            if (actionTypeFilter !== 'all') params.action_type = actionTypeFilter;
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;

            const response = await SystemAdminPermissionsService.getSystemAdminAuditLog(params);
            setAuditLogs(response.audit_logs);
            setTotalLogs(response.total);
        } catch (error) {
            console.error('Failed to load audit logs:', error);
            showToast.error('Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setPage(1);
        loadAuditLogs();
    };

    const handleExport = () => {
        // TODO: Implement export functionality
        showToast.success('Export functionality will be implemented');
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getActionBadge = (actionType: string) => {
        const actionConfig = {
            'assign': { variant: 'success' as const, label: 'Assigned' },
            'update': { variant: 'secondary' as const, label: 'Updated' },
            'revoke': { variant: 'destructive' as const, label: 'Revoked' },
            'access_grant': { variant: 'success' as const, label: 'Access Granted' },
            'access_revoke': { variant: 'warning' as const, label: 'Access Revoked' },
        };

        const config = actionConfig[actionType as keyof typeof actionConfig] || {
            variant: 'outline' as const,
            label: actionType.replace('_', ' ').toUpperCase(),
        };

        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const filteredLogs = auditLogs.filter(log => {
        if (searchQuery) {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                log.admin_username.toLowerCase().includes(searchLower) ||
                log.target_username?.toLowerCase().includes(searchLower) ||
                log.target_organization_name?.toLowerCase().includes(searchLower) ||
                log.notes?.toLowerCase().includes(searchLower);

            if (!matchesSearch) return false;
        }
        return true;
    });

    const auditColumns = [
        {
            accessorKey: 'performed_date',
            header: 'Date & Time',
            cell: ({ row }: any) => (
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatDate(row.original.performed_date)}</span>
                </div>
            ),
        },
        {
            accessorKey: 'action_type',
            header: 'Action',
            cell: ({ row }: any) => getActionBadge(row.original.action_type),
        },
        {
            accessorKey: 'admin_username',
            header: 'Performed By',
            cell: ({ row }: any) => (
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                        <p className="font-medium">{row.original.admin_username}</p>
                        <p className="text-xs text-muted-foreground">ID: {row.original.admin_user_id.slice(0, 8)}...</p>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'target_info',
            header: 'Target',
            cell: ({ row }: any) => (
                <div className="space-y-1">
                    {row.original.target_username && (
                        <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{row.original.target_username}</span>
                        </div>
                    )}
                    {row.original.target_organization_name && (
                        <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{row.original.target_organization_name}</span>
                        </div>
                    )}
                    {!row.original.target_username && !row.original.target_organization_name && (
                        <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                </div>
            ),
        },
        {
            accessorKey: 'changes_made',
            header: 'Changes',
            cell: ({ row }: any) => {
                const changes = row.original.changes_made;
                if (!changes || Object.keys(changes).length === 0) {
                    return <span className="text-sm text-muted-foreground">No details</span>;
                }

                return (
                    <div className="max-w-xs">
                        <pre className="text-xs bg-muted/50 p-2 rounded overflow-hidden text-ellipsis">
                            {JSON.stringify(changes, null, 2).slice(0, 100)}
                            {JSON.stringify(changes).length > 100 && '...'}
                        </pre>
                    </div>
                );
            },
        },
        {
            accessorKey: 'notes',
            header: 'Notes',
            cell: ({ row }: any) => (
                <span className="text-sm text-muted-foreground">
                    {row.original.notes || 'No notes'}
                </span>
            ),
        },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        System Administrator Audit Log
                    </DialogTitle>
                    <DialogDescription>
                        Complete history of system administrator actions and changes
                        {adminUserId && ' for selected administrator'}
                        {organizationId && ' for selected organization'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex-1 min-w-64">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search logs..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Actions</SelectItem>
                                <SelectItem value="assign">Assignments</SelectItem>
                                <SelectItem value="update">Updates</SelectItem>
                                <SelectItem value="revoke">Revocations</SelectItem>
                                <SelectItem value="access_grant">Access Grants</SelectItem>
                                <SelectItem value="access_revoke">Access Revokes</SelectItem>
                            </SelectContent>
                        </Select>

                        <DatePicker
                            value={startDate}
                            onChange={setStartDate}
                            placeholder="Start date"
                        />

                        <DatePicker
                            value={endDate}
                            onChange={setEndDate}
                            placeholder="End date"
                        />

                        <Button variant="outline" size="sm" onClick={handleRefresh}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>

                        <Button variant="outline" size="sm" onClick={handleExport}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-muted/50 p-3 rounded-lg text-center">
                            <p className="text-2xl font-bold text-green-600">{totalLogs}</p>
                            <p className="text-sm text-muted-foreground">Total Actions</p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded-lg text-center">
                            <p className="text-2xl font-bold text-blue-600">
                                {auditLogs.filter(log => log.action_type === 'assign').length}
                            </p>
                            <p className="text-sm text-muted-foreground">Assignments</p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded-lg text-center">
                            <p className="text-2xl font-bold text-orange-600">
                                {auditLogs.filter(log => log.action_type === 'update').length}
                            </p>
                            <p className="text-sm text-muted-foreground">Updates</p>
                        </div>
                        <div className="bg-muted/50 p-3 rounded-lg text-center">
                            <p className="text-2xl font-bold text-red-600">
                                {auditLogs.filter(log => log.action_type === 'revoke').length}
                            </p>
                            <p className="text-sm text-muted-foreground">Revocations</p>
                        </div>
                    </div>

                    {/* Audit Log Table */}
                    <div className="border rounded-lg">
                        <DataTable
                            columns={auditColumns}
                            data={filteredLogs}
                        />
                    </div>

                    {filteredLogs.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p className="text-lg font-medium">No audit logs found</p>
                            <p className="text-muted-foreground">
                                {searchQuery || actionTypeFilter !== 'all' || startDate || endDate
                                    ? 'Try adjusting your filters'
                                    : 'No system administrator actions have been logged yet'
                                }
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}