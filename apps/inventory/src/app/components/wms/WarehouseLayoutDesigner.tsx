import * as React from 'react';

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Edit3,
  FilePlus,
  Info,
  LayoutTemplate,
  Loader2,
  Plus,
  Save,
  Trash2,
  Wand2,
} from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { cn } from '@horizon-sync/ui/lib';

import { useUserStore } from '@horizon-sync/store';

import { floorPlanApi } from '../../utility/api/floorplan';
import type {
  AisleSpec,
  FloorPlanApplyResponse,
  FloorPlanConfig,
  FloorPlanPreviewResponse,
  FloorPlanResponse,
  FloorPlanUpdateResponse,
  ZoneSpec,
} from '../../types/floorplan.types';
import {
  defaultAisleSpec,
  defaultFloorPlanConfig,
  defaultZoneSpec,
  LAYOUT_TEMPLATES,
} from '../../types/floorplan.types';

// ─── helpers ─────────────────────────────────────────────────────────────────

function countBins(config: FloorPlanConfig): number {
  let n = 0;
  for (const z of config.zones)
    for (const a of z.aisles)
      n += a.num_bays * a.num_levels * a.bins_per_level;
  return n;
}

// ─── Number field ─────────────────────────────────────────────────────────────

function NumField({
  label,
  value,
  onChange,
  min,
  step = 1,
  className,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        value={value}
        min={min}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="h-8 text-xs"
      />
    </div>
  );
}

// ─── AisleRow ─────────────────────────────────────────────────────────────────

function AisleRow({
  aisle,
  index,
  zoneIndex,
  onChange,
  onRemove,
}: {
  aisle: AisleSpec;
  index: number;
  zoneIndex: number;
  onChange: (a: AisleSpec) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = React.useState(index === 0);
  const bins = aisle.num_bays * aisle.num_levels * aisle.bins_per_level;

  return (
    <div className="rounded-md border bg-background">
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none"
        onClick={() => setOpen((o) => !o)}>
        {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
        <span className="text-xs font-medium flex-1 truncate">
          Aisle&nbsp;<span className="font-mono">{aisle.code || `Z${zoneIndex + 1}-A${index + 1}`}</span>
        </span>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
          {bins} bins
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}>
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      </div>

      {open && (
        <div className="px-3 pb-3 pt-1 grid grid-cols-2 gap-x-3 gap-y-2 border-t">
          <div className="space-y-1">
            <Label className="text-xs">Code</Label>
            <Input
              value={aisle.code}
              onChange={(e) => onChange({ ...aisle, code: e.target.value })}
              className="h-8 text-xs font-mono"
              placeholder="A01"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Name (optional)</Label>
            <Input
              value={aisle.name ?? ''}
              onChange={(e) => onChange({ ...aisle, name: e.target.value || null })}
              className="h-8 text-xs"
              placeholder="Main Aisle"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Orientation</Label>
            <Select
              value={aisle.orientation}
              onValueChange={(v) => onChange({ ...aisle, orientation: v as 'x' | 'y' })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="x">X-axis (horizontal)</SelectItem>
                <SelectItem value="y">Y-axis (vertical)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <NumField label="Bays" value={aisle.num_bays} min={1}
            onChange={(v) => onChange({ ...aisle, num_bays: v })} />
          <NumField label="Bay spacing" value={aisle.bay_spacing} min={0.1} step={0.5}
            onChange={(v) => onChange({ ...aisle, bay_spacing: v })} />
          <NumField label="Levels" value={aisle.num_levels} min={1}
            onChange={(v) => onChange({ ...aisle, num_levels: v })} />
          <NumField label="Bins / level" value={aisle.bins_per_level} min={1}
            onChange={(v) => onChange({ ...aisle, bins_per_level: v })} />
          <NumField label="Bin capacity" value={aisle.bin_capacity} min={1} step={10}
            onChange={(v) => onChange({ ...aisle, bin_capacity: v })} />
          <NumField label="Grid X" value={aisle.grid_x} step={0.5}
            onChange={(v) => onChange({ ...aisle, grid_x: v })} />
          <NumField label="Grid Y" value={aisle.grid_y} step={0.5}
            onChange={(v) => onChange({ ...aisle, grid_y: v })} />
        </div>
      )}
    </div>
  );
}

// ─── ZoneCard ─────────────────────────────────────────────────────────────────

function ZoneCard({
  zone,
  index,
  onChange,
  onRemove,
}: {
  zone: ZoneSpec;
  index: number;
  onChange: (z: ZoneSpec) => void;
  onRemove: () => void;
}) {
  const totalBins = zone.aisles.reduce(
    (s, a) => s + a.num_bays * a.num_levels * a.bins_per_level,
    0,
  );

  const updateAisle = (ai: number, a: AisleSpec) => {
    const aisles = [...zone.aisles];
    aisles[ai] = a;
    onChange({ ...zone, aisles });
  };

  const addAisle = () => {
    const spec = defaultAisleSpec();
    spec.code = `A${String(zone.aisles.length + 1).padStart(2, '0')}`;
    onChange({ ...zone, aisles: [...zone.aisles, spec] });
  };

  const removeAisle = (ai: number) =>
    onChange({ ...zone, aisles: zone.aisles.filter((_, i) => i !== ai) });

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold flex-1">
          Zone&nbsp;
          <span className="font-mono">{zone.code || `Z${index + 1}`}</span>
        </span>
        <Badge variant="outline" className="text-[10px]">{totalBins} bins</Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onRemove}
          disabled={index === 0}>
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        <div className="space-y-1">
          <Label className="text-xs">Zone Code</Label>
          <Input
            value={zone.code}
            onChange={(e) => onChange({ ...zone, code: e.target.value })}
            className="h-8 text-xs font-mono"
            placeholder="A"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Name (optional)</Label>
          <Input
            value={zone.name ?? ''}
            onChange={(e) => onChange({ ...zone, name: e.target.value || null })}
            className="h-8 text-xs"
            placeholder="Ambient Storage"
          />
        </div>
        <NumField label="Grid X origin" value={zone.grid_x} step={1}
          onChange={(v) => onChange({ ...zone, grid_x: v })} />
        <NumField label="Grid Y origin" value={zone.grid_y} step={1}
          onChange={(v) => onChange({ ...zone, grid_y: v })} />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Aisles</p>
        {zone.aisles.map((a, ai) => (
          <AisleRow
            key={ai}
            aisle={a}
            index={ai}
            zoneIndex={index}
            onChange={(updated) => updateAisle(ai, updated)}
            onRemove={() => removeAisle(ai)}
          />
        ))}
        <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs h-8" onClick={addAisle}>
          <Plus className="h-3.5 w-3.5" />
          Add Aisle
        </Button>
      </div>
    </div>
  );
}

