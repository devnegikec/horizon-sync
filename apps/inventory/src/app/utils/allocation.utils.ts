import type { PaymentReference } from '../types/payment.types';

/**
 * Calculate unallocated amount from payment amount and allocations
 */
export function calculateUnallocatedAmount(
  paymentAmount: number,
  allocations: PaymentReference[]
): number {
  const totalAllocated = allocations.reduce(
    (sum, allocation) => sum + allocation.allocated_amount,
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

  if (allocationAmount > paymentUnallocatedAmount) {
    errors.push(
      `Allocation amount cannot exceed unallocated payment amount (${paymentUnallocatedAmount.toFixed(2)})`
    );
  }

  if (allocationAmount > invoiceOutstandingBalance) {
    errors.push(
      `Allocation amount cannot exceed invoice outstanding balance (${invoiceOutstandingBalance.toFixed(2)})`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format allocation amount for display
 */
export function formatAllocationAmount(amount: number, currencyCode: string): string {
  return `${currencyCode} ${amount.toFixed(2)}`;
}
