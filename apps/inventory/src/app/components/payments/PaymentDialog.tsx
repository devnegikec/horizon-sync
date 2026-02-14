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

import type { Payment, PaymentMode, PartyType } from '../../types/payment';
import type { Invoice } from '../../types/invoice';
import type { CustomerResponse } from '../../types/customer.types';
import { customerApi } from '../../utility/api';
import { PaymentAllocationTable } from './PaymentAllocationTable';
import { paymentFormSchema, type PaymentFormData, type PaymentAllocationFormData } from '../../utils/validation';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment?: Payment | null;
  preSelectedInvoice?: Invoice | null;
  onSave: (data: PaymentFormData, id?: string) => Promise<void>;
  saving: boolean;
}

export function PaymentDialog({ 
  open, 
  onOpenChange, 
  payment, 
  preSelectedInvoice,
  onSave, 
  saving 
}: PaymentDialogProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const isEdit = !!payment;

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      party_id: '',
      party_type: 'Customer',
      payment_date: new Date(),
      payment_mode: 'Cash',
      reference_number: '',
      currency: 'INR',
      total_amount: 0,
      status: 'Draft',
      remarks: '',
      allocations: [],
    },
  });

  const { control, handleSubmit, formState: { errors }, setValue, watch, reset } = form;
  const allocations = watch('allocations');
  const partyType = watch('party_type');
  const totalAmount = watch('total_amount');

  // Prefetch customer data when dialog opens
  const { data: customersData } = useQuery<CustomerResponse>({
    queryKey: ['customers-list'],
    queryFn: () => customerApi.list(accessToken || '', 1, 100) as Promise<CustomerResponse>,
    enabled: !!accessToken && open && partyType === 'Customer',
    staleTime: 30_000, // 30 seconds cache
  });

  const customers = customersData?.customers ?? [];

  // Reset form when dialog opens or payment changes
  React.useEffect(() => {
    if (payment) {
      reset({
        party_id: payment.party_id,
        party_type: payment.party_type,
        payment_date: new Date(payment.payment_date),
        payment_mode: payment.payment_mode,
        reference_number: payment.reference_number || '',
        currency: payment.currency,
        total_amount: payment.total_amount,
        status: ['Draft', 'Submitted', 'Reconciled', 'Cancelled'].includes(payment.status) 
          ? (payment.status as 'Draft' | 'Submitted' | 'Reconciled' | 'Cancelled')
          : 'Draft',
        remarks: payment.remarks || '',
        allocations: payment.allocations && payment.allocations.length > 0
          ? payment.allocations.map((alloc) => ({
              invoice_id: alloc.invoice_id,
              allocated_amount: alloc.allocated_amount,
            }))
          : [],
      });
    } else if (preSelectedInvoice) {
      // Pre-fill from invoice
      reset({
        party_id: preSelectedInvoice.party_id,
        party_type: preSelectedInvoice.party_type,
        payment_date: new Date(),
        payment_mode: 'Cash',
        reference_number: '',
        currency: preSelectedInvoice.currency,
        total_amount: preSelectedInvoice.outstanding_amount,
        status: 'Draft',
        remarks: '',
        allocations: [{
          invoice_id: preSelectedInvoice.id,
          allocated_amount: preSelectedInvoice.outstanding_amount,
        }],
      });
    } else {
      reset({
        party_id: '',
        party_type: 'Customer',
        payment_date: new Date(),
        payment_mode: 'Cash',
        reference_number: '',
        currency: 'INR',
        total_amount: 0,
        status: 'Draft',
        remarks: '',
        allocations: [],
      });
    }
  }, [payment, preSelectedInvoice, open, reset]);

  // Calculate allocated and unallocated amounts
  const { totalAllocated, unallocated } = React.useMemo(() => {
    const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.allocated_amount, 0);
    const unallocated = totalAmount - totalAllocated;
    return { totalAllocated, unallocated };
  }, [allocations, totalAmount]);

  const onSubmit = async (data: PaymentFormData) => {
    if (isEdit && payment) {
      await onSave(data, payment.id);
    } else {
      await onSave(data);
    }
  };

  const availableStatuses: Array<'Draft' | 'Submitted' | 'Reconciled' | 'Cancelled'> = React.useMemo(() => {
    if (!isEdit) return ['Draft'];
    
    const current = payment?.status;
    if (current === 'Draft') return ['Draft', 'Submitted'];
    if (current === 'Submitted') return ['Submitted', 'Reconciled', 'Cancelled'];
    // Reconciled and Cancelled statuses cannot be changed
    return [current as 'Draft' | 'Submitted' | 'Reconciled' | 'Cancelled'];
  }, [isEdit, payment?.status]);

  const isAllocationEditingDisabled = isEdit && payment?.status !== 'Draft';
  const partyId = watch('party_id');
  const currency = watch('currency');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto sm:rounded-lg w-full h-full sm:h-auto sm:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Payment' : 'Create Payment'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            {isEdit && payment && (
              <div className="space-y-2">
                <Label htmlFor="payment_number">Payment Number</Label>
                <Input id="payment_number" value={payment.payment_number} disabled />
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="party_type">Party Type *</Label>
                <Controller
                  name="party_type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isEdit || !!preSelectedInvoice}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Customer">Customer</SelectItem>
                        <SelectItem value="Supplier">Supplier</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.party_type && (
                  <p className="text-sm text-red-600">{errors.party_type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="party_id">
                  {partyType === 'Customer' ? 'Customer' : 'Supplier'} *
                </Label>
                <Controller
                  name="party_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isEdit || !!preSelectedInvoice}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${partyType.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {partyType === 'Customer' && customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.customer_name}
                          </SelectItem>
                        ))}
                        {partyType === 'Supplier' && (
                          <SelectItem value="" disabled>
                            Supplier list not implemented
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.party_id && (
                  <p className="text-sm text-red-600">{errors.party_id.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="payment_date">Payment Date *</Label>
                <Controller
                  name="payment_date"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="payment_date"
                      type="date"
                      value={field.value instanceof Date ? field.value.toISOString().slice(0, 10) : ''}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  )}
                />
                {errors.payment_date && (
                  <p className="text-sm text-red-600">{errors.payment_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_mode">Payment Mode *</Label>
                <Controller
                  name="payment_mode"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="Credit Card">Credit Card</SelectItem>
                        <SelectItem value="Check">Check</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.payment_mode && (
                  <p className="text-sm text-red-600">{errors.payment_mode.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference_number">Reference Number</Label>
                <Controller
                  name="reference_number"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="reference_number"
                      type="text"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Check #, Transaction ID"
                    />
                  )}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Controller
                  name="currency"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isEdit || !!preSelectedInvoice}
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

              <div className="space-y-2">
                <Label htmlFor="total_amount">Total Amount *</Label>
                <Controller
                  name="total_amount"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="total_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={field.value}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
                {errors.total_amount && (
                  <p className="text-sm text-red-600">{errors.total_amount.message}</p>
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

          {/* Payment Allocations */}
          <Separator />
          <div className="space-y-2">
            <PaymentAllocationTable
              partyId={partyId}
              partyType={partyType}
              currency={currency}
              totalAmount={totalAmount}
              allocations={allocations}
              onAllocationsChange={(items) => setValue('allocations', items)}
              disabled={isAllocationEditingDisabled}
              preSelectedInvoiceId={preSelectedInvoice?.id}
            />
            {errors.allocations && (
              <p className="text-sm text-red-600">
                {typeof errors.allocations.message === 'string' 
                  ? errors.allocations.message 
                  : 'Please check allocations for errors'}
              </p>
            )}
          </div>

          {/* Allocation Summary */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Amount:</span>
                <span className="text-sm font-medium">
                  {currency} {totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Allocated:</span>
                <span className="text-sm font-medium">
                  {currency} {totalAllocated.toFixed(2)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Unallocated:</span>
                <span className={unallocated < 0 ? 'text-red-600' : ''}>
                  {currency} {unallocated.toFixed(2)}
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
              {saving ? 'Saving...' : isEdit ? 'Update Payment' : 'Create Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Memoize the component for better performance
export default React.memo(PaymentDialog);
