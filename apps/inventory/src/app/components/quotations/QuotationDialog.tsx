import * as React from 'react';

import { useQuery } from '@tanstack/react-query';

import { useUserStore } from '@horizon-sync/store';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Separator } from '@horizon-sync/ui/components';

import type { CustomerResponse } from '../../types/customer.types';
import type { Quotation, QuotationCreate, QuotationLineItemCreate, QuotationStatus, QuotationUpdate } from '../../types/quotation.types';
import { customerApi } from '../../utility/api';

import { QuotationFormFields } from './QuotationFormFields';
import { QuotationLineItemsTable } from './QuotationLineItemsTable';

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
  tax_rate: 0,
  tax_amount: 0,
  total_amount: 0,
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

  const { data: customersData } = useQuery<CustomerResponse>({
    queryKey: ['customers-list'],
    queryFn: () => customerApi.list(accessToken || '', 1, 100) as Promise<CustomerResponse>,
    enabled: !!accessToken && open,
  });

  const customers = customersData?.customers ?? [];

  // Initialize form data from quotation
  const initializeFormData = React.useCallback(() => {
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
      
      const lineItems = quotation.items || quotation.line_items || [];
      if (lineItems.length > 0) {
        setItems(lineItems as QuotationLineItemCreate[]);
      } else {
        setItems([{ ...emptyItem, sort_order: 1 }]);
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
    }
  }, [quotation]);

  React.useEffect(() => {
    initializeFormData();
  }, [initializeFormData, open]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const grandTotal = React.useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.total_amount || item.amount || 0), 0);
  }, [items]);

  const isLineItemEditingDisabled = isEdit && (formData.status === 'sent' || formData.status === 'accepted' || formData.status === 'rejected' || formData.status === 'expired');

  // Validation helper
  const validateForm = (): string | null => {
    if (!formData.customer_id) return 'Please select a customer';
    if (items.length === 0 || items.some(item => !item.item_id)) return 'Please add at least one line item with a valid item';
    if (items.some(item => Number(item.qty) <= 0 || Number(item.rate) < 0)) return 'All line items must have positive quantities and non-negative rates';
    if (new Date(formData.valid_until) < new Date(formData.quotation_date)) return 'Valid until date must be after quotation date';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
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
          <QuotationFormFields formData={formData}
            customers={customers}
            isEdit={isEdit}
            availableStatuses={availableStatuses}
            onFieldChange={handleChange}/>

          {/* Line Items */}
          <Separator />
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Line Items</h3>
            <QuotationLineItemsTable
              items={items}
              onItemsChange={setItems}
              disabled={isLineItemEditingDisabled}
              currency={formData.currency}
            />
          </div>

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
