import { usePaymentActions } from '../../hooks/usePaymentActions';
import type { PaymentEntry, CreatePaymentPayload, UpdatePaymentPayload } from '../../types/payment.types';
import { toDateInputValue } from '../../utils/payment.utils';
import { FormDialog } from '../containers';

import { PaymentForm } from './PaymentForm';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment?: PaymentEntry | null;
  initialData?: Partial<CreatePaymentPayload> | null;
  preselectedInvoiceId?: string | null;
  onSuccess: () => void;
}

export function PaymentDialog({ open, onOpenChange, payment, initialData, preselectedInvoiceId, onSuccess }: PaymentDialogProps) {
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

  const formInitialData = payment
    ? {
        payment_type: payment.payment_type,
        party_id: payment.party_id,
        amount: payment.amount,
        currency_code: payment.currency_code,
        payment_date: toDateInputValue(payment.payment_date),
        payment_mode: payment.payment_mode,
        reference_no: payment.reference_no,
        bank_account_id: payment.bank_account_id,
      }
    : initialData || undefined;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // PaymentForm handles its own submission via the form element
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditMode ? 'Edit Payment' : 'Capture Payment'}
      size="lg"
      saving={loading}
      footer={null}
    >
      <PaymentForm initialData={formInitialData}
        preselectedInvoiceId={preselectedInvoiceId}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
        mode={isEditMode ? 'edit' : 'create'}/>
    </FormDialog>
  );
}
