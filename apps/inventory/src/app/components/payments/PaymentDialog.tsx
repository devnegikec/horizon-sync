import * as React from 'react';
import { useQuery } from '@tanstack/react-query';

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

import type { Payment, PaymentFormData, PaymentMode, PartyType, PaymentAllocationFormData } from '../../types/payment';
import type { Invoice } from '../../types/invoice';
import type { CustomerResponse } from '../../types/customer.types';
import { customerApi } from '../../utility/api';
import { PaymentAllocationTable } from './PaymentAllocationTable';

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

  const [formData, setFormData] = React.useState({
    party_id: '',
    party_type: 'Customer' as PartyType,
    payment_date: new Date().toISOString().slice(0, 10),
    payment_mode: 'Cash' as PaymentMode,
    reference_number: '',
    currency: 'INR',
    total_amount: 0,
    status: 'Draft' as 'Draft' | 'Submitted',
    remarks: '',
  });

  const [allocations, setAllocations] = React.useState<PaymentAllocationFormData[]>([]);

  const { data: customersData } = useQuery<CustomerResponse>({
    queryKey: ['customers-list'],
    queryFn: () => customerApi.list(accessToken || '', 1, 100) as Promise<CustomerResponse>,
    enabled: !!accessToken && open && formData.party_type === 'Customer',
  });

  const customers = customersData?.customers ?? [];

  // Reset form when dialog opens or payment changes
  React.useEffect(() => {
    if (payment) {
      setFormData({
        party_id: payment.party_id,
        party_type: payment.party_type,
        payment_date: payment.payment_date.slice(0, 10),
        payment_mode: payment.payment_mode,
        reference_number: payment.reference_number || '',
        currency: payment.currency,
        total_amount: payment.total_amount,
        status: ['Draft', 'Submitted'].includes(payment.status) 
          ? (payment.status as 'Draft' | 'Submitted')
          : 'Draft',
        remarks: payment.remarks || '',
      });
      if (payment.allocations && payment.allocations.length > 0) {
        setAllocations(payment.allocations.map((alloc) => ({
          invoice_id: alloc.invoice_id,
          allocated_amount: alloc.allocated_amount,
        })));
      } else {
        setAllocations([]);
      }
    } else if (preSelectedInvoice) {
      // Pre-fill from invoice
      setFormData({
        party_id: preSelectedInvoice.party_id,
        party_type: preSelectedInvoice.party_type,
        payment_date: new Date().toISOString().slice(0, 10),
        payment_mode: 'Cash',
        reference_number: '',
        currency: preSelectedInvoice.currency,
        total_amount: preSelectedInvoice.outstanding_amount,
        status: 'Draft',
        remarks: '',
      });
      setAllocations([{
        invoice_id: preSelectedInvoice.id,
        allocated_amount: preSelectedInvoice.outstanding_amount,
      }]);
    } else {
      setFormData({
        party_id: '',
        party_type: 'Customer',
        payment_date: new Date().toISOString().slice(0, 10),
        payment_mode: 'Cash',
        reference_number: '',
        currency: 'INR',
        total_amount: 0,
        status: 'Draft',
        remarks: '',
      });
      setAllocations([]);
    }
  }, [payment, preSelectedInvoice, open]);

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Calculate allocated and unallocated amounts
  const { totalAllocated, unallocated } = React.useMemo(() => {
    const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.allocated_amount, 0);
    const unallocated = formData.total_amount - totalAllocated;
    return { totalAllocated, unallocated };
  }, [allocations, formData.total_amount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.party_id) {
      alert('Please select a party');
      return;
    }
    if (!formData.payment_mode) {
      alert('Please select a payment mode');
      return;
    }
    if (formData.total_amount <= 0) {
      alert('Total amount must be greater than zero');
      return;
    }
    if (totalAllocated > formData.total_amount) {
      alert('Total allocated amount cannot exceed payment total amount');
      return;
    }

    const submitData: PaymentFormData = {
      ...formData,
      payment_date: new Date(formData.payment_date),
      allocations,
    };

    if (isEdit && payment) {
      await onSave(submitData, payment.id);
    } else {
      await onSave(submitData);
    }
  };

  const availableStatuses: Array<'Draft' | 'Submitted'> = React.useMemo(() => {
    if (!isEdit) return ['Draft'];
    
    const current = payment?.status;
    if (current === 'Draft') return ['Draft', 'Submitted'];
    if (current === 'Submitted') return ['Submitted'];
    // Reconciled and Cancelled statuses cannot be changed manually
    return [current as 'Draft' | 'Submitted'];
  }, [isEdit, payment?.status]);

  const isAllocationEditingDisabled = isEdit && payment?.status !== 'Draft';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Payment' : 'Create Payment'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                <Select
                  value={formData.party_type}
                  onValueChange={(v) => handleChange('party_type', v)}
                  disabled={isEdit || !!preSelectedInvoice}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Customer">Customer</SelectItem>
                    <SelectItem value="Supplier">Supplier</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="party_id">
                  {formData.party_type === 'Customer' ? 'Customer' : 'Supplier'} *
                </Label>
                <Select
                  value={formData.party_id}
                  onValueChange={(v) => handleChange('party_id', v)}
                  disabled={isEdit || !!preSelectedInvoice}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${formData.party_type.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.party_type === 'Customer' && customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.customer_name}
                      </SelectItem>
                    ))}
                    {formData.party_type === 'Supplier' && (
                      <SelectItem value="" disabled>
                        Supplier list not implemented
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="payment_date">Payment Date *</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => handleChange('payment_date', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_mode">Payment Mode *</Label>
                <Select
                  value={formData.payment_mode}
                  onValueChange={(v) => handleChange('payment_mode', v)}
                  required
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference_number">Reference Number</Label>
                <Input
                  id="reference_number"
                  type="text"
                  value={formData.reference_number}
                  onChange={(e) => handleChange('reference_number', e.target.value)}
                  placeholder="Check #, Transaction ID"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(v) => handleChange('currency', v)}
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_amount">Total Amount *</Label>
                <Input
                  id="total_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.total_amount}
                  onChange={(e) => handleChange('total_amount', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
            </div>

            {isEdit && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => handleChange('status', v)}
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
              </div>
            )}
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => handleChange('remarks', e.target.value)}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          {/* Payment Allocations */}
          <Separator />
          <PaymentAllocationTable
            partyId={formData.party_id}
            partyType={formData.party_type}
            currency={formData.currency}
            totalAmount={formData.total_amount}
            allocations={allocations}
            onAllocationsChange={setAllocations}
            disabled={isAllocationEditingDisabled}
            preSelectedInvoiceId={preSelectedInvoice?.id}
          />

          {/* Allocation Summary */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Amount:</span>
                <span className="text-sm font-medium">
                  {formData.currency} {formData.total_amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Allocated:</span>
                <span className="text-sm font-medium">
                  {formData.currency} {totalAllocated.toFixed(2)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Unallocated:</span>
                <span className={unallocated < 0 ? 'text-red-600' : ''}>
                  {formData.currency} {unallocated.toFixed(2)}
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
