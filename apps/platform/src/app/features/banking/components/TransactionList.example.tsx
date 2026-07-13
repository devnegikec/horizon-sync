/**
 * Example usage of TransactionList component
 * 
 * This file demonstrates how to integrate the TransactionList component
 * into a bank account detail page or banking dashboard.
 */

import { TransactionList } from './TransactionList';
import { BankAccountDetail } from './BankAccountDetail';
import { TransactionImportDialog } from './TransactionImportDialog';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { useState } from 'react';
import { Upload } from 'lucide-react';

/**
 * Example 1: Basic usage in a bank account detail page
 */
export function BankAccountDetailWithTransactions({ accountId }: { accountId: string }) {
    return (
        <div className="space-y-6">
            {/* Bank Account Details */}
            <BankAccountDetail accountId={accountId} />
            
            {/* Transaction List */}
            <TransactionList bankAccountId={accountId} />
        </div>
    );
}

/**
 * Example 2: With import functionality
 */
export function BankAccountTransactionsPage({ accountId }: { accountId: string }) {
    const [importDialogOpen, setImportDialogOpen] = useState(false);

    return (
        <div className="space-y-6">
            {/* Header with Import Button */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Bank Transactions</h1>
                    <p className="text-muted-foreground">
                        View and manage imported bank transactions
                    </p>
                </div>
                <Button onClick={() => setImportDialogOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Transactions
                </Button>
            </div>

            {/* Transaction List */}
            <TransactionList bankAccountId={accountId} />

            {/* Import Dialog */}
            <TransactionImportDialog
                bankAccountId={accountId}
                open={importDialogOpen}
                onOpenChange={setImportDialogOpen}
            />
        </div>
    );
}

/**
 * Example 3: Standalone usage in a dashboard
 */
export function RecentTransactionsWidget({ accountId }: { accountId: string }) {
    return (
        <div className="rounded-lg border bg-card">
            <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
                <TransactionList bankAccountId={accountId} />
            </div>
        </div>
    );
}

/**
 * Example 4: Multiple accounts with tabs
 */
export function MultiAccountTransactions({ accountIds }: { accountIds: string[] }) {
    const [selectedAccount, setSelectedAccount] = useState(accountIds[0]);

    return (
        <div className="space-y-4">
            {/* Account Selector */}
            <div className="flex gap-2">
                {accountIds.map((accountId) => (
                    <Button
                        key={accountId}
                        variant={selectedAccount === accountId ? 'default' : 'outline'}
                        onClick={() => setSelectedAccount(accountId)}
                    >
                        Account {accountId.slice(0, 8)}
                    </Button>
                ))}
            </div>

            {/* Transaction List for Selected Account */}
            <TransactionList bankAccountId={selectedAccount} />
        </div>
    );
}
