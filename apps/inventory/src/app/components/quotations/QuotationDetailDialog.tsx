import * as React from 'react';
import { Edit, FileText, Mail } from 'lucide-react';

import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Separator } from '@horizon-sync/ui/components';

import type { Quotation } from '../../types/quotation.types';
import { EmailComposer } from '../common/EmailComposer';
import { StatusBadge } from './StatusBadge';
import { LineItemTable } from './LineItemTable';

interface QuotationDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: Quotation | null;
  onEdit: (quotation: Quotation) => void;
  onConvert: (quotation: Quotation) => void;
}

export function QuotationDetailDialog({ open, onOpenChange, quotation, onEdit, onConvert }: QuotationDetailDialogProps) {
  const [emailDialogOpen, setEmailDialogOpen] = React.useState(false);
  
  if (!quotation) return null;

  const isTerminalStatus = quotation.status === 'accepted' || quotation.status === 'rejected' || quotation.status === 'expired';
  const canConvert = quotation.status === 'accepted';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <FileText className="h-5 w-5" />
              Quotation Details
            </DialogTitle>
            <StatusBadge status={quotation.status} />
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Quotation Number</p>
              <p className="text-lg font-semibold">{quotation.quotation_no}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="text-lg font-semibold">{quotation.customer_name || quotation.customer?.customer_name || 'N/A'}</p>
            </div>
          </div>

          {/* Dates and Currency */}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Quotation Date</p>
              <p className="font-medium">{formatDate(quotation.quotation_date)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valid Until</p>
              <p className="font-medium">{formatDate(quotation.valid_until)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Currency</p>
              <p className="font-medium">{quotation.currency}</p>
            </div>
          </div>

          {/* Grand Total */}
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Grand Total</span>
              <span className="text-2xl font-bold">{quotation.currency} {Number(quotation.grand_total).toFixed(2)}</span>
            </div>
          </div>

          {/* Line Items */}
          <Separator />
          <div>
            <h3 className="text-lg font-medium mb-4">Line Items</h3>
            {(() => {
              const lineItems = quotation.items || quotation.line_items || [];
              return lineItems.length > 0 ? (
                <LineItemTable 
                  items={lineItems.map(item => ({
                    item_id: item.item_name || item.item_id,
                    qty: Number(item.qty),
                    uom: item.uom,
                    rate: Number(item.rate),
                    amount: Number(item.amount),
                    sort_order: item.sort_order,
                  }))} 
                  onItemsChange={() => {}} 
                  readonly 
                />
              ) : (
                <p className="text-sm text-muted-foreground">No line items</p>
              );
            })()}
          </div>

          {/* Remarks */}
          {quotation.remarks && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Remarks</p>
              <p className="text-sm">{quotation.remarks}</p>
            </div>
          )}

          {/* Timestamps */}
          <Separator />
          <div className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
            <div>
              <p>Created: {formatDate(quotation.created_at)}</p>
            </div>
            {quotation.updated_at && (
              <div>
                <p>Updated: {formatDate(quotation.updated_at)}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button variant="outline" onClick={() => setEmailDialogOpen(true)} className="gap-2">
            <Mail className="h-4 w-4" />
            Send Email
          </Button>
          {canConvert && (
            <Button variant="default" onClick={() => onConvert(quotation)} className="gap-2">
              <FileText className="h-4 w-4" />
              Convert to Sales Order
            </Button>
          )}
          {!isTerminalStatus && (
            <Button variant="default" onClick={() => onEdit(quotation)} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <EmailComposer
      open={emailDialogOpen}
      onOpenChange={setEmailDialogOpen}
      docType="quotation"
      docId={quotation.id}
      docNo={quotation.quotation_no}
      defaultRecipient={quotation.customer?.email || ''}
      defaultSubject={`Quotation ${quotation.quotation_no}`}
      defaultMessage={`Dear ${quotation.customer_name || quotation.customer?.customer_name || 'Customer'},\n\nPlease find attached quotation ${quotation.quotation_no} for your review.\n\nBest regards`}
      onSuccess={() => {
        setEmailDialogOpen(false);
      }}
    />
  </>
  );
}
