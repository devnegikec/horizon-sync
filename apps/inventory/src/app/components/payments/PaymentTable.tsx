import { useMemo, useCallback, memo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Eye, Edit, CheckCircle, XCircle } from 'lucide-react';
import {
  DataTable,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  TableSkeleton,
} from '@horizon-sync/ui/components';
import { formatDate, getPaymentModeLabel } from '../../utils/payment.utils';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { PaymentAmountDisplay } from './PaymentAmountDisplay';
import type { PaymentEntry } from '../../types/payment.types';

interface PaymentTableProps {
  payments: PaymentEntry[];
  loading: boolean;
  error: string | null;
  onView: (payment: PaymentEntry) => void;
  onEdit: (payment: PaymentEntry) => void;
  onConfirm: (payment: PaymentEntry) => void;
  onCancel: (payment: PaymentEntry) => void;
}

// Memoize the actions cell component to prevent unnecessary re-renders
const PaymentActionsCell = memo(({ 
  payment, 
  onView, 
  onEdit, 
  onConfirm, 
  onCancel 
}: { 
  payment: PaymentEntry;
  onView: (payment: PaymentEntry) => void;
  onEdit: (payment: PaymentEntry) => void;
  onConfirm: (payment: PaymentEntry) => void;
  onCancel: (payment: PaymentEntry) => void;
}) => {
  const isDraft = payment.status === 'Draft';
  const isConfirmed = payment.status === 'Confirmed';

  const handleView = useCallback(() => onView(payment), [payment, onView]);
  const handleEdit = useCallback(() => onEdit(payment), [payment, onEdit]);
  const handleConfirm = useCallback(() => onConfirm(payment), [payment, onConfirm]);
  const handleCancel = useCallback(() => onCancel(payment), [payment, onCancel]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleView}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        {isDraft && (
          <>
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleConfirm}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirm
            </DropdownMenuItem>
          </>
        )}
        {isConfirmed && (
          <DropdownMenuItem 
            onClick={handleCancel}
            className="text-destructive"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancel
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

PaymentActionsCell.displayName = 'PaymentActionsCell';

export const PaymentTable = memo(function PaymentTable({
  payments,
  loading,
  error,
  onView,
  onEdit,
  onConfirm,
  onCancel,
}: PaymentTableProps) {
  const columns = useMemo<ColumnDef<PaymentEntry>[]>(
    () => [
      {
        accessorKey: 'receipt_number',
        header: 'Receipt Number',
        cell: ({ row }) => {
          const receiptNumber = row.original.receipt_number;
          return <div className="font-medium">{receiptNumber || '-'}</div>;
        },
      },
      {
        accessorKey: 'payment_date',
        header: 'Payment Date',
        cell: ({ row }) => <div>{formatDate(row.original.payment_date)}</div>,
      },
      {
        accessorKey: 'party_name',
        header: 'Party',
        cell: ({ row }) => {
          const partyDisplay = row.original.party_name || row.original.party_id;
          return <div className="max-w-[200px] truncate">{partyDisplay}</div>;
        },
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => (
          <PaymentAmountDisplay
            amount={row.original.amount}
            currencyCode={row.original.currency_code}
            className="font-medium"
          />
        ),
      },
      {
        accessorKey: 'payment_mode',
        header: 'Mode',
        cell: ({ row }) => <div>{getPaymentModeLabel(row.original.payment_mode)}</div>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <PaymentStatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <PaymentActionsCell
            payment={row.original}
            onView={onView}
            onEdit={onEdit}
            onConfirm={onConfirm}
            onCancel={onCancel}
          />
        ),
      },
    ],
    [onView, onEdit, onConfirm, onCancel]
  );

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (loading) {
    return <TableSkeleton columns={7} rows={5} />;
  }

  return (
    <DataTable
      columns={columns}
      data={payments}
    />
  );
});
