import { useMutation } from '@tanstack/react-query';
import { bankAccountService } from '../services';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

// Hook for validating banking details
export function useBankingValidation() {
    const { toast } = useToast();

    return useMutation({
        mutationFn: bankAccountService.validateBankingDetails,
        onError: (error) => {
            toast({
                title: 'Validation Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });
}

// Utility functions for client-side validation
export const bankingValidation = {
    validateIBAN: (iban: string): { valid: boolean; error?: string } => {
        if (!iban) return { valid: false, error: 'IBAN is required' };

        const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();

        // Basic format check
        if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(cleanIBAN)) {
            return { valid: false, error: 'Invalid IBAN format' };
        }

        // Length check (15-34 characters)
        if (cleanIBAN.length < 15 || cleanIBAN.length > 34) {
            return { valid: false, error: 'IBAN length must be between 15 and 34 characters' };
        }

        return { valid: true };
    },

    validateSWIFT: (swift: string): { valid: boolean; error?: string } => {
        if (!swift) return { valid: false, error: 'SWIFT code is required' };

        const cleanSWIFT = swift.replace(/\s/g, '').toUpperCase();

        // SWIFT format: 4 chars bank + 2 chars country + 2 chars location + optional 3 chars branch
        if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(cleanSWIFT)) {
            return { valid: false, error: 'Invalid SWIFT code format' };
        }

        return { valid: true };
    },

    validateRoutingNumber: (routingNumber: string): { valid: boolean; error?: string } => {
        if (!routingNumber) return { valid: false, error: 'Routing number is required' };

        const cleanRouting = routingNumber.replace(/[\s-]/g, '');

        // US routing number: 9 digits
        if (!/^[0-9]{9}$/.test(cleanRouting)) {
            return { valid: false, error: 'Routing number must be 9 digits' };
        }

        return { valid: true };
    },

    validateSortCode: (sortCode: string): { valid: boolean; error?: string } => {
        if (!sortCode) return { valid: false, error: 'Sort code is required' };

        const cleanSortCode = sortCode.replace(/[\s-]/g, '');

        // UK sort code: 6 digits
        if (!/^[0-9]{6}$/.test(cleanSortCode)) {
            return { valid: false, error: 'Sort code must be 6 digits' };
        }

        return { valid: true };
    },

    validateBSB: (bsb: string): { valid: boolean; error?: string } => {
        if (!bsb) return { valid: false, error: 'BSB number is required' };

        const cleanBSB = bsb.replace(/[\s-]/g, '');

        // Australian BSB: 6 digits
        if (!/^[0-9]{6}$/.test(cleanBSB)) {
            return { valid: false, error: 'BSB number must be 6 digits' };
        }

        return { valid: true };
    },

    formatIBAN: (iban: string): string => {
        const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();
        return cleanIBAN.replace(/.{4}/g, '$& ').trim();
    },

    formatAccountNumber: (accountNumber: string, maskLength = 4): string => {
        if (accountNumber.length <= maskLength) return accountNumber;

        const visiblePart = accountNumber.slice(-maskLength);
        const maskedPart = '*'.repeat(accountNumber.length - maskLength);

        return maskedPart + visiblePart;
    },
};