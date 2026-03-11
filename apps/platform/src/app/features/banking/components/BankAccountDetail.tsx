import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Separator } from '@horizon-sync/ui/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
import { useBankAccount, useBankAccountHistory } from '../hooks';
import { BankAccountHistory } from '../types';
import { Eye, EyeOff, Building2, CreditCard, Globe, Calendar, User, Clock } from 'lucide-react';

interface BankAccountDetailProps {
    accountId: string;
}

// Account Header Component
interface AccountHeaderProps {
    account: { bank_name: string; is_active: boolean; is_primary: boolean };
}

const AccountHeader = ({ account }: AccountHeaderProps) => (
    <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {account.bank_name}
        </CardTitle>
        <div className="flex items-center gap-2">
            <Badge variant={account.is_active ? 'default' : 'secondary'}>
                {account.is_active ? 'Active' : 'Inactive'}
            </Badge>
            {account.is_primary && (
                <Badge variant="outline">Primary</Badge>
            )}
        </div>
    </div>
);

// Account Holder Component
interface AccountHolderProps {
    accountHolderName: string;
}

const AccountHolderInfo = ({ accountHolderName }: AccountHolderProps) => (
    <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Account Holder</h3>
        <p className="text-lg font-semibold">{accountHolderName}</p>
    </div>
);

// Account Number Display Component
interface AccountNumberProps {
    accountNumber: string;
    showFull: boolean;
    onToggle: () => void;
}

const AccountNumberDisplay = ({ accountNumber, showFull, onToggle }: AccountNumberProps) => (
    <div>
        <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Account Number
            </h3>
            <Button variant="ghost" size="sm" onClick={onToggle}>
                {showFull ? (
                    <>
                        <EyeOff className="h-4 w-4 mr-1" />
                        Hide
                    </>
                ) : (
                    <>
                        <Eye className="h-4 w-4 mr-1" />
                        View Full
                    </>
                )}
            </Button>
        </div>
        <p className="font-mono text-sm">
            {showFull ? accountNumber : maskAccountNumber(accountNumber)}
        </p>
    </div>
);

// Banking Details Component
interface BankingDetailsProps {
    account: {
        iban?: string;
        swift_code?: string;
        routing_number?: string;
        sort_code?: string;
        bsb_number?: string;
        ifsc_code?: string;
        currency: string;
        country_code: string;
        account_type?: string;
        account_purpose?: string;
    };
    showFullAccountNumber: boolean;
}

const BankingDetails = ({ account, showFullAccountNumber }: BankingDetailsProps) => (
    <>
        {/* IBAN */}
        {account.iban && (
            <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">IBAN</h3>
                <p className="font-mono text-sm">
                    {showFullAccountNumber ? account.iban : maskIBAN(account.iban)}
                </p>
            </div>
        )}

        {/* SWIFT Code */}
        {account.swift_code && (
            <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">SWIFT Code</h3>
                <p className="font-mono text-sm">{account.swift_code}</p>
            </div>
        )}

        {/* Routing Number */}
        {account.routing_number && (
            <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Routing Number</h3>
                <p className="font-mono text-sm">{account.routing_number}</p>
            </div>
        )}

        {/* Additional fields */}
        {account.sort_code && (
            <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Sort Code</h3>
                <p className="font-mono text-sm">{account.sort_code}</p>
            </div>
        )}

        {account.bsb_number && (
            <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">BSB Number</h3>
                <p className="font-mono text-sm">{account.bsb_number}</p>
            </div>
        )}

        {account.ifsc_code && (
            <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">IFSC Code</h3>
                <p className="font-mono text-sm">{account.ifsc_code}</p>
            </div>
        )}

        <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Currency
            </h3>
            <p className="text-sm">{account.currency}</p>
        </div>

        <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Country</h3>
            <p className="text-sm">{account.country_code}</p>
        </div>

        {account.account_type && (
            <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Account Type</h3>
                <p className="text-sm capitalize">{account.account_type}</p>
            </div>
        )}

        {account.account_purpose && (
            <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Purpose</h3>
                <p className="text-sm capitalize">{account.account_purpose}</p>
            </div>
        )}
    </>
);

// Masking utilities per requirements 15.7 and 15.8
const maskAccountNumber = (accountNumber: string): string => {
    if (accountNumber.length <= 4) {
        return accountNumber;
    }
    return '•••• ' + accountNumber.slice(-4);
};

const maskIBAN = (iban: string): string => {
    if (iban.length <= 8) {
        return '*'.repeat(iban.length);
    }
    const first4 = iban.slice(0, 4);
    const last4 = iban.slice(-4);
    const maskedLength = iban.length - 8;
    return `${first4}${'*'.repeat(maskedLength)}${last4}`;
};

