import { useState, useEffect, useCallback, memo } from 'react';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components';
import { usePaymentValidation, type PaymentFormData } from '../../hooks/usePaymentValidation';
import type { PaymentType, PaymentMode, CreatePaymentPayload, UpdatePaymentPayload } from '../../types/payment.types';

interface PaymentFormProps {
  initialData?: Partial<CreatePaymentPayload>;
  onSubmit: (data: CreatePaymentPayload | UpdatePaymentPayload) => void;
  onCancel: () => void;
  loading?: boolean;
  mode: 'create' | 'edit';
}

export const PaymentForm = memo(function PaymentForm({ initialData, onSubmit, onCancel, loading, mode }: PaymentFormProps) {
  const [formData, setFormData] = useState<PaymentFormData>({
    payment_type: initialData?.payment_type,
    party_id: initialData?.party_id,
    amount: initialData?.amount,
    currency_code: initialData?.currency_code || 'USD',
    payment_date: initialData?.payment_date || new Date().toISOString().split('T')[0],
    payment_mode: initialData?.payment_mode,
    reference_no: initialData?.reference_no,
  });

  const { errors, isValid } = usePaymentValidation(formData);

  const requiresReferenceNo = 
    formData.payment_mode === 'Check' || formData.payment_mode === 'Bank_Transfer';

  useEffect(() => {
    if (!requiresReferenceNo) {
      setFormData((prev) => ({ ...prev, reference_no: undefined }));
    }
  }, [requiresReferenceNo]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const payload: any = {
      amount: typeof formData.amount === 'string' ? parseFloat(formData.amount) : formData.amount,
      currency_code: formData.currency_code,
      payment_date: formData.payment_date,
      payment_mode: formData.payment_mode,
      reference_no: formData.reference_no,
    };

    if (mode === 'create') {
      payload.payment_type = formData.payment_type;
      payload.party_id = formData.party_id;
    }

    onSubmit(payload);
  }, [isValid, formData, mode, onSubmit]);

  const handlePaymentTypeChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, payment_type: value as PaymentType }));
  }, []);

  const handlePartyIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, party_id: e.target.value }));
  }, []);

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, amount: e.target.value }));
  }, []);

  const handleCurrencyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, currency_code: e.target.value.toUpperCase() }));
  }, []);

  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, payment_date: e.target.value }));
  }, []);

  const handlePaymentModeChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, payment_mode: value as PaymentMode }));
  }, []);

  const handleReferenceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, reference_no: e.target.value }));
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === 'create' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="payment_type">Payment Type *</Label>
            <Select
              value={formData.payment_type}
              onValueChange={handlePaymentTypeChange}
            >
              <SelectTrigger id="payment_type">
                <SelectValue placeholder="Select payment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Customer_Payment">Customer Payment</SelectItem>
                <SelectItem value="Supplier_Payment">Supplier Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="party_id">Party *</Label>
            <Input
              id="party_id"
              placeholder="Enter party ID"
              value={formData.party_id || ''}
              onChange={handlePartyIdChange}
            />
            <p className="text-xs text-muted-foreground">
              Enter customer or supplier ID
            </p>
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="amount">Amount *</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={formData.amount || ''}
          onChange={handleAmountChange}
        />
        {errors.amount && (
          <p className="text-sm text-destructive">{errors.amount}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency_code">Currency *</Label>
        <Input
          id="currency_code"
          placeholder="USD"
          maxLength={3}
          value={formData.currency_code || ''}
          onChange={handleCurrencyChange}
        />
        {errors.currency_code && (
          <p className="text-sm text-destructive">{errors.currency_code}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment_date">Payment Date *</Label>
        <Input
          id="payment_date"
          type="date"
          value={formData.payment_date || ''}
          onChange={handleDateChange}
        />
        {errors.payment_date && (
          <p className="text-sm text-destructive">{errors.payment_date}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment_mode">Payment Mode *</Label>
        <Select
          value={formData.payment_mode}
          onValueChange={handlePaymentModeChange}
        >
          <SelectTrigger id="payment_mode">
            <SelectValue placeholder="Select payment mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Cash">Cash</SelectItem>
            <SelectItem value="Check">Check</SelectItem>
            <SelectItem value="Bank_Transfer">Bank Transfer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {requiresReferenceNo && (
        <div className="space-y-2">
          <Label htmlFor="reference_no">Reference Number *</Label>
          <Input
            id="reference_no"
            placeholder="Enter check number or transaction reference"
            value={formData.reference_no || ''}
            onChange={handleReferenceChange}
          />
          {errors.reference_no && (
            <p className="text-sm text-destructive">{errors.reference_no}</p>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={!isValid || loading}>
          {loading ? 'Saving...' : mode === 'create' ? 'Create Payment' : 'Update Payment'}
        </Button>
      </div>
    </form>
  );
});
