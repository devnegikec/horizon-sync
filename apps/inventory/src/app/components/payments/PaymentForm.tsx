import { useState, useEffect, useCallback, useMemo, memo } from 'react';

import { useQuery } from '@tanstack/react-query';
import { FileText, AlertCircle } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardContent,
  Checkbox,
} from '@horizon-sync/ui/components';

import { useOutstandingInvoicesForAllocation } from '../../hooks/useOutstandingInvoicesForAllocation';
import { usePaymentValidation, type PaymentFormData } from '../../hooks/usePaymentValidation';
import type { CustomerResponse } from '../../types/customer.types';
import type { PaymentType, PaymentMode, CreatePaymentPayload, UpdatePaymentPayload, InvoiceForAllocation } from '../../types/payment.types';
import type { SuppliersResponse } from '../../types/supplier.types';
import { supplierApi } from '../../utility/api';
import { customerApi } from '../../utility/api';
import { apiRequest } from '../../utility/api/core';
import { toDateInputValue } from '../../utils/payment.utils';

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  is_active: boolean;
}

interface BankAccountListResponse {
  items: BankAccount[];
  total: number;
}

interface PaymentFormProps {
  initialData?: Partial<CreatePaymentPayload>;
  preselectedInvoiceId?: string | null;
  onSubmit: (data: CreatePaymentPayload | UpdatePaymentPayload) => void;
  onCancel: () => void;
  loading?: boolean;
  mode: 'create' | 'edit';
}

function getAccessTokenForApi(): string | null {
  const fromStore = useUserStore.getState().accessToken;
  if (fromStore) return fromStore;
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
}

