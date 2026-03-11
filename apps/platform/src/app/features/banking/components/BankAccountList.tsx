import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@horizon-sync/ui/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@horizon-sync/ui/components/ui/dropdown-menu';
import { useBankAccounts, useToggleBankAccountStatus } from '../hooks';
import { BankAccount } from '../types';
import { Search, MoreHorizontal, Eye, Edit, Power } from 'lucide-react';

interface BankAccountListProps {
    onView?: (account: BankAccount) => void;
    onEdit?: (account: BankAccount) => void;
}

// Masking utilities per requirements 15.7 and 15.8
const maskAccountNumber = (accountNumber: string): string => {
    // Show last 4 digits (Requirement 15.7)
    if (accountNumber.length <= 4) {
        return accountNumber;
    }
    return '•••• ' + accountNumber.slice(-4);
};

const maskIBAN = (iban: string): string => {
    // Show first 4 and last 4 characters (Requirement 15.8)
    if (iban.length <= 8) {
        return '*'.repeat(iban.length);
    }
    const first4 = iban.slice(0, 4);
    const last4 = iban.slice(-4);
    const maskedLength = iban.length - 8;
    return `${first4}${'*'.repeat(maskedLength)}${last4}`;
};

export function BankAccountList({ onView, onEdit }: BankAccountListProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

    // Fetch bank accounts with optional active filter
    const { data: accounts, isLoading, error } = useBankAccounts({
        active: statusFilter === 'all' ? undefined : statusFilter === 'active',
    });

    const toggleStatus = useToggleBankAccountStatus();

    // Filter accounts by search term
    const filteredAccounts = accounts?.items?.filter(account =>
        account.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.account_holder_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.account_number.includes(searchTerm)
    ) || [];

    const handleToggleStatus = (account: BankAccount) => {
        toggleStatus.mutate({
            accountId: account.id,
            activate: !account.is_active,
        });
    };

    if (error) {
        return (
            <Card>
                <CardContent className="p-6">
                    <p className="text-destructive">Error loading bank accounts: {error.message}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with filters */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Bank Accounts</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant={statusFilter === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setStatusFilter('all')}
                            >
                                All
                            </Button>
                            <Button
                                variant={statusFilter === 'active' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setStatusFilter('active')}
                            >
                                Active
                            </Button>
                            <Button
                                variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setStatusFilter('inactive')}
                            >
                                Inactive
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search by bank name, account holder, or account number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Bank accounts table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <div className="animate-pulse space-y-4">
                                <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
                                <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
                                <div className="h-4 bg-muted rounded w-2/3 mx-auto" />
                            </div>
                        </div>
                    ) : filteredAccounts.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            {searchTerm
                                ? `No accounts found matching "${searchTerm}"`
                                : statusFilter === 'all'
                                ? 'No bank accounts found'
                                : `No ${statusFilter} bank accounts found`}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Account Holder</TableHead>
                                    <TableHead>Bank Name</TableHead>
                                    <TableHead>Account Number</TableHead>
                                    <TableHead>Currency</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAccounts.map((account) => (
                                    <TableRow key={account.id}>
                                        <TableCell className="font-medium">
                                            {account.account_holder_name}
                                        </TableCell>
                                        <TableCell>{account.bank_name}</TableCell>
                                        <TableCell className="font-mono text-sm">
                                            {account.iban
                                                ? maskIBAN(account.iban)
                                                : maskAccountNumber(account.account_number)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{account.currency}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={account.is_active ? 'default' : 'secondary'}
                                            >
                                                {account.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {onView && (
                                                        <DropdownMenuItem onClick={() => onView(account)}>
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View
                                                        </DropdownMenuItem>
                                                    )}
                                                    {onEdit && (
                                                        <DropdownMenuItem onClick={() => onEdit(account)}>
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        onClick={() => handleToggleStatus(account)}
                                                    >
                                                        <Power className="h-4 w-4 mr-2" />
                                                        {account.is_active ? 'Deactivate' : 'Activate'}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Summary stats */}
            {filteredAccounts.length > 0 && (
                <Card>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold text-primary">
                                    {filteredAccounts.length}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {statusFilter === 'all' ? 'Total' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Accounts
                                </p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-600">
                                    {filteredAccounts.filter(a => a.is_active).length}
                                </p>
                                <p className="text-sm text-muted-foreground">Active</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-blue-600">
                                    {filteredAccounts.filter(a => a.is_primary).length}
                                </p>
                                <p className="text-sm text-muted-foreground">Primary</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-purple-600">
                                    {new Set(filteredAccounts.map(a => a.currency)).size}
                                </p>
                                <p className="text-sm text-muted-foreground">Currencies</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
