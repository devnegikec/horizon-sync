import * as React from 'react';

import {
  Mail,
  Phone,
  MapPin,
  Building2,
  Hash,
  CreditCard,
  Wallet,
  Calendar,
  Tag as TagIcon,
  Globe,
  FileText,
} from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';
import { Separator } from '@horizon-sync/ui/components/ui/separator';
import { useCurrencyStore } from '@horizon-sync/store';

import type { Customer } from '../../types/customer.types';
import { getCurrencySymbol } from '../../types/currency.types';

interface CustomerDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}

function getStatusBadge(status: Customer['status']) {
  switch (status) {
    case 'active':
      return { variant: 'success' as const, label: 'Active', color: 'bg-emerald-500' };
    case 'inactive':
      return { variant: 'secondary' as const, label: 'Inactive', color: 'bg-gray-400' };
    case 'blocked':
      return { variant: 'destructive' as const, label: 'Blocked', color: 'bg-red-500' };
  }
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-medium mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}

export function CustomerDetailDialog({ open, onOpenChange, customer }: CustomerDetailDialogProps) {
  const baseCurrency = useCurrencyStore((s) => s.baseCurrency);
  const currencySymbol = getCurrencySymbol(baseCurrency || 'USD');

  if (!customer) return null;

  const creditLimit = parseFloat(customer.credit_limit);
  const outstandingBalance = parseFloat(customer.outstanding_balance);
  const creditUtilization = creditLimit > 0 ? (outstandingBalance / creditLimit) * 100 : 0;
  const statusBadge = getStatusBadge(customer.status);
  const tags = Array.isArray(customer.tags) ? customer.tags : [];

  const fullAddress = [
    customer.address_line1,
    customer.address_line2,
    customer.city,
    customer.state,
    customer.postal_code,
    customer.country,
  ].filter(Boolean).join(', ');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent p-6 pb-5">
          <DialogHeader className="space-y-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                  <Building2 className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <DialogTitle className="text-xl font-bold">{customer.customer_name}</DialogTitle>
                    <Badge variant={statusBadge.variant} className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5">
                      {statusBadge.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5" />
                    <code className="font-mono text-xs">{customer.customer_code}</code>
                  </p>
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Financial Summary Cards */}
        <div className="px-6 -mt-1">
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-4">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Credit Limit</p>
                <p className="text-lg font-bold mt-1">{currencySymbol}{creditLimit.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-4">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Outstanding</p>
                <p className="text-lg font-bold mt-1 text-amber-600">{currencySymbol}{outstandingBalance.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-4">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Available</p>
                <p className="text-lg font-bold mt-1 text-emerald-600">{currencySymbol}{(creditLimit - outstandingBalance).toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {/* Credit Utilization Bar */}
          <div className="mt-3 px-1">
            <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground mb-1.5">
              <span>Credit Utilization</span>
              <span className="font-semibold">{creditUtilization.toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  creditUtilization > 90 ? 'bg-destructive' : creditUtilization > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(creditUtilization, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <Separator className="mt-5" />

        {/* Details Sections */}
        <div className="p-6 pt-5 space-y-6">
          {/* Contact & Address in 2-column grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Contact */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Contact
              </h3>
              <div className="space-y-3.5">
                <InfoItem icon={Mail} label="Email" value={customer.email} />
                <InfoItem icon={Phone} label="Phone" value={customer.phone} />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </h3>
              <div className="space-y-3.5">
                <InfoItem icon={MapPin} label="City" value={customer.city} />
                {(fullAddress && fullAddress !== customer.city) && (
                  <InfoItem icon={Globe} label="Full Address" value={fullAddress} />
                )}
                {customer.address && !fullAddress && (
                  <InfoItem icon={MapPin} label="Address" value={customer.address} />
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Business Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Business Details
              </h3>
              <div className="space-y-3.5">
                <InfoItem icon={Hash} label="Tax Number" value={customer.tax_number} />
                <InfoItem icon={Calendar} label="Member Since" value={
                  new Date(customer.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                } />
              </div>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <TagIcon className="h-4 w-4" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="px-3 py-1.5 text-xs font-medium bg-primary/5 border-primary/20">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
