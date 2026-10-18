import * as React from 'react';

import { ArrowLeft, CheckCircle2, Loader2, Pencil, Plus, Upload } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { toast } from '@horizon-sync/ui';
import { Button } from '@horizon-sync/ui/components';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';

import { PlanVersionDialog } from '../components/subscription/PlanVersionDialog';
import { PublishVersionDialog, RetireVersionDialog } from '../components/subscription/PublishVersionDialog';
import { Money, PlanVersionStatusBadge, cadenceLabel, formatDate, formatDateTime, formatDecimal } from '../components/subscription/SubscriptionUI';
import { useIdempotencyKey } from '../hooks/useIdempotencyKey';
import { usePermissions } from '../hooks/usePermissions';
import { SubscriptionApiError, SubscriptionService } from '../services/subscription.service';
import { SYSTEM_ADMIN_PERMISSIONS } from '../types/permissions';
import type { SubscriptionPlanDetail, SubscriptionPlanVersion } from '../types/subscription.types';

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function VersionFacts({ version, currency }: { version: SubscriptionPlanVersion; currency: string }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <DetailItem label="Cadence" value={cadenceLabel(version.billing_cadence)} />
      <DetailItem label="Base price" value={<Money value={version.base_price} currency={currency} />} />
      <DetailItem label="Tax rate" value={`${formatDecimal(version.tax_rate, 4)}%`} />
      <DetailItem label="Included credits" value={formatDecimal(version.included_credits, 2)} />
      <DetailItem label="ID weight" value={formatDecimal(version.id_weight, 6)} />
      <DetailItem label="Top-ups" value={version.topup_allowed ? 'Allowed' : 'Blocked'} />
      <DetailItem label="Effective from" value={formatDateTime(version.effective_from)} />
      <DetailItem label="Effective to" value={version.effective_to ? formatDateTime(version.effective_to) : 'Open'} />
    </div>
  );
}

interface VersionActionsProps {
  version: SubscriptionPlanVersion;
  canManage: boolean;
  busy: boolean;
  onEdit: () => void;
  onApprove: () => void;
  onPublish: () => void;
  onRetire: () => void;
}

function VersionActions({ version, canManage, busy, onEdit, onApprove, onPublish, onRetire }: VersionActionsProps) {
  if (!canManage) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {version.status === 'draft' && (
        <Button size="sm" variant="outline" onClick={onEdit} disabled={busy}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          Edit draft
        </Button>
      )}
      {version.status === 'draft' && (
        <Button size="sm" variant="outline" onClick={onApprove} disabled={busy}>
          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
          Approve
        </Button>
      )}
      {version.status === 'approved' && (
        <Button size="sm" onClick={onPublish} disabled={busy}>
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          Publish
        </Button>
      )}
      {version.status === 'published' && (
        <Button size="sm" variant="outline" onClick={onRetire} disabled={busy}>
          Retire
        </Button>
      )}
    </div>
  );
}

function VersionCard({
  version,
  currency,
  canManage,
  busy,
  onEdit,
  onApprove,
  onPublish,
  onRetire,
}: VersionActionsProps & { currency: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold">v{version.version}</span>
          <PlanVersionStatusBadge status={version.status} />
          {version.approved_by && <Badge variant="outline">Approved by {version.approved_by.slice(0, 8)}</Badge>}
        </div>
        <VersionActions version={version}
          canManage={canManage}
          busy={busy}
          onEdit={onEdit}
          onApprove={onApprove}
          onPublish={onPublish}
          onRetire={onRetire} />
      </div>
      <VersionFacts version={version} currency={currency} />
      <p className="mt-3 text-xs text-muted-foreground">Created {formatDate(version.created_at)}</p>
    </div>
  );
}

function scopeLabel(plan: SubscriptionPlanDetail): string {
  if (!plan.organization_id) return 'Global catalog plan';
  return `Organization-specific · ${plan.organization_name ?? plan.organization_id}`;
}

function PlanHeader({ plan, canManage, onBack, onCreate }: { plan: SubscriptionPlanDetail; canManage: boolean; onBack: () => void; onCreate: () => void }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1">
        <Button variant="ghost" size="sm" className="-ml-2 h-7 px-2" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Plans
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{plan.name}</h1>
          <Badge variant="outline" className="font-mono">{plan.code}</Badge>
          <Badge variant={plan.is_active ? 'success' : 'secondary'}>{plan.is_active ? 'Active' : 'Inactive'}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{scopeLabel(plan)}</p>
      </div>
      {canManage && (
        <Button size="sm" onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New version
        </Button>
      )}
    </div>
  );
}

