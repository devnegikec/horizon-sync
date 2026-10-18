import * as React from 'react';

import { AlertTriangle, Coins, CreditCard, RefreshCw, Settings2 } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@horizon-sync/ui/components/ui/tabs';

import { useAuth, usePermissions } from '../../../hooks';
import { useAccountBilling } from '../hooks/useAccountBilling';
import type { AccountSubscription } from '../types';

import { ActivateSubscriptionDialog } from './ActivateSubscriptionDialog';
import { StatusPill } from './BillingFormat';
import { BuyCreditsDialog } from './BuyCreditsDialog';
import { ChangePlanDialog } from './ChangePlanDialog';
import { CreditsPanel } from './CreditsPanel';
import { InvoicesPanel } from './InvoicesPanel';
import { CreditsWidget, PlanFacts, StatusBanner } from './PlanOverview';
import { StartSubscriptionDialog } from './StartSubscriptionDialog';

const TOPUP_PERMISSIONS = ['billing.topup', 'billing.manage', 'qr_product.manage', '*.*'];
const PLAN_PERMISSIONS = ['system_admin.billing_update', 'system_admin.billing_manage', '*.*'];
const SELF_SERVE_PERMISSIONS = ['system_admin.billing_create', 'system_admin.billing_manage', '*.*'];

function LoadingState() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

function NoSubscriptionState({ canSelfServe, onSetup, onRetry }: { canSelfServe: boolean; onSetup: () => void; onRetry: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <CreditCard className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold">No subscription yet</p>
          <p className="max-w-md text-sm text-muted-foreground">
            {canSelfServe
              ? 'Choose a published plan to start billing, credits and ID generation for this organization.'
              : 'Your organization needs a plan before credits and ID generation can start. Request activation and operations will issue the activation invoice.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <Button size="sm" onClick={onSetup}>
            {canSelfServe ? 'Set up subscription' : 'Request activation'}
          </Button>
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SubscriptionHeader({
  subscription,
  canTopUp,
  canChangePlan,
  onBuy,
  onChangePlan,
}: {
  subscription: AccountSubscription;
  canTopUp: boolean;
  canChangePlan: boolean;
  onBuy: () => void;
  onChangePlan: () => void;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">{subscription.plan.name}</h2>
          <StatusPill status={subscription.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          {subscription.plan.code} · version {subscription.plan_version.version}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {canTopUp && subscription.can_top_up && subscription.status !== 'suspended' && (
          <Button size="sm" onClick={onBuy}>
            <Coins className="mr-2 h-4 w-4" />
            Buy credits
          </Button>
        )}
        {canChangePlan && (
          <Button size="sm" variant="outline" onClick={onChangePlan}>
            <Settings2 className="mr-2 h-4 w-4" />
            Change plan
          </Button>
        )}
      </div>
    </div>
  );
}

export function SubscriptionSettings() {
  const { hasAnyPermission } = usePermissions();
  const { user } = useAuth();
  const { subscription, credits, loading, error, reload } = useAccountBilling();
  const [tab, setTab] = React.useState('overview');
  const [buyOpen, setBuyOpen] = React.useState(false);
  const [changeOpen, setChangeOpen] = React.useState(false);
  const [setupOpen, setSetupOpen] = React.useState(false);
  const [activateOpen, setActivateOpen] = React.useState(false);

  const canTopUp = hasAnyPermission(TOPUP_PERMISSIONS);
  const adminMode = hasAnyPermission(PLAN_PERMISSIONS);
  const canSelfServe = hasAnyPermission(SELF_SERVE_PERMISSIONS);
  const organizationId = user?.organization_id ?? '';

  if (loading && !subscription) return <LoadingState />;

  if (error && !subscription) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={reload}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <div className="space-y-6">
        <NoSubscriptionState canSelfServe={canSelfServe}
          onSetup={() => setSetupOpen(true)}
          onRetry={reload} />
        <StartSubscriptionDialog open={setupOpen}
          onOpenChange={setSetupOpen}
          organizationId={organizationId}
          canSelfServe={canSelfServe}
          onCreated={reload} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SubscriptionHeader subscription={subscription}
        canTopUp={canTopUp}
        canChangePlan={subscription.status !== 'closed'}
        onBuy={() => setBuyOpen(true)}
        onChangePlan={() => setChangeOpen(true)} />

      <StatusBanner subscription={subscription} onActivate={() => setActivateOpen(true)} />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="h-auto flex-wrap gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="credits">Credits</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <PlanFacts subscription={subscription} />
          <CreditsWidget credits={credits} canTopUp={canTopUp && subscription.can_top_up} onBuyCredits={() => setBuyOpen(true)} />
        </TabsContent>

        <TabsContent value="credits">
          <CreditsPanel credits={credits} />
        </TabsContent>

        <TabsContent value="invoices">
          <InvoicesPanel />
        </TabsContent>
      </Tabs>

      <BuyCreditsDialog open={buyOpen}
        onOpenChange={setBuyOpen}
        currency={subscription.plan_version.currency ?? 'USD'}
        onPaid={reload} />

      <ChangePlanDialog open={changeOpen}
        onOpenChange={setChangeOpen}
        subscription={subscription}
        adminMode={adminMode}
        onDone={reload} />

      <ActivateSubscriptionDialog open={activateOpen}
        onOpenChange={setActivateOpen}
        subscription={subscription}
        onActivated={reload} />
    </div>
  );
}
