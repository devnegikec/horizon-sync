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
} from 'lucide-react';

const deactivationSchema = z.object({
    action_type: z.string().min(1, 'Action type is required'),
    reason: z.string().min(10, 'Reason must be at least 10 characters'),
    scheduled_date: z.string().optional(),
    send_notification: z.boolean(),
});

type DeactivationFormData = z.infer<typeof deactivationSchema>;

interface Organization {
    id: string;
    name: string;
    status: string;
    tier: string;
    user_count: number;
    last_activity_date: string;
    billing_status: string;
}

interface DeactivationActionModalProps {
    organization: Organization | null;
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: DeactivationFormData) => Promise<void>;
    loading?: boolean;
}

const actionTypes = [
    { value: 'immediate', label: 'Immediate Deactivation', icon: Ban },
    { value: 'scheduled', label: 'Scheduled Deactivation', icon: Calendar },
    { value: 'grace_period', label: 'Grace Period Warning', icon: AlertTriangle },
    { value: 'reactivate', label: 'Reactivate Organization', icon: CheckCircle },
];

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

export function DeactivationActionModal({
    organization,
    isOpen,
    onClose,
    onSubmit,
    loading = false,
}: DeactivationActionModalProps) {
    const [selectedAction, setSelectedAction] = useState<string>('');

    const form = useForm<DeactivationFormData>({
        resolver: zodResolver(deactivationSchema),
        defaultValues: {
            action_type: '',
            reason: '',
            scheduled_date: '',
            send_notification: true,
        },
    });

    const { watch, setValue } = form;
    const watchedActionType = watch('action_type');

    const handleSubmit = async (data: DeactivationFormData) => {
        await onSubmit(data);
        handleClose();
    };

    const handleClose = () => {
        form.reset();
        setSelectedAction('');
        onClose();
    };

    const requiresScheduledDate = watchedActionType === 'scheduled';
    const isReactivation = watchedActionType === 'reactivate';

    if (!organization) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Organization Action: {organization.name}
                    </DialogTitle>
                </DialogHeader>

                {/* Organization Summary */}
                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle className="text-lg">Organization Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Current Status</label>
                                <div className="mt-1">{getStatusBadge(organization.status)}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Subscription Tier</label>
                                <div className="mt-1">{getTierBadge(organization.tier)}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">User Count</label>
                                <p className="font-medium">{organization.user_count}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Last Activity</label>
                                <p className="font-medium">
                                    {new Date(organization.last_activity_date).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    {/* Action Type Selection */}
                    <div>
                        <Label htmlFor="action_type">Action Type *</Label>
                        <Select
                            {...form.register('action_type')}
                            onValueChange={(value) => form.setValue('action_type', value)}
                            value={form.watch('action_type')}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select action type" />
                            </SelectTrigger>
                            <SelectContent>
                                {actionTypes.map((action) => {
                                    const Icon = action.icon;
                                    return (
                                        <SelectItem key={action.value} value={action.value}>
                                            <div className="flex items-center gap-2">
                                                <Icon className="h-4 w-4" />
                                                {action.label}
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
                        <Label htmlFor="reason">
                            {isReactivation ? 'Reactivation Reason' : 'Deactivation Reason'} *
                        </Label>
                        <Textarea
                            id="reason"
                            placeholder={
                                isReactivation
                                    ? 'Explain why this organization should be reactivated...'
                                    : 'Explain why this organization should be deactivated...'
                            }
                            className="min-h-[100px]"
                            {...form.register('reason')}
                        />
                        {form.formState.errors.reason && (
                            <p className="text-sm text-red-500 mt-1">{form.formState.errors.reason.message}</p>
                        )}
                    </div>

                    {/* Warning Alert */}
                    {!isReactivation && (
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Warning:</strong> This action will affect the organization's access to the system.
                                {watchedActionType === 'immediate' &&
                                    ' The organization will be deactivated immediately and users will lose access.'}
                                {watchedActionType === 'scheduled' &&
                                    ' The organization will be deactivated on the scheduled date.'}
                                {watchedActionType === 'grace_period' &&
                                    ' The organization will receive a warning and grace period before deactivation.'}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Submit Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            variant={isReactivation ? 'default' : 'destructive'}
                        >
                            {loading ? 'Processing...' : isReactivation ? 'Reactivate' : 'Apply Action'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}