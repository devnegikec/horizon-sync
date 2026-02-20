import * as React from 'react';
import { Edit, FileText } from 'lucide-react';

import { Badge, Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Separator } from '@horizon-sync/ui/components';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@horizon-sync/ui/components/ui/table';

import type { RFQ, RFQListItem, RFQStatus } from '../../types/rfq.types';
import { formatDate } from '../../utility/formatDate';

interface RFQDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rfq: RFQ | null;
  onEdit: (rfq: RFQListItem) => void;
}

const STATUS_COLORS: Record<RFQStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  partially_responded: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  fully_responded: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  closed: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};

export function RFQDetailDialog({
  open,
  onOpenChange,
  rfq,
  onEdit,
}: RFQDetailDialogProps) {
  if (!rfq) return null;

  const canEdit = rfq.status === 'draft';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <FileText className="h-5 w-5" />
              RFQ Details
            </DialogTitle>
            <Badge variant="secondary" className={STATUS_COLORS[rfq.status]}>
              {rfq.status.replace(/_/g, ' ')}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">RFQ ID</p>
              <p className="text-lg font-semibold font-mono">RFQ-{rfq.id.slice(0, 8)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Material Request ID</p>
              <p className="text-lg font-semibold font-mono">
                {rfq.material_request_id ? rfq.material_request_id.slice(0, 8) : 'N/A'}
              </p>
            </div>
          </div>

          {/* Dates */}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Closing Date</p>
              <p className="font-medium">{formatDate(rfq.closing_date, 'DD-MMM-YY')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created Date</p>
              <p className="font-medium">{formatDate(rfq.created_at, 'DD-MMM-YY')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-medium">{formatDate(rfq.updated_at, 'DD-MMM-YY')}</p>
            </div>
          </div>

          {/* Suppliers */}
          <div>
            <p className="text-sm text-muted-foreground mb-2">Suppliers</p>
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium">{rfq.suppliers?.length || 0} suppliers selected</p>
              {rfq.suppliers && rfq.suppliers.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {rfq.suppliers.map((supplier) => (
                    <Badge key={supplier.id} variant="outline">
                      {supplier.supplier_id.slice(0, 8)}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Line Items */}
          <Separator />
          <div>
            <h3 className="text-lg font-medium mb-4">Line Items</h3>
            {rfq.line_items && rfq.line_items.length > 0 ? (
              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Item ID</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Required Date</TableHead>
                        <TableHead>Quotes</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rfq.line_items.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-mono text-sm">{item.item_id.slice(0, 8)}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatDate(item.required_date, 'DD-MMM-YY')}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {item.quotes?.length || 0} quotes
                            </Badge>
                          </TableCell>
                          <TableCell>{item.description || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No line items found</p>
            )}
          </div>

          {/* Quotes Summary */}
          {rfq.line_items && rfq.line_items.some(item => item.quotes && item.quotes.length > 0) && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-medium mb-4">Quotes Summary</h3>
                <div className="space-y-4">
                  {rfq.line_items.map((item) => {
                    if (!item.quotes || item.quotes.length === 0) return null;
                    return (
                      <div key={item.id} className="rounded-lg border p-4">
                        <p className="text-sm font-medium mb-2">
                          Item: {item.item_id.slice(0, 8)} ({item.quantity} units)
                        </p>
                        <div className="space-y-2">
                          {item.quotes.map((quote) => (
                            <div key={quote.id} className="flex justify-between items-center text-sm border-t pt-2">
                              <div>
                                <p className="font-medium">Supplier: {quote.supplier_id.slice(0, 8)}</p>
                                <p className="text-muted-foreground">
                                  Delivery: {formatDate(quote.quoted_delivery_date, 'DD-MMM-YY')}
                                </p>
                                {quote.supplier_notes && (
                                  <p className="text-xs text-muted-foreground mt-1">{quote.supplier_notes}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">${quote.quoted_price.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground">per unit</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {canEdit && (
            <Button 
              variant="default" 
              onClick={() => {
                // Convert RFQ to RFQListItem for onEdit
                const rfqListItem: RFQListItem = {
                  id: rfq.id,
                  organization_id: rfq.organization_id,
                  material_request_id: rfq.material_request_id,
                  status: rfq.status,
                  closing_date: rfq.closing_date,
                  created_at: rfq.created_at,
                  created_by: rfq.created_by,
                  line_items_count: rfq.line_items?.length || 0,
                  suppliers_count: rfq.suppliers?.length || 0,
                };
                onEdit(rfqListItem);
              }} 
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit RFQ
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
