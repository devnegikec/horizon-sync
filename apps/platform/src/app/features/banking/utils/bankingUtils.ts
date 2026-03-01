import { BankAccount, PaymentTransaction } from '../types';

/**
 * Banking utility functions for data processing and business logic
 */

export const bankingUtils = {
    /**
     * Check if an account can process a payment of given amount
     */
    canProcessPayment: (account: BankAccount, amount: number): {
        allowed: boolean;
        reason?: string;
    } => {
        if (!account.is_active) {
            return { allowed: false, reason: 'Account is not active' };
        }

        if (account.daily_transfer_limit && amount > account.daily_transfer_limit) {
            return {
                allowed: false,
                reason: `Amount exceeds daily limit of ${account.daily_transfer_limit}`
            };
        }

        return { allowed: true };
    },

    /**
     * Calculate transfer fees (placeholder - would integrate with bank APIs)
     */
    calculateTransferFee: (fromAccount: BankAccount, toAccount: BankAccount, amount: number): number => {
        // Simplified fee calculation
        if (fromAccount.bank_name === toAccount.bank_name) {
            return 0; // No fee for same bank
        }

        // Different banks
        if (amount > 1000) {
            return 25; // High value transfer fee
        }

        return 5; // Standard transfer fee
    },

    /**
     * Determine if dual approval is required
     */
    requiresDualApproval: (account: BankAccount, amount: number): boolean => {
        if (account.requires_dual_approval) {
            return true;
        }

        // Large amounts always require approval
        if (amount > 10000) {
            return true;
        }

        return false;
    },

    /**
     * Get next working day (excludes weekends)
     */
    getNextWorkingDay: (date: Date = new Date()): Date => {
        const nextDay = new Date(date);
        nextDay.setDate(date.getDate() + 1);

        // Skip weekends
        while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
            nextDay.setDate(nextDay.getDate() + 1);
        }

        return nextDay;
    },

    /**
     * Estimate processing time for different transaction types
     */
    estimateProcessingTime: (transactionType: string): string => {
        switch (transactionType) {
            case 'ach':
                return '1-2 business days';
            case 'wire':
                return 'Same day';
            case 'transfer':
                return 'Instant';
            default:
                return '1 business day';
        }
    },

    /**
     * Generate unique reference number
     */
    generateReferenceNumber: (): string => {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `TXN-${timestamp}-${random}`.toUpperCase();
    },

    /**
     * Validate account for specific transaction type
     */
    validateAccountForTransaction: (account: BankAccount, transactionType: string): {
        valid: boolean;
        reason?: string;
    } => {
        if (!account.is_active) {
            return { valid: false, reason: 'Account is inactive' };
        }

        switch (transactionType) {
            case 'wire':
                if (!account.wire_transfer_enabled) {
                    return { valid: false, reason: 'Wire transfers not enabled for this account' };
                }
                break;
            case 'ach':
                if (!account.ach_enabled) {
                    return { valid: false, reason: 'ACH transfers not enabled for this account' };
                }
                break;
        }

        return { valid: true };
    },

    /**
     * Sort accounts by priority (primary first, then by name)
     */
    sortAccountsByPriority: (accounts: BankAccount[]): BankAccount[] => {
        return [...accounts].sort((a, b) => {
            if (a.is_primary && !b.is_primary) return -1;
            if (!a.is_primary && b.is_primary) return 1;
            return a.bank_name.localeCompare(b.bank_name);
        });
    },

    /**
     * Filter accounts by capabilities
     */
    filterAccountsByCapability: (
        accounts: BankAccount[],
        capability: 'wire' | 'ach' | 'online' | 'mobile'
    ): BankAccount[] => {
        return accounts.filter(account => {
            switch (capability) {
                case 'wire':
                    return account.wire_transfer_enabled;
                case 'ach':
                    return account.ach_enabled;
                case 'online':
                    return account.online_banking_enabled;
                case 'mobile':
                    return account.mobile_banking_enabled;
                default:
                    return true;
            }
        });
    }
};