export const PaymentForm = memo(function PaymentForm({ initialData, preselectedInvoiceId, onSubmit, onCancel, loading, mode }: PaymentFormProps) {
  const accessTokenFromStore = useUserStore((s) => s.accessToken);
  const accessToken = accessTokenFromStore ?? getAccessTokenForApi();

  const normalizedDate = initialData?.payment_date
    ? toDateInputValue(initialData.payment_date) || new Date().toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<PaymentFormData>({
    payment_type: initialData?.payment_type,
    party_id: initialData?.party_id,
    amount: initialData?.amount,
    currency_code: initialData?.currency_code || 'USD',
    payment_date: normalizedDate,
    payment_mode: initialData?.payment_mode,
    reference_no: initialData?.reference_no,
    bank_account_id: initialData?.bank_account_id,
  });

  // Allocation state (only for create mode)
  const [allocationType, setAllocationType] = useState<'single' | 'multiple'>(
    preselectedInvoiceId ? 'single' : 'multiple'
  );
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(
    preselectedInvoiceId ? new Set([preselectedInvoiceId]) : new Set()
  );
  const [allocationAmounts, setAllocationAmounts] = useState<Record<string, number>>({});

  // Fetch outstanding invoices for allocation
  const { invoices: outstandingInvoices, loading: invoicesLoading } = useOutstandingInvoicesForAllocation(
    formData.party_id || null,
    formData.payment_type || 'Customer_Payment'
  );

  const {
    data: customersData,
    error: customersError,
    isFetching: customersLoading,
  } = useQuery<CustomerResponse>({
    queryKey: ['customers-list-payment', accessToken ?? ''],
    queryFn: () => customerApi.list(accessToken || '', 1, 100) as Promise<CustomerResponse>,
    enabled: !!accessToken && mode === 'create',
    staleTime: 60_000,
    retry: 1,
  });
  const {
    data: suppliersData,
    error: suppliersError,
    isFetching: suppliersLoading,
  } = useQuery<SuppliersResponse>({
    queryKey: ['suppliers-list-payment', accessToken ?? ''],
    queryFn: () => supplierApi.list(accessToken || '', 1, 100) as Promise<SuppliersResponse>,
    enabled: !!accessToken && mode === 'create',
    staleTime: 60_000,
    retry: 1,
  });

  // Fetch active bank accounts for Bank_Transfer payment mode
  const {
    data: bankAccountsData,
    error: bankAccountsError,
    isFetching: bankAccountsLoading,
  } = useQuery<BankAccountListResponse>({
    queryKey: ['bank-accounts-active', accessToken ?? ''],
    queryFn: () => apiRequest<BankAccountListResponse>('/bank-accounts', accessToken || '', {
      params: { is_active: true }
    }),
    enabled: !!accessToken,
    staleTime: 60_000,
    retry: 1,
  });

  const bankAccounts = bankAccountsData?.items ?? [];

  const customers = customersData?.customers ?? [];
  const suppliers = suppliersData?.suppliers ?? [];
  const partyLoadError = formData.payment_type === 'Customer_Payment' ? customersError : suppliersError;
  const partyLoading = formData.payment_type === 'Customer_Payment' ? customersLoading : suppliersLoading;

  const { errors, isValid } = usePaymentValidation(formData, mode);

  const selectedPartyDetails = useMemo(() => {
    if (!formData.party_id) return null;
    if (formData.payment_type === 'Customer_Payment') {
      const c = customers.find((x) => x.id === formData.party_id);
      return c ? { name: c.customer_name, code: c.customer_code, email: c.email, phone: c.phone } : null;
    }
    if (formData.payment_type === 'Supplier_Payment') {
      const s = suppliers.find((x) => x.id === formData.party_id);
      return s ? { name: s.supplier_name, code: s.supplier_code, email: s.email, phone: s.phone } : null;
    }
    return null;
  }, [formData.party_id, formData.payment_type, customers, suppliers]);

  const requiresReferenceNo = 
    formData.payment_mode === 'Check' || formData.payment_mode === 'Bank_Transfer';

  useEffect(() => {
    if (!requiresReferenceNo) {
      setFormData((prev) => ({ ...prev, reference_no: undefined }));
    }
  }, [requiresReferenceNo]);

  // Sync form when initialData changes (for both edit and create modes)
  useEffect(() => {
    if (initialData) {
      const dateVal = initialData.payment_date 
        ? toDateInputValue(initialData.payment_date) || new Date().toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      setFormData({
        payment_type: initialData.payment_type,
        party_id: initialData.party_id,
        amount: initialData.amount,
        currency_code: initialData.currency_code || 'USD',
        payment_date: dateVal,
        payment_mode: initialData.payment_mode,
        reference_no: initialData.reference_no,
        bank_account_id: initialData.bank_account_id,
      });
    }
  }, [initialData?.payment_date, initialData?.amount, initialData?.payment_mode, initialData?.reference_no, initialData?.currency_code, initialData?.party_id, initialData?.payment_type]);

  // Backend expects ISO datetime (e.g. with "T"), not date-only "YYYY-MM-DD"
  const toPaymentDateTime = useCallback((dateStr: string): string => {
    if (!dateStr) return dateStr;
    if (/^\d{4}-\d{2}-\d{2}T/.test(dateStr)) return dateStr; // already ISO datetime
    return `${dateStr}T00:00:00.000Z`;
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const amount =
      typeof formData.amount === 'string' ? parseFloat(formData.amount) : formData.amount;
    const paymentDateTime = toPaymentDateTime(formData.payment_date!);

    if (mode === 'create') {
      const payload: CreatePaymentPayload = {
        payment_type: formData.payment_type!,
        party_id: formData.party_id!,
        amount: amount as number,
        currency_code: formData.currency_code!,
        payment_date: paymentDateTime,
        payment_mode: formData.payment_mode!,
        reference_no: formData.reference_no,
        ...(formData.payment_mode === 'Bank_Transfer' && { bank_account_id: formData.bank_account_id }),
      };
      onSubmit(payload);
    } else {
      const payload: UpdatePaymentPayload = {
        amount: amount as number,
        payment_date: paymentDateTime,
        payment_mode: formData.payment_mode!,
        reference_no: formData.reference_no ?? undefined,
      };
      onSubmit(payload);
    }
  }, [isValid, formData, mode, onSubmit, toPaymentDateTime]);

  const handlePaymentTypeChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, payment_type: value as PaymentType, party_id: undefined }));
  }, []);

  const handlePartySelect = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, party_id: value }));
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

  const handleBankAccountChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, bank_account_id: value }));
  }, []);

  // Allocation handlers
  const handleAllocationTypeChange = useCallback((value: string) => {
    setAllocationType(value as 'single' | 'multiple');
    if (value === 'single' && preselectedInvoiceId) {
      setSelectedInvoices(new Set([preselectedInvoiceId]));
    } else {
      setSelectedInvoices(new Set());
    }
    setAllocationAmounts({});
  }, [preselectedInvoiceId]);

  const handleInvoiceToggle = useCallback((invoiceId: string, checked: boolean) => {
    setSelectedInvoices(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(invoiceId);
      } else {
        newSet.delete(invoiceId);
        setAllocationAmounts(amounts => {
          const { [invoiceId]: _, ...rest } = amounts;
          return rest;
        });
      }
      return newSet;
    });
  }, []);

  const handleAllocationAmountChange = useCallback((invoiceId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setAllocationAmounts(prev => ({ ...prev, [invoiceId]: numValue }));
  }, []);

  const totalAllocated = useMemo(() => {
    return Object.values(allocationAmounts).reduce((sum, amt) => sum + amt, 0);
  }, [allocationAmounts]);

  const showAllocationSection = mode === 'create' && formData.party_id && outstandingInvoices.length > 0;

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
      {mode === 'create' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="payment_type">Payment Type *</Label>
            <Select value={formData.payment_type ?? ''}
              onValueChange={handlePaymentTypeChange}>
              <SelectTrigger id="payment_type">
                <SelectValue placeholder="Select payment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Customer_Payment">Customer Payment</SelectItem>
                <SelectItem value="Supplier_Payment">Supplier Payment</SelectItem>
              </SelectContent>
            </Select>
            {errors.payment_type && (
              <p className="text-sm text-destructive">{errors.payment_type}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="party_id">Party *</Label>
            <Select value={formData.party_id ?? ''}
              onValueChange={handlePartySelect}
              disabled={!formData.payment_type || partyLoading}>
              <SelectTrigger id="party_id">
                <SelectValue placeholder={
                    !formData.payment_type
                      ? 'Select payment type first'
                      : partyLoading
                        ? 'Loading…'
                        : formData.payment_type === 'Customer_Payment'
                          ? 'Select customer'
                          : 'Select supplier'
                  }/>
              </SelectTrigger>
              <SelectContent>
                {formData.payment_type === 'Customer_Payment' &&
                  customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.customer_code ? `${c.customer_name} (${c.customer_code})` : c.customer_name}
                    </SelectItem>
                  ))}
                {formData.payment_type === 'Supplier_Payment' &&
                  suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.supplier_code ? `${s.supplier_name} (${s.supplier_code})` : s.supplier_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {partyLoadError && (
              <p className="text-sm text-destructive">
                {formData.payment_type === 'Customer_Payment'
                  ? 'Failed to load customers. Check your connection and try again.'
                  : 'Failed to load suppliers. Check your connection and try again.'}
              </p>
            )}
            {selectedPartyDetails && (
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                <p className="font-medium text-foreground">{selectedPartyDetails.name}</p>
                {(selectedPartyDetails.email || selectedPartyDetails.phone) && (
                  <p className="text-muted-foreground mt-0.5">
                    {[selectedPartyDetails.email, selectedPartyDetails.phone].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            )}
            {errors.party_id && (
              <p className="text-sm text-destructive">{errors.party_id}</p>
            )}
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="amount">Amount *</Label>
        <Input id="amount"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={formData.amount || ''}
          onChange={handleAmountChange}/>
        {errors.amount && (
          <p className="text-sm text-destructive">{errors.amount}</p>
        )}
      </div>

      {/* Allocation Section */}
      {showAllocationSection && (
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Invoice Allocation</Label>
                {totalAllocated > 0 && (
                  <span className="text-sm text-muted-foreground">
                    Allocated: {formData.currency_code} {totalAllocated.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input type="radio"
                    id="single"
                    name="allocationType"
                    value="single"
                    checked={allocationType === 'single'}
                    onChange={(e) => handleAllocationTypeChange(e.target.value)}
                    className="h-4 w-4 cursor-pointer"/>
                  <Label htmlFor="single" className="font-normal cursor-pointer">
                    Single Invoice {preselectedInvoiceId && '(Pre-selected)'}
                  </Label>
                </div>
                <div className="flex items-center space-x-3">
                  <input type="radio"
                    id="multiple"
                    name="allocationType"
                    value="multiple"
                    checked={allocationType === 'multiple'}
                    onChange={(e) => handleAllocationTypeChange(e.target.value)}
                    className="h-4 w-4 cursor-pointer"/>
                  <Label htmlFor="multiple" className="font-normal cursor-pointer">
                    Multiple Invoices
                  </Label>
                </div>
              </div>

              {invoicesLoading ? (
                <div className="text-sm text-muted-foreground py-4">Loading invoices...</div>
              ) : outstandingInvoices.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <AlertCircle className="h-4 w-4" />
                  <span>No outstanding invoices found for this party</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-3">
                  {allocationType === 'single' ? (
                    // Single invoice selection
                    <div className="space-y-2">
                      {outstandingInvoices.map((invoice) => {
                        const isSelected = selectedInvoices.has(invoice.id);
                        return (
                          <div key={invoice.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded border">
                            <div className="flex items-center space-x-3 flex-1">
                              <input type="radio"
                                id={`invoice-${invoice.id}`}
                                name="singleInvoice"
                                value={invoice.id}
                                checked={isSelected}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  const value = e.target.value;
                                  setSelectedInvoices(new Set([value]));
                                  const selectedInvoice = outstandingInvoices.find(inv => inv.id === value);
                                  if (selectedInvoice) {
                                    setAllocationAmounts({ [value]: selectedInvoice.balance_due });
                                    setFormData(prev => ({ ...prev, amount: selectedInvoice.balance_due }));
                                  }
                                }}
                                className="h-4 w-4 cursor-pointer"/>
                              <Label htmlFor={`invoice-${invoice.id}`} className="flex items-center gap-2 cursor-pointer flex-1">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{invoice.invoice_no}</p>
                                  <p className="text-xs text-muted-foreground">{invoice.invoice_date}</p>
                                </div>
                              </Label>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">
                                {invoice.currency} {invoice.balance_due.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">Due</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Multiple invoice selection with allocation amounts
                    <div className="space-y-2">
                      {outstandingInvoices.map((invoice) => {
                        const isSelected = selectedInvoices.has(invoice.id);
                        return (
                          <div key={invoice.id} className="border rounded-md p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 flex-1">
                                <Checkbox id={`invoice-multi-${invoice.id}`}
                                  checked={isSelected}
                                  onCheckedChange={(checked) => handleInvoiceToggle(invoice.id, checked as boolean)}/>
                                <Label htmlFor={`invoice-multi-${invoice.id}`} className="flex items-center gap-2 cursor-pointer flex-1">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{invoice.invoice_no}</p>
                                    <p className="text-xs text-muted-foreground">{invoice.invoice_date}</p>
                                  </div>
                                </Label>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold">
                                  {invoice.currency} {invoice.balance_due.toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground">Due</p>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="pl-9">
                                <Label htmlFor={`amount-${invoice.id}`} className="text-xs text-muted-foreground">
                                  Allocation Amount
                                </Label>
                                <Input id={`amount-${invoice.id}`}
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={allocationAmounts[invoice.id] || ''}
                                  onChange={(e) => handleAllocationAmountChange(invoice.id, e.target.value)}
                                  className="mt-1"/>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        <Label htmlFor="currency_code">Currency *</Label>
        <Input id="currency_code"
          placeholder="USD"
          maxLength={3}
          value={formData.currency_code || ''}
          onChange={handleCurrencyChange}/>
        {errors.currency_code && (
          <p className="text-sm text-destructive">{errors.currency_code}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment_date">Payment Date *</Label>
        <Input id="payment_date"
          type="date"
          value={formData.payment_date || ''}
          onChange={handleDateChange}/>
        {errors.payment_date && (
          <p className="text-sm text-destructive">{errors.payment_date}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment_mode">Payment Mode *</Label>
        <Select value={formData.payment_mode ?? ''}
          onValueChange={handlePaymentModeChange}>
          <SelectTrigger id="payment_mode">
            <SelectValue placeholder="Select payment mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Cash">Cash</SelectItem>
            <SelectItem value="Check">Check</SelectItem>
            <SelectItem value="Bank_Transfer">Bank Transfer</SelectItem>
          </SelectContent>
        </Select>
        {errors.payment_mode && (
          <p className="text-sm text-destructive">{errors.payment_mode}</p>
        )}
      </div>

      {formData.payment_mode === 'Bank_Transfer' && (
        <div className="space-y-2">
          <Label htmlFor="bank_account_id">Bank Account *</Label>
          <Select value={formData.bank_account_id ?? ''}
            onValueChange={handleBankAccountChange}
            disabled={bankAccountsLoading}>
            <SelectTrigger id="bank_account_id">
              <SelectValue placeholder={
                  bankAccountsLoading
                    ? 'Loading bank accounts...'
                    : bankAccounts.length === 0
                      ? 'No active bank accounts available'
                      : 'Select bank account'
                }/>
            </SelectTrigger>
            <SelectContent>
              {bankAccounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.bank_name} - ****{account.account_number.slice(-4)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {bankAccountsError && (
            <p className="text-sm text-destructive">
              Failed to load bank accounts. Check your connection and try again.
            </p>
          )}
          {errors.bank_account_id && (
            <p className="text-sm text-destructive">{errors.bank_account_id}</p>
          )}
        </div>
      )}

      {requiresReferenceNo && (
        <div className="space-y-2">
          <Label htmlFor="reference_no">Reference Number *</Label>
          <Input id="reference_no"
            placeholder="Enter check number or transaction reference"
            value={formData.reference_no || ''}
            onChange={handleReferenceChange}/>
          {errors.reference_no && (
            <p className="text-sm text-destructive">{errors.reference_no}</p>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <button type="button"
          disabled={!isValid || loading}
          onClick={(e) => {
            e.preventDefault();
            handleSubmit(e as unknown as React.FormEvent);
          }}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 disabled:pointer-events-none disabled:opacity-50">
          {loading ? 'Saving...' : mode === 'create' ? 'Capture Payment' : 'Update Payment'}
        </button>
      </div>
    </form>
  );
});
