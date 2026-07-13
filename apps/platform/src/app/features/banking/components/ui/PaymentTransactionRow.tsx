import React from 'react';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { PaymentTransaction } from '../../types';
import { useCancelPayment, useApprovePayment } from '../../hooks';
import { CheckCircle, XCircle, Clock, MoreHorizontal } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@horizon-sync/ui/components/ui/dropdown-menu';

interface PaymentTransactionRowProps {
    payment: PaymentTransaction;
    showActions?: boolean;
}

export function PaymentTransactionRow({ payment, showActions = false }: PaymentTransactionRowProps) {
    const cancelPayment = useCancelPayment();
    const approvePayment = useApprovePayment();

    const getStatusIcon = () => {
        switch (payment.status) {
            case 'completed':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'failed':
            case 'cancelled':
                return <XCircle className="h-4 w-4 text-red-600" />;
            case 'pending':
            case 'processing':
            default:
                return <Clock className="h-4 w-4 text-yellow-600" />;
        }
    };

    const getStatusVariant = (): 'success' | 'warning' | 'destructive' | 'default' => {
        switch (payment.status) {
            case 'completed':
                return 'success';
            case 'failed':
            case 'cancelled':
                return 'destructive';
            case 'pending':
            case 'processing':
            default:
                return 'warning';
        }
    };

    const handleCancel = () => {
        if (window.confirm('Are you sure you want to cancel this payment?')) {
            cancelPayment.mutate(payment.id);
        }
    };

    const handleApprove = () => {
        if (window.confirm('Are you sure you want to approve this payment?')) {
            approvePayment.mutate(payment.id);
        }
    };

    return (
        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    {getStatusIcon()}
                    <Badge variant={getStatusVariant()}>
                        {payment.status}
                    </Badge>
                </div>

                <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{payment.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="capitalize">{payment.transaction_type}</span>
                        {payment.reference_number && (
                            <span>Ref: {payment.reference_number}</span>
                        )}
                        <span>
                            {payment.processed_date
                                ? new Date(payment.processed_date).toLocaleDateString()
                                : payment.scheduled_date
                                    ? `Scheduled: ${new Date(payment.scheduled_date).toLocaleDateString()}`
                                    : new Date(payment.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="font-semibold">
                        {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: payment.currency,
                        }).format(payment.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">{payment.currency}</p>
                </div>

                {showActions && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {payment.status === 'pending' && payment.approval_required && (
                                <DropdownMenuItem
                                    onClick={handleApprove}
                                    disabled={approvePayment.isPending}
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve Payment
                                </DropdownMenuItem>
                            )}
                            {['pending', 'processing'].includes(payment.status) && (
                                <DropdownMenuItem
                                    onClick={handleCancel}
                                    disabled={cancelPayment.isPending}
                                    className="text-red-600"
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancel Payment
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                                View Details
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
    );
}