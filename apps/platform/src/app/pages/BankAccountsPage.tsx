import React, { useState } from 'react';
import { BankAccountList } from '../features/banking/components/BankAccountList';
import { BankAccount } from '../features/banking/types';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Plus } from 'lucide-react';

/**
 * Bank Accounts Page
 * 
 * Displays a list of bank accounts with filtering and actions.
 * This page demonstrates the BankAccountList component usage.
 */
export function BankAccountsPage() {
    const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);

    const handleView = (account: BankAccount) => {
        setSelectedAccount(account);
        // In a real app, this would navigate to a detail page or open a modal
        console.log('Viewing account:', account);
    };

    const handleEdit = (account: BankAccount) => {
        // In a real app, this would navigate to an edit page or open a modal
        console.log('Editing account:', account);
    };

    const handleAddAccount = () => {
        // In a real app, this would navigate to a create page or open a modal
        console.log('Adding new account');
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bank Accounts</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your organization's bank accounts
                    </p>
                </div>
                <Button onClick={handleAddAccount}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Bank Account
                </Button>
            </div>

            {/* Bank Account List Component */}
            <BankAccountList
                onView={handleView}
                onEdit={handleEdit}
            />

            {/* Selected Account Info (for demo purposes) */}
            {selectedAccount && (
                <div className="p-4 border rounded-lg bg-muted">
                    <h3 className="font-semibold mb-2">Selected Account</h3>
                    <pre className="text-sm">
                        {JSON.stringify(selectedAccount, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