// ─── SummaryBox ───────────────────────────────────────────────────────────────

function SummaryBox({ preview }: { preview: FloorPlanPreviewResponse | FloorPlanApplyResponse }) {
  const s = preview.summary;
  return (
    <div className="rounded-lg border bg-green-50 dark:bg-green-950/20 p-4 space-y-2">
      <div className="flex items-center gap-2 text-green-800 dark:text-green-400 font-medium text-sm">
        <CheckCircle2 className="h-4 w-4" />
        <span>{'locations_created' in preview
          ? `Applied - ${preview.locations_created} locations created`
          : 'Preview ready'}</span>
      </div>
      <div className="grid grid-cols-5 gap-2 text-xs text-center">
        {[
          { label: 'Zones', val: s.zone_count },
          { label: 'Aisles', val: s.aisle_count },
          { label: 'Bays', val: s.bay_count },
          { label: 'Levels', val: s.level_count },
          { label: 'Bins', val: s.bin_count },
        ].map(({ label, val }) => (
          <div key={label} className="rounded-md bg-white dark:bg-green-950/40 py-2 px-1">
            <p className="font-semibold text-base text-green-900 dark:text-green-300">{val}</p>
            <p className="text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      {s.sample_bin_codes.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Sample codes:&nbsp;
          <span className="font-mono">{s.sample_bin_codes.join(', ')}{s.bin_count > 6 ? ' …' : ''}</span>
        </p>
      )}
      {'locations_deleted' in preview && preview.locations_deleted > 0 && (
        <p className="text-xs text-amber-700 flex items-center gap-1">
          <AlertTriangle className="h-3.5 w-3.5" />
          {preview.locations_deleted} existing locations deactivated
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WarehouseLayoutDesigner({
  warehouseId,
  onApplied,
}: {
  warehouseId: string;
  /** Called after a successful apply so parent can refresh the 3D view. */
  onApplied?: () => void;
}) {
  const accessToken = useUserStore((s) => s.accessToken);

  // Saved layouts state
  const [savedLayouts, setSavedLayouts] = React.useState<FloorPlanResponse[]>([]);
  const [loadingLayouts, setLoadingLayouts] = React.useState(false);
  const [editingPlanId, setEditingPlanId] = React.useState<string | null>(null);

  // Designer form state
  const [config, setConfig] = React.useState<FloorPlanConfig>(defaultFloorPlanConfig);
  const [planName, setPlanName] = React.useState('Initial layout v1');
  const [preview, setPreview] = React.useState<FloorPlanPreviewResponse | null>(null);
  const [applyResult, setApplyResult] = React.useState<FloorPlanApplyResponse | FloorPlanUpdateResponse | null>(null);
  const [previewing, setPreviewing] = React.useState(false);
  const [applying, setApplying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Delete state
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

  const totalBins = countBins(config);

  // Fetch saved layouts on mount and when warehouse changes
  const fetchLayouts = React.useCallback(async () => {
    if (!accessToken) return;
    setLoadingLayouts(true);
    try {
      const data = await floorPlanApi.list(accessToken, warehouseId);
      setSavedLayouts(data);
    } catch {
      /* silent — list failure is non-critical */
    } finally {
      setLoadingLayouts(false);
    }
  }, [accessToken, warehouseId]);

  React.useEffect(() => {
    fetchLayouts();
  }, [fetchLayouts]);

  // Load a saved layout into the form for editing
  const loadLayout = (plan: FloorPlanResponse) => {
    setConfig(plan.config);
    setPlanName(plan.name);
    setEditingPlanId(plan.id);
    setPreview(null);
    setApplyResult(null);
    setError(null);
  };

  // Reset to new layout mode
  const resetToNew = () => {
    setConfig(defaultFloorPlanConfig());
    setPlanName('');
    setEditingPlanId(null);
    setPreview(null);
    setApplyResult(null);
    setError(null);
  };

  // Zone CRUD
  const updateZone = (zi: number, z: ZoneSpec) => {
    const zones = [...config.zones];
    zones[zi] = z;
    setConfig({ ...config, zones });
    setPreview(null);
    setApplyResult(null);
  };

  const addZone = () => {
    const z = defaultZoneSpec();
    z.code = String.fromCharCode(65 + config.zones.length); // A, B, C …
    z.grid_y = config.zones.length * 10;
    setConfig({ ...config, zones: [...config.zones, z] });
  };

  const removeZone = (zi: number) =>
    setConfig({ ...config, zones: config.zones.filter((_, i) => i !== zi) });

  // Preview
  const handlePreview = async () => {
    if (!accessToken) return;
    setPreviewing(true);
    setError(null);
    setApplyResult(null);
    try {
      const res = await floorPlanApi.preview(accessToken, { warehouse_id: warehouseId, config });
      setPreview(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed');
    } finally {
      setPreviewing(false);
    }
  };

  // Apply (create new) or Update (edit existing)
  const handleApply = async () => {
    if (!accessToken || !planName.trim()) return;
    setApplying(true);
    setError(null);
    try {
      if (editingPlanId) {
        // Update existing layout
        const res = await floorPlanApi.update(accessToken, editingPlanId, {
          name: planName.trim(),
          config,
        });
        setApplyResult(res);
      } else {
        // Create new layout
        const res = await floorPlanApi.apply(accessToken, {
          warehouse_id: warehouseId,
          name: planName.trim(),
          config,
          replace_existing: true,
        });
        setApplyResult(res);
        setEditingPlanId(res.floor_plan_id);
      }
      setPreview(null);
      onApplied?.();
      fetchLayouts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Apply failed');
    } finally {
      setApplying(false);
    }
  };

  // Delete a layout
  const handleDelete = async (planId: string) => {
    if (!accessToken) return;
    setDeletingId(planId);
    try {
      await floorPlanApi.delete(accessToken, planId, true);
      // If we were editing this plan, reset to new mode
      if (editingPlanId === planId) {
        resetToNew();
      }
      fetchLayouts();
      onApplied?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeletingId(null);
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold">Layout Designer</h3>
          <p className="text-xs text-muted-foreground">
            {editingPlanId
              ? 'Editing saved layout — modify and click "Update Layout" to apply changes.'
              : 'Define zones and aisles — the system generates all bin locations with 3D positions automatically.'}
          </p>
        </div>
        <Badge variant="secondary" className="text-sm font-mono px-3 py-1 shrink-0">
          {totalBins} bins total
        </Badge>
      </div>

      {/* Saved Layouts Panel */}
      <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Saved Layouts
          </p>
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={resetToNew}>
            <FilePlus className="h-3.5 w-3.5" />
            New Layout
          </Button>
        </div>

        {loadingLayouts && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading saved layouts…
          </div>
        )}

        {!loadingLayouts && savedLayouts.length === 0 && (
          <p className="text-xs text-muted-foreground italic py-1">
            No saved layouts for this warehouse yet. Design one below and apply it.
          </p>
        )}

        {!loadingLayouts && savedLayouts.length > 0 && (
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {savedLayouts.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  'flex items-center gap-2 rounded-md border p-2 text-xs transition-colors',
                  editingPlanId === plan.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-accent',
                )}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium truncate">{plan.name}</p>
                    {plan.is_active && (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 text-emerald-700 bg-emerald-100 shrink-0">
                        Active
                      </Badge>
                    )}
                    {!plan.is_active && !plan.generated_at && (
                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0 text-violet-700 bg-violet-100 shrink-0">
                        Template
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {plan.config.zones.length} zone{plan.config.zones.length !== 1 ? 's' : ''}
                    {' · '}
                    {countBins(plan.config)} bins
                    {plan.generated_at && (
                      <> · Applied {new Date(plan.generated_at).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
                <Button
                  variant={editingPlanId === plan.id ? 'default' : 'outline'}
                  size="sm"
                  className="h-6 text-[10px] px-2 gap-1"
                  onClick={() => loadLayout(plan)}>
                  <Edit3 className="h-3 w-3" />
                  {editingPlanId === plan.id ? 'Editing' : 'Edit'}
                </Button>
                {deleteConfirmId === plan.id ? (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      disabled={deletingId === plan.id}
                      onClick={() => handleDelete(plan.id)}>
                      {deletingId === plan.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Confirm'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => setDeleteConfirmId(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setDeleteConfirmId(plan.id)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preloaded Templates */}
      {!editingPlanId && savedLayouts.length === 0 && (
        <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <LayoutTemplate className="h-3.5 w-3.5" />
            Start from a Template
          </p>
          <p className="text-xs text-muted-foreground">
            Choose a preloaded layout as a starting point — customize it before applying.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {LAYOUT_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => {
                  setConfig(tpl.config);
                  setPlanName(tpl.name);
                  setEditingPlanId(null);
                  setPreview(null);
                  setApplyResult(null);
                }}
                className="text-left rounded-md border p-2.5 hover:bg-accent transition-colors space-y-1">
                <p className="text-xs font-medium">{tpl.name}</p>
                <p className="text-[10px] text-muted-foreground">{tpl.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Templates quick-access when layouts exist */}
      {!editingPlanId && savedLayouts.length > 0 && (
        <details className="rounded-lg border bg-muted/20 p-3 group">
          <summary className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 cursor-pointer select-none">
            <LayoutTemplate className="h-3.5 w-3.5" />
            Start from a Template
            <ChevronRight className="h-3 w-3 ml-auto transition-transform group-open:rotate-90" />
          </summary>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {LAYOUT_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => {
                  setConfig(tpl.config);
                  setPlanName(tpl.name);
                  setEditingPlanId(null);
                  setPreview(null);
                  setApplyResult(null);
                }}
                className="text-left rounded-md border p-2.5 hover:bg-accent transition-colors space-y-1">
                <p className="text-xs font-medium">{tpl.name}</p>
                <p className="text-[10px] text-muted-foreground">{tpl.description}</p>
              </button>
            ))}
          </div>
        </details>
      )}

      {/* Editing indicator */}
      {editingPlanId && (
        <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs">
          <Edit3 className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>
            Editing: <span className="font-semibold">{planName}</span>
            {' — '}changes will replace the existing layout and regenerate all locations.
          </span>
          <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 ml-auto" onClick={resetToNew}>
            Cancel edit
          </Button>
        </div>
      )}

      {/* Global setting */}
      <div className="flex items-end gap-4">
        <NumField
          label="Grid unit (world units)"
          value={config.grid_unit}
          min={0.1}
          step={0.5}
          className="w-48"
          onChange={(v) => setConfig({ ...config, grid_unit: v })}
        />
        <p className="text-xs text-muted-foreground pb-1">
          Controls scale for display purposes only.
        </p>
      </div>

      {/* Zone list */}
      <div className="space-y-3">
        {config.zones.map((zone, zi) => (
          <ZoneCard
            key={zi}
            zone={zone}
            index={zi}
            onChange={(z) => updateZone(zi, z)}
            onRemove={() => removeZone(zi)}
          />
        ))}
        <Button variant="outline" className="w-full gap-2" onClick={addZone}>
          <Plus className="h-4 w-4" />
          Add Zone
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Preview / Apply result */}
      {preview && <SummaryBox preview={preview} />}
      {applyResult && <SummaryBox preview={applyResult} />}

      {/* Action bar */}
      <div className="flex items-end gap-3 flex-wrap border-t pt-4">
        <div className="flex-1 min-w-48 space-y-1">
          <Label className="text-xs">Plan name (required to apply)</Label>
          <Input
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="My warehouse layout"
            className="h-8 text-sm"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handlePreview}
          disabled={previewing || config.zones.length === 0}>
          {previewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          Preview
        </Button>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={handleApply}
          disabled={applying || !planName.trim() || config.zones.length === 0}>
          {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : editingPlanId ? <Save className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {editingPlanId ? 'Update Layout' : 'Apply Layout'}
        </Button>
      </div>
    </div>
  );
}