export function BankAccountDetail({ accountId }: BankAccountDetailProps) {
    const [showFullAccountNumber, setShowFullAccountNumber] = useState(false);
    const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);

    const { data: account, isLoading, error } = useBankAccount(accountId);
    const { data: history, isLoading: historyLoading } = useBankAccountHistory(accountId);

    // Requirement 15.9: Unmasking requires permission check
    const handleViewFullAccountNumber = () => {
        // TODO: Implement actual permission check with backend
        // For now, we'll show a dialog to simulate permission check
        const hasPermission = checkUnmaskPermission();
        
        if (hasPermission) {
            setShowFullAccountNumber(true);
            // Requirement 15.10: Log unmasking in audit trail
            logUnmaskingAction(accountId);
        } else {
            setPermissionDialogOpen(true);
        }
    };

    // Simulated permission check - should be replaced with actual backend check
    const checkUnmaskPermission = (): boolean => {
        // TODO: Replace with actual permission check from user context
        // For now, return true for demonstration
        return true;
    };

    // Log unmasking action for audit trail (Requirement 15.10)
    const logUnmaskingAction = (_accountId: string) => {
        // TODO: Implement actual audit logging to backend
        // Audit logging logic would go here
    };

    if (error) {
        return (
            <Card>
                <CardContent className="p-6">
                    <p className="text-destructive">Error loading bank account: {error.message}</p>
                </CardContent>
            </Card>
        );
    }

    if (isLoading || !account) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                        <div className="h-4 bg-muted rounded w-2/3" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const handleToggleAccountNumber = () => {
        if (showFullAccountNumber) {
            setShowFullAccountNumber(false);
        } else {
            handleViewFullAccountNumber();
        }
    };

    return (
        <div className="space-y-6">
            {/* Account Overview */}
            <Card>
                <CardHeader>
                    <AccountHeader account={account} />
                </CardHeader>
                <CardContent className="space-y-6">
                    <AccountHolderInfo accountHolderName={account.account_holder_name} />
                    
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AccountNumberDisplay 
                            accountNumber={account.account_number}
                            showFull={showFullAccountNumber}
                            onToggle={handleToggleAccountNumber}
                        />
                        <BankingDetails account={account} showFullAccountNumber={showFullAccountNumber} />
                    </div>

                    {/* Branch Information */}
                    {(account.branch_name || account.branch_code) && (
                        <>
                            <Separator />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {account.branch_name && (
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Branch Name</h3>
                                        <p className="text-sm">{account.branch_name}</p>
                                    </div>
                                )}
                                {account.branch_code && (
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground mb-2">Branch Code</h3>
                                        <p className="text-sm">{account.branch_code}</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Audit History Timeline - Requirement 18.9 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Audit History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {historyLoading ? (
                        <div className="animate-pulse space-y-4">
                            <div className="h-4 bg-muted rounded w-3/4" />
                            <div className="h-4 bg-muted rounded w-1/2" />
                        </div>
                    ) : !history || history.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No history available</p>
                    ) : (
                        <div className="space-y-4">
                            {history.map((entry) => (
                                <AuditHistoryEntry key={entry.id} entry={entry} />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Permission Denied Dialog */}
            <Dialog open={permissionDialogOpen} onOpenChange={setPermissionDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Permission Required</DialogTitle>
                        <DialogDescription>
                            You do not have permission to view the full account number. 
                            Please contact your administrator for elevated access.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end">
                        <Button onClick={() => setPermissionDialogOpen(false)}>
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Audit History Entry Component
interface AuditHistoryEntryProps {
    entry: BankAccountHistory;
}

function AuditHistoryEntry({ entry }: AuditHistoryEntryProps) {
    const getActionColor = (action: string) => {
        switch (action.toLowerCase()) {
            case 'created':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'updated':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'activated':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'deactivated':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateString;
        }
    };

    return (
        <div className="flex gap-4 pb-4 border-b last:border-b-0 last:pb-0">
            <div className="flex-shrink-0">
                <div className={`w-2 h-2 rounded-full mt-2 ${getActionColor(entry.action_type).split(' ')[0]}`} />
            </div>
            <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                    <Badge variant="outline" className={getActionColor(entry.action_type)}>
                        {entry.action_type}
                    </Badge>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(entry.changed_at)}
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-3 w-3" />
                    {entry.changed_by}
                </div>
                {entry.reason && (
                    <p className="text-sm text-muted-foreground italic">{entry.reason}</p>
                )}
                {entry.old_values && entry.new_values && (
                    <div className="text-xs space-y-1 mt-2">
                        {Object.keys(entry.new_values).map((key) => {
                            const oldValue = entry.old_values?.[key];
                            const newValue = entry.new_values?.[key];
                            if (oldValue !== newValue) {
                                return (
                                    <div key={key} className="flex gap-2">
                                        <span className="font-medium">{key}:</span>
                                        <span className="text-muted-foreground line-through">
                                            {String(oldValue)}
                                        </span>
                                        <span>→</span>
                                        <span className="text-foreground">{String(newValue)}</span>
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
