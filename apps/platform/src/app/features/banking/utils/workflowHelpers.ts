import { PaymentTransaction } from '../types';

/**
 * Workflow management helpers for banking operations
 */

export const workflowHelpers = {
    /**
     * Payment workflow states and transitions
     */
    paymentWorkflow: {
        states: {
            DRAFT: 'draft',
            PENDING: 'pending',
            APPROVED: 'approved',
            PROCESSING: 'processing',
            COMPLETED: 'completed',
            FAILED: 'failed',
            CANCELLED: 'cancelled'
        },

        transitions: {
            DRAFT: ['PENDING', 'CANCELLED'],
            PENDING: ['APPROVED', 'CANCELLED'],
            APPROVED: ['PROCESSING', 'CANCELLED'],
            PROCESSING: ['COMPLETED', 'FAILED'],
            COMPLETED: [],
            FAILED: ['PENDING'], // Can retry
            CANCELLED: []
        },

        canTransition: (from: string, to: string): boolean => {
            const transitions = workflowHelpers.paymentWorkflow.transitions;
            const transition = from.toUpperCase() as keyof typeof transitions;
            const allowedTransitions = transitions[transition];
            if (!allowedTransitions) return false;
            
            return (allowedTransitions as readonly string[]).includes(to.toUpperCase());
        },

        getNextStates: (currentState: string): string[] => {
            const transitions = workflowHelpers.paymentWorkflow.transitions;
            const transition = currentState.toUpperCase() as keyof typeof transitions;
            const stateTransitions = transitions[transition];
            return stateTransitions ? [...stateTransitions] : [];
        }
    },

    /**
     * Approval workflow helpers
     */
    approvalWorkflow: {
        /**
         * Determine approval requirements
         */
        getApprovalRequirements: (amount: number, accountRequiresDual: boolean): {
            levels: number;
            approvers: string[];
            reason: string;
        } => {
            let levels = 0;
            let reason = '';
            const approvers: string[] = [];

            if (accountRequiresDual) {
                levels = 2;
                reason = 'Account requires dual approval';
                approvers.push('Account Manager', 'Finance Manager');
            } else if (amount > 50000) {
                levels = 2;
                reason = 'High value transaction (>$50,000)';
                approvers.push('Department Manager', 'Finance Director');
            } else if (amount > 10000) {
                levels = 1;
                reason = 'Medium value transaction (>$10,000)';
                approvers.push('Department Manager');
            }

            return { levels, approvers, reason };
        },

        /**
         * Check if transaction is ready for next approval level
         */
        isReadyForNextApproval: (transaction: PaymentTransaction): boolean => {
            // Implementation would check approval history
            return transaction.status === 'pending' && transaction.approval_required;
        },

        /**
         * Get pending approvals for user
         */
        getPendingApprovals: (userId: string, transactions: PaymentTransaction[]): PaymentTransaction[] => {
            return transactions.filter(tx =>
                tx.status === 'pending' &&
                tx.approval_required &&
                !tx.approved_by // Not yet approved
            );
        }
    },

    /**
     * Transaction batching helpers
     */
    batchingHelpers: {
        /**
         * Group transactions for batch processing
         */
        groupTransactionsForBatch: (transactions: PaymentTransaction[]): {
            sameBankTransfers: PaymentTransaction[];
            wireTransfers: PaymentTransaction[];
            achTransfers: PaymentTransaction[];
            internationalTransfers: PaymentTransaction[];
        } => {
            return {
                sameBankTransfers: transactions.filter(tx => tx.transaction_type === 'transfer'),
                wireTransfers: transactions.filter(tx => tx.transaction_type === 'wire'),
                achTransfers: transactions.filter(tx => tx.transaction_type === 'ach'),
                internationalTransfers: transactions.filter(tx =>
                    tx.transaction_type === 'wire' && tx.description.toLowerCase().includes('international')
                )
            };
        },

        /**
         * Calculate optimal batch size
         */
        calculateOptimalBatchSize: (transactionType: string, totalCount: number): number => {
            const limits = {
                wire: 10,  // Wire transfers: smaller batches
                ach: 100,  // ACH: larger batches
                transfer: 50, // Internal transfers: medium batches
                payment: 25   // General payments: conservative
            };

            const limit = limits[transactionType as keyof typeof limits] || limits.payment;
            return Math.min(limit, Math.ceil(totalCount / 10)); // Max 10 batches
        }
    },

    /**
     * Reconciliation workflow helpers
     */
    reconciliationHelpers: {
        /**
         * Match transactions with bank statements
         */
        matchTransactions: (internalTxs: PaymentTransaction[], bankStatementTxs: any[]) => {
            // Simplified matching logic
            const matches = [];
            const unmatched = [];

            for (const internal of internalTxs) {
                const bankMatch = bankStatementTxs.find(bank =>
                    Math.abs(bank.amount - internal.amount) < 0.01 && // Amount match
                    Math.abs(new Date(bank.date).getTime() - new Date(internal.processed_date || internal.created_at).getTime()) < 86400000 // Within 24 hours
                );

                if (bankMatch) {
                    matches.push({ internal, bank: bankMatch });
                } else {
                    unmatched.push(internal);
                }
            }

            return { matches, unmatched };
        },

        /**
         * Generate reconciliation report
         */
        generateReconciliationReport: (matches: any[], unmatched: PaymentTransaction[]) => {
            const totalInternal = matches.length + unmatched.length;
            const matchRate = totalInternal > 0 ? (matches.length / totalInternal) * 100 : 0;

            return {
                summary: {
                    totalTransactions: totalInternal,
                    matched: matches.length,
                    unmatched: unmatched.length,
                    matchRate: Math.round(matchRate * 100) / 100
                },
                details: {
                    matches,
                    unmatched
                },
                recommendations: workflowHelpers.reconciliationHelpers.getReconciliationRecommendations(matchRate, unmatched)
            };
        },

        /**
         * Get reconciliation recommendations
         */
        getReconciliationRecommendations: (matchRate: number, unmatched: PaymentTransaction[]): string[] => {
            const recommendations = [];

            if (matchRate < 80) {
                recommendations.push('Consider reviewing transaction matching criteria');
            }

            if (unmatched.length > 10) {
                recommendations.push('High number of unmatched transactions - check for timing differences');
            }

            const oldUnmatched = unmatched.filter(tx =>
                new Date().getTime() - new Date(tx.created_at).getTime() > 7 * 86400000 // Older than 7 days
            );

            if (oldUnmatched.length > 0) {
                recommendations.push(`${oldUnmatched.length} transactions older than 7 days need investigation`);
            }

            return recommendations;
        }
    },

    /**
     * Notification workflow helpers
     */
    notifications: {
        /**
         * Determine notification recipients for transaction events
         */
        getNotificationRecipients: (event: string, transaction: PaymentTransaction) => {
            const recipients = [];

            switch (event) {
                case 'approval_required':
                    recipients.push('finance_manager', 'department_head');
                    break;
                case 'large_transaction':
                    if (transaction.amount > 100000) {
                        recipients.push('cfo', 'ceo');
                    } else if (transaction.amount > 50000) {
                        recipients.push('finance_director');
                    }
                    break;
                case 'failed_transaction':
                    recipients.push('treasury', 'finance_team');
                    break;
                case 'completed_transfer':
                    recipients.push('requester', 'finance_team');
                    break;
            }

            return recipients;
        },

        /**
         * Generate notification content
         */
        generateNotificationContent: (event: string, transaction: PaymentTransaction) => {
            const formatAmount = (amount: number) =>
                new Intl.NumberFormat('en-US', { style: 'currency', currency: transaction.currency }).format(amount);

            switch (event) {
                case 'approval_required':
                    return {
                        subject: 'Payment Approval Required',
                        message: `A payment of ${formatAmount(transaction.amount)} requires your approval.`,
                        priority: 'high'
                    };
                case 'transaction_completed':
                    return {
                        subject: 'Payment Completed',
                        message: `Your payment of ${formatAmount(transaction.amount)} has been successfully processed.`,
                        priority: 'normal'
                    };
                case 'transaction_failed':
                    return {
                        subject: 'Payment Failed',
                        message: `Payment of ${formatAmount(transaction.amount)} failed to process. Please review and retry.`,
                        priority: 'high'
                    };
                default:
                    return {
                        subject: 'Banking Notification',
                        message: 'A banking transaction requires your attention.',
                        priority: 'normal'
                    };
            }
        }
    }
};