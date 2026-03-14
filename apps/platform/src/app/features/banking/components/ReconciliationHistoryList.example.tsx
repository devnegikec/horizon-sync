import { useState } from 'react';
import { ReconciliationHistoryList } from './ReconciliationHistoryList';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@horizon-sync/ui/components/ui/select';
import { Alert, AlertDescription } from '@horizon-sync/ui/components/ui/alert';
import { CheckCircle } from 'lucide-react';

/**
 * Example 1: Basic Usage
 * Shows the reconciliation history without any filters
 */
export function BasicExample() {
    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Basic Reconciliation History</h2>
            <ReconciliationHistoryList />
        </div>
    );
}

/**
 * Example 2: With Filters
 * Shows the reconciliation history with bank account and date range filters
 */
export function FilteredExample() {
    const [bankAccountId, setBankAccountId] = useState('bank-account-123');
    const [dateFrom, setDateFrom] = useState('2024-01-01');
    const [dateTo, setDateTo] = useState('2024-01-31');

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold">Filtered Reconciliation History</h2>
            
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="bank-account">Bank Account</Label>
                            <Select value={bankAccountId} onValueChange={setBankAccountId}>
                                <SelectTrigger id="bank-account">
                                    <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bank-account-123">Chase Business Checking</SelectItem>
                                    <SelectItem value="bank-account-456">Wells Fargo Savings</SelectItem>
                                    <SelectItem value="bank-account-789">BofA Operating Account</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="date-from">Date From</Label>
                            <Input
                                id="date-from"
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>
                        
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
                </CardContent>
            </Card>

            <ReconciliationHistoryList
                bankAccountId={bankAccountId}
                dateFrom={dateFrom}
                dateTo={dateTo}
            />
        </div>
    );
}

/**
 * Example 3: With Callback
 * Shows how to handle the undo callback to refresh other components
 */
export function WithCallbackExample() {
    const [lastUndone, setLastUndone] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleReconciliationUndone = () => {
        const timestamp = new Date().toLocaleString();
        setLastUndone(timestamp);
        setShowSuccess(true);
        
        // Hide success message after 5 seconds
        setTimeout(() => setShowSuccess(false), 5000);
        
        // Here you would typically refresh other components
        console.log('Reconciliation undone, refreshing data...');
    };

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold">Reconciliation History with Callback</h2>
            
            {showSuccess && (
                <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                        Reconciliation successfully undone at {lastUndone}
                    </AlertDescription>
                </Alert>
            )}

            <ReconciliationHistoryList
                onReconciliationUndone={handleReconciliationUndone}
            />
        </div>
    );
}

/**
 * Example 4: Integrated Dashboard
 * Shows the history list integrated with other reconciliation components
 */
export function IntegratedDashboardExample() {
    const [selectedBankAccount, setSelectedBankAccount] = useState('bank-account-123');
    const [dateFrom, setDateFrom] = useState('2024-01-01');
    const [dateTo, setDateTo] = useState('2024-01-31');
    const [refreshKey, setRefreshKey] = useState(0);

    const handleReconciliationUndone = () => {
        // Trigger refresh of all components
        setRefreshKey(prev => prev + 1);
        console.log('Refreshing all reconciliation data...');
    };

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold">Reconciliation Dashboard</h2>
            
            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="bank-account">Bank Account</Label>
                            <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
                                <SelectTrigger id="bank-account">
                                    <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bank-account-123">Chase Business Checking</SelectItem>
                                    <SelectItem value="bank-account-456">Wells Fargo Savings</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="date-from">Date From</Label>
                            <Input
                                id="date-from"
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>
                        
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
                </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">24</div>
                        <p className="text-xs text-muted-foreground">Total Reconciliations</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">22</div>
                        <p className="text-xs text-muted-foreground">Active</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-red-600">2</div>
                        <p className="text-xs text-muted-foreground">Undone</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-blue-600">$45,230</div>
                        <p className="text-xs text-muted-foreground">Total Reconciled</p>
                    </CardContent>
                </Card>
            </div>

            {/* History List */}
            <ReconciliationHistoryList
                key={refreshKey}
                bankAccountId={selectedBankAccount}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onReconciliationUndone={handleReconciliationUndone}
            />
        </div>
    );
}

/**
 * Example 5: With Manual Refresh
 * Shows how to manually refresh the history list
 */
export function ManualRefreshExample() {
    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Reconciliation History</h2>
                <Button onClick={handleRefresh}>
                    Refresh History
                </Button>
            </div>

            <ReconciliationHistoryList
                key={refreshKey}
                onReconciliationUndone={handleRefresh}
            />
        </div>
    );
}

/**
 * Example 6: Current Month Only
 * Shows history for the current month
 */
export function CurrentMonthExample() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const dateFrom = firstDayOfMonth.toISOString().split('T')[0];
    const dateTo = lastDayOfMonth.toISOString().split('T')[0];

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold">Current Month Reconciliation History</h2>
            <p className="text-muted-foreground">
                Showing reconciliations from {dateFrom} to {dateTo}
            </p>
            
            <ReconciliationHistoryList
                dateFrom={dateFrom}
                dateTo={dateTo}
            />
        </div>
    );
}

/**
 * Example 7: Last 90 Days
 * Shows history for the last 90 days
 */
export function Last90DaysExample() {
    const today = new Date();
    const ninetyDaysAgo = new Date(today);
    ninetyDaysAgo.setDate(today.getDate() - 90);

    const dateFrom = ninetyDaysAgo.toISOString().split('T')[0];
    const dateTo = today.toISOString().split('T')[0];

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold">Last 90 Days Reconciliation History</h2>
            <Alert>
                <AlertDescription>
                    Reconciliations older than 90 days may require elevated permissions to undo.
                </AlertDescription>
            </Alert>
            
            <ReconciliationHistoryList
                dateFrom={dateFrom}
                dateTo={dateTo}
            />
        </div>
    );
}
