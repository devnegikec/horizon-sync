import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Input } from '@horizon-sync/ui/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@horizon-sync/ui/components/ui/select';
import { AutoReconciliationButton } from './AutoReconciliationButton';

/**
 * Example usage of AutoReconciliationButton component
 * 
 * This example demonstrates:
 * 1. Basic usage with bank account and date range selection
 * 2. Handling completion callback
 * 3. Integration with other reconciliation components
 */
export function AutoReconciliationButtonExample() {
    const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [lastRunResult, setLastRunResult] = useState<string | null>(null);

    // Mock bank accounts for example
    const mockBankAccounts = [
        { id: 'bank-1', name: 'Chase Business Checking - **** 1234' },
        { id: 'bank-2', name: 'Wells Fargo Savings - **** 5678' },
        { id: 'bank-3', name: 'Bank of America Operating - **** 9012' },
    ];

    // Set default date range (last 30 days)
    useState(() => {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        setDateTo(today.toISOString().split('T')[0]);
        setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
    });

    const handleComplete = () => {
        setLastRunResult(`Auto-reconciliation completed at ${new Date().toLocaleTimeString()}`);
        console.log('Auto-reconciliation completed, refreshing data...');
        // In a real app, you would refresh the reconciliation data here
    };

    return (
        <div className="space-y-6 p-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Auto-Reconciliation Example</h1>
                <p className="text-muted-foreground">
                    This example demonstrates the AutoReconciliationButton component in action.
                </p>
            </div>

            {/* Example 1: Basic Usage */}
            <Card>
                <CardHeader>
                    <CardTitle>Example 1: Basic Usage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Bank Account Selector */}
                        <div className="space-y-2">
                            <Label htmlFor="bank-account">Bank Account</Label>
                            <Select
                                value={selectedBankAccountId}
                                onValueChange={setSelectedBankAccountId}
                            >
                                <SelectTrigger id="bank-account">
                                    <SelectValue placeholder="Select bank account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {mockBankAccounts.map((account) => (
                                        <SelectItem key={account.id} value={account.id}>
                                            {account.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date From */}
                        <div className="space-y-2">
                            <Label htmlFor="date-from">Date From</Label>
                            <Input
                                id="date-from"
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>

                        {/* Date To */}
                        <div className="space-y-2">
                            <Label htmlFor="date-to">Date To</Label>
                            <Input
                                id="date-to"
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Auto-Reconciliation Button */}
                    <div className="space-y-2">
                        <Label>Run Auto-Reconciliation</Label>
                        <AutoReconciliationButton
                            bankAccountId={selectedBankAccountId}
                            dateFrom={dateFrom}
                            dateTo={dateTo}
                            onComplete={handleComplete}
                        />
                    </div>

                    {/* Last Run Result */}
                    {lastRunResult && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-700">{lastRunResult}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Example 2: Disabled State */}
            <Card>
                <CardHeader>
                    <CardTitle>Example 2: Disabled State</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        The button is disabled when required parameters are missing or when explicitly disabled.
                    </p>
                    <AutoReconciliationButton
                        bankAccountId=""
                        dateFrom={dateFrom}
                        dateTo={dateTo}
                        disabled={true}
                    />
                </CardContent>
            </Card>

            {/* Example 3: Integration with Reconciliation Workspace */}
            <Card>
                <CardHeader>
                    <CardTitle>Example 3: Integration with Reconciliation Workspace</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        In a real application, this button would be integrated with the ReconciliationWorkspace
                        component and would trigger a refresh of the suggested matches list after completion.
                    </p>
                    <div className="p-4 bg-muted rounded-lg">
                        <code className="text-sm">
                            {`<ReconciliationWorkspace>
  <AutoReconciliationButton
    bankAccountId={selectedBankAccountId}
    dateFrom={dateFrom}
    dateTo={dateTo}
    onComplete={() => {
      // Refresh unreconciled transactions
      loadUnreconciledTransactions();
      // Refresh suggested matches
      loadSuggestedMatches();
      // Refresh balance
      loadBalance();
    }}
  />
  <SuggestedMatchesList
    bankAccountId={selectedBankAccountId}
    dateFrom={dateFrom}
    dateTo={dateTo}
  />
</ReconciliationWorkspace>`}
                        </code>
                    </div>
                </CardContent>
            </Card>

            {/* Example 4: Expected Results */}
            <Card>
                <CardHeader>
                    <CardTitle>Example 4: Expected Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        After running auto-reconciliation, you'll see a results dialog with:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                        <li>
                            <strong>Exact Matches:</strong> Transactions with perfect matches (amount, date, reference)
                            - automatically confirmed
                        </li>
                        <li>
                            <strong>Fuzzy Matches:</strong> Probable matches (amount exact, date within 3 days,
                            optional reference match) - require manual confirmation
                        </li>
                        <li>
                            <strong>Many-to-One Matches:</strong> Multiple journal entries summing to one transaction
                            - require manual confirmation
                        </li>
                        <li>
                            <strong>Success Rate:</strong> Percentage of transactions automatically reconciled
                        </li>
                    </ul>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-700">
                            <strong>Note:</strong> Exact matches are automatically confirmed and the transaction
                            status is updated to "reconciled". Fuzzy and many-to-one matches are suggested and
                            require manual review in the Suggested Matches section.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default AutoReconciliationButtonExample;
