import type { PaymentReference } from '../types/payment.types';

/**
 * Calculate unallocated amount from payment amount and allocations.
 * Coerces amounts to number (API may return string from Decimal).
 */
export function calculateUnallocatedAmount(
  paymentAmount: number,
  allocations: PaymentReference[]
): number {
  const totalAllocated = allocations.reduce(
    (sum, allocation) => sum + Number(allocation.allocated_amount ?? 0),
    0
  );
  return paymentAmount - totalAllocated;
}

/**
 * Validation result for allocation
 */
export interface AllocationValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate allocation amount against constraints
 */
export function validateAllocation(
  allocationAmount: number,
  paymentUnallocatedAmount: number,
  invoiceOutstandingBalance: number
): AllocationValidationResult {
  const errors: string[] = [];

  if (allocationAmount <= 0) {
    errors.push('Allocation amount must be greater than 0');
  }

  const paymentUnallocated = Number(paymentUnallocatedAmount);
  const invoiceOutstanding = Number(invoiceOutstandingBalance);
  if (allocationAmount > paymentUnallocated) {
    errors.push(
      `Allocation amount cannot exceed unallocated payment amount (${paymentUnallocated.toFixed(2)})`
    );
  }

  if (allocationAmount > invoiceOutstanding) {
    errors.push(
      `Allocation amount cannot exceed invoice outstanding balance (${invoiceOutstanding.toFixed(2)})`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format allocation amount for display.
 * Coerces amount to number (API may return string from Decimal).
 */
export function formatAllocationAmount(amount: number | string | null | undefined, currencyCode: string): string {
  const n = Number(amount ?? 0);
  return `${currencyCode} ${Number.isNaN(n) ? '0.00' : n.toFixed(2)}`;
}