function PlanSummaryCard({ plan }: { plan: SubscriptionPlanDetail }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Plan configuration</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <DetailItem label="Currency" value={plan.currency} />
        <DetailItem label="Scope" value={plan.organization_id ? 'Organization' : 'Global'} />
        <DetailItem label="Published version" value={plan.published_version ? `v${plan.published_version.version}` : '—'} />
        <DetailItem label="Draft versions" value={plan.draft_version_count} />
        {plan.description && (
          <div className="col-span-2 sm:col-span-4">
            <DetailItem label="Description" value={<span className="font-normal text-muted-foreground">{plan.description}</span>} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PlanVersionsProps {
  plan: SubscriptionPlanDetail;
  versions: SubscriptionPlanVersion[];
  canManage: boolean;
  busyVersionId: string | null;
  onCreate: () => void;
  onEdit: (version: SubscriptionPlanVersion) => void;
  onApprove: (version: SubscriptionPlanVersion) => void;
  onPublish: (version: SubscriptionPlanVersion) => void;
  onRetire: (version: SubscriptionPlanVersion) => void;
}

function PlanVersions({ plan, versions, canManage, busyVersionId, onCreate, onEdit, onApprove, onPublish, onRetire }: PlanVersionsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Versions</h2>
        <p className="text-xs text-muted-foreground">Published versions are immutable.</p>
      </div>

      {versions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border py-10 text-center">
          <p className="text-sm text-muted-foreground">No versions yet. Create a draft to set pricing, credits and ID weight.</p>
          {canManage && (
            <Button size="sm" variant="outline" onClick={onCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create draft version
            </Button>
          )}
        </div>
      ) : (
        versions.map((version) => (
          <VersionCard key={version.id}
            version={version}
            currency={plan.currency}
            canManage={canManage}
            busy={busyVersionId === version.id}
            onEdit={() => onEdit(version)}
            onApprove={() => onApprove(version)}
            onPublish={() => onPublish(version)}
            onRetire={() => onRetire(version)} />
        ))
      )}
    </div>
  );
}

export function SubscriptionPlanDetailPage() {
  const { planId = '' } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(SYSTEM_ADMIN_PERMISSIONS.BILLING_UPDATE);
  const keyFor = useIdempotencyKey();
  const [plan, setPlan] = React.useState<SubscriptionPlanDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busyVersionId, setBusyVersionId] = React.useState<string | null>(null);
  const [versionDialogOpen, setVersionDialogOpen] = React.useState(false);
  const [editingVersion, setEditingVersion] = React.useState<SubscriptionPlanVersion | null>(null);
  const [publishTarget, setPublishTarget] = React.useState<SubscriptionPlanVersion | null>(null);
  const [retireTarget, setRetireTarget] = React.useState<SubscriptionPlanVersion | null>(null);

  const load = React.useCallback(async () => {
    if (!planId) return;
    setLoading(true);
    setError(null);
    try {
      setPlan(await SubscriptionService.getPlan(planId));
    } catch (err) {
      setError(err instanceof SubscriptionApiError ? err.message : 'Could not load this plan.');
    } finally {
      setLoading(false);
    }
  }, [planId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const handleApprove = async (version: SubscriptionPlanVersion) => {
    setBusyVersionId(version.id);
    try {
      await SubscriptionService.approveVersion(planId, version.id, keyFor({ planId, versionId: version.id, action: 'approve' }));
      toast({ title: 'Version approved', description: `v${version.version} can now be published.` });
      await load();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Approval failed', description: err instanceof SubscriptionApiError ? err.message : 'Try again.' });
    } finally {
      setBusyVersionId(null);
    }
  };

  const openEdit = (version: SubscriptionPlanVersion) => {
    setEditingVersion(version);
    setVersionDialogOpen(true);
  };

  const openCreate = () => {
    setEditingVersion(null);
    setVersionDialogOpen(true);
  };

  if (loading && !plan) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/subscriptions/plans')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to plans
        </Button>
        <div className="flex flex-col items-center gap-3 rounded-lg border py-10 text-center">
          <p className="text-sm text-destructive">{error ?? 'Plan not found.'}</p>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const versions = [...(plan.versions ?? [])].sort((a, b) => b.version - a.version);

  return (
    <div className="space-y-6">
      <PlanHeader plan={plan}
        canManage={canManage}
        onBack={() => navigate('/subscriptions/plans')}
        onCreate={openCreate} />

      <PlanSummaryCard plan={plan} />

      <PlanVersions plan={plan}
        versions={versions}
        canManage={canManage}
        busyVersionId={busyVersionId}
        onCreate={openCreate}
        onEdit={openEdit}
        onApprove={(version) => void handleApprove(version)}
        onPublish={setPublishTarget}
        onRetire={setRetireTarget} />

      <PlanVersionDialog open={versionDialogOpen}
        onOpenChange={setVersionDialogOpen}
        planId={planId}
        planCode={plan.code}
        currency={plan.currency}
        version={editingVersion}
        onSaved={() => void load()} />

      <PublishVersionDialog open={Boolean(publishTarget)}
        onOpenChange={(open) => !open && setPublishTarget(null)}
        planId={planId}
        planCode={plan.code}
        version={publishTarget}
        onDone={() => void load()} />

      <RetireVersionDialog open={Boolean(retireTarget)}
        onOpenChange={(open) => !open && setRetireTarget(null)}
        planId={planId}
        planCode={plan.code}
        version={retireTarget}
        onDone={() => void load()} />
    </div>
  );
}
