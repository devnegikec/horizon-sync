import { ReconciliationReport } from './ReconciliationReport';

/**
 * Example 1: Basic Usage
 * 
 * Display the reconciliation report with all filters available to the user.
 */
export function BasicReconciliationReportExample() {
    return (
        <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold">Reconciliation Report</h2>
            <ReconciliationReport />
        </div>
    );
}

/**
 * Example 2: Pre-selected Bank Account
 * 
 * Display the reconciliation report for a specific bank account.
 * Useful when navigating from a bank account detail page.
 */
export function PreSelectedBankAccountExample() {
    // In a real application, this would come from route params or props
    const bankAccountId = '123e4567-e89b-12d3-a456-426614174000';
    
    return (
        <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold">Bank Account Reconciliation Report</h2>
            <ReconciliationReport bankAccountId={bankAccountId} />
        </div>
    );
}

/**
 * Example 3: Embedded in Dashboard
 * 
 * Display the reconciliation report as part of a larger dashboard.
 */
export function DashboardEmbeddedExample() {
    return (
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Other dashboard widgets */}
                <div className="lg:col-span-2">
                    <ReconciliationReport />
                </div>
                
                <div className="space-y-6">
                    {/* Sidebar content */}
                    <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold mb-2">Quick Actions</h3>
                        <p className="text-sm text-muted-foreground">
                            Generate reports for different time periods
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Example 4: Full Page Report
 * 
 * Display the reconciliation report as a full-page view with header.
 */
export function FullPageReportExample() {
    return (
        <div className="min-h-screen bg-background">
            {/* Page Header */}
            <div className="border-b">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">Reconciliation Reports</h1>
                            <p className="text-muted-foreground mt-1">
                                View and export reconciliation reports for your bank accounts
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Content */}
            <div className="container mx-auto px-6 py-6">
                <ReconciliationReport />
            </div>
        </div>
    );
}

/**
 * Example 5: With Custom Wrapper
 * 
 * Wrap the report in a custom container with additional context.
 */
export function CustomWrapperExample() {
    const handleReportGenerated = () => {
        console.log('Report generated successfully');
    };

    return (
        <div className="p-6 space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900">Report Instructions</h3>
                <p className="text-sm text-blue-700 mt-1">
                    Select a bank account and date range to generate a reconciliation report.
                    You can export the report to CSV or PDF format for your records.
                </p>
            </div>

            <ReconciliationReport />

            <div className="text-sm text-muted-foreground">
                <p>
                    Reports show all transactions within the selected date range, grouped by status.
                    Reconciled transactions display their matched journal entries.
                </p>
            </div>
        </div>
    );
}

/**
 * Example 6: Multiple Reports View
 * 
 * Display multiple report instances for different accounts.
 */
export function MultipleReportsExample() {
    const bankAccounts = [
        { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Operating Account' },
        { id: '223e4567-e89b-12d3-a456-426614174001', name: 'Payroll Account' },
    ];

    return (
        <div className="p-6 space-y-8">
            <h2 className="text-2xl font-bold">All Bank Account Reports</h2>
            
            {bankAccounts.map((account) => (
                <div key={account.id} className="space-y-2">
                    <h3 className="text-xl font-semibold">{account.name}</h3>
                    <ReconciliationReport bankAccountId={account.id} />
                </div>
            ))}
        </div>
    );
}

/**
 * Example 7: With Loading State
 * 
 * Show how the component handles loading states.
 */
export function LoadingStateExample() {
    return (
        <div className="p-6 space-y-6">
            <h2 className="text-2xl font-bold">Report Loading Example</h2>
            <p className="text-muted-foreground">
                The component shows loading indicators while fetching data and during exports.
            </p>
            <ReconciliationReport />
        </div>
    );
}

/**
 * Example 8: Responsive Layout
 * 
 * Demonstrate responsive behavior on different screen sizes.
 */
export function ResponsiveLayoutExample() {
    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold">Reconciliation Report</h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1">
                        Responsive design adapts to all screen sizes
                    </p>
                </div>
                
                <ReconciliationReport />
            </div>
        </div>
    );
}
