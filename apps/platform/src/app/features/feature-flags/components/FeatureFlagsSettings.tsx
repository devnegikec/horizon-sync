import * as React from 'react';

import { Badge } from '@horizon-sync/ui/components';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';
import { Switch } from '@horizon-sync/ui/components/ui/switch';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';
import { AlertCircle, RotateCcw } from 'lucide-react';

import {
    featureFlagService,
    type TenantFeatureFlag,
} from '../services/featureFlagService';

export interface FeatureFlagsSettingsProps {
    accessToken: string;
    canEdit: boolean;
}

const FLAG_LABELS: Record<string, string> = {
    wms_enabled: 'WMS (Warehouse Management)',
    qseal_enabled: 'QSeal (QR Product Authentication)',
    invoices_enabled: 'Invoicing',
    inventory_module_enabled: 'Inventory Module',
    banking_module_enabled: 'Banking',
    payments_module_enabled: 'Payments',
    revenue_module_enabled: 'Revenue',
    sourcing_module_enabled: 'Sourcing',
    book_module_enabled: 'Books',
    book_chart_of_account_enabled: 'Chart of Accounts',
    taxandcharges_module_enabled: 'Taxes & Charges',
    subscriptions_module_enabled: 'Subscriptions',
    analytics_module_enabled: 'Analytics',
    qseal_module_enabled: 'QSeal Module',
    users_module_enabled: 'Users',
    roles_module_enabled: 'Roles',
    reports_module_enabled: 'Reports',
    product_editable_manually: 'Manual Product Editing',
    item_auto_create_product: 'Auto-create Product from Item',
    variant_structured_enabled: 'Structured Variants',
    auto_create_sku_on_item: 'Auto-create SKU on Item',
    auto_create_variant_axes: 'Auto-create Variant Axes',
    require_item_approval: 'Require Item Approval',
    auto_approve_single_create: 'Auto-approve Single Item Create',
};

function labelFor(name: string): string {
    return FLAG_LABELS[name] ?? name;
}

export function FeatureFlagsSettings({ accessToken, canEdit }: FeatureFlagsSettingsProps) {
    const { toast } = useToast();
    const [flags, setFlags] = React.useState<TenantFeatureFlag[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [updating, setUpdating] = React.useState<string | null>(null);

    const load = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await featureFlagService.list(accessToken);
            setFlags(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load feature flags');
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    React.useEffect(() => {
        load();
    }, [load]);

    const handleToggle = async (flag: TenantFeatureFlag, key: 'enabled' | 'visible', value: boolean) => {
        if (updating) return;
        setUpdating(`${flag.name}:${key}`);
        // Optimistic update
        setFlags((prev) =>
            prev.map((f) =>
                f.name === flag.name ? { ...f, [key]: value, inherited: false } : f,
            ),
        );
        try {
            await featureFlagService.update(accessToken, flag.name, { [key]: value });
            toast({
                title: 'Feature flag updated',
                description: `${labelFor(flag.name)} → ${key === 'enabled' ? (value ? 'Enabled' : 'Disabled') : value ? 'Visible' : 'Hidden'}`,
            });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to update feature flag');
            // Revert on failure
            setFlags((prev) =>
                prev.map((f) => (f.name === flag.name ? flag : f)),
            );
            toast({
                title: 'Error',
                description: e instanceof Error ? e.message : 'Failed to update feature flag',
                variant: 'destructive',
            });
        } finally {
            setUpdating(null);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {error && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive bg-destructive/10 p-4">
                    <AlertCircle className="h-4 w-4 mt-0.5 text-destructive" />
                    <div className="flex-1">
                        <p className="text-sm text-destructive">{error}</p>
                        <Button variant="outline" size="sm" className="mt-2 gap-2" onClick={load}>
                            <RotateCcw className="h-3.5 w-3.5" />
                            Retry
                        </Button>
                    </div>
                </div>
            )}

            {flags.length === 0 && !loading && !error && (
                <div className="text-center py-12 text-muted-foreground">
                    No feature flags configured for your organization.
                </div>
            )}

            {flags.map((flag) => {
                const isUpdating = updating?.startsWith(`${flag.name}:`);
                return (
                    <Card key={flag.name}>
                        <CardContent className="p-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0 space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-medium">{labelFor(flag.name)}</p>
                                        <Badge variant="outline">Tenant Override</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {flag.description || flag.name}
                                    </p>
                                </div>

                                <div className="flex shrink-0 items-center gap-6">
                                    <label className="flex items-center gap-2 text-sm">
                                        <Switch
                                            checked={flag.enabled}
                                            disabled={!canEdit || isUpdating}
                                            onCheckedChange={(v) => handleToggle(flag, 'enabled', v)}
                                        />
                                        <span className={flag.enabled ? '' : 'text-muted-foreground'}>
                                            {flag.enabled ? 'Enabled' : 'Disabled'}
                                        </span>
                                    </label>

                                    <label className="flex items-center gap-2 text-sm">
                                        <Switch
                                            checked={flag.visible}
                                            disabled={!canEdit || isUpdating}
                                            onCheckedChange={(v) => handleToggle(flag, 'visible', v)}
                                        />
                                        <span className={flag.visible ? '' : 'text-muted-foreground'}>
                                            {flag.visible ? 'Visible' : 'Hidden'}
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}

            {!canEdit && (
                <p className="text-sm text-muted-foreground">
                    You need the <code className="text-xs">organization.update</code> permission to change feature flags.
                </p>
            )}
        </div>
    );
}
