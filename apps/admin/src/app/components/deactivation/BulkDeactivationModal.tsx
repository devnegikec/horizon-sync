import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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
    Textarea,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Alert,
    AlertDescription,
    Checkbox,
    Separator,
    Label,
} from '@horizon-sync/ui/components';
import { cn } from '@horizon-sync/ui/lib';
import {
    AlertTriangle,
    Ban,
    CheckCircle,
    Building2,
    Calendar,
    Users,
    XCircle,
} from 'lucide-react';

const bulkDeactivationSchema = z.object({
    action_type: z.string().min(1, 'Action type is required'),
    reason: z.string().min(10, 'Reason must be at least 10 characters'),
    scheduled_date: z.string().optional(),
    send_notification: z.boolean(),
    confirm_bulk_action: z.boolean().refine(val => val === true, {
        message: 'You must confirm this bulk action',
    }),
});

type BulkDeactivationFormData = z.infer<typeof bulkDeactivationSchema>;

interface Organization {
    id: string;
    name: string;
    status: string;
    tier: string;
    user_count: number;
    last_activity_date: string;
    billing_status: string;
    total_outstanding: number;
}

interface BulkDeactivationModalProps {
    organizations: Organization[];
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: BulkDeactivationFormData, organizationIds: string[]) => Promise<void>;
    loading?: boolean;
}

const actionTypes = [
    { value: 'immediate', label: 'Immediate Deactivation', icon: Ban, description: 'Deactivate all organizations immediately' },
    { value: 'scheduled', label: 'Scheduled Deactivation', icon: Calendar, description: 'Schedule deactivation for a future date' },
    { value: 'grace_period', label: 'Grace Period Warning', icon: AlertTriangle, description: 'Send warning with grace period' },
    { value: 'suspend', label: 'Suspend Organizations', icon: XCircle, description: 'Temporarily suspend access' },
];

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}

