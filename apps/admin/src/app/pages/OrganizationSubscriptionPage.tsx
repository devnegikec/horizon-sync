import * as React from 'react';

import { ArrowLeft, Coins, Loader2, PlusCircle, RefreshCw, Settings2, ShieldCheck } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@horizon-sync/ui/components';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@horizon-sync/ui/components/ui/table';

import { ActivateSubscriptionDialog } from '../components/subscription/ActivateSubscriptionDialog';
import { AssignPlanDialog } from '../components/subscription/AssignPlanDialog';
import { ChangeVersionDialog } from '../components/subscription/ChangeVersionDialog';
import { CreditAdjustmentDialog } from '../components/subscription/CreditAdjustmentDialog';
import { SubscriptionActionDialog, type SubscriptionLifecycleAction } from '../components/subscription/SubscriptionActionDialog';
import {
  CreditQuantity,
  Money,
  BillingReadOnlyNotice,
  SubscriptionStatusBadge,
  activationFeeLabel,
  cadenceLabel,
  formatDate,
  formatDateTime,
  formatDecimal,
} from '../components/subscription/SubscriptionUI';
import { usePermissions } from '../hooks/usePermissions';
import { AdminOrganizationService } from '../services/admin-organization.service';
import { SubscriptionApiError, SubscriptionService } from '../services/subscription.service';
import type { QRCreditBalance, QRCreditLedgerItem } from '../types/qr-credit.types';
import type { CreditBatch, OrganizationSubscription } from '../types/subscription.types';
import { BILLING_WRITE_PERMISSION_CODES } from '../utils/permissions';

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function planLabel(subscription: OrganizationSubscription): string {
  if (!subscription.plan) return '—';
  return `${subscription.plan.code} · v${subscription.plan_version?.version ?? '—'}`;
}

function planCadence(subscription: OrganizationSubscription): string {
  return cadenceLabel(subscription.plan_version?.billing_cadence ?? subscription.billing_cadence);
}

function taxLabel(subscription: OrganizationSubscription): string {
  const version = subscription.plan_version;
  return version ? `${formatDecimal(version.tax_rate, 4)}%` : '—';
}

function effectiveLabel(subscription: OrganizationSubscription): string {
  const version = subscription.plan_version;
  return version ? formatDateTime(version.effective_from) : '—';
}

function SubscriptionHeader({ subscription, currency }: { subscription: OrganizationSubscription; currency: string }) {
  const version = subscription.plan_version;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Contract</CardTitle>
        <SubscriptionStatusBadge status={subscription.status} />
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <DetailItem label="Plan" value={planLabel(subscription)} />
        <DetailItem label="Cadence" value={planCadence(subscription)} />
        <DetailItem label="Recurring fee" value={<Money value={version?.base_price} currency={currency} />} />
        <DetailItem label="ID weight" value={formatDecimal(version?.id_weight, 6)} />
        <DetailItem label="Included credits" value={formatDecimal(version?.included_credits, 2)} />
        <DetailItem label="Tax rate" value={taxLabel(subscription)} />
        <DetailItem label="Activation fee" value={<Money value={subscription.activation_fee} currency={currency} />} />
        <DetailItem label="Activation status" value={activationFeeLabel(subscription.activation_fee_status)} />
        <DetailItem label="Current period" value={`${formatDate(subscription.current_period_start)} → ${formatDate(subscription.current_period_end)}`} />
        <DetailItem label="Next invoice" value={formatDate(subscription.next_invoice_date)} />
        <DetailItem label="Billing anchor" value={subscription.billing_anchor_day ? `Day ${subscription.billing_anchor_day}` : '—'} />
        <DetailItem label="Timezone" value={subscription.billing_timezone ?? '—'} />
        <DetailItem label="Activated" value={formatDateTime(subscription.activated_at)} />
        <DetailItem label="Version effective" value={effectiveLabel(subscription)} />
      </CardContent>
    </Card>
  );
}

