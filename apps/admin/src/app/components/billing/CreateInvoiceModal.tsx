import { useState, useEffect } from 'react';
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
    Input,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Textarea,
    Separator,
    Label,
} from '@horizon-sync/ui/components';
import { cn } from '@horizon-sync/ui/lib';
import {
    Plus,
    Trash2,
    Calculator,
    FileText,
    Calendar,
    DollarSign,
} from 'lucide-react';

import { AdminOrganizationService } from '../../services/admin-organization.service';
import type { SubscriptionInvoiceCreateRequest, InvoiceLineItem } from '../../types';

const invoiceSchema = z.object({
    organization_id: z.string().min(1, 'Organization is required'),
    invoice_type: z.enum(['subscription', 'setup_fee', 'overage', 'addon', 'credit_adjustment']),
    subscription_tier: z.enum(['basic', 'pro', 'enterprise']),
    billing_period_start: z.string().min(1, 'Billing period start is required'),
    billing_period_end: z.string().min(1, 'Billing period end is required'),
    amount: z.number().min(0.01, 'Amount must be greater than 0'),
    due_date: z.string().min(1, 'Due date is required'),
    description: z.string().optional(),
    line_items: z.array(z.object({
        description: z.string().min(1, 'Line item description is required'),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
        unit_price: z.number().min(0, 'Unit price must be >= 0'),
        total_amount: z.number().min(0, 'Total amount must be >= 0'),
    })).optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface CreateInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: SubscriptionInvoiceCreateRequest) => Promise<void>;
}

