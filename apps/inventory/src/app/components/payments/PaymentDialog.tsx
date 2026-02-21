import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components';
import { PaymentForm } from './PaymentForm';
import { usePaymentActions } from '../../hooks/usePaymentActions';
import type { PaymentEntry, CreatePaymentPayload, UpdatePaymentPayload } from '../../types/payment.types';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment?: PaymentEntry | null;
  onSuccess: () => void;
}

export function PaymentDialog({ open, onOpenChange, payment, onSuccess }: PaymentDialogProps) {
  const { createPayment, updatePayment, loading } = usePaymentActions();
  const isEditMode = !!payment;

  const handleSubmit = async (data: CreatePaymentPayload | UpdatePaymentPayload) => {
    let result;

    if (isEditMode && payment) {
      result = await updatePayment(payment.id, data as UpdatePaymentPayload);
    } else {
      result = await createPayment(data as CreatePaymentPayload);
    }

    if (result) {
      onOpenChange(false);
      onSuccess();
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const initialData = payment
    ? {
        payment_type: payment.payment_type,
        party_id: payment.party_id,
        amount: payment.amount,
        currency_code: payment.currency_code,
        payment_date: payment.payment_date,
        payment_mode: payment.payment_mode,
        reference_no: payment.reference_no,
      }
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Payment' : 'Create New Payment'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update payment details. Only draft payments can be edited.'
              : 'Enter payment details to create a new payment entry.'}
          </DialogDescription>
        </DialogHeader>
        <PaymentForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          mode={isEditMode ? 'edit' : 'create'}
        />
      </DialogContent>
    </Dialog>
  );
}
