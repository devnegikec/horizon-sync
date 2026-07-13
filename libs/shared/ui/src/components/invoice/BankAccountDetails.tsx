import { Building2, CreditCard, Globe } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

export interface BankAccount {
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  iban?: string;
  swift_code?: string;
  routing_number?: string;
  ifsc_code?: string;
  sort_code?: string;
  bsb_number?: string;
  branch_name?: string;
  branch_code?: string;
}

export interface BankAccountDetailsProps {
  account?: BankAccount | null;
  loading?: boolean;
  className?: string;
}

export function BankAccountDetails({ account, loading, className }: BankAccountDetailsProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Bank Account Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (!account) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Bank Account Details for Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 text-sm">
          <div className="flex items-start gap-2">
            <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="font-medium">{account.bank_name}</p>
              <p className="text-muted-foreground">{account.account_holder_name}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <CreditCard className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground text-xs">Account Number</p>
              <p className="font-mono font-medium">{account.account_number}</p>
            </div>
          </div>

          {account.ifsc_code && (
            <div className="flex items-start gap-2">
              <Globe className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">IFSC Code</p>
                <p className="font-mono font-medium">{account.ifsc_code}</p>
              </div>
            </div>
          )}

          {account.iban && (
            <div className="flex items-start gap-2">
              <Globe className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">IBAN</p>
                <p className="font-mono font-medium">{account.iban}</p>
              </div>
            </div>
          )}

          {account.swift_code && (
            <div className="flex items-start gap-2">
              <Globe className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">SWIFT/BIC Code</p>
                <p className="font-mono font-medium">{account.swift_code}</p>
              </div>
            </div>
          )}

          {account.routing_number && (
            <div className="flex items-start gap-2">
              <Globe className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Routing Number</p>
                <p className="font-mono font-medium">{account.routing_number}</p>
              </div>
            </div>
          )}

          {account.sort_code && (
            <div className="flex items-start gap-2">
              <Globe className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Sort Code</p>
                <p className="font-mono font-medium">{account.sort_code}</p>
              </div>
            </div>
          )}

          {account.bsb_number && (
            <div className="flex items-start gap-2">
              <Globe className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">BSB Number</p>
                <p className="font-mono font-medium">{account.bsb_number}</p>
              </div>
            </div>
          )}

          {account.branch_name && (
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Branch</p>
                <p className="font-medium">{account.branch_name}</p>
                {account.branch_code && (
                  <p className="text-muted-foreground text-xs">Code: {account.branch_code}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
