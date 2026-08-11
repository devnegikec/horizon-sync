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
    for (const a of z.aisles) {
      const rowCount = a.rows === 'both' ? 2 : 1;
      n += rowCount * a.num_bays_per_row * a.num_levels * a.bins_per_level;
    }
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
  const [localValue, setLocalValue] = React.useState(String(value));

  // Sync from parent when value changes externally
  React.useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  return (
    <div className={cn('space-y-1', className)}>
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        value={localValue}
        min={min}
        step={step}
        onChange={(e) => {
          setLocalValue(e.target.value);
          const num = parseFloat(e.target.value);
          if (!isNaN(num)) onChange(num);
        }}
        onBlur={() => {
          // On blur, if empty or invalid, reset to min or 0
          const num = parseFloat(localValue);
          if (isNaN(num) || localValue.trim() === '') {
            const fallback = min ?? 0;
            setLocalValue(String(fallback));
            onChange(fallback);
          }
        }}
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
  totalAisles,
  onChange,
  onRemove,
}: {
  aisle: AisleSpec;
  index: number;
  zoneIndex: number;
  totalAisles: number;
  onChange: (a: AisleSpec) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = React.useState(index === 0);
  // Calculate bins: rows (1 or 2) × bays_per_row × levels × bins_per_level
  const rowCount = aisle.rows === 'both' ? 2 : 1;
  const bins = rowCount * aisle.num_bays_per_row * aisle.num_levels * aisle.bins_per_level;

  // Auto-detect edge aisle hint
  const isEdge = totalAisles > 1 && (index === 0 || index === totalAisles - 1);
  const edgeHint = isEdge ? (index === 0 ? '(edge — right row only by default)' : '(edge — left row only by default)') : '';

  return (
    <div className="rounded-md border bg-background">
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none"
        onClick={() => setOpen((o) => !o)}>
        {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
        <span className="text-xs font-medium flex-1 truncate">
          Aisle&nbsp;<span className="font-mono">{aisle.code || `Z${zoneIndex + 1}-A${index + 1}`}</span>
          {edgeHint && <span className="text-muted-foreground ml-1 text-[10px]">{edgeHint}</span>}
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
        <div className="px-3 pb-3 pt-1 space-y-3 border-t">
          {/* Identity */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            <div className="space-y-1">
              <Label className="text-xs">Aisle Code</Label>
              <Input value={aisle.code} onChange={(e) => onChange({ ...aisle, code: e.target.value })} className="h-8 text-xs font-mono" placeholder="A01" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Aisle Name (optional)</Label>
              <Input value={aisle.name ?? ''} onChange={(e) => onChange({ ...aisle, name: e.target.value || null })} className="h-8 text-xs" placeholder="Main Aisle" />
            </div>
          </div>

          {/* Direction + Rows */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            <div className="space-y-1">
              <Label className="text-xs">Aisle Direction</Label>
              <Select value={aisle.direction} onValueChange={(v) => onChange({ ...aisle, direction: v as 'horizontal' | 'vertical' })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="horizontal">Horizontal (runs left to right)</SelectItem>
                  <SelectItem value="vertical">Vertical (runs front to back)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Rack Rows (sides of corridor)</Label>
              <Select value={aisle.rows} onValueChange={(v) => onChange({ ...aisle, rows: v as 'both' | 'left_only' | 'right_only' })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="both">Both sides (left + right)</SelectItem>
                  <SelectItem value="left_only">Left side only</SelectItem>
                  <SelectItem value="right_only">Right side only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Corridor + Rack config */}
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide pt-1">Corridor & Rack Configuration</p>
          <div className="grid grid-cols-3 gap-x-3 gap-y-2">
            <NumField label="Corridor width (m)" value={aisle.corridor_width} min={1} step={0.5} onChange={(v) => onChange({ ...aisle, corridor_width: v })} />
            <NumField label="Bin slots along depth" value={aisle.num_bays_per_row} min={1} onChange={(v) => onChange({ ...aisle, num_bays_per_row: v })} />
            <NumField label="Slot spacing (m)" value={aisle.bay_depth} min={0.5} step={0.1} onChange={(v) => onChange({ ...aisle, bay_depth: v })} />
            <NumField label="Rack height (levels)" value={aisle.num_levels} min={1} onChange={(v) => onChange({ ...aisle, num_levels: v })} />
            <NumField label="Level height (m)" value={aisle.level_height} min={0.5} step={0.1} onChange={(v) => onChange({ ...aisle, level_height: v })} />
            <NumField label="Bins per level" value={aisle.bins_per_level} min={1} onChange={(v) => onChange({ ...aisle, bins_per_level: v })} />
          </div>

          {/* Capacity */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            <NumField label="Bin capacity (units)" value={aisle.bin_capacity} min={1} step={10} onChange={(v) => onChange({ ...aisle, bin_capacity: v })} />
          </div>
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
    (s, a) => {
      const rowCount = a.rows === 'both' ? 2 : 1;
      return s + rowCount * a.num_bays_per_row * a.num_levels * a.bins_per_level;
    },
    0,
  );

  const updateAisle = (ai: number, a: AisleSpec) => {
    const aisles = [...zone.aisles];
    aisles[ai] = a;
    onChange({ ...zone, aisles });
  };

  const addAisle = () => {
    const num = zone.aisles.length + 1;
    // Smart auto-fill: copy config from the last aisle in this zone
    const prevAisle = zone.aisles.length > 0 ? zone.aisles[zone.aisles.length - 1] : null;
    const spec: AisleSpec = prevAisle
      ? { ...prevAisle, code: `A-${String(num).padStart(2, '0')}`, name: `Aisle ${num}`, rows: 'left_only' }
      : { ...defaultAisleSpec(), code: `A-${String(num).padStart(2, '0')}`, name: `Aisle ${num}`, rows: num > 1 ? 'left_only' : 'both' };
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
        <NumField label="Distance from left wall (m)" value={zone.offset_x} step={1}
          onChange={(v) => onChange({ ...zone, offset_x: v })} />
        <NumField label="Distance from front wall (m)" value={zone.offset_y} step={1}
          onChange={(v) => onChange({ ...zone, offset_y: v })} />
        <NumField label="Spacing between aisles (m)" value={zone.aisle_spacing} min={2} step={0.5}
          onChange={(v) => onChange({ ...zone, aisle_spacing: v })} />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Aisles</p>
        {zone.aisles.map((a, ai) => (
          <AisleRow
            key={ai}
            aisle={a}
            index={ai}
            zoneIndex={index}
            totalAisles={zone.aisles.length}
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

function SummaryBox({ preview }: { preview: FloorPlanPreviewResponse | FloorPlanApplyResponse | FloorPlanUpdateResponse | null }) {
  if (!preview) return null;
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
  const [mode, setMode] = React.useState<'landing' | 'editor'>('landing');

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
      // Show active plans + inactive templates (never applied).
      // Hide deleted plans that were previously applied.
      setSavedLayouts(data.filter((p) => p.is_active || !p.generated_at));
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
    setMode('editor');
  };

  // Start from a template
  const startFromTemplate = (tpl: { name: string; config: FloorPlanConfig }) => {
    setConfig(tpl.config);
    setPlanName(tpl.name);
    setEditingPlanId(null);
    setPreview(null);
    setApplyResult(null);
    setError(null);
    setMode('editor');
  };

  // Start from scratch
  const startFromScratch = () => {
    setConfig(defaultFloorPlanConfig());
    setPlanName('');
    setEditingPlanId(null);
    setPreview(null);
    setApplyResult(null);
    setError(null);
    setMode('editor');
  };

  // Back to landing
  const backToLanding = () => {
    setMode('landing');
    setEditingPlanId(null);
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
    setMode('landing');
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
    const prevZone = config.zones.length > 0 ? config.zones[config.zones.length - 1] : null;
    const z = prevZone ? { ...defaultZoneSpec(), aisle_spacing: prevZone.aisle_spacing } : defaultZoneSpec();
    z.code = `Z-${String(config.zones.length + 1).padStart(2, '0')}`; // Z-01, Z-02, Z-03…
    z.name = `Zone ${z.code}`;

    // Smart offset: calculate based on previous zone's extent
    if (prevZone && prevZone.aisles.length > 0) {
      const prevAisle = prevZone.aisles[0];
      const prevDepth = prevAisle.num_bays_per_row * prevAisle.bay_depth;
      z.offset_y = prevZone.offset_y + prevDepth + prevZone.aisle_spacing * prevZone.aisles.length + 10;
      // Copy aisle config from previous zone for consistency
      z.aisles = prevZone.aisles.map((a, i) => ({
        ...a,
        code: `A-${String(i + 1).padStart(2, '0')}`,
        name: `Aisle ${i + 1}`,
      }));
    } else {
      z.offset_y = config.zones.length * 50;
    }
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

  // Reset everything (delete all plans + locations for a fresh start)
  const handleReset = async () => {
    if (!accessToken) return;
    if (!window.confirm('This will permanently delete ALL layouts and locations for this warehouse. Are you sure?')) return;
    try {
      await floorPlanApi.reset(accessToken, warehouseId);
      resetToNew();
      fetchLayouts();
      onApplied?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    }
  };

  return (
    <div className="space-y-5">
      {mode === 'landing' ? (
        <>
          {/* Landing — choose what to do */}
          <div>
            <h3 className="text-sm font-semibold">Layout Designer</h3>
            <p className="text-xs text-muted-foreground">
              Design your warehouse layout or modify an existing one.
            </p>
          </div>

          {/* Active layout indicator */}
          {savedLayouts.some((p) => p.is_active) && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30 p-3">
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide mb-1">Current Active Layout</p>
              {savedLayouts.filter((p) => p.is_active).map((plan) => (
                <div key={plan.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{plan.name}</p>
                    <p className="text-[10px] text-muted-foreground">Applied {plan.generated_at ? new Date(plan.generated_at).toLocaleDateString() : ''}</p>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => loadLayout(plan)}>
                    <Edit3 className="h-3 w-3 mr-1" /> Edit
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Templates */}
          <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <LayoutTemplate className="h-3.5 w-3.5" /> Start from a Template
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Choose a pre-built layout to customize for your warehouse.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {LAYOUT_TEMPLATES.map((tpl) => (
                <button key={tpl.id} onClick={() => startFromTemplate(tpl)}
                  className="text-left rounded-md border p-3 hover:bg-accent hover:border-primary/30 transition-all space-y-1 group">
                  <p className="text-xs font-medium group-hover:text-primary">{tpl.name}</p>
                  <p className="text-[10px] text-muted-foreground">{tpl.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Saved layouts (non-active) */}
          {savedLayouts.filter((p) => !p.is_active).length > 0 && (
            <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Saved Layouts</p>
              <div className="space-y-1.5">
                {savedLayouts.filter((p) => !p.is_active).map((plan) => (
                  <div key={plan.id} className="flex items-center gap-2 rounded-md border p-2 text-xs hover:bg-accent transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{plan.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {!plan.generated_at && <Badge variant="secondary" className="text-[9px] px-1 py-0 text-violet-700 bg-violet-100 mr-1">Template</Badge>}
                        {countBins(plan.config)} bins
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => loadLayout(plan)}>
                      <Edit3 className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    {deleteConfirmId === plan.id ? (
                      <div className="flex items-center gap-1">
                        <Button variant="destructive" size="sm" className="h-6 text-[10px] px-2" disabled={deletingId === plan.id} onClick={() => handleDelete(plan.id)}>
                          {deletingId === plan.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Delete'}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeleteConfirmId(plan.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Start from scratch */}
          <Button variant="outline" className="w-full gap-2" onClick={startFromScratch}>
            <FilePlus className="h-4 w-4" /> Start from Scratch
          </Button>

          {/* Reset (delete everything) */}
          {savedLayouts.length > 0 && (
            <Button variant="ghost" className="w-full gap-2 text-destructive hover:text-destructive" onClick={handleReset}>
              <Trash2 className="h-4 w-4" /> Reset Warehouse Layout
            </Button>
          )}

          {loadingLayouts && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
              <Loader2 className="h-3 w-3 animate-spin" /> Loading layouts…
            </div>
          )}
        </>
      ) : null}

      {mode === 'editor' ? (
        <>
      {/* Editor header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={backToLanding}>
            ← Back
          </Button>
          <div>
            <h3 className="text-sm font-semibold">
              {editingPlanId ? `Editing: ${planName}` : 'New Layout'}
            </h3>
            <p className="text-xs text-muted-foreground">
              Configure zones and aisles below, then preview and apply.
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm font-mono px-3 py-1 shrink-0">
          {totalBins} bins total
        </Badge>
      </div>

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
      <SummaryBox preview={preview} />
      <SummaryBox preview={applyResult} />

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
      </>
      ) : null}
    </div>
  );
}
