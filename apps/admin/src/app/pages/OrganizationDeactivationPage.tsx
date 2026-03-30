import { useState, useEffect } from 'react';

import {
    AlertTriangle,
    Ban,
    CheckCircle,
    Clock,
    Download,
    Eye,
    RefreshCw,
    AlertCircle,
    Building2,
    Users,
    XCircle
} from 'lucide-react';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Button,
    SearchInput,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Badge,
    DataTable,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    Alert,
    AlertDescription,
} from '@horizon-sync/ui/components';
import { cn } from '@horizon-sync/ui/lib';
import { toast } from '@horizon-sync/ui';

import { OrganizationDeactivationService } from '../services/organization-deactivation.service';
import type {
    DeactivationActionResponse,
    DeactivationSummaryResponse,
    OrganizationStatusResponse,
    OrganizationsRequiringActionResponse,
} from '../types';
import { DeactivationActionModal } from '../../app/components/deactivation/DeactivationActionModal';
import { OrganizationStatusModal } from '../components/deactivation/OrganizationStatusModal';
import { BulkDeactivationModal } from '../components/deactivation/BulkDeactivationModal';

const PAGE_SIZE = 20;

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    iconBg: string;
    iconColor: string;
    onClick?: () => void;
}

function StatCard({ title, value, icon: Icon, iconBg, iconColor, onClick }: StatCardProps) {
    return (
        <Card
            className={cn(
                "border-border hover:shadow-md transition-shadow",
                onClick && "cursor-pointer hover:bg-muted/50"
            )}
            onClick={onClick}
        >
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-3xl font-bold tracking-tight">{value}</p>
                    </div>
                    <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', iconBg)}>
                        <Icon className={cn('h-6 w-6', iconColor)} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getActionTypeBadge(actionType: string) {
    const actionConfig = {
        'trial_expired': { variant: 'warning' as const, label: 'Trial Expired' },
        'subscription_expired': { variant: 'destructive' as const, label: 'Subscription Expired' },
        'suspended': { variant: 'destructive' as const, label: 'Suspended' },
        'cancelled': { variant: 'secondary' as const, label: 'Cancelled' },
        'reactivated': { variant: 'success' as const, label: 'Reactivated' },
        'payment_overdue': { variant: 'warning' as const, label: 'Payment Overdue' },
    };

    const config = actionConfig[actionType as keyof typeof actionConfig] || {
        variant: 'outline' as const,
        label: actionType.replace(/_/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase()),
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
}

function getStatusBadge(status: string) {
    const statusConfig = {
        'active': { variant: 'success' as const, label: 'Active' },
        'trial': { variant: 'secondary' as const, label: 'Trial' },
        'suspended': { variant: 'destructive' as const, label: 'Suspended' },
        'cancelled': { variant: 'secondary' as const, label: 'Cancelled' },
        'expired': { variant: 'warning' as const, label: 'Expired' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
        variant: 'outline' as const,
        label: status,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function OrganizationDeactivationPage() {
    const [summary, setSummary] = useState<DeactivationSummaryResponse | null>(null);
    const [actionsPending, setActionsPending] = useState<DeactivationActionResponse[]>([]);
    const [organizationsRequiringAction, setOrganizationsRequiringAction] = useState<OrganizationsRequiringActionResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionTypeFilter, setActionTypeFilter] = useState<string>('all');
    const [activeTab, setActiveTab] = useState('summary');
    const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>([]);

    // Modals
    const [selectedAction, setSelectedAction] = useState<DeactivationActionResponse | null>(null);
    const [selectedOrganization, setSelectedOrganization] = useState<any | null>(null);
    const [selectedOrganizationsForBulk, setSelectedOrganizationsForBulk] = useState<any[]>([]);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load deactivation summary
            const summaryData = await OrganizationDeactivationService.getDeactivationSummary();
            setSummary(summaryData);
            setActionsPending(summaryData.actions_pending || []);

            // Load organizations requiring action
            const organizationsData = await OrganizationDeactivationService.getOrganizationsRequiringAction();
            setOrganizationsRequiringAction(organizationsData);

        } catch (error) {
            console.error('Failed to load deactivation data:', error);
            toast({
                title: 'Error',
                description: 'Failed to load deactivation data',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRunDeactivationCheck = async () => {
        try {
            setLoading(true);
            const actions = await OrganizationDeactivationService.checkOrganizationsForDeactivation();
            toast({
                title: 'Success',
                description: `Found ${actions.length} organizations requiring action`,
            });
            loadData();
        } catch (error) {
            console.error('Failed to run deactivation check:', error);
            toast({
                title: 'Error',
                description: 'Failed to run deactivation check',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivationAction = async (data: any) => {
        if (!selectedAction) return;

        try {
            let result;
            const action = data.action_type;
            const organizationId = selectedAction.organization_id;

            switch (action) {
                case 'immediate':
                case 'suspend':
                    result = await OrganizationDeactivationService.suspendOrganization(organizationId, data);
                    break;
                case 'scheduled':
                    result = await OrganizationDeactivationService.expireSubscription(organizationId, data);
                    break;
                case 'grace_period':
                    result = await OrganizationDeactivationService.expireTrial(organizationId, data);
                    break;
                case 'reactivate':
                    result = await OrganizationDeactivationService.reactivateOrganization(organizationId, data);
                    break;
            }

            toast({
                title: 'Success',
                description: `Organization action completed successfully`,
            });
            setSelectedAction(null);
            loadData();
        } catch (error) {
            console.error('Failed to perform action:', error);
            toast({
                title: 'Error',
                description: 'Failed to perform organization action',
                variant: 'destructive',
            });
        }
    };

    const handleBulkActions = async (data: any, organizationIds: string[]) => {
        try {
            let result;
            const action = data.action_type;

            switch (action) {
                case 'immediate':
                case 'suspend':
                    result = await OrganizationDeactivationService.bulkSuspendOrganizations(
                        organizationIds,
                        30, // default days overdue
                        data.reason
                    );
                    break;
                case 'scheduled':
                    // Handle scheduled bulk actions
                    result = await OrganizationDeactivationService.bulkSuspendOrganizations(
                        organizationIds,
                        0,
                        data.reason
                    );
                    break;
                case 'grace_period':
                    result = await OrganizationDeactivationService.bulkSuspendOrganizations(
                        organizationIds,
                        7, // grace period days
                        data.reason
                    );
                    break;
            }

            toast({
                title: 'Success',
                description: `Bulk action applied to ${organizationIds.length} organizations`,
            });
            setShowBulkModal(false);
            setSelectedOrganizations([]);
            loadData();
        } catch (error) {
            console.error('Failed to perform bulk action:', error);
            toast({
                title: 'Error',
                description: 'Failed to perform bulk action',
                variant: 'destructive',
            });
        }
    };

    const handleViewOrganizationStatus = (organizationId: string) => {
        // Create mock organization object from available data
        // In a real implementation, you'd fetch the organization details
        const organization = {
            id: organizationId,
            name: `Organization ${organizationId}`,
            status: 'active',
            tier: 'basic',
            user_count: 10,
            active_user_count: 8,
            last_activity_date: new Date().toISOString(),
            billing_status: 'current',
            total_outstanding: 0,
            created_date: new Date().toISOString(),
            subscription_start_date: new Date().toISOString(),
        };
        setSelectedOrganization(organization);
        setShowStatusModal(true);
    };

    const filteredActions = actionsPending.filter((action: DeactivationActionResponse) => {
        if (actionTypeFilter !== 'all' && action.action_type !== actionTypeFilter) return false;
        if (searchQuery && !action.organization_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const pendingActionsColumns = [
        {
            accessorKey: 'organization_name',
            header: 'Organization',
            cell: ({ row }: any) => (
                <Button
                    variant="link"
                    className="p-0 h-auto font-medium"
                    onClick={() => handleViewOrganizationStatus(row.original.organization_id)}
                >
                    {row.original.organization_name}
                </Button>
            ),
        },
        {
            accessorKey: 'action_type',
            header: 'Required Action',
            cell: ({ row }: any) => getActionTypeBadge(row.original.action_type),
        },
        {
            accessorKey: 'previous_status',
            header: 'Current Status',
            cell: ({ row }: any) => getStatusBadge(row.original.previous_status),
        },
        {
            accessorKey: 'reason',
            header: 'Reason',
            cell: ({ row }: any) => (
                <span className="text-sm text-muted-foreground">
                    {row.original.reason || 'N/A'}
                </span>
            ),
        },
        {
            accessorKey: 'action_date',
            header: 'Action Date',
            cell: ({ row }: any) => formatDate(row.original.action_date),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }: any) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAction(row.original)}
                    >
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                    </Button>
                </div>
            ),
        },
    ];

    if (loading && !summary) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading deactivation data...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Organization Deactivation</h1>
                    <p className="text-muted-foreground mt-2">
                        Monitor and manage organization trials, subscriptions, and deactivation workflow
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                    </Button>
                    <Button
                        onClick={handleRunDeactivationCheck}
                        size="sm"
                        disabled={loading}
                    >
                        <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                        Check Organizations
                    </Button>
                </div>
            </div>

            {/* Alerts */}
            {summary && summary.actions_pending.length > 0 && (
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        <strong>{summary.actions_pending.length} organizations</strong> require immediate deactivation action.
                        Review the pending actions below.
                    </AlertDescription>
                </Alert>
            )}

            {/* Stats Cards */}
            {summary && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Organizations"
                        value={summary.total_organizations}
                        icon={Building2}
                        iconBg="bg-blue-50"
                        iconColor="text-blue-600"
                    />
                    <StatCard
                        title="Trial Expired"
                        value={summary.trial_expired_count}
                        icon={Clock}
                        iconBg="bg-yellow-50"
                        iconColor="text-yellow-600"
                        onClick={() => {
                            setActiveTab('trial-expired');
                        }}
                    />
                    <StatCard
                        title="Subscription Expired"
                        value={summary.subscription_expired_count}
                        icon={XCircle}
                        iconBg="bg-red-50"
                        iconColor="text-red-600"
                        onClick={() => {
                            setActiveTab('subscription-expired');
                        }}
                    />
                    <StatCard
                        title="Payment Overdue"
                        value={summary.overdue_payment_count}
                        icon={AlertCircle}
                        iconBg="bg-orange-50"
                        iconColor="text-orange-600"
                        onClick={() => {
                            setActiveTab('payment-overdue');
                        }}
                    />
                </div>
            )}

            {/* Main Content */}
            <Card className="border-border">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Deactivation Management</CardTitle>
                        <div className="flex items-center gap-2">
                            <SearchInput
                                placeholder="Search organizations..."
                                value={searchQuery}
                                onChange={setSearchQuery}
                                className="w-64"
                            />
                            <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                                <SelectTrigger className="w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Action Types</SelectItem>
                                    <SelectItem value="trial_expired">Trial Expired</SelectItem>
                                    <SelectItem value="subscription_expired">Subscription Expired</SelectItem>
                                    <SelectItem value="payment_overdue">Payment Overdue</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <div className="flex items-center justify-between mb-4">
                            <TabsList>
                                <TabsTrigger value="summary">Summary</TabsTrigger>
                                <TabsTrigger value="pending-actions">
                                    Pending Actions
                                    {summary && summary.actions_pending.length > 0 && (
                                        <Badge variant="destructive" className="ml-2">
                                            {summary.actions_pending.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="trial-expired">
                                    Trial Expired
                                    {organizationsRequiringAction && organizationsRequiringAction.trial_expired.length > 0 && (
                                        <Badge variant="warning" className="ml-2">
                                            {organizationsRequiringAction.trial_expired.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="subscription-expired">
                                    Subscription Expired
                                    {organizationsRequiringAction && organizationsRequiringAction.subscription_expired.length > 0 && (
                                        <Badge variant="destructive" className="ml-2">
                                            {organizationsRequiringAction.subscription_expired.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="payment-overdue">
                                    Payment Overdue
                                    {organizationsRequiringAction && organizationsRequiringAction.payment_overdue.length > 0 && (
                                        <Badge variant="warning" className="ml-2">
                                            {organizationsRequiringAction.payment_overdue.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                            </TabsList>
                            {selectedOrganizations.length > 0 && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                        // Convert selected organization IDs to organization objects
                                        const orgsForBulk = selectedOrganizations.map(orgId => ({
                                            id: orgId,
                                            name: `Organization ${orgId}`,
                                            status: 'active',
                                            tier: 'basic',
                                            user_count: 10,
                                            last_activity_date: new Date().toISOString(),
                                            billing_status: 'current',
                                            total_outstanding: 0,
                                        }));
                                        setSelectedOrganizationsForBulk(orgsForBulk);
                                        setShowBulkModal(true);
                                    }}
                                >
                                    <Ban className="h-4 w-4 mr-2" />
                                    Bulk Suspend ({selectedOrganizations.length})
                                </Button>
                            )}
                        </div>

                        <TabsContent value="summary">
                            {summary && (
                                <div className="grid gap-6 md:grid-cols-2">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Deactivation Summary</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Total Organizations:</span>
                                                    <span className="font-medium">{summary.total_organizations}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Suspended:</span>
                                                    <span className="font-medium text-red-600">{summary.suspended_count}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Cancelled:</span>
                                                    <span className="font-medium text-gray-600">{summary.cancelled_count}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Last Check:</span>
                                                    <span className="font-medium">
                                                        {summary.last_check_date
                                                            ? formatDate(summary.last_check_date)
                                                            : 'Never'
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Actions Required</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Trial Expired:</span>
                                                    <span className="font-medium text-yellow-600">{summary.trial_expired_count}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Subscription Expired:</span>
                                                    <span className="font-medium text-red-600">{summary.subscription_expired_count}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Payment Overdue:</span>
                                                    <span className="font-medium text-orange-600">{summary.overdue_payment_count}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Pending Actions:</span>
                                                    <span className="font-medium">{summary.actions_pending.length}</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="pending-actions">
                            <DataTable
                                columns={pendingActionsColumns}
                                data={filteredActions}
                            />
                        </TabsContent>

                        {/* Additional tabs for specific organization types */}
                        {/* Implementation for trial-expired, subscription-expired, payment-overdue tabs */}
                        {/* Would show filtered organization lists with action buttons */}
                    </Tabs>
                </CardContent>
            </Card>

            {/* Modals */}
            {selectedAction && (
                <DeactivationActionModal
                    organization={{
                        id: selectedAction.organization_id,
                        name: selectedAction.organization_name,
                        status: selectedAction.new_status || 'active',
                        tier: 'basic', // Default tier since not available in DeactivationActionResponse
                        user_count: 0, // Default count since not available in DeactivationActionResponse
                        last_activity_date: selectedAction.action_date || new Date().toISOString(),
                        billing_status: 'current'
                    }}
                    isOpen={!!selectedAction}
                    onClose={() => setSelectedAction(null)}
                    onSubmit={handleDeactivationAction}
                />
            )}

            {showStatusModal && selectedOrganization && (
                <OrganizationStatusModal
                    organization={selectedOrganization}
                    isOpen={showStatusModal}
                    onClose={() => {
                        setShowStatusModal(false);
                        setSelectedOrganization(null);
                    }}
                    onActionRequest={(org) => {
                        setSelectedAction({
                            organization_id: org.id,
                            organization_name: org.name,
                            action_type: 'manual',
                            previous_status: org.status,
                            new_status: 'active',
                            action_date: new Date().toISOString(),
                            performed_by: 'Admin',
                            reason: 'Manual action request'
                        } as DeactivationActionResponse);
                        setShowStatusModal(false);
                    }}
                    loading={loading}
                />
            )}

            {showBulkModal && (
                <BulkDeactivationModal
                    organizations={selectedOrganizationsForBulk}
                    isOpen={showBulkModal}
                    onClose={() => setShowBulkModal(false)}
                    onSubmit={handleBulkActions}
                    loading={loading}
                />
            )}
        </div>
    );
}