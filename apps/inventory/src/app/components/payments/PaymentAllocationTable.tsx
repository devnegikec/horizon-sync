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

  // Keep draft string per invoice so user can type "1." or "0.5" without losing input
  const [draftAmounts, setDraftAmounts] = React.useState<Record<string, string>>({});

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

      const allocateAmount = Math.min(remainingAmount, Number(invoice.outstanding_amount ?? 0));
      newAllocations.push({
        invoice_id: invoice.id,
        allocated_amount: allocateAmount,
      });
      remainingAmount -= allocateAmount;
    }

    onAllocationsChange(newAllocations);
  };

  // Get allocation amount for an invoice (coerce to number; API may return string from Decimal)
  const getAllocationAmount = (invoiceId: string): number => {
    const allocation = allocations.find((a) => a.invoice_id === invoiceId);
    return Number(allocation?.allocated_amount ?? 0);
  };

  // Display value: draft string while typing, otherwise number (empty when 0)
  const getInputValue = (invoiceId: string): string => {
    if (draftAmounts[invoiceId] !== undefined) return draftAmounts[invoiceId];
    const amount = getAllocationAmount(invoiceId);
    return amount === 0 ? '' : String(amount);
  };

  const handleAmountChange = (invoiceId: string, raw: string) => {
    // Allow only digits and at most one decimal point
    let filtered = raw.replace(/[^\d.]/g, '');
    const parts = filtered.split('.');
    if (parts.length > 2) filtered = parts[0] + '.' + parts.slice(1).join('');
    setDraftAmounts((prev) => ({ ...prev, [invoiceId]: filtered }));
    const num = parseFloat(filtered);
    handleAllocationChange(invoiceId, Number.isNaN(num) ? 0 : num);
  };

  const handleAmountBlur = (invoiceId: string) => {
    setDraftAmounts((prev) => {
      const next = { ...prev };
      delete next[invoiceId];
      return next;
    });
  };

  // Check if invoice is selected
  const isInvoiceSelected = (invoiceId: string): boolean => {
    return allocations.some((a) => a.invoice_id === invoiceId);
  };

  // Calculate total allocated (coerce amounts to number; API may return string from Decimal)
  const totalAllocated = allocations.reduce((sum, a) => sum + Number(a.allocated_amount ?? 0), 0);
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
              const isOverAllocated = allocationAmount > Number(invoice.outstanding_amount ?? 0);
              
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
                    {currency} {Number(invoice.grand_total ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {currency} {Number(invoice.outstanding_amount ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={getInputValue(invoice.id)}
                      onChange={(e) => handleAmountChange(invoice.id, e.target.value)}
                      onBlur={() => handleAmountBlur(invoice.id)}
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
            Total Allocated: <span className="font-medium">{currency} {Number(totalAllocated).toFixed(2)}</span>
          </span>
          <span>
            Unallocated: <span className={`font-medium ${unallocated < 0 ? 'text-red-600' : ''}`}>
              {currency} {Number(unallocated).toFixed(2)}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