export function CreateInvoiceModal({ isOpen, onClose, onSubmit }: CreateInvoiceModalProps) {
    const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([]);
    const [loading, setLoading] = useState(false);
    const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);

    const form = useForm<InvoiceFormData>({
        resolver: zodResolver(invoiceSchema),
        defaultValues: {
            invoice_type: 'subscription',
            subscription_tier: 'basic',
            line_items: [],
        },
    });

    useEffect(() => {
        if (isOpen) {
            loadOrganizations();
        }
    }, [isOpen]);

    const loadOrganizations = async () => {
        try {
            const response = await AdminOrganizationService.getOrganizations({
                page_size: 100
            });
            setOrganizations(
                response.organizations.map((org) => ({
                    id: org.id,
                    name: org.name,
                }))
            );
        } catch (error) {
            console.error('Failed to load organizations:', error);
        }
    };

    const handleAddLineItem = () => {
        setLineItems(prev => [
            ...prev,
            { description: '', quantity: 1, unit_price: 0, total_amount: 0 }
        ]);
    };

    const handleRemoveLineItem = (index: number) => {
        setLineItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleLineItemChange = (index: number, field: keyof InvoiceLineItem, value: any) => {
        setLineItems(prev => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                [field]: value,
            };

            // Auto-calculate total amount
            if (field === 'quantity' || field === 'unit_price') {
                updated[index].total_amount = updated[index].quantity * updated[index].unit_price;
            }

            return updated;
        });
    };

    const calculateInvoiceTotal = () => {
        return lineItems.reduce((total, item) => total + item.total_amount, 0);
    };

    const handleSubmit = async (data: InvoiceFormData) => {
        try {
            setLoading(true);
            await onSubmit({
                ...data,
                line_items: lineItems.length > 0 ? lineItems : undefined,
            });
            form.reset();
            setLineItems([]);
            onClose();
        } catch (error) {
            console.error('Failed to create invoice:', error);
        } finally {
            setLoading(false);
        }
    };

    const invoiceTypeOptions = [
        { value: 'subscription', label: 'Subscription' },
        { value: 'setup_fee', label: 'Setup Fee' },
        { value: 'overage', label: 'Overage' },
        { value: 'addon', label: 'Add-on' },
        { value: 'credit_adjustment', label: 'Credit Adjustment' },
    ];

    const tierOptions = [
        { value: 'basic', label: 'Basic' },
        { value: 'pro', label: 'Pro' },
        { value: 'enterprise', label: 'Enterprise' },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Subscription Invoice</DialogTitle>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="organization_id">Organization *</Label>
                            <Select
                                {...form.register('organization_id')}
                                onValueChange={(value) => form.setValue('organization_id', value)}
                                value={form.watch('organization_id')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select organization" />
                                </SelectTrigger>
                                <SelectContent>
                                    {organizations.map((org) => (
                                        <SelectItem key={org.id} value={org.id}>
                                            {org.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.formState.errors.organization_id && (
                                <p className="text-sm text-red-500 mt-1">{form.formState.errors.organization_id.message}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="invoice_type">Invoice Type *</Label>
                            <Select
                                {...form.register('invoice_type')}
                                onValueChange={(value) => form.setValue('invoice_type', value as any)}
                                value={form.watch('invoice_type')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {invoiceTypeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.formState.errors.invoice_type && (
                                <p className="text-sm text-red-500 mt-1">{form.formState.errors.invoice_type.message}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="subscription_tier">Subscription Tier *</Label>
                            <Select
                                {...form.register('subscription_tier')}
                                onValueChange={(value) => form.setValue('subscription_tier', value as any)}
                                value={form.watch('subscription_tier')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select tier" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tierOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.formState.errors.subscription_tier && (
                                <p className="text-sm text-red-500 mt-1">{form.formState.errors.subscription_tier.message}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="amount">Amount ($) *</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                {...form.register('amount', { valueAsNumber: true })}
                            />
                            {form.formState.errors.amount && (
                                <p className="text-sm text-red-500 mt-1">{form.formState.errors.amount.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Date Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="billing_period_start">Billing Period Start *</Label>
                            <Input
                                id="billing_period_start"
                                type="date"
                                {...form.register('billing_period_start')}
                            />
                            {form.formState.errors.billing_period_start && (
                                <p className="text-sm text-red-500 mt-1">{form.formState.errors.billing_period_start.message}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="billing_period_end">Billing Period End *</Label>
                            <Input
                                id="billing_period_end"
                                type="date"
                                {...form.register('billing_period_end')}
                            />
                            {form.formState.errors.billing_period_end && (
                                <p className="text-sm text-red-500 mt-1">{form.formState.errors.billing_period_end.message}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="due_date">Due Date *</Label>
                            <Input
                                id="due_date"
                                type="date"
                                {...form.register('due_date')}
                            />
                            {form.formState.errors.due_date && (
                                <p className="text-sm text-red-500 mt-1">{form.formState.errors.due_date.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Additional invoice description..."
                            className="min-h-[80px]"
                            {...form.register('description')}
                        />
                        {form.formState.errors.description && (
                            <p className="text-sm text-red-500 mt-1">{form.formState.errors.description.message}</p>
                        )}
                    </div>

                    {/* Line Items */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium">Line Items</h3>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddLineItem}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Line Item
                            </Button>
                        </div>

                        {lineItems.map((item, index) => (
                            <Card key={index}>
                                <CardContent className="p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="md:col-span-2">
                                            <Label>Description</Label>
                                            <Input
                                                value={item.description}
                                                onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                                                placeholder="Line item description"
                                            />
                                        </div>
                                        <div>
                                            <Label>Quantity</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => handleLineItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                            />
                                        </div>
                                        <div>
                                            <Label>Unit Price ($)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={item.unit_price}
                                                onChange={(e) => handleLineItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Total: <span className="font-medium">${item.total_amount.toFixed(2)}</span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRemoveLineItem(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {lineItems.length > 0 && (
                            <div className="text-right">
                                <div className="inline-block bg-muted p-3 rounded-md">
                                    <div className="text-sm text-muted-foreground">Line Items Subtotal:</div>
                                    <div className="text-lg font-semibold">${calculateInvoiceTotal().toFixed(2)}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-6">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Invoice'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}