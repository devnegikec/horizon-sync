import { BankAccount, PaymentTransaction } from '../types';

/**
 * Formatting utilities for banking data display
 */

export const formatters = {
    /**
     * Currency formatting
     */
    currency: {
        format: (amount: number, currency: string = 'USD'): string => {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount);
        },

        formatCompact: (amount: number, currency: string = 'USD'): string => {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency,
                notation: 'compact',
                maximumFractionDigits: 1
            }).format(amount);
        },

        formatWithSymbol: (amount: number, currency: string = 'USD'): string => {
            const symbols = { USD: '$', EUR: '€', GBP: '£', CAD: 'C$' };
            const symbol = symbols[currency as keyof typeof symbols] || currency;
            return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        }
    },

    /**
     * Account number formatting
     */
    account: {
        maskAccountNumber: (accountNumber: string, visibleDigits: number = 4): string => {
            if (accountNumber.length <= visibleDigits) {
                return accountNumber;
            }

            const masked = '*'.repeat(accountNumber.length - visibleDigits);
            const visible = accountNumber.slice(-visibleDigits);
            return `${masked}${visible}`;
        },

        formatAccountDisplay: (account: BankAccount): string => {
            const masked = formatters.account.maskAccountNumber(account.account_number);
            return `${account.bank_name} - ${masked}`;
        },

        formatIBAN: (iban: string): string => {
            return iban.replace(/.{4}/g, '$& ').trim();
        },

        formatSortCode: (sortCode: string): string => {
            // Format UK sort code as XX-XX-XX
            if (sortCode.length === 6) {
                return `${sortCode.slice(0, 2)}-${sortCode.slice(2, 4)}-${sortCode.slice(4, 6)}`;
            }
            return sortCode;
        },

        formatRoutingNumber: (routingNumber: string): string => {
            // US routing numbers can be formatted as XXX-XXX-XXX
            if (routingNumber.length === 9) {
                return `${routingNumber.slice(0, 3)}-${routingNumber.slice(3, 6)}-${routingNumber.slice(6, 9)}`;
            }
            return routingNumber;
        }
    },

    /**
     * Date and time formatting
     */
    dateTime: {
        formatTransactionDate: (dateString: string): string => {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        },

        formatDateOnly: (dateString: string): string => {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        },

        formatTimeAgo: (dateString: string): string => {
            const date = new Date(dateString);
            const now = new Date();
            const diffInMs = now.getTime() - date.getTime();
            const diffInMinutes = Math.floor(diffInMs / 60000);
            const diffInHours = Math.floor(diffInMinutes / 60);
            const diffInDays = Math.floor(diffInHours / 24);

            if (diffInMinutes < 1) return 'Just now';
            if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
            if (diffInHours < 24) return `${diffInHours} hr ago`;
            if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

            return formatters.dateTime.formatDateOnly(dateString);
        },

        formatBusinessDays: (startDate: Date, businessDays: number): string => {
            const result = new Date(startDate);
            let addedDays = 0;

            while (addedDays < businessDays) {
                result.setDate(result.getDate() + 1);
                if (result.getDay() !== 0 && result.getDay() !== 6) { // Not weekend
                    addedDays++;
                }
            }

            return formatters.dateTime.formatDateOnly(result.toISOString());
        }
    },

    /**
     * Status and badge formatting
     */
    status: {
        getStatusColor: (status: string): string => {
            const colors = {
                completed: 'green',
                processing: 'blue',
                pending: 'yellow',
                failed: 'red',
                cancelled: 'gray',
                approved: 'green',
                rejected: 'red'
            };
            return colors[status as keyof typeof colors] || 'gray';
        },

        getStatusIcon: (status: string): string => {
            const icons = {
                completed: '✅',
                processing: '⏳',
                pending: '⏰',
                failed: '❌',
                cancelled: '🚫',
                approved: '👍',
                rejected: '👎'
            };
            return icons[status as keyof typeof icons] || '📄';
        },

        formatStatusText: (status: string): string => {
            return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
        }
    },

    /**
     * Transaction formatting
     */
    transaction: {
        formatTransactionSummary: (transaction: PaymentTransaction): string => {
            const amount = formatters.currency.format(transaction.amount, transaction.currency);
            const type = formatters.status.formatStatusText(transaction.transaction_type);
            return `${type} - ${amount}`;
        },

        formatTransactionDescription: (transaction: PaymentTransaction, maxLength: number = 50): string => {
            if (transaction.description.length <= maxLength) {
                return transaction.description;
            }
            return `${transaction.description.substring(0, maxLength - 3)}...`;
        },

        formatReferenceNumber: (refNumber: string): string => {
            // Add spacing for readability
            if (refNumber.length > 8) {
                return refNumber.replace(/(.{4})/g, '$1-').slice(0, -1);
            }
            return refNumber;
        }
    },

    /**
     * File size and data formatting
     */
    data: {
        formatFileSize: (bytes: number): string => {
            const units = ['B', 'KB', 'MB', 'GB'];
            let size = bytes;
            let unitIndex = 0;

            while (size >= 1024 && unitIndex < units.length - 1) {
                size /= 1024;
                unitIndex++;
            }

            return `${size.toFixed(1)} ${units[unitIndex]}`;
        },

        formatPercentage: (value: number, total: number): string => {
            if (total === 0) return '0%';
            const percentage = (value / total) * 100;
            return `${percentage.toFixed(1)}%`;
        },

        formatLargeNumber: (num: number): string => {
            return new Intl.NumberFormat('en-US', {
                notation: 'compact',
                maximumFractionDigits: 1
            }).format(num);
        }
    },

    /**
     * Validation formatting
     */
    validation: {
        formatValidationMessage: (field: string, error: string): string => {
            const fieldFormatted = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return `${fieldFormatted}: ${error}`;
        },

        formatFieldName: (fieldName: string): string => {
            return fieldName
                .replace(/_/g, ' ')
                .replace(/\b\w/g, l => l.toUpperCase())
                .replace(/Id$/, 'ID')
                .replace(/Api/, 'API')
                .replace(/Iban/, 'IBAN')
                .replace(/Swift/, 'SWIFT');
        }
    }
};