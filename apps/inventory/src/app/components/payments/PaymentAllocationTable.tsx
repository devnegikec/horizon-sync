import * as React from 'react';
import { useQuery } from '@tanstack/react-query';

import { useUserStore } from '@horizon-sync/store';
import {
  Button,
  Checkbox,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@horizon-sync/ui/components';
import { Loader2 } from 'lucide-react';

import type { PartyType, PaymentAllocationFormData } from '../../types/payment';
import type { OutstandingInvoice } from '../../types/payment';
import { paymentApi } from '../../api/payments';

interface PaymentAllocationTableProps {
  partyId: string | null;
  partyType: PartyType | null;
  currency: string;
  totalAmount: number;
  allocations: PaymentAllocationFormData[];
  onAllocationsChange: (allocations: PaymentAllocationFormData[]) => void;
  disabled?: boolean;
  preSelectedInvoiceId?: string;
}

export function PaymentAllocationTable({
  partyId,
  partyType,
  currency,
  totalAmount,
  allocations,
  onAllocationsChange,
  disabled = false,
  preSelectedInvoiceId,
}: PaymentAllocationTableProps) {
  const accessToken = useUserStore((s) => s.accessToken);

  // Fetch outstanding invoices for the selected party
  const { data: outstandingInvoices, isLoading } = useQuery<OutstandingInvoice[]>({
    queryKey: ['outstanding-invoices', partyId, partyType],
    queryFn: () => paymentApi.getOutstandingInvoices(accessToken || '', partyId || '', partyType || 'Customer'),
    enabled: !!accessToken && !!partyId && !!partyType,
  });

  const invoices = outstandingInvoices ?? [];

  // Handle allocation amount change
  const handleAllocationChange = (invoiceId: string, amount: number) => {
    const existingIndex = allocations.findIndex((a) => a.invoice_id === invoiceId);
    
    if (existingIndex >= 0) {
      // Update existing allocation
      const newAllocations = [...allocations];
      newAllocations[existingIndex] = {
        ...newAllocations[existingIndex],
        allocated_amount: amount,
      };
      onAllocationsChange(newAllocations);
    } else {
      // Add new allocation
      onAllocationsChange([
        ...allocations,
        { invoice_id: invoiceId, allocated_amount: amount },
      ]);
    }
  };

  // Handle invoice selection
  const handleInvoiceSelect = (invoiceId: string, selected: boolean) => {
    if (selected) {
      // Add allocation with 0 amount if not already present
      const existingAllocation = allocations.find((a) => a.invoice_id === invoiceId);
      if (!existingAllocation) {
        const invoice = invoices.find((inv) => inv.id === invoiceId);
        if (invoice) {
          onAllocationsChange([
            ...allocations,
            { invoice_id: invoiceId, allocated_amount: 0 },
          ]);
        }
      }
    } else {
      // Remove allocation
      onAllocationsChange(allocations.filter((a) => a.invoice_id !== invoiceId));
    }
  };

  // Auto-allocate button handler
  const handleAutoAllocate = () => {
    if (!invoices.length) return;

    // Sort invoices by due date (oldest first)
    const sortedInvoices = [...invoices].sort((a, b) => 
      new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    );

    let remainingAmount = totalAmount;
    const newAllocations: PaymentAllocationFormData[] = [];

    for (const invoice of sortedInvoices) {
      if (remainingAmount <= 0) break;

      const allocateAmount = Math.min(remainingAmount, invoice.outstanding_amount);
      newAllocations.push({
        invoice_id: invoice.id,
        allocated_amount: allocateAmount,
      });
      remainingAmount -= allocateAmount;
    }

    onAllocationsChange(newAllocations);
  };

  // Get allocation amount for an invoice
  const getAllocationAmount = (invoiceId: string): number => {
    const allocation = allocations.find((a) => a.invoice_id === invoiceId);
    return allocation?.allocated_amount ?? 0;
  };

  // Check if invoice is selected
  const isInvoiceSelected = (invoiceId: string): boolean => {
    return allocations.some((a) => a.invoice_id === invoiceId);
  };

  // Calculate total allocated
  const totalAllocated = allocations.reduce((sum, a) => sum + a.allocated_amount, 0);
  const unallocated = totalAmount - totalAllocated;

  if (!partyId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Invoice Allocations</h3>
        </div>
        <div className="text-sm text-muted-foreground text-center py-8">
          Please select a party to view outstanding invoices
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Invoice Allocations</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!invoices.length) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Invoice Allocations</h3>
        </div>
        <div className="text-sm text-muted-foreground text-center py-8">
          No outstanding invoices found for this party
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Invoice Allocations</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAutoAllocate}
          disabled={disabled || totalAmount <= 0}
        >
          Auto Allocate
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Select</TableHead>
              <TableHead>Invoice Number</TableHead>
              <TableHead>Posting Date</TableHead>
              <TableHead className="text-right">Grand Total</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead className="text-right">Allocated Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => {
              const allocationAmount = getAllocationAmount(invoice.id);
              const isSelected = isInvoiceSelected(invoice.id);
              const isOverAllocated = allocationAmount > invoice.outstanding_amount;
              
              return (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => 
                        handleInvoiceSelect(invoice.id, checked as boolean)
                      }
                      disabled={disabled || invoice.id === preSelectedInvoiceId}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {invoice.invoice_number}
                  </TableCell>
                  <TableCell>
                    {new Date(invoice.posting_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {currency} {invoice.grand_total.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {currency} {invoice.outstanding_amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={invoice.outstanding_amount}
                      value={allocationAmount}
                      onChange={(e) => 
                        handleAllocationChange(invoice.id, parseFloat(e.target.value) || 0)
                      }
                      disabled={disabled || !isSelected}
                      className={`w-32 text-right ${isOverAllocated ? 'border-red-500' : ''}`}
                    />
                    {isOverAllocated && (
                      <p className="text-xs text-red-600 mt-1">
                        Exceeds outstanding
                      </p>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">
          {allocations.length} invoice(s) selected
        </span>
        <div className="space-x-4">
          <span>
            Total Allocated: <span className="font-medium">{currency} {totalAllocated.toFixed(2)}</span>
          </span>
          <span>
            Unallocated: <span className={`font-medium ${unallocated < 0 ? 'text-red-600' : ''}`}>
              {currency} {unallocated.toFixed(2)}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
