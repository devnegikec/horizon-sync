import * as React from 'react';
import { useQuery } from '@tanstack/react-query';

import { useUserStore } from '@horizon-sync/store';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator, Textarea } from '@horizon-sync/ui/components';

import type { Quotation, QuotationCreate, QuotationLineItemCreate, QuotationStatus, QuotationUpdate } from '../../types/quotation.types';
import type { CustomerResponse } from '../../types/customer.types';
import { customerApi } from '../../utility/api';
import { LineItemTable } from './LineItemTable';

interface QuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: Quotation | null;
  onSave: (data: QuotationCreate | QuotationUpdate, id?: string) => Promise<void>;
  saving: boolean;
}

const emptyItem: QuotationLineItemCreate = {
  item_id: '',
  qty: 1,
  uom: 'pcs',
  rate: 0,
  amount: 0,
  sort_order: 0,
};

export function QuotationDialog({ open, onOpenChange, quotation, onSave, saving }: QuotationDialogProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const isEdit = !!quotation;

  const [formData, setFormData] = React.useState({
    quotation_no: '',
    customer_id: '',
    quotation_date: new Date().toISOString().slice(0, 10),
    valid_until:new Date().toISOString().slice(0, 10),
    currency: 'INR',
    status: 'draft' as QuotationStatus,
    remarks: '',
  });

  const [items, setItems] = React.useState<QuotationLineItemCreate[]>([{ ...emptyItem, sort_order: 1 }]);
  const [initialItemsData, setInitialItemsData] = React.useState<any[]>([]);

  const { data: customersData } = useQuery<CustomerResponse>({
    queryKey: ['customers-list'],
    queryFn: () => customerApi.list(accessToken || '', 1, 100) as Promise<CustomerResponse>,
    enabled: !!accessToken && open,
  });

  const customers = customersData?.customers ?? [];

  React.useEffect(() => {
    if (quotation) {
      setFormData({
        quotation_no: quotation.quotation_no,
        customer_id: quotation.customer_id,
        quotation_date: quotation.quotation_date.slice(0, 10),
        valid_until: quotation.valid_until.slice(0, 10),
        currency: quotation.currency,
        status: quotation.status,
        remarks: quotation.remarks || '',
      });
      // Handle both 'items' and 'line_items' field names from API
      const lineItems = quotation.items || quotation.line_items || [];
      if (lineItems.length > 0) {
        // Extract picker data if available (items with full details)
        const itemsWithPickerData = lineItems.filter((item: any) => item.item_code && item.item_name);
        if (itemsWithPickerData.length > 0) {
          setInitialItemsData(itemsWithPickerData);
        }
        
        setItems(lineItems.map((item: any) => ({
          item_id: item.item_id || item.id,
          qty: Number(item.qty),
          uom: item.uom,
          rate: Number(item.rate),
          amount: Number(item.amount),
          tax_template_id: item.tax_template_id || null,
          tax_rate: item.tax_rate || 0,
          tax_amount: item.tax_amount || 0,
          total_amount: item.total_amount || 0,
          sort_order: item.sort_order,
        })));
      } else {
        setItems([{ ...emptyItem, sort_order: 1 }]);
        setInitialItemsData([]);
      }
    } else {
      setFormData({
        quotation_no: '',
        customer_id: '',
        quotation_date: new Date().toISOString().slice(0, 10),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        currency: 'INR',
        status: 'draft',
        remarks: '',
      });
      setItems([{ ...emptyItem, sort_order: 1 }]);
      setInitialItemsData([]);
    }
  }, [quotation, open]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const grandTotal = React.useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.amount), 0);
  }, [items]);

  const isLineItemEditingDisabled = isEdit && (formData.status === 'sent' || formData.status === 'accepted' || formData.status === 'rejected' || formData.status === 'expired');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.customer_id) {
      alert('Please select a customer');
      return;
    }
    if (items.length === 0 || items.some(item => !item.item_id)) {
      alert('Please add at least one line item with a valid item');
      return;
    }
    if (items.some(item => item.qty <= 0 || item.rate < 0)) {
      alert('All line items must have positive quantities and non-negative rates');
      return;
    }
    if (new Date(formData.valid_until) < new Date(formData.quotation_date)) {
      alert('Valid until date must be after quotation date');
      return;
    }

    if (isEdit) {
      const updateData: QuotationUpdate = {
        quotation_date: new Date(formData.quotation_date).toISOString(),
        valid_until: new Date(formData.valid_until).toISOString(),
        status: formData.status,
        remarks: formData.remarks || undefined,
      };
      
      if (!isLineItemEditingDisabled) {
        updateData.items = items;
      }
      
      await onSave(updateData, quotation.id);
    } else {
      const createData: QuotationCreate = {
        quotation_no: formData.quotation_no || undefined,
        customer_id: formData.customer_id,
        quotation_date: new Date(formData.quotation_date).toISOString(),
        valid_until: new Date(formData.valid_until).toISOString(),
        status: formData.status,
        grand_total: grandTotal,
        currency: formData.currency,
        remarks: formData.remarks || undefined,
        items: items,
      };
      await onSave(createData);
    }
  };

  const canChangeStatus = isEdit && quotation;
  const availableStatuses: QuotationStatus[] = React.useMemo(() => {
    if (!canChangeStatus) return ['draft'];
    
    const current = formData.status;
    if (current === 'draft') return ['draft', 'sent'];
    if (current === 'sent') return ['sent', 'accepted', 'rejected', 'expired'];
    return [current]; // Terminal statuses can't change
  }, [canChangeStatus, formData.status]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Quotation' : 'Create Quotation'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quotation_no">Quotation #</Label>
                <Input
                  id="quotation_no"
                  value={formData.quotation_no}
                  onChange={(e) => handleChange('quotation_no', e.target.value)}
                  disabled={isEdit}
                  placeholder={isEdit ? '' : 'Auto-generated if left blank'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_id">Customer *</Label>
                <Select 
                  value={formData.customer_id || undefined} 
                  onValueChange={(v) => handleChange('customer_id', v)} 
                  disabled={isEdit}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.customer_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="quotation_date">Quotation Date *</Label>
                <Input
                  id="quotation_date"
                  type="date"
                  value={formData.quotation_date}
                  onChange={(e) => handleChange('quotation_date', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid_until">Valid Until *</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => handleChange('valid_until', e.target.value)}
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
                  value={formData.status || 'draft'} 
                  onValueChange={(v) => handleChange('status', v as QuotationStatus)}
                  disabled={availableStatuses.length === 1}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStatuses.filter(status => status).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
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
          <LineItemTable 
            items={items} 
            onItemsChange={setItems} 
            disabled={isLineItemEditingDisabled}
            initialItemsData={initialItemsData}
          />

          {/* Grand Total */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Grand Total:</span>
                <span>{formData.currency} {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : isEdit ? 'Update Quotation' : 'Create Quotation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
