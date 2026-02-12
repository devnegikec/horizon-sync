import * as React from 'react';
import { ArrowRight, FileText } from 'lucide-react';

import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Label, Separator } from '@horizon-sync/ui/components';

import type { Quotation } from '../../types/quotation.types';

interface ConvertToSalesOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: Quotation | null;
  onConvert: (quotationId: string, data: ConversionData) => Promise<void>;
  converting: boolean;
}

export interface ConversionData {
  order_date: string;
  delivery_date?: string;
}

export function ConvertToSalesOrderDialog({ 
  open, 
  onOpenChange, 
  quotation, 
  onConvert, 
  converting 
}: ConvertToSalesOrderDialogProps) {
  const [formData, setFormData] = React.useState({
    order_date: new Date().toISOString().slice(0, 10),
    delivery_date: '',
  });

  React.useEffect(() => {
    if (open && quotation) {
      // Reset form when dialog opens
      setFormData({
        order_date: new Date().toISOString().slice(0, 10),
        delivery_date: '',
      });
    }
  }, [open, quotation]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quotation) return;

    // Validation
    if (!formData.order_date) {
      alert('Please select an order date');
      return;
    }

    if (formData.delivery_date && new Date(formData.delivery_date) < new Date(formData.order_date)) {
      alert('Delivery date must be after order date');
      return;
    }

    const conversionData: ConversionData = {
      order_date: new Date(formData.order_date).toISOString(),
      delivery_date: formData.delivery_date ? new Date(formData.delivery_date).toISOString() : undefined,
    };

    await onConvert(quotation.id, conversionData);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!quotation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <ArrowRight className="h-5 w-5" />
            Convert to Sales Order
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quotation Summary */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Converting Quotation</span>
            </div>
            
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Quotation Number</p>
                <p className="font-semibold">{quotation.quotation_no}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-semibold">{quotation.customer_name || quotation.customer?.customer_name || 'N/A'}</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Quotation Date</p>
                <p className="font-medium">{formatDate(quotation.quotation_date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Grand Total</p>
                <p className="font-medium">{quotation.currency} {Number(quotation.grand_total).toFixed(2)}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Line Items</p>
              <p className="font-medium">{quotation.line_items?.length || 0} items</p>
            </div>
          </div>

          <Separator />

          {/* Sales Order Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Sales Order Details</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="order_date">Order Date *</Label>
                <Input
                  id="order_date"
                  type="date"
                  value={formData.order_date}
                  onChange={(e) => handleChange('order_date', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="delivery_date">Delivery Date (Optional)</Label>
                <Input
                  id="delivery_date"
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => handleChange('delivery_date', e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm">
              <p className="text-blue-900 dark:text-blue-100">
                The sales order will be created with all line items from this quotation. 
                Customer, currency, and remarks will be copied automatically.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={converting}>
              Cancel
            </Button>
            <Button type="submit" disabled={converting}>
              {converting ? 'Converting...' : 'Convert to Sales Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
