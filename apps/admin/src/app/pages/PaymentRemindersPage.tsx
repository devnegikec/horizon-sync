import React, { useState, useEffect } from 'react';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    Label,
    Textarea,
} from '@horizon-sync/ui/components';
import {
    Search,
    Filter,
    Bell,
    Plus,
    Eye,
    Send,
    Clock,
    Building2,
    Mail,
    Settings,
    AlertTriangle,
} from 'lucide-react';

import { PaymentReminderService } from '../services/payment-reminder.service';
import type { ReminderConfig, ReminderLog } from '../types';

interface ReminderFilter {
    search: string;
    organization_id: string;
    reminder_stage: string;
    status: string;
}

export function PaymentRemindersPage() {
    const [reminderConfigs, setReminderConfigs] = useState<ReminderConfig[]>([]);
    const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedConfig, setSelectedConfig] = useState<ReminderConfig | null>(null);
    const [selectedLog, setSelectedLog] = useState<ReminderLog | null>(null);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [showLogModal, setShowLogModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'configs' | 'logs'>('configs');
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        totalCount: 0,
    });
    const [filters, setFilters] = useState<ReminderFilter>({
        search: '',
        organization_id: '',
        reminder_stage: '',
        status: '',
    });

    useEffect(() => {
        if (activeTab === 'configs') {
            loadReminderConfigs();
        } else {
            loadReminderLogs();
        }
    }, [activeTab, filters, pagination.page]);

    const loadReminderConfigs = async () => {
        try {
            setLoading(true);
            const response = await PaymentReminderService.getReminderConfigs({
                page: pagination.page,
                page_size: 20,
                ...filters,
            });
            setReminderConfigs(response?.data || []);
            setPagination({
                page: response?.page || 1,
                totalPages: response?.total_pages || 1,
                totalCount: response?.total || 0,
            });
        } catch (error) {
            console.error('Failed to load reminder configs:', error);
            setReminderConfigs([]);
            setPagination({ page: 1, totalPages: 1, totalCount: 0 });
        } finally {
            setLoading(false);
        }
    };

    const loadReminderLogs = async () => {
        try {
            setLoading(true);
            const response = await PaymentReminderService.getReminderLogs({
                page: pagination.page,
                page_size: 20,
                ...filters,
            });
            setReminderLogs(response?.data || []);
            setPagination({
                page: response?.page || 1,
                totalPages: response?.total_pages || 1,
                totalCount: response?.total || 0,
            });
        } catch (error) {
            console.error('Failed to load reminder logs:', error);
            setReminderLogs([]);
            setPagination({ page: 1, totalPages: 1, totalCount: 0 });
        } finally {
            setLoading(false);
        }
    };

    const handleSendBatchReminders = async () => {
        try {
            // Use master organization ID as default
            const masterOrgId = '550e8400-e29b-41d4-a716-446655440001';
            const result = await PaymentReminderService.sendBatchReminders({
                organization_ids: [masterOrgId],
                dry_run: false
            });
            await loadReminderLogs(); // Refresh logs
            alert(`Batch reminders sent successfully! Processed ${result.organizations} organizations.`);
        } catch (error) {
            console.error('Failed to send batch reminders:', error);
            alert('Failed to send batch reminders');
        }
    };

    const handlePreviewBatchReminders = async () => {
        try {
            // Use master organization ID as default
            const masterOrgId = '550e8400-e29b-41d4-a716-446655440001';
            const result = await PaymentReminderService.sendBatchReminders({
                organization_ids: [masterOrgId],
                dry_run: true
            });

            const message = `Preview Results:\n` +
                `Organizations: ${result.organizations}\n` +
                `Would process: ${result.would_process || 0} invoices\n` +
                `Would send: ${result.would_send || 0} reminders\n` +
                `Would skip: ${result.would_skip || 0} reminders\n\n` +
                `Breakdown by stage:\n${Object.entries(result.breakdown_by_stage || {}).map(([stage, count]) => `  ${stage}: ${count}`).join('\n')}`;

            alert(message);
        } catch (error) {
            console.error('Failed to preview batch reminders:', error);
            alert('Failed to preview batch reminders');
        }
    };

    const getStatusBadge = (isEnabled: boolean) => {
        return (
            <Badge variant={isEnabled ? 'success' : 'secondary'}>
                {isEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
        );
    };

    const handleViewLogDetails = (log: ReminderLog) => {
        setSelectedLog(log);
        setShowLogModal(true);
    };

    const getReminderStageBadge = (stage: string) => {
        const stageConfig = {
            gentle: { variant: 'secondary' as const, label: 'Gentle', icon: Clock },
            standard: { variant: 'default' as const, label: 'Standard', icon: Bell },
            firm: { variant: 'warning' as const, label: 'Firm', icon: AlertTriangle },
            final: { variant: 'destructive' as const, label: 'Final', icon: AlertTriangle },
        };

        const config = stageConfig[stage as keyof typeof stageConfig] || {
            variant: 'secondary' as const,
            label: stage,
            icon: Bell,
        };

        const Icon = config.icon;

        return (
            <div className="flex items-center space-x-2">
                <Icon className="h-4 w-4" />
                <Badge variant={config.variant}>{config.label}</Badge>
            </div>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payment Reminders</h1>
                    <p className="text-muted-foreground">
                        Manage automated payment reminder system
                    </p>
                </div>
                <div className="flex space-x-2">
                    <Button onClick={handlePreviewBatchReminders} variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview Batch
                    </Button>
                    <Button onClick={handleSendBatchReminders}>
                        <Send className="h-4 w-4 mr-2" />
                        Send Batch Reminders
                    </Button>
                    <Button onClick={() => setShowConfigModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Config
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <Settings className="h-5 w-5 text-muted-foreground" />
                            <div className="space-y-1">
                                <p className="text-2xl font-bold">{reminderConfigs?.length || 0}</p>
                                <p className="text-xs text-muted-foreground">Active Configs</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <Mail className="h-5 w-5 text-green-600" />
                            <div className="space-y-1">
                                <p className="text-2xl font-bold">
                                    {reminderLogs?.filter(log => log.status === 'sent').length || 0}
                                </p>
                                <p className="text-xs text-muted-foreground">Sent Today</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <Clock className="h-5 w-5 text-amber-600" />
                            <div className="space-y-1">
                                <p className="text-2xl font-bold">
                                    {reminderLogs?.filter(log => log.status === 'pending').length || 0}
                                </p>
                                <p className="text-xs text-muted-foreground">Pending</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <div className="space-y-1">
                                <p className="text-2xl font-bold">
                                    {reminderLogs?.filter(log => log.status === 'failed').length || 0}
                                </p>
                                <p className="text-xs text-muted-foreground">Failed</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 p-1 bg-muted rounded-lg w-fit">
                <Button
                    variant={activeTab === 'configs' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('configs')}
                >
                    <Settings className="h-4 w-4 mr-2" />
                    Configurations
                </Button>
                <Button
                    variant={activeTab === 'logs' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('logs')}
                >
                    <Mail className="h-4 w-4 mr-2" />
                    Reminder Logs
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-6">
                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search..."
                                className="pl-8"
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            />
                        </div>
                        {activeTab === 'logs' && (
                            <Select
                                value={filters.reminder_stage || 'all'}
                                onValueChange={(value) => setFilters(prev => ({ ...prev, reminder_stage: value === 'all' ? '' : value }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Reminder Stage" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Stages</SelectItem>
                                    <SelectItem value="gentle">Gentle</SelectItem>
                                    <SelectItem value="standard">Standard</SelectItem>
                                    <SelectItem value="firm">Firm</SelectItem>
                                    <SelectItem value="final">Final</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                        <Select
                            value={filters.status || 'all'}
                            onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? '' : value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                {activeTab === 'configs' ? (
                                    <>
                                        <SelectItem value="true">Enabled</SelectItem>
                                        <SelectItem value="false">Disabled</SelectItem>
                                    </>
                                ) : (
                                    <>
                                        <SelectItem value="sent">Sent</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="failed">Failed</SelectItem>
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                        <Button variant="outline">
                            <Filter className="h-4 w-4 mr-2" />
                            Clear Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Content Tables */}
            <Card>
                <CardContent className="p-0">
                    {activeTab === 'configs' ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Organization</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Grace Period</TableHead>
                                    <TableHead>Escalation Days</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            Loading configurations...
                                        </TableCell>
                                    </TableRow>
                                ) : (reminderConfigs || []).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            No reminder configurations found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    (reminderConfigs || []).map((config) => (
                                        <TableRow key={config.id}>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                                    <span>{config.organization_name || 'Default'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(config.is_enabled)}</TableCell>
                                            <TableCell>{config.grace_period_days} days</TableCell>
                                            <TableCell>{config.escalation_days} days</TableCell>
                                            <TableCell>{formatDate(config.created_at)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedConfig(config)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Organization</TableHead>
                                    <TableHead>Stage</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Sent Date</TableHead>
                                    <TableHead>Invoice #</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            Loading reminder logs...
                                        </TableCell>
                                    </TableRow>
                                ) : (reminderLogs || []).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8">
                                            No reminder logs found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    (reminderLogs || []).map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                                    <span>{log.organization_name || 'Unknown'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getReminderStageBadge(log.reminder_stage)}</TableCell>
                                            <TableCell>
                                                <Badge variant={log.status === 'sent' ? 'success' :
                                                    log.status === 'failed' ? 'destructive' : 'secondary'}>
                                                    {log.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{formatDate(log.sent_at)}</TableCell>
                                            <TableCell>{log.invoice_number || 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewLogDetails(log)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
                    </p>
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page === 1}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page === pagination.totalPages}
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Configuration Modal */}
            {showConfigModal && (
                <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Reminder Configuration</DialogTitle>
                            <DialogDescription>
                                Configure payment reminder settings for organizations
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <Label>Grace Period (days)</Label>
                                <Input type="number" placeholder="7" />
                            </div>
                            <div>
                                <Label>Escalation Interval (days)</Label>
                                <Input type="number" placeholder="3" />
                            </div>
                            <div className="flex items-center space-x-2">
                                <input type="checkbox" id="enable-reminders" />
                                <Label htmlFor="enable-reminders">Enable automatic reminders</Label>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setShowConfigModal(false)}>
                                Cancel
                            </Button>
                            <Button onClick={() => setShowConfigModal(false)}>
                                Save Configuration
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Reminder Log Details Modal */}
            {showLogModal && selectedLog && (
                <Dialog open={showLogModal} onOpenChange={setShowLogModal}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Payment Reminder Log Details</DialogTitle>
                            <DialogDescription>
                                View detailed information about this payment reminder
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                            {/* Basic Information */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Invoice Number</Label>
                                    <p className="font-medium">{selectedLog.invoice_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Organization</Label>
                                    <p className="font-medium">{selectedLog.organization_name || 'Unknown'}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Reminder Stage</Label>
                                    <div className="mt-1">{getReminderStageBadge(selectedLog.reminder_stage)}</div>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                                    <Badge variant={selectedLog.status === 'sent' ? 'success' :
                                        selectedLog.status === 'failed' ? 'destructive' : 'secondary'} className="mt-1">
                                        {selectedLog.status}
                                    </Badge>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Recipient Email</Label>
                                    <p className="font-medium">{selectedLog.recipient_email}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Recipient Name</Label>
                                    <p className="font-medium">{selectedLog.recipient_name || 'Unknown'}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Invoice Amount</Label>
                                    <p className="font-medium">${selectedLog.invoice_amount || '0.00'}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Outstanding Amount</Label>
                                    <p className="font-medium">${selectedLog.outstanding_amount || '0.00'}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Days Overdue</Label>
                                    <p className="font-medium">{selectedLog.days_overdue || 0} days</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Due Date</Label>
                                    <p className="font-medium">{selectedLog.due_date ? formatDate(selectedLog.due_date) : 'N/A'}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Sent At</Label>
                                    <p className="font-medium">{selectedLog.sent_at ? formatDate(selectedLog.sent_at) : 'Not sent'}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Created At</Label>
                                    <p className="font-medium">{formatDate(selectedLog.created_at)}</p>
                                </div>
                            </div>

                            {/* Email Subject */}
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Email Subject</Label>
                                <p className="font-medium mt-1">{selectedLog.subject || 'N/A'}</p>
                            </div>

                            {/* Error Message (if failed) */}
                            {selectedLog.status === 'failed' && selectedLog.error_message && (
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Error Message</Label>
                                    <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-md">
                                        <p className="text-sm text-red-800">{selectedLog.error_message}</p>
                                    </div>
                                </div>
                            )}

                            {/* Additional Info */}
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <Label className="text-muted-foreground">Reminder Type</Label>
                                    <p className="font-medium capitalize">{selectedLog.reminder_type || 'Manual'}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Retry Count</Label>
                                    <p className="font-medium">{selectedLog.retry_count || 0}</p>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Triggered By</Label>
                                    <p className="font-medium capitalize">{selectedLog.triggered_by || 'System'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={() => setShowLogModal(false)}>
                                Close
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}