import { useState, useEffect } from 'react';
import { useCurrencyStore } from '@horizon-sync/store';
import { getCurrencySymbol } from '@horizon-sync/ui';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    Button,
    Badge,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    Separator,
} from '@horizon-sync/ui/components';
import { cn } from '@horizon-sync/ui/lib';
import {
    Building2,
    Users,
    Calendar,
    DollarSign,
    Activity,
    Clock,
    AlertTriangle,
    CheckCircle,
    Ban,
    History,
} from 'lucide-react';

interface Organization {
    id: string;
    name: string;
    status: string;
    tier: string;
    user_count: number;
    active_user_count: number;
    last_activity_date: string;
    billing_status: string;
    total_outstanding: number;
    created_date: string;
    subscription_start_date: string;
    last_payment_date?: string;
    deactivation_scheduled_date?: string;
    deactivation_reason?: string;
}

interface DeactivationHistory {
    id: string;
    action_type: string;
    reason: string;
    performed_by: string;
    performed_at: string;
    scheduled_date?: string;
    status: string;
}

interface OrganizationStatusModalProps {
    organization: Organization | null;
    isOpen: boolean;
    onClose: () => void;
    onActionRequest: (organization: Organization) => void;
    loading?: boolean;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getStatusBadge(status: string) {
    const statusConfig = {
        active: { variant: 'success' as const, label: 'Active', icon: CheckCircle },
        inactive: { variant: 'secondary' as const, label: 'Inactive', icon: Ban },
        suspended: { variant: 'warning' as const, label: 'Suspended', icon: AlertTriangle },
        deactivated: { variant: 'destructive' as const, label: 'Deactivated', icon: Ban },
        pending_deactivation: { variant: 'warning' as const, label: 'Pending Deactivation', icon: Clock },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
        variant: 'secondary' as const,
        label: status,
        icon: Ban,
    };

    const Icon = config.icon;

    return (
        <Badge variant={config.variant} className="flex items-center gap-1">
            <Icon className="h-3 w-3" />
            {config.label}
        </Badge>
    );
}

function getTierBadge(tier: string) {
    const tierConfig = {
        basic: { variant: 'secondary' as const, label: 'Basic' },
        pro: { variant: 'secondary' as const, label: 'Pro' },
        enterprise: { variant: 'success' as const, label: 'Enterprise' },
    };

    const config = tierConfig[tier as keyof typeof tierConfig] || {
        variant: 'secondary' as const,
        label: tier,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
}

function getBillingStatusBadge(status: string) {
    const statusConfig = {
        current: { variant: 'success' as const, label: 'Current' },
        overdue: { variant: 'destructive' as const, label: 'Overdue' },
        suspended: { variant: 'warning' as const, label: 'Suspended' },
        cancelled: { variant: 'destructive' as const, label: 'Cancelled' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
        variant: 'secondary' as const,
        label: status,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
}

function getActionTypeBadge(actionType: string) {
    const actionConfig = {
        immediate: { variant: 'destructive' as const, label: 'Immediate Deactivation' },
        scheduled: { variant: 'warning' as const, label: 'Scheduled Deactivation' },
        grace_period: { variant: 'secondary' as const, label: 'Grace Period Warning' },
        reactivate: { variant: 'success' as const, label: 'Reactivation' },
        suspend: { variant: 'warning' as const, label: 'Suspension' },
    };

    const config = actionConfig[actionType as keyof typeof actionConfig] || {
        variant: 'secondary' as const,
        label: actionType,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function OrganizationStatusModal({
    organization,
    isOpen,
    onClose,
    onActionRequest,
    loading = false,
}: OrganizationStatusModalProps) {
    const baseCurrency = useCurrencyStore((s) => s.baseCurrency);
    const currencySymbol = getCurrencySymbol(baseCurrency || 'INR');
    const [deactivationHistory, setDeactivationHistory] = useState<DeactivationHistory[]>([
        // Mock data - replace with actual API call
        {
            id: '1',
            action_type: 'grace_period',
            reason: 'Payment overdue for 30 days',
            performed_by: 'System',
            performed_at: '2024-01-15T10:30:00Z',
            status: 'completed'
        },
        {
            id: '2',
            action_type: 'scheduled',
            reason: 'Organization requested deactivation',
            performed_by: 'Admin User',
            performed_at: '2024-01-10T14:22:00Z',
            scheduled_date: '2024-02-01T00:00:00Z',
            status: 'cancelled'
        }
    ]);

    if (!organization) return null;

    const isDeactivated = organization.status === 'deactivated';
    const isPendingDeactivation = organization.status === 'pending_deactivation';
    const hasOutstanding = organization.total_outstanding > 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            {organization.name} - Status Details
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            {getStatusBadge(organization.status)}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onActionRequest(organization)}
                            >
                                Manage Status
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="overview" className="w-full">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="users">Users</TabsTrigger>
                        <TabsTrigger value="billing">Billing</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        {/* Status Alerts */}
                        {isPendingDeactivation && organization.deactivation_scheduled_date && (
                            <Card className="border-warning">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-warning" />
                                        <div>
                                            <p className="font-medium text-warning">Deactivation Scheduled</p>
                                            <p className="text-sm text-muted-foreground">
                                                This organization is scheduled for deactivation on{' '}
                                                {formatDate(organization.deactivation_scheduled_date)}
                                            </p>
                                            {organization.deactivation_reason && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Reason: {organization.deactivation_reason}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {hasOutstanding && (
                            <Card className="border-destructive">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2">
                                        <span className="h-4 w-4 inline-flex items-center justify-center text-sm font-bold mr-2">{currencySymbol}</span>
                                        <div>
                                            <p className="font-medium text-destructive">Outstanding Balance</p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatCurrency(organization.total_outstanding)} outstanding
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Main Status Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Building2 className="h-5 w-5" />
                                        Organization Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                                            <div className="mt-1">{getStatusBadge(organization.status)}</div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Subscription Tier</label>
                                            <div className="mt-1">{getTierBadge(organization.tier)}</div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                                            <p className="font-medium">{formatDate(organization.created_date)}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Last Activity</label>
                                            <p className="font-medium">{formatDate(organization.last_activity_date)}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        User Statistics
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Total Users</label>
                                            <p className="text-2xl font-bold">{organization.user_count}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Active Users</label>
                                            <p className="text-2xl font-bold text-success">{organization.active_user_count}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-sm font-medium text-muted-foreground">Activity Rate</label>
                                            <p className="font-medium">
                                                {Math.round((organization.active_user_count / organization.user_count) * 100)}%
                                                <span className="text-sm text-muted-foreground ml-1">
                                                    ({organization.active_user_count} of {organization.user_count} users)
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="users" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>User Activity Overview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                                        <Users className="h-8 w-8 mx-auto mb-2" />
                                        <p className="text-2xl font-bold">{organization.user_count}</p>
                                        <p className="text-sm text-muted-foreground">Total Users</p>
                                    </div>
                                    <div className="text-center p-4 bg-green-50 rounded-lg">
                                        <Activity className="h-8 w-8 mx-auto mb-2 text-green-600" />
                                        <p className="text-2xl font-bold text-green-600">{organization.active_user_count}</p>
                                        <p className="text-sm text-muted-foreground">Active Users</p>
                                    </div>
                                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                                        <Clock className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                                        <p className="text-2xl font-bold text-gray-600">
                                            {organization.user_count - organization.active_user_count}
                                        </p>
                                        <p className="text-sm text-muted-foreground">Inactive Users</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="billing" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Billing Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Billing Status</label>
                                        <div className="mt-1">{getBillingStatusBadge(organization.billing_status)}</div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Outstanding Balance</label>
                                        <p className={cn(
                                            "text-xl font-bold",
                                            organization.total_outstanding > 0 ? "text-destructive" : "text-success"
                                        )}>
                                            {formatCurrency(organization.total_outstanding)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Subscription Start</label>
                                        <p className="font-medium">{formatDate(organization.subscription_start_date)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Last Payment</label>
                                        <p className="font-medium">
                                            {organization.last_payment_date ?
                                                formatDate(organization.last_payment_date) : 'No payments recorded'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="history" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <History className="h-5 w-5" />
                                    Deactivation History
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {deactivationHistory.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg font-medium">No deactivation history</p>
                                        <p className="text-sm">This organization has no recorded deactivation actions</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {deactivationHistory.map((record, index) => (
                                            <div key={record.id} className={cn(
                                                "p-4 border rounded-lg",
                                                index !== deactivationHistory.length - 1 && "mb-4"
                                            )}>
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            {getActionTypeBadge(record.action_type)}
                                                            <Badge variant={record.status === 'completed' ? 'success' : 'secondary'}>
                                                                {record.status}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">{record.reason}</p>
                                                        <div className="text-xs text-muted-foreground space-y-1">
                                                            <p>Performed by: {record.performed_by}</p>
                                                            <p>Date: {formatDateTime(record.performed_at)}</p>
                                                            {record.scheduled_date && (
                                                                <p>Scheduled for: {formatDateTime(record.scheduled_date)}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}