function CreditSummary({ balance }: { balance: QRCreditBalance | null }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Available credits</p>
          <p className="text-2xl font-bold">
            <CreditQuantity value={balance?.balance_credits ?? 0} />
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Reserved</p>
          <p className="text-2xl font-bold">
            <CreditQuantity value={balance?.reserved_credits ?? 0} />
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Used to date</p>
          <p className="text-2xl font-bold">
            <CreditQuantity value={balance?.used_credits ?? 0} />
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function BatchesTable({ batches }: { batches: CreditBatch[] }) {
  if (batches.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No credit batches recorded for this organization.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Source</TableHead>
          <TableHead className="text-right">Granted</TableHead>
          <TableHead className="text-right">Available</TableHead>
          <TableHead>Issued</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {batches.map((batch) => (
          <TableRow key={batch.id}>
            <TableCell className="text-xs">{batch.source_type.replace(/_/g, ' ')}</TableCell>
            <TableCell className="text-right text-xs tabular-nums">
              <CreditQuantity value={batch.granted_qty} />
            </TableCell>
            <TableCell className="text-right text-xs tabular-nums">
              <CreditQuantity value={batch.available_qty} />
            </TableCell>
            <TableCell className="text-xs">{formatDate(batch.issued_at)}</TableCell>
            <TableCell className="text-xs">{formatDate(batch.expires_at)}</TableCell>
            <TableCell>
              <Badge variant={batch.status === 'active' ? 'success' : batch.status === 'expired' ? 'secondary' : 'outline'}>{batch.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function LedgerTable({ entries }: { entries: QRCreditLedgerItem[] }) {
  if (entries.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No ledger entries yet.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>When</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Balance after</TableHead>
          <TableHead>Reason</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell className="text-xs">{formatDateTime(entry.created_at)}</TableCell>
            <TableCell className="text-xs">{entry.transaction_type.replace(/_/g, ' ')}</TableCell>
            <TableCell className={`text-right text-xs tabular-nums ${entry.amount < 0 ? 'text-destructive' : ''}`}>
              <CreditQuantity value={entry.amount} />
            </TableCell>
            <TableCell className="text-right text-xs tabular-nums">
              <CreditQuantity value={entry.balance_after} />
            </TableCell>
            <TableCell className="max-w-[240px] truncate text-xs text-muted-foreground" title={entry.reason ?? undefined}>
              {entry.reason ?? '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

interface ActionsProps {
  subscription: OrganizationSubscription | null;
  canManage: boolean;
  onAssign: () => void;
  onActivate: () => void;
  onChangeVersion: () => void;
  onLifecycle: (action: SubscriptionLifecycleAction) => void;
  onAdjust: () => void;
}

function SubscriptionActions({ subscription, canManage, onAssign, onActivate, onChangeVersion, onLifecycle, onAdjust }: ActionsProps) {
  if (!canManage) return null;
  if (!subscription) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={onAssign}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Assign plan
        </Button>
      </div>
    );
  }

  const status = subscription.status;
  const canOperate = status === 'active' || status === 'overdue';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === 'pending_activation_payment' && (
        <Button size="sm" onClick={onActivate}>
          <ShieldCheck className="mr-2 h-4 w-4" />
          Mark activation paid
        </Button>
      )}
      {canOperate && (
        <Button size="sm" variant="outline" onClick={onChangeVersion}>
          <Settings2 className="mr-2 h-4 w-4" />
          Change version
        </Button>
      )}
      {canOperate && (
        <Button size="sm" variant="outline" onClick={() => onLifecycle('suspend')}>
          Suspend
        </Button>
      )}
      {status === 'suspended' && (
        <Button size="sm" onClick={() => onLifecycle('reinstate')}>
          Reinstate
        </Button>
      )}
      {status !== 'closed' && (
        <Button size="sm" variant="outline" onClick={() => onLifecycle('close')}>
          Close
        </Button>
      )}
      <Button size="sm" variant="outline" onClick={onAdjust}>
        <Coins className="mr-2 h-4 w-4" />
        Adjust credits
      </Button>
    </div>
  );
}

function fulfilled<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === 'fulfilled' ? result.value : null;
}

function subscriptionCurrency(subscription: OrganizationSubscription | null): string {
  return subscription?.plan_version?.currency ?? 'USD';
}

function availableBalance(balance: QRCreditBalance | null): string {
  return String(balance?.balance_credits ?? 0);
}

function subscriptionError(result: PromiseSettledResult<OrganizationSubscription>): string | null {
  if (result.status !== 'rejected') return null;
  const failure = result.reason as SubscriptionApiError;
  if (failure?.status === 404) return null;
  return failure?.message ?? 'Could not load the subscription.';
}

function organizationName(
  result: PromiseSettledResult<Awaited<ReturnType<typeof AdminOrganizationService.getById>>>,
  subscription: OrganizationSubscription | null,
  fallback: string,
): string {
  const organization = fulfilled(result);
  if (organization) return organization.slug || organization.name;
  return subscription?.organization_name ?? fallback;
}

function useOrganizationSubscriptionData(organizationId: string, reloadToken: number) {
  const [subscription, setSubscription] = React.useState<OrganizationSubscription | null>(null);
  const [balance, setBalance] = React.useState<QRCreditBalance | null>(null);
  const [batches, setBatches] = React.useState<CreditBatch[]>([]);
  const [ledger, setLedger] = React.useState<QRCreditLedgerItem[]>([]);
  const [organizationLabel, setOrganizationLabel] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = async () => {
      const [subscriptionResult, balanceResult, ledgerResult, batchesResult, orgResult] = await Promise.allSettled([
        SubscriptionService.getSubscription(organizationId),
        SubscriptionService.getCreditBalance(organizationId),
        SubscriptionService.getCreditLedger(organizationId, 1, 20),
        SubscriptionService.getCreditBatches(organizationId),
        AdminOrganizationService.getById(organizationId),
      ]);
      if (cancelled) return;

      const subscriptionValue = fulfilled(subscriptionResult);
      const balanceValue = fulfilled(balanceResult);
      const ledgerValue = fulfilled(ledgerResult);
      const batchesValue = fulfilled(batchesResult);

      setSubscription(subscriptionValue);
      setError(subscriptionError(subscriptionResult));
      if (balanceValue) setBalance(balanceValue);
      if (ledgerValue) setLedger(ledgerValue.transactions ?? []);
      if (batchesValue) setBatches(batchesValue.items ?? []);
      setOrganizationLabel(organizationName(orgResult, subscriptionValue, organizationId));
      setLoading(false);
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [organizationId, reloadToken]);

  return { subscription, balance, batches, ledger, organizationLabel, loading, error };
}

interface SubscriptionDialogsProps {
  orgId: string;
  subscription: OrganizationSubscription | null;
  balance: QRCreditBalance | null;
  currency: string;
  organizationLabel: string;
  assignOpen: boolean;
  activateOpen: boolean;
  changeOpen: boolean;
  adjustOpen: boolean;
  lifecycleAction: SubscriptionLifecycleAction | null;
  onAssignOpen: (open: boolean) => void;
  onActivateOpen: (open: boolean) => void;
  onChangeOpen: (open: boolean) => void;
  onAdjustOpen: (open: boolean) => void;
  onLifecycleAction: (action: SubscriptionLifecycleAction | null) => void;
  onReload: () => void;
}

function SubscriptionDialogs({
  orgId,
  subscription,
  balance,
  currency,
  organizationLabel,
  assignOpen,
  activateOpen,
  changeOpen,
  adjustOpen,
  lifecycleAction,
  onAssignOpen,
  onActivateOpen,
  onChangeOpen,
  onAdjustOpen,
  onLifecycleAction,
  onReload,
}: SubscriptionDialogsProps) {
  return (
    <>
      <AssignPlanDialog open={assignOpen} onOpenChange={onAssignOpen} organizationId={orgId} onCreated={onReload} />

      {subscription && (
        <ActivateSubscriptionDialog open={activateOpen}
          onOpenChange={onActivateOpen}
          organizationId={orgId}
          expectedFee={subscription.activation_fee}
          currency={currency}
          onActivated={onReload} />
      )}

      {subscription && (
        <ChangeVersionDialog open={changeOpen} onOpenChange={onChangeOpen} current={subscription} onChanged={onReload} />
      )}

      <CreditAdjustmentDialog open={adjustOpen}
        onOpenChange={onAdjustOpen}
        organizationId={orgId}
        availableBalance={availableBalance(balance)}
        onDone={onReload} />

      {lifecycleAction && (
        <SubscriptionActionDialog open={Boolean(lifecycleAction)}
          onOpenChange={(open) => !open && onLifecycleAction(null)}
          action={lifecycleAction}
          organizationId={orgId}
          organizationLabel={organizationLabel || orgId}
          onDone={onReload} />
      )}
    </>
  );
}

export function OrganizationSubscriptionPage() {
  const { orgId = '' } = useParams();
  const navigate = useNavigate();
  const { hasAnyPermission, loading: permissionsLoading } = usePermissions();
  const canManage = hasAnyPermission(BILLING_WRITE_PERMISSION_CODES);
  const [reloadToken, setReloadToken] = React.useState(0);
  const { subscription, balance, batches, ledger, organizationLabel, loading, error } = useOrganizationSubscriptionData(orgId, reloadToken);
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [activateOpen, setActivateOpen] = React.useState(false);
  const [changeOpen, setChangeOpen] = React.useState(false);
  const [adjustOpen, setAdjustOpen] = React.useState(false);
  const [lifecycleAction, setLifecycleAction] = React.useState<SubscriptionLifecycleAction | null>(null);

  const reload = () => setReloadToken((token) => token + 1);
  const currency = subscriptionCurrency(subscription);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="-ml-2 h-7 px-2" onClick={() => navigate('/subscriptions/customers')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Subscriptions
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{organizationLabel || 'Organization'}</h1>
            <SubscriptionStatusBadge status={subscription?.status} />
          </div>
          <p className="font-mono text-xs text-muted-foreground">{orgId}</p>
        </div>
        <Button variant="outline" size="sm" onClick={reload}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}

      {!permissionsLoading && !canManage && <BillingReadOnlyNotice requiredPermission="system_admin.billing_update" />}

      <SubscriptionActions subscription={subscription}
        canManage={canManage}
        onAssign={() => setAssignOpen(true)}
        onActivate={() => setActivateOpen(true)}
        onChangeVersion={() => setChangeOpen(true)}
        onLifecycle={setLifecycleAction}
        onAdjust={() => setAdjustOpen(true)} />

      {subscription ? (
        <SubscriptionHeader subscription={subscription} currency={currency} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm font-medium">No subscription yet</p>
            <p className="max-w-md text-xs text-muted-foreground">
              Assign a published plan version to start activation and recurring billing for this organization.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Credits</h2>
        <CreditSummary balance={balance} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Credit batches</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <BatchesTable batches={batches} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ledger (latest 20)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <LedgerTable entries={ledger} />
        </CardContent>
      </Card>

      <SubscriptionDialogs orgId={orgId}
        subscription={subscription}
        balance={balance}
        currency={currency}
        organizationLabel={organizationLabel}
        assignOpen={assignOpen}
        activateOpen={activateOpen}
        changeOpen={changeOpen}
        adjustOpen={adjustOpen}
        lifecycleAction={lifecycleAction}
        onAssignOpen={setAssignOpen}
        onActivateOpen={setActivateOpen}
        onChangeOpen={setChangeOpen}
        onAdjustOpen={setAdjustOpen}
        onLifecycleAction={setLifecycleAction}
        onReload={reload} />
    </div>
  );
}