function getStatusBadge(status: string) {
    const statusConfig = {
        active: { variant: 'success' as const, label: 'Active' },
        inactive: { variant: 'secondary' as const, label: 'Inactive' },
        suspended: { variant: 'warning' as const, label: 'Suspended' },
        deactivated: { variant: 'destructive' as const, label: 'Deactivated' },
        pending_deactivation: { variant: 'warning' as const, label: 'Pending Deactivation' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
        variant: 'secondary' as const,
        label: status,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
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

export function BulkDeactivationModal({
    organizations,
    isOpen,
    onClose,
    onSubmit,
    loading = false,
}: BulkDeactivationModalProps) {
    const [selectedOrganizations, setSelectedOrganizations] = useState<Set<string>>(
        new Set(organizations.map(org => org.id))
    );

    const form = useForm<BulkDeactivationFormData>({
        resolver: zodResolver(bulkDeactivationSchema),
        defaultValues: {
            action_type: '',
            reason: '',
            scheduled_date: '',
            send_notification: true,
            confirm_bulk_action: false,
        },
    });

    const { watch, setValue } = form;
    const watchedActionType = watch('action_type');

    const handleSubmit = async (data: BulkDeactivationFormData) => {
        const selectedIds = Array.from(selectedOrganizations);
        await onSubmit(data, selectedIds);
        handleClose();
    };

    const handleClose = () => {
        form.reset();
        setSelectedOrganizations(new Set(organizations.map(org => org.id)));
        onClose();
    };

    const handleOrganizationToggle = (orgId: string) => {
        const newSelected = new Set(selectedOrganizations);
        if (newSelected.has(orgId)) {
            newSelected.delete(orgId);
        } else {
            newSelected.add(orgId);
        }
        setSelectedOrganizations(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedOrganizations.size === organizations.length) {
            setSelectedOrganizations(new Set());
        } else {
            setSelectedOrganizations(new Set(organizations.map(org => org.id)));
        }
    };

    const requiresScheduledDate = watchedActionType === 'scheduled';
    const selectedOrgCount = selectedOrganizations.size;
    const totalUserCount = organizations
        .filter(org => selectedOrganizations.has(org.id))
        .reduce((sum, org) => sum + org.user_count, 0);
    const totalOutstanding = organizations
        .filter(org => selectedOrganizations.has(org.id))
        .reduce((sum, org) => sum + org.total_outstanding, 0);

    if (organizations.length === 0) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Bulk Organization Management ({organizations.length} organizations)
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    {/* Summary Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Impact Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-3 bg-muted/50 rounded-lg">
                                    <p className="text-2xl font-bold">{selectedOrgCount}</p>
                                    <p className="text-sm text-muted-foreground">Organizations Selected</p>
                                </div>
                                <div className="text-center p-3 bg-blue-50 rounded-lg">
                                    <p className="text-2xl font-bold text-blue-600">{totalUserCount}</p>
                                    <p className="text-sm text-muted-foreground">Total Users Affected</p>
                                </div>
                                <div className="text-center p-3 bg-red-50 rounded-lg">
                                    <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOutstanding)}</p>
                                    <p className="text-sm text-muted-foreground">Outstanding Balance</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Type Selection */}
                    <div>
                        <Label htmlFor="action_type">Bulk Action Type *</Label>
                        <Select
                            {...form.register('action_type')}
                            onValueChange={(value) => form.setValue('action_type', value)}
                            value={form.watch('action_type')}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select bulk action type" />
                            </SelectTrigger>
                            <SelectContent>
                                {actionTypes.map((action) => {
                                    const Icon = action.icon;
                                    return (
                                        <SelectItem key={action.value} value={action.value}>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Icon className="h-4 w-4" />
                                                    {action.label}
                                                </div>
                                                <p className="text-xs text-muted-foreground">{action.description}</p>
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                        {form.formState.errors.action_type && (
                            <p className="text-sm text-red-500 mt-1">{form.formState.errors.action_type.message}</p>
                        )}
                    </div>

                    {/* Scheduled Date (if needed) */}
                    {requiresScheduledDate && (
                        <div>
                            <Label htmlFor="scheduled_date">Scheduled Date *</Label>
                            <input
                                id="scheduled_date"
                                type="datetime-local"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                {...form.register('scheduled_date')}
                            />
                            {form.formState.errors.scheduled_date && (
                                <p className="text-sm text-red-500 mt-1">{form.formState.errors.scheduled_date.message}</p>
                            )}
                        </div>
                    )}

                    {/* Reason */}
                    <div>
                        <Label htmlFor="reason">Bulk Action Reason *</Label>
                        <Textarea
                            id="reason"
                            placeholder="Explain why this bulk action is being performed..."
                            className="min-h-[100px]"
                            {...form.register('reason')}
                        />
                        {form.formState.errors.reason && (
                            <p className="text-sm text-red-500 mt-1">{form.formState.errors.reason.message}</p>
                        )}
                    </div>

                    {/* Organization Selection */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Organizations to Process</CardTitle>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSelectAll}
                                >
                                    {selectedOrganizations.size === organizations.length ? 'Deselect All' : 'Select All'}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 overflow-y-auto">
                                <div className="space-y-2">
                                    {organizations.map((org) => (
                                        <div key={org.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                                            <Checkbox
                                                checked={selectedOrganizations.has(org.id)}
                                                onCheckedChange={() => handleOrganizationToggle(org.id)}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-1">
                                                        <p className="font-medium truncate">{org.name}</p>
                                                        <div className="flex items-center gap-2">
                                                            {getStatusBadge(org.status)}
                                                            {getTierBadge(org.tier)}
                                                        </div>
                                                    </div>
                                                    <div className="text-right space-y-1">
                                                        <p className="text-sm text-muted-foreground">
                                                            <Users className="h-4 w-4 inline mr-1" />
                                                            {org.user_count} users
                                                        </p>
                                                        {org.total_outstanding > 0 && (
                                                            <p className="text-sm text-destructive font-medium">
                                                                {formatCurrency(org.total_outstanding)} outstanding
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notification Option */}
                    <div className="flex flex-row items-start space-x-3 space-y-0">
                        <Checkbox
                            {...form.register('send_notification')}
                            checked={form.watch('send_notification')}
                            onCheckedChange={(checked) => form.setValue('send_notification', Boolean(checked))}
                        />
                        <div className="space-y-1 leading-none">
                            <Label>Send notifications to affected organizations</Label>
                            <p className="text-sm text-muted-foreground">
                                Organizations will receive email notifications about this action
                            </p>
                        </div>
                    </div>

                    {/* Confirmation */}
                    <div className="flex flex-row items-start space-x-3 space-y-0">
                        <Checkbox
                            {...form.register('confirm_bulk_action')}
                            checked={form.watch('confirm_bulk_action')}
                            onCheckedChange={(checked) => form.setValue('confirm_bulk_action', Boolean(checked))}
                        />
                        <div className="space-y-1 leading-none">
                            <Label>I understand the impact of this bulk action *</Label>
                            <p className="text-sm text-muted-foreground">
                                This will affect {selectedOrgCount} organizations and {totalUserCount} users
                            </p>
                            {form.formState.errors.confirm_bulk_action && (
                                <p className="text-sm text-red-500">{form.formState.errors.confirm_bulk_action.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Warning Alert */}
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Critical Action:</strong> This bulk operation will affect {selectedOrgCount} organizations
                            and {totalUserCount} users. Please review the selections carefully before proceeding.
                            {watchedActionType === 'immediate' &&
                                ' All selected organizations will be deactivated immediately.'}
                            {watchedActionType === 'scheduled' &&
                                ' All selected organizations will be deactivated on the scheduled date.'}
                            {watchedActionType === 'suspend' &&
                                ' All selected organizations will be suspended and users will lose access.'}
                        </AlertDescription>
                    </Alert>

                    <Separator />

                    {/* Submit Actions */}
                    <div className="flex items-center justify-end gap-3">
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || selectedOrgCount === 0}
                            variant="destructive"
                        >
                            {loading ? 'Processing...' : `Apply to ${selectedOrgCount} Organizations`}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}