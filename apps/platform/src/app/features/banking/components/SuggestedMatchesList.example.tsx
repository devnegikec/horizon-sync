import { useState } from 'react';
import { SuggestedMatchesList } from './SuggestedMatchesList';
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
import { RefreshCw } from 'lucide-react';

/**
 * Example 1: Basic Usage
 * 
 * Displays all suggested matches without filters
 */
export function BasicSuggestedMatchesExample() {
    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Basic Suggested Matches</h2>
            <SuggestedMatchesList />
        </div>
    );
}

/**
 * Example 2: With Filters
 * 
 * Demonstrates filtering by bank account and date range
 */
export function FilteredSuggestedMatchesExample() {
    const [selectedBankAccount, setSelectedBankAccount] = useState('bank-123');
    const [dateFrom, setDateFrom] = useState('2024-01-01');
    const [dateTo, setDateTo] = useState('2024-01-31');

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold">Filtered Suggested Matches</h2>
            
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="bank-account">Bank Account</Label>
                            <Select
                                value={selectedBankAccount}
                                onValueChange={setSelectedBankAccount}
                            >
                                <SelectTrigger id="bank-account">
                                    <SelectValue placeholder="Select bank account" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bank-123">Chase Business - ****1234</SelectItem>
                                    <SelectItem value="bank-456">Wells Fargo - ****5678</SelectItem>
                                    <SelectItem value="bank-789">Bank of America - ****9012</SelectItem>
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

            <SuggestedMatchesList
                bankAccountId={selectedBankAccount}
                dateFrom={dateFrom}
                dateTo={dateTo}
            />
        </div>
    );
}

/**
 * Example 3: With Callbacks
 * 
 * Demonstrates handling match confirmation and rejection events
 */
export function CallbackSuggestedMatchesExample() {
    const [lastAction, setLastAction] = useState<string>('');
    const [actionCount, setActionCount] = useState({ confirmed: 0, rejected: 0 });

    const handleMatchConfirmed = () => {
        setLastAction('Match confirmed successfully!');
        setActionCount(prev => ({ ...prev, confirmed: prev.confirmed + 1 }));
        
        // In a real app, you might:
        // - Refresh other components
        // - Show a success toast
        // - Update statistics
        // - Reload transaction lists
    };

    const handleMatchRejected = () => {
        setLastAction('Match rejected');
        setActionCount(prev => ({ ...prev, rejected: prev.rejected + 1 }));
        
        // In a real app, you might:
        // - Show a notification
        // - Update statistics
        // - Log the rejection
    };

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold">Suggested Matches with Callbacks</h2>
            
            {lastAction && (
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                        <p className="text-sm font-medium text-blue-900">{lastAction}</p>
                        <div className="mt-2 text-xs text-blue-700">
                            <span className="mr-4">Confirmed: {actionCount.confirmed}</span>
                            <span>Rejected: {actionCount.rejected}</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            <SuggestedMatchesList
                onMatchConfirmed={handleMatchConfirmed}
                onMatchRejected={handleMatchRejected}
            />
        </div>
    );
}

/**
 * Example 4: Integrated with Reconciliation Workspace
 * 
 * Shows how to integrate with other reconciliation components
 */
export function IntegratedReconciliationExample() {
    const [selectedBankAccount, setSelectedBankAccount] = useState('bank-123');
    const [dateFrom, setDateFrom] = useState('2024-01-01');
    const [dateTo, setDateTo] = useState('2024-01-31');
    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    const handleMatchAction = () => {
        // Refresh all components when a match is confirmed or rejected
        handleRefresh();
    };

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Bank Reconciliation</h2>
                <Button onClick={handleRefresh}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh All
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="bank-account">Bank Account</Label>
                            <Select
                                value={selectedBankAccount}
                                onValueChange={setSelectedBankAccount}
                            >
                                <SelectTrigger id="bank-account">
                                    <SelectValue placeholder="Select bank account" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bank-123">Chase Business - ****1234</SelectItem>
                                    <SelectItem value="bank-456">Wells Fargo - ****5678</SelectItem>
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

            {/* Suggested Matches */}
            <SuggestedMatchesList
                key={refreshKey}
                bankAccountId={selectedBankAccount}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onMatchConfirmed={handleMatchAction}
                onMatchRejected={handleMatchAction}
            />

            {/* Other reconciliation components would go here */}
            {/* For example: ReconciliationWorkspace, ManualReconciliationDialog, etc. */}
        </div>
    );
}

/**
 * Example 5: With Custom Styling
 * 
 * Demonstrates how to wrap the component with custom styling
 */
export function StyledSuggestedMatchesExample() {
    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Reconciliation Dashboard</h1>
                    <p className="text-gray-600 mt-2">
                        Review and approve suggested transaction matches
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <SuggestedMatchesList />
                </div>
            </div>
        </div>
    );
}

/**
 * Example 6: Mobile-Responsive Layout
 * 
 * Shows how the component adapts to different screen sizes
 */
export function ResponsiveSuggestedMatchesExample() {
    return (
        <div className="p-2 md:p-4 lg:p-6">
            <h2 className="text-xl md:text-2xl font-bold mb-4">
                Suggested Matches (Responsive)
            </h2>
            
            <div className="w-full">
                <SuggestedMatchesList />
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                    <strong>Tip:</strong> Resize your browser window to see how the component
                    adapts to different screen sizes. The table becomes scrollable on smaller
                    screens, and action buttons stack vertically on mobile devices.
                </p>
            </div>
        </div>
    );
}

/**
 * Example 7: With Statistics Summary
 * 
 * Shows suggested matches with summary statistics
 */
export function SuggestedMatchesWithStatsExample() {
    const [stats] = useState({
        totalSuggested: 15,
        highConfidence: 8,
        mediumConfidence: 5,
        lowConfidence: 2,
        totalAmount: 45250.75,
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-2xl font-bold">Suggested Matches with Statistics</h2>
            
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Total Suggested</p>
                            <p className="text-2xl font-bold text-blue-600">{stats.totalSuggested}</p>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">High Confidence</p>
                            <p className="text-2xl font-bold text-green-600">{stats.highConfidence}</p>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Medium Confidence</p>
                            <p className="text-2xl font-bold text-yellow-600">{stats.mediumConfidence}</p>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Low Confidence</p>
                            <p className="text-2xl font-bold text-orange-600">{stats.lowConfidence}</p>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">Total Amount</p>
                            <p className="text-2xl font-bold text-purple-600">
                                {formatCurrency(stats.totalAmount)}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Suggested Matches List */}
            <SuggestedMatchesList />
        </div>
    );
}
