import * as React from 'react';

import { AlertCircle, ArrowDown, ArrowUp, Loader2, RotateCcw, Save } from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';
import { Switch } from '@horizon-sync/ui/components/ui/switch';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { dashboardLayoutService, type DashboardWidget, type WidgetOverride } from '../services/dashboardLayoutService';
import { hasPermissionFromStore } from '../utils/permissions';

export interface DashboardLayoutSettingsProps {
  organizationId: string;
  accessToken: string;
  canEdit: boolean;
}

function toOverrides(widgets: DashboardWidget[]): WidgetOverride[] {
  return widgets.map((widget, index) => ({ id: widget.id, enabled: widget.enabled, order: index }));
}

function overridesEqual(a: WidgetOverride[], b: WidgetOverride[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((item, index) => item.id === b[index].id && item.enabled === b[index].enabled);
}

/** Swap a widget with its neighbour and renumber `order` to the array index. */
function moveWidget(widgets: DashboardWidget[], index: number, direction: -1 | 1): DashboardWidget[] {
  const target = index + direction;
  if (target < 0 || target >= widgets.length) return widgets;
  const next = [...widgets];
  const [moved] = next.splice(index, 1);
  next.splice(target, 0, moved);
  return next.map((widget, position) => ({ ...widget, order: position }));
}

function toggleWidget(widgets: DashboardWidget[], id: string, enabled: boolean): DashboardWidget[] {
  return widgets.map((widget) => (widget.id === id ? { ...widget, enabled } : widget));
}

function LayoutToolbar({
  canEdit,
  dirty,
  saving,
  enabledCount,
  total,
  onSave,
  onReset,
}: {
  canEdit: boolean;
  dirty: boolean;
  saving: boolean;
  enabledCount: number;
  total: number;
  onSave: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-lg font-semibold">Dashboard Layout</h3>
        <p className="text-sm text-muted-foreground">
          {enabledCount} of {total} widgets shown. Choose which widgets appear on your dashboard and their order.
        </p>
      </div>
      <div className="flex items-center gap-2">
        {dirty && <span className="text-xs text-muted-foreground">Unsaved changes</span>}
        <Button variant="outline" className="gap-2" onClick={onReset} disabled={!canEdit || saving}>
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
        <Button className="gap-2" onClick={onSave} disabled={!canEdit || !dirty || saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </Button>
      </div>
    </div>
  );
}

function WidgetRow({
  widget,
  index,
  count,
  canEdit,
  onToggle,
  onMove,
}: {
  widget: DashboardWidget;
  index: number;
  count: number;
  canEdit: boolean;
  onToggle: (id: string, enabled: boolean) => void;
  onMove: (index: number, direction: -1 | 1) => void;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex flex-col">
          <Button variant="ghost"
            size="icon"
            className="h-6 w-6"
            aria-label={`Move ${widget.label} up`}
            disabled={!canEdit || index === 0}
            onClick={() => onMove(index, -1)}>
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button variant="ghost"
            size="icon"
            className="h-6 w-6"
            aria-label={`Move ${widget.label} down`}
            disabled={!canEdit || index === count - 1}
            onClick={() => onMove(index, 1)}>
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-medium">{widget.label}</p>
          {widget.description && <p className="text-xs text-muted-foreground">{widget.description}</p>}
          <div className="mt-1 flex flex-wrap gap-1">
            {widget.chart_type && <Badge variant="outline">{widget.chart_type}</Badge>}
            {widget.is_default === false && <Badge variant="secondary">Customized</Badge>}
          </div>
        </div>

        <Switch checked={widget.enabled}
          disabled={!canEdit}
          aria-label={`Show ${widget.label}`}
          onCheckedChange={(value) => onToggle(widget.id, value)} />
      </CardContent>
    </Card>
  );
}

function WidgetList({
  widgets,
  groups,
  canEdit,
  onToggle,
  onMove,
}: {
  widgets: DashboardWidget[];
  groups: Record<string, string>;
  canEdit: boolean;
  onToggle: (id: string, enabled: boolean) => void;
  onMove: (index: number, direction: -1 | 1) => void;
}) {
  return (
    <div className="space-y-3">
      {widgets.map((widget, index) => {
        const previous = widgets[index - 1];
        const showGroup = Boolean(widget.group) && widget.group !== previous?.group;
        return (
          <React.Fragment key={widget.id}>
            {showGroup && (
              <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {widget.group_label ?? groups[widget.group ?? ''] ?? widget.group}
              </p>
            )}
            <WidgetRow widget={widget}
              index={index}
              count={widgets.length}
              canEdit={canEdit}
              onToggle={onToggle}
              onMove={onMove} />
          </React.Fragment>
        );
      })}
    </div>
  );
}

/**
 * Settings → Dashboard Layout tab.
 *
 * Lets an org choose which dashboard widgets are shown and in what order. The
 * selection is saved server-side in `organizations.extra_data.dashboard_layout`
 * and the widget catalogue is owned by the backend.
 */
export function DashboardLayoutSettings({ organizationId, accessToken, canEdit }: DashboardLayoutSettingsProps) {
  const { toast } = useToast();
  const [widgets, setWidgets] = React.useState<DashboardWidget[]>([]);
  const [groups, setGroups] = React.useState<Record<string, string>>({});
  const [saved, setSaved] = React.useState<WidgetOverride[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const applyLayout = React.useCallback((layout: { widgets: DashboardWidget[]; groups: Record<string, string> }) => {
    setWidgets(layout.widgets);
    setGroups(layout.groups);
    setSaved(toOverrides(layout.widgets));
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      applyLayout(await dashboardLayoutService.get(accessToken, organizationId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard layout');
    } finally {
      setLoading(false);
    }
  }, [accessToken, organizationId, applyLayout]);

  React.useEffect(() => {
    load();
  }, [load]);

  const current = toOverrides(widgets);
  const dirty = !overridesEqual(current, saved);
  // The endpoint requires `org.update`; the parent passes the broader
  // `organization.update` flag, so accept either.
  const canEditLayout = canEdit || hasPermissionFromStore('org.update');
  const enabledCount = widgets.filter((widget) => widget.enabled).length;

  const handleMove = (index: number, direction: -1 | 1): void => {
    setWidgets((prev) => moveWidget(prev, index, direction));
  };

  const handleToggle = (id: string, enabled: boolean): void => {
    setWidgets((prev) => toggleWidget(prev, id, enabled));
  };

  const handleSave = async (): Promise<void> => {
    if (saving) return;
    // Snapshot what we send and advance only the baseline — adopting the
    // response body would overwrite edits made while the request was pending.
    const payload = current;
    setSaving(true);
    try {
      await dashboardLayoutService.save(accessToken, organizationId, payload);
      setSaved(payload);
      toast({ title: 'Dashboard layout saved' });
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to save dashboard layout',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (): Promise<void> => {
    if (saving) return;
    setSaving(true);
    try {
      const reset = await dashboardLayoutService.reset(accessToken, organizationId);
      applyLayout(reset ?? (await dashboardLayoutService.get(accessToken, organizationId)));
      toast({ title: 'Dashboard layout reset to default' });
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed to reset dashboard layout',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <LayoutToolbar canEdit={canEditLayout}
        dirty={dirty}
        saving={saving}
        enabledCount={enabledCount}
        total={widgets.length}
        onSave={handleSave}
        onReset={handleReset} />

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive bg-destructive/10 p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
          <div className="flex-1">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="mt-2 gap-2" onClick={load}>
              <RotateCcw className="h-3.5 w-3.5" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {widgets.length === 0 && !error && (
        <div className="py-12 text-center text-muted-foreground">No dashboard widgets available.</div>
      )}

      <WidgetList widgets={widgets}
        groups={groups}
        canEdit={canEditLayout && !saving}
        onToggle={handleToggle}
        onMove={handleMove} />

      {!canEditLayout && (
        <p className="text-sm text-muted-foreground">
          You need the <code className="text-xs">organization.update</code> permission to change the dashboard layout.
        </p>
      )}
    </div>
  );
}
