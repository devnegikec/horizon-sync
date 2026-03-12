import * as React from 'react';

import { useQuery } from '@tanstack/react-query';
import { Building2, CreditCard, Globe } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@horizon-sync/ui/components';

import { apiRequest } from '../../utility/api/core';

interface BankAccount {
  id: string;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  country_code: string;
  currency: string;
  iban?: string;
  swift_code?: string;
  routing_number?: string;
  ifsc_code?: string;
  sort_code?: string;
  bsb_number?: string;
  branch_name?: string;
  branch_code?: string;
  is_primary: boolean;
}

interface BankAccountListResponse {
  items: BankAccount[];
  total: number;
}

interface BankAccountDetailsProps {
  className?: string;
}

export function BankAccountDetails({ className }: BankAccountDetailsProps) {
  const accessToken = useUserStore((s) => s.accessToken);

  const { data, isLoading, error } = useQuery<BankAccountListResponse>({
    queryKey: ['bank-accounts-internal-primary', accessToken ?? ''],
    queryFn: () => apiRequest<BankAccountListResponse>('/bank-accounts/internal', accessToken || '', {
      params: { is_active: true, is_primary: true, page_size: 1 }
    }),
    enabled: !!accessToken,
    staleTime: 300_000, // 5 minutes cache
  });

  const primaryAccount = data?.items?.[0];

  if (isLoading) {
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

  if (error || !primaryAccount) {
    return null; // Don't show anything if no bank account is configured
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
              <p className="font-medium">{primaryAccount.bank_name}</p>
              <p className="text-muted-foreground">{primaryAccount.account_holder_name}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <CreditCard className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground text-xs">Account Number</p>
              <p className="font-mono font-medium">{primaryAccount.account_number}</p>
            </div>
          </div>

          {primaryAccount.ifsc_code && (
            <div className="flex items-start gap-2">
              <Globe className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">IFSC Code</p>
                <p className="font-mono font-medium">{primaryAccount.ifsc_code}</p>
              </div>
            </div>
          )}

          {primaryAccount.iban && (
            <div className="flex items-start gap-2">
              <Globe className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">IBAN</p>
                <p className="font-mono font-medium">{primaryAccount.iban}</p>
              </div>
            </div>
          )}

          {primaryAccount.swift_code && (
            <div className="flex items-start gap-2">
              <Globe className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">SWIFT/BIC Code</p>
                <p className="font-mono font-medium">{primaryAccount.swift_code}</p>
              </div>
            </div>
          )}

          {primaryAccount.routing_number && (
            <div className="flex items-start gap-2">
              <Globe className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Routing Number</p>
                <p className="font-mono font-medium">{primaryAccount.routing_number}</p>
              </div>
            </div>
          )}

          {primaryAccount.sort_code && (
            <div className="flex items-start gap-2">
              <Globe className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Sort Code</p>
                <p className="font-mono font-medium">{primaryAccount.sort_code}</p>
              </div>
            </div>
          )}

          {primaryAccount.bsb_number && (
            <div className="flex items-start gap-2">
              <Globe className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">BSB Number</p>
                <p className="font-mono font-medium">{primaryAccount.bsb_number}</p>
              </div>
            </div>
          )}

          {primaryAccount.branch_name && (
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Branch</p>
                <p className="font-medium">{primaryAccount.branch_name}</p>
                {primaryAccount.branch_code && (
                  <p className="text-muted-foreground text-xs">Code: {primaryAccount.branch_code}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
