import { useState, useMemo, useCallback, memo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { AlertCircle } from 'lucide-react';
import {
  DataTable,
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from '@horizon-sync/ui/components';
import { formatCurrency, formatDate } from '../../utils/payment.utils';
import { calculateUnallocatedAmount, validateAllocation } from '../../utils/allocation.utils';
import type { InvoiceForAllocation, PaymentReference } from '../../types/payment.types';

interface InvoiceLinkerProps {
  invoices: InvoiceForAllocation[];
  paymentAmount: number;
  paymentCurrency: string;
  existingAllocations: PaymentReference[];
  onSave: (allocations: Array<{ invoice_id: string; allocated_amount: number }>) => void;
  loading?: boolean;
}

interface AllocationInput {
  invoice_id: string;
  allocated_amount: string;
  error?: string;
}

// Memoize the allocation input cell to prevent unnecessary re-renders
const AllocationInputCell = memo(({ 
  invoiceId, 
  input, 
  onAllocationChange, 
  loading 
}: { 
  invoiceId: string;
  input: AllocationInput | undefined;
  onAllocationChange: (invoiceId: string, value: string) => void;
  loading: boolean;
}) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onAllocationChange(invoiceId, e.target.value);
  }, [invoiceId, onAllocationChange]);

  return (
    <div className="space-y-1">
      <Input
        type="number"
        step="0.01"
        placeholder="0.00"
        value={input?.allocated_amount || ''}
        onChange={handleChange}
        className={input?.error ? 'border-destructive' : ''}
        disabled={loading}
      />
      {input?.error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {input.error}
        </p>
      )}
    </div>
  );
});

AllocationInputCell.displayName = 'AllocationInputCell';

export const InvoiceLinker = memo(function InvoiceLinker({
  invoices,
  paymentAmount,
  paymentCurrency,
  existingAllocations,
  onSave,
  loading = false,
}: InvoiceLinkerProps) {
  const [allocationInputs, setAllocationInputs] = useState<Record<string, AllocationInput>>({});

  // Memoize unallocated amount calculation - this is expensive
  const unallocatedAmount = useMemo(() => {
    const existingTotal = calculateUnallocatedAmount(paymentAmount, existingAllocations);
    const inputTotal = Object.values(allocationInputs).reduce((sum, input) => {
      const amount = parseFloat(input.allocated_amount) || 0;
      return sum + amount;
    }, 0);
    return existingTotal - inputTotal;
  }, [paymentAmount, existingAllocations, allocationInputs]);

  const handleAllocationChange = useCallback(
    (invoiceId: string, value: string) => {
      const amount = parseFloat(value) || 0;
      const invoice = invoices.find((inv) => inv.id === invoiceId);

      if (!invoice) return;

      // Calculate unallocated amount excluding this input
      const otherInputsTotal = Object.entries(allocationInputs)
        .filter(([id]) => id !== invoiceId)
        .reduce((sum, [, input]) => sum + (parseFloat(input.allocated_amount) || 0), 0);
      const availableAmount = calculateUnallocatedAmount(paymentAmount, existingAllocations) - otherInputsTotal;

      // Validate allocation
      const validation = validateAllocation(amount, availableAmount, invoice.balance_due);

      setAllocationInputs((prev) => ({
        ...prev,
        [invoiceId]: {
          invoice_id: invoiceId,
          allocated_amount: value,
          error: validation.isValid ? undefined : validation.errors[0],
        },
      }));
    },
    [invoices, paymentAmount, existingAllocations, allocationInputs]
  );

  const handleSave = useCallback(() => {
    const allocations = Object.values(allocationInputs)
      .filter((input) => {
        const amount = parseFloat(input.allocated_amount);
        return amount > 0 && !input.error;
      })
      .map((input) => ({
        invoice_id: input.invoice_id,
        allocated_amount: parseFloat(input.allocated_amount),
      }));

    if (allocations.length > 0) {
      onSave(allocations);
      setAllocationInputs({});
    }
  }, [allocationInputs, onSave]);

  const hasValidAllocations = useMemo(() => {
    return Object.values(allocationInputs).some((input) => {
      const amount = parseFloat(input.allocated_amount);
      return amount > 0 && !input.error;
    });
  }, [allocationInputs]);

  const columns = useMemo<ColumnDef<InvoiceForAllocation>[]>(
    () => [
      {
        accessorKey: 'invoice_no',
        header: 'Invoice Number',
        cell: ({ row }) => <div className="font-medium">{row.original.invoice_no}</div>,
      },
      {
        accessorKey: 'invoice_date',
        header: 'Invoice Date',
        cell: ({ row }) => <div>{formatDate(row.original.invoice_date)}</div>,
      },
      {
        accessorKey: 'total_amount',
        header: 'Total Amount',
        cell: ({ row }) => (
          <div>{formatCurrency(row.original.total_amount, row.original.currency)}</div>
        ),
      },
      {
        accessorKey: 'balance_due',
        header: 'Outstanding',
        cell: ({ row }) => (
          <div className="font-medium text-orange-600">
            {formatCurrency(row.original.balance_due, row.original.currency)}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const statusColors: Record<string, string> = {
            Unpaid: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
            Partially_Paid: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
          };
          return (
            <Badge className={statusColors[row.original.status] || 'bg-gray-100 text-gray-800'}>
              {row.original.status.replace('_', ' ')}
            </Badge>
          );
        },
      },
      {
        id: 'allocated_amount',
        header: 'Allocate Amount',
        cell: ({ row }) => {
          const invoiceId = row.original.id;
          const input = allocationInputs[invoiceId];

          return (
            <AllocationInputCell
              invoiceId={invoiceId}
              input={input}
              onAllocationChange={handleAllocationChange}
              loading={loading}
            />
          );
        },
      },
    ],
    [allocationInputs, handleAllocationChange, loading]
  );

  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground text-center">
            No outstanding invoices found for this party.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Link Invoices</CardTitle>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Unallocated Amount</p>
            <p
              className={`text-lg font-bold ${
                unallocatedAmount < 0 ? 'text-destructive' : 'text-foreground'
              }`}
            >
              {formatCurrency(unallocatedAmount, paymentCurrency)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <DataTable columns={columns} data={invoices} />
        <div className="flex justify-end gap-3">
          <Button
            onClick={handleSave}
            disabled={!hasValidAllocations || unallocatedAmount < 0 || loading}
          >
            {loading ? 'Saving...' : 'Save Allocations'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
