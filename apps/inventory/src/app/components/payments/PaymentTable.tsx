import { useMemo, useCallback, memo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Eye, Edit, CheckCircle, XCircle, Building2 } from 'lucide-react';
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
          const display =
            receiptNumber != null && String(receiptNumber).trim() !== ''
              ? receiptNumber
              : row.original.status === 'Draft'
                ? 'Draft'
                : '—';
          return <div className="font-medium">{display}</div>;
        },
      },
      {
        accessorKey: 'payment_date',
        header: 'Payment Date',
        cell: ({ row }) => <div>{formatDate(row.original.payment_date)}</div>,
      },
      {
        accessorKey: 'party_name',
        header: 'Customer',
        cell: ({ row }) => {
          const p = row.original;
          const name = p.party_name || p.party_id;
          const code = p.party_code;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate max-w-[180px]">{name}</p>
                {code && <code className="text-xs text-muted-foreground">{code}</code>}
              </div>
            </div>
          );
        },
      },
      {
        id: 'party_contact',
        header: 'Contact',
        cell: ({ row }) => {
          const p = row.original;
          const email = p.party_email;
          const phone = p.party_phone;
          if (!email && !phone) return <span className="text-muted-foreground">—</span>;
          return (
            <div className="text-sm">
              {email && <p className="truncate max-w-[200px]">{email}</p>}
              {phone && <p className="text-muted-foreground">{phone}</p>}
            </div>
          );
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
    return <TableSkeleton columns={8} rows={5} />;
  }

  return (
    <DataTable
      columns={columns}
      data={payments}
    />
  );
});
