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

import type { Invoice, InvoiceLineItemFormData, InvoiceType, PartyType, InvoiceFormData } from '../../types/invoice';
import type { CustomerResponse } from '../../types/customer.types';
import { customerApi } from '../../utility/api';
import { InvoiceLineItemTable } from './InvoiceLineItemTable';

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

  const [formData, setFormData] = React.useState({
    party_id: '',
    party_type: 'Customer' as PartyType,
    posting_date: new Date().toISOString().slice(0, 10),
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    currency: 'INR',
    invoice_type: 'Sales' as InvoiceType,
    status: 'Draft' as 'Draft' | 'Submitted' | 'Cancelled',
    remarks: '',
  });

  const [lineItems, setLineItems] = React.useState<InvoiceLineItemFormData[]>([]);

  const { data: customersData } = useQuery<CustomerResponse>({
    queryKey: ['customers-list'],
    queryFn: () => customerApi.list(accessToken || '', 1, 100) as Promise<CustomerResponse>,
    enabled: !!accessToken && open,
  });

  const customers = customersData?.customers ?? [];

  // Reset form when dialog opens or invoice changes
  React.useEffect(() => {
    if (invoice) {
      setFormData({
        party_id: invoice.party_id,
        party_type: invoice.party_type,
        posting_date: invoice.posting_date.slice(0, 10),
        due_date: invoice.due_date.slice(0, 10),
        currency: invoice.currency,
        invoice_type: invoice.invoice_type,
        status: ['Draft', 'Submitted', 'Cancelled'].includes(invoice.status) 
          ? (invoice.status as 'Draft' | 'Submitted' | 'Cancelled')
          : 'Draft',
        remarks: invoice.remarks || '',
      });
      if (invoice.line_items && invoice.line_items.length > 0) {
        setLineItems(invoice.line_items.map((item) => ({
          item_id: item.item_id,
          description: item.description,
          quantity: Number(item.quantity),
          uom: item.uom,
          rate: Number(item.rate),
          tax_template_id: item.tax_template_id,
        })));
      } else {
        setLineItems([]);
      }
    } else {
      setFormData({
        party_id: '',
        party_type: 'Customer',
        posting_date: new Date().toISOString().slice(0, 10),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        currency: 'INR',
        invoice_type: 'Sales',
        status: 'Draft',
        remarks: '',
      });
      setLineItems([]);
    }
  }, [invoice, open]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.party_id) {
      alert('Please select a customer');
      return;
    }
    if (lineItems.length === 0 || lineItems.some(item => !item.item_id)) {
      alert('Please add at least one line item with a valid item');
      return;
    }
    if (lineItems.some(item => item.quantity <= 0 || item.rate < 0)) {
      alert('All line items must have positive quantities and non-negative rates');
      return;
    }
    if (new Date(formData.due_date) < new Date(formData.posting_date)) {
      alert('Due date must not be before posting date');
      return;
    }

    const submitData: InvoiceFormData = {
      ...formData,
      posting_date: new Date(formData.posting_date),
      due_date: new Date(formData.due_date),
      line_items: lineItems,
    };

    if (isEdit && invoice) {
      await onSave(submitData, invoice.id);
    } else {
      await onSave(submitData);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Invoice' : 'Create Invoice'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                <Select
                  value={formData.party_id}
                  onValueChange={(v) => handleChange('party_id', v)}
                  disabled={isEdit}
                  required
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice_type">Invoice Type *</Label>
                <Select
                  value={formData.invoice_type}
                  onValueChange={(v) => handleChange('invoice_type', v)}
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
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="posting_date">Posting Date *</Label>
                <Input
                  id="posting_date"
                  type="date"
                  value={formData.posting_date}
                  onChange={(e) => handleChange('posting_date', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleChange('due_date', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(v) => handleChange('currency', v)}
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

          {/* Line Items */}
          <Separator />
          <InvoiceLineItemTable
            items={lineItems}
            onItemsChange={setLineItems}
            disabled={isLineItemEditingDisabled}
          />

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Subtotal:</span>
                <span className="text-sm font-medium">
                  {formData.currency} {subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Tax:</span>
                <span className="text-sm font-medium">
                  {formData.currency} {totalTax.toFixed(2)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Grand Total:</span>
                <span>
                  {formData.currency} {grandTotal.toFixed(2)}
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
