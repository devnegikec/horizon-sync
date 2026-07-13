import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Textarea,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    Input,
    Checkbox,
    Label,
    Separator,
} from '@horizon-sync/ui/components';
import { cn } from '@horizon-sync/ui/lib';
import { useCurrencyStore } from '@horizon-sync/store';
import { getCurrencySymbol } from '@horizon-sync/ui';
import {
    Building2,
    DollarSign,
    FileText,
    Calendar,
    TrendingUp,
    Settings,
} from 'lucide-react';

import { BillingManagementService } from '../../services/billing-management.service';
import type { OrganizationBillingInfo, TierUpdateRequest } from '../../types';

const tierUpdateSchema = z.object({
    new_tier: z.enum(['basic', 'pro', 'enterprise']),
    effective_date: z.string().optional(),
    prorated: z.boolean(),
    reason: z.string().optional(),
});

type TierUpdateFormData = z.infer<typeof tierUpdateSchema>;

interface OrganizationBillingModalProps {
    organization: OrganizationBillingInfo;
    isOpen: boolean;
    onClose: () => void;
    onRefresh: () => void;
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

function getTierBadge(tier: string) {
    const tierConfig = {
        basic: { variant: 'secondary' as const, label: 'Basic', color: 'bg-gray-100 text-gray-800' },
        pro: { variant: 'secondary' as const, label: 'Pro', color: 'bg-blue-100 text-blue-800' },
        enterprise: { variant: 'success' as const, label: 'Enterprise', color: 'bg-green-100 text-green-800' },
    };

    const config = tierConfig[tier as keyof typeof tierConfig] || {
        variant: 'secondary' as const,
        label: tier,
        color: 'bg-gray-100 text-gray-800',
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function OrganizationBillingModal({ organization, isOpen, onClose, onRefresh }: OrganizationBillingModalProps) {
    const baseCurrency = useCurrencyStore((s) => s.baseCurrency);
    const currencySymbol = getCurrencySymbol(baseCurrency || 'INR');
    const [loading, setLoading] = useState(false);
    const [showTierUpdate, setShowTierUpdate] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    const tierUpdateForm = useForm<TierUpdateFormData>({
        resolver: zodResolver(tierUpdateSchema),
        defaultValues: {
            new_tier: 'basic', // Default to basic since subscription_tier is not in API response
            prorated: true,
            effective_date: new Date().toISOString().split('T')[0],
        },
    });

    const handleTierUpdate: SubmitHandler<TierUpdateFormData> = async (data) => {
        try {
            setLoading(true);
            await BillingManagementService.updateOrganizationTier(organization.organization_id, data);
            setShowTierUpdate(false);
            onRefresh();
            onClose();
        } catch (error) {
            console.error('Failed to update tier:', error);
        } finally {
            setLoading(false);
        }
    };

    const tierOptions = [
        { value: 'basic', label: 'Basic', description: 'Basic features and support' },
        { value: 'pro', label: 'Pro', description: 'Advanced features and priority support' },
        { value: 'enterprise', label: 'Enterprise', description: 'Full features and dedicated support' },
    ];

    const currentTier = organization.billing_status || 'active';
    // Since we don't have outstanding balance info in current API response, set to false
    const hasOutstanding = false;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            {organization.organization_name} - Billing Details
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            {getTierBadge(organization.billing_status || 'active')}
                            {hasOutstanding && (
                                <Badge variant="destructive">Outstanding Balance</Badge>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="subscription">Subscription</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        {/* Financial Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Credit Limit</p>
                                            <p className="text-2xl font-bold text-green-600">
                                                {formatCurrency(organization.credit_limit || 0)}
                                            </p>
                                        </div>
                                        <div className="bg-green-100 p-2 rounded-full">
                                            <span className="h-4 w-4 inline-flex items-center justify-center text-sm font-bold mr-2">{currencySymbol}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Outstanding</p>
                                            <p className={cn(
                                                "text-2xl font-bold",
                                                hasOutstanding ? 'text-red-600' : 'text-muted-foreground'
                                            )}>
                                                {formatCurrency(0)}
                                            </p>
                                        </div>
                                        <div className={cn(
                                            "p-2 rounded-full",
                                            hasOutstanding ? 'bg-red-100' : 'bg-gray-100'
                                        )}>
                                            <FileText className={cn(
                                                "h-5 w-5",
                                                hasOutstanding ? 'text-red-600' : 'text-gray-600'
                                            )} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Seat Limit</p>
                                            <p className="text-2xl font-bold">
                                                {organization.seat_limit || 0}
                                            </p>
                                        </div>
                                        <div className="bg-blue-100 p-2 rounded-full">
                                            <FileText className="h-5 w-5 text-blue-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Billing Cycle</p>
                                            <p className="text-lg font-semibold capitalize">
                                                {organization.billing_cycle || 'monthly'}
                                            </p>
                                        </div>
                                        <div className="bg-purple-100 p-2 rounded-full">
                                            <Calendar className="h-5 w-5 text-purple-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Billing Information */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Subscription Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Current Tier:</span>
                                        <div className="flex items-center gap-2">
                                            {getTierBadge(organization.billing_status || 'active')}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowTierUpdate(true)}
                                            >
                                                <Settings className="h-4 w-4 mr-1" />
                                                Update
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Billing Cycle:</span>
                                        <span className="font-medium capitalize">{organization.billing_cycle || 'monthly'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Next Billing Date:</span>
                                        <span className="font-medium">{organization.next_billing_date ? formatDate(organization.next_billing_date) : 'N/A'}</span>
                                    </div>
                                    {organization.last_billed_date && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Last Billed:</span>
                                            <span className="font-medium">{formatDate(organization.last_billed_date)}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Account Status</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Payment Status:</span>
                                        <Badge variant={hasOutstanding ? 'destructive' : 'success'}>
                                            {hasOutstanding ? 'Outstanding Balance' : 'Up to Date'}
                                        </Badge>
                                    </div>

                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="subscription">
                        {showTierUpdate && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Update Subscription Tier</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={tierUpdateForm.handleSubmit(handleTierUpdate)} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>New Subscription Tier *</Label>
                                            <Select
                                                {...tierUpdateForm.register('new_tier')}
                                                onValueChange={(value) => tierUpdateForm.setValue('new_tier', value as any)}
                                                value={tierUpdateForm.watch('new_tier')}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select tier" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {tierOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{option.label}</span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {option.description}
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {tierUpdateForm.formState.errors.new_tier && (
                                                <p className="text-sm text-red-500 mt-1">{tierUpdateForm.formState.errors.new_tier.message}</p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="effective_date">Effective Date</Label>
                                                <input
                                                    id="effective_date"
                                                    type="date"
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    {...tierUpdateForm.register('effective_date')}
                                                />
                                                {tierUpdateForm.formState.errors.effective_date && (
                                                    <p className="text-sm text-red-500 mt-1">{tierUpdateForm.formState.errors.effective_date.message}</p>
                                                )}
                                            </div>

                                            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <Label className="text-base">Prorated Billing</Label>
                                                    <div className="text-sm text-muted-foreground">
                                                        Apply prorated charges for tier change
                                                    </div>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-gray-300"
                                                    {...tierUpdateForm.register('prorated')}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="reason">Reason for Change</Label>
                                            <Textarea
                                                id="reason"
                                                placeholder="Reason for tier change..."
                                                {...tierUpdateForm.register('reason')}
                                            />
                                            {tierUpdateForm.formState.errors.reason && (
                                                <p className="text-sm text-red-500 mt-1">{tierUpdateForm.formState.errors.reason.message}</p>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-end gap-3">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setShowTierUpdate(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button type="submit" disabled={loading}>
                                                {loading ? 'Updating...' : 'Update Tier'}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        {!showTierUpdate && (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Current Subscription</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-xl font-semibold">{currentTier.charAt(0).toUpperCase() + currentTier.slice(1)} Plan</h3>
                                                    <p className="text-muted-foreground">Active subscription tier</p>
                                                </div>
                                                <Button onClick={() => setShowTierUpdate(true)}>
                                                    <Settings className="h-4 w-4 mr-2" />
                                                    Change Tier
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="analytics">
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5" />
                                        Billing Analytics
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h4 className="font-medium mb-2">Subscription Details</h4>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-muted-foreground">Billing Status:</span>
                                                        <Badge variant={organization.billing_status === 'active' ? 'success' : 'secondary'}>
                                                            {organization.billing_status || 'Inactive'}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-muted-foreground">Billing Cycle:</span>
                                                        <span className="font-medium">{organization.billing_cycle || 'Not set'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-muted-foreground">Seat Limit:</span>
                                                        <span className="font-medium">{organization.seat_limit || 'Unlimited'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="font-medium mb-2">Account Information</h4>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-muted-foreground">Credit Limit:</span>
                                                        <span className="font-medium">
                                                            {organization.credit_limit ? formatCurrency(organization.credit_limit) : 'Not set'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-muted-foreground">Customer Since:</span>
                                                        <span className="font-medium">
                                                            {organization.customer_since ? formatDate(organization.customer_since) : 'Not set'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-muted-foreground">Next Billing:</span>
                                                        <span className="font-medium">
                                                            {organization.next_billing_date ? formatDate(organization.next_billing_date) : 'Not scheduled'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="flex items-center justify-end gap-3 pt-6">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}