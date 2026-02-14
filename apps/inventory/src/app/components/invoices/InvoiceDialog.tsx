import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useUserStore } from '@horizon-sync/store';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Textarea,
} from '@horizon-sync/ui/components';

import type { Invoice, InvoiceType, PartyType } from '../../types/invoice';
import type { CustomerResponse } from '../../types/customer.types';
import { customerApi } from '../../utility/api';
import { InvoiceLineItemTable } from './InvoiceLineItemTable';
import { invoiceFormSchema, type InvoiceFormData, type InvoiceLineItemFormData } from '../../utils/validation';

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: Invoice | null;
  onSave: (data: InvoiceFormData, id?: string) => Promise<void>;
  saving: boolean;
}

export function InvoiceDialog({ open, onOpenChange, invoice, onSave, saving }: InvoiceDialogProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const isEdit = !!invoice;

  // Prefetch customer data when dialog opens
  const { data: customersData } = useQuery<CustomerResponse>({
    queryKey: ['customers-list'],
    queryFn: () => customerApi.list(accessToken || '', 1, 100) as Promise<CustomerResponse>,
    enabled: !!accessToken && open,
    staleTime: 30_000, // 30 seconds cache
  });

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      party_id: '',
      party_type: 'Customer',
      posting_date: new Date(),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      currency: 'INR',
      invoice_type: 'Sales',
      status: 'Draft',
      remarks: '',
      line_items: [],
    },
  });

  const { control, handleSubmit, formState: { errors }, setValue, watch, reset } = form;
  const lineItems = watch('line_items');

  const customers = customersData?.customers ?? [];

  // Reset form when dialog opens or invoice changes
  React.useEffect(() => {
    if (invoice) {
      reset({
        party_id: invoice.party_id,
        party_type: invoice.party_type,
        posting_date: new Date(invoice.posting_date),
        due_date: new Date(invoice.due_date),
        currency: invoice.currency,
        invoice_type: invoice.invoice_type,
        status: ['Draft', 'Submitted', 'Cancelled'].includes(invoice.status) 
          ? (invoice.status as 'Draft' | 'Submitted' | 'Cancelled')
          : 'Draft',
        remarks: invoice.remarks || '',
        line_items: invoice.line_items && invoice.line_items.length > 0
          ? invoice.line_items.map((item) => ({
              item_id: item.item_id,
              description: item.description,
              quantity: Number(item.quantity),
              uom: item.uom,
              rate: Number(item.rate),
              tax_template_id: item.tax_template_id,
            }))
          : [],
      });
    } else {
      reset({
        party_id: '',
        party_type: 'Customer',
        posting_date: new Date(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        currency: 'INR',
        invoice_type: 'Sales',
        status: 'Draft',
        remarks: '',
        line_items: [],
      });
    }
  }, [invoice, open, reset]);

  // Calculate totals
  const { subtotal, totalTax, grandTotal } = React.useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => {
      const amount = item.quantity * item.rate;
      return sum + amount;
    }, 0);

    const totalTax = lineItems.reduce((sum, item) => {
      const amount = item.quantity * item.rate;
      // Tax calculation will be implemented when tax templates are available
      // For now, we'll use 0 as placeholder
      const taxAmount = 0;
      return sum + taxAmount;
    }, 0);

    const grandTotal = subtotal + totalTax;

    return { subtotal, totalTax, grandTotal };
  }, [lineItems]);

  const onSubmit = async (data: InvoiceFormData) => {
    if (isEdit && invoice) {
      await onSave(data, invoice.id);
    } else {
      await onSave(data);
    }
  };

  const availableStatuses: Array<'Draft' | 'Submitted' | 'Cancelled'> = React.useMemo(() => {
    if (!isEdit) return ['Draft'];
    
    const current = invoice?.status;
    if (current === 'Draft') return ['Draft', 'Submitted'];
    if (current === 'Submitted') return ['Submitted', 'Cancelled'];
    // Paid, Partially Paid, Overdue, and Cancelled statuses cannot be changed manually
    return [current as 'Draft' | 'Submitted' | 'Cancelled'];
  }, [isEdit, invoice?.status]);

  const isLineItemEditingDisabled = isEdit && invoice?.status !== 'Draft';
  const currency = watch('currency');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto sm:rounded-lg w-full h-full sm:h-auto sm:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Invoice' : 'Create Invoice'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            {isEdit && invoice && (
              <div className="space-y-2">
                <Label htmlFor="invoice_number">Invoice Number</Label>
                <Input id="invoice_number" value={invoice.invoice_number} disabled />
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="party_id">Customer *</Label>
                <Controller
                  name="party_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isEdit}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.customer_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.party_id && (
                  <p className="text-sm text-red-600">{errors.party_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice_type">Invoice Type *</Label>
                <Controller
                  name="invoice_type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isEdit}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="Purchase">Purchase</SelectItem>
                        <SelectItem value="Debit Note">Debit Note</SelectItem>
                        <SelectItem value="Credit Note">Credit Note</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.invoice_type && (
                  <p className="text-sm text-red-600">{errors.invoice_type.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="posting_date">Posting Date *</Label>
                <Controller
                  name="posting_date"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="posting_date"
                      type="date"
                      value={field.value instanceof Date ? field.value.toISOString().slice(0, 10) : ''}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  )}
                />
                {errors.posting_date && (
                  <p className="text-sm text-red-600">{errors.posting_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date *</Label>
                <Controller
                  name="due_date"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="due_date"
                      type="date"
                      value={field.value instanceof Date ? field.value.toISOString().slice(0, 10) : ''}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  )}
                />
                {errors.due_date && (
                  <p className="text-sm text-red-600">{errors.due_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Controller
                  name="currency"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isEdit}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.currency && (
                  <p className="text-sm text-red-600">{errors.currency.message}</p>
                )}
              </div>
            </div>

            {isEdit && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={availableStatuses.length === 1}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.status && (
                  <p className="text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Controller
              name="remarks"
              control={control}
              render={({ field }) => (
                <Textarea
                  id="remarks"
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Additional notes..."
                  rows={2}
                />
              )}
            />
          </div>

          {/* Line Items */}
          <Separator />
          <div className="space-y-2">
            <InvoiceLineItemTable
              items={lineItems}
              onItemsChange={(items) => setValue('line_items', items)}
              disabled={isLineItemEditingDisabled}
            />
            {errors.line_items && (
              <p className="text-sm text-red-600">
                {typeof errors.line_items.message === 'string' 
                  ? errors.line_items.message 
                  : 'Please check line items for errors'}
              </p>
            )}
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Subtotal:</span>
                <span className="text-sm font-medium">
                  {currency} {subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Tax:</span>
                <span className="text-sm font-medium">
                  {currency} {totalTax.toFixed(2)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Grand Total:</span>
                <span>
                  {currency} {grandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update Invoice' : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Memoize the component for better performance
export default React.memo(InvoiceDialog);
