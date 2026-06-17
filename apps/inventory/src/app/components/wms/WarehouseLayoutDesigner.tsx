import * as React from 'react';

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Info,
  Loader2,
  Plus,
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
  ZoneSpec,
} from '../../types/floorplan.types';
import {
  defaultAisleSpec,
  defaultFloorPlanConfig,
  defaultZoneSpec,
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
  const [config, setConfig] = React.useState<FloorPlanConfig>(defaultFloorPlanConfig);
  const [planName, setPlanName] = React.useState('');
  const [replaceExisting, setReplaceExisting] = React.useState(false);
  const [preview, setPreview] = React.useState<FloorPlanPreviewResponse | null>(null);
  const [applyResult, setApplyResult] = React.useState<FloorPlanApplyResponse | null>(null);
  const [previewing, setPreviewing] = React.useState(false);
  const [applying, setApplying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const totalBins = countBins(config);

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
    // offset each new zone so they don't overlap in the 3D view
    z.grid_y = config.zones.length * 10;
    setConfig({ ...config, zones: [...config.zones, z] });
  };

  const removeZone = (zi: number) =>
    setConfig({ ...config, zones: config.zones.filter((_, i) => i !== zi) });

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

  const handleApply = async () => {
    if (!accessToken || !planName.trim()) return;
    setApplying(true);
    setError(null);
    try {
      const res = await floorPlanApi.apply(accessToken, {
        warehouse_id: warehouseId,
        name: planName.trim(),
        config,
        replace_existing: replaceExisting,
      });
      setApplyResult(res);
      setPreview(null);
      onApplied?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Apply failed');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold">Layout Designer</h3>
          <p className="text-xs text-muted-foreground">
            Define zones and aisles — the system generates all bin locations with 3D positions automatically.
          </p>
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
      {preview && <SummaryBox preview={preview} />}
      {applyResult && <SummaryBox preview={applyResult} />}

      {/* Action bar */}
      <div className="flex items-end gap-3 flex-wrap border-t pt-4">
        <div className="flex-1 min-w-48 space-y-1">
          <Label className="text-xs">Plan name (required to apply)</Label>
          <Input
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="Initial layout v1"
            className="h-8 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-xs cursor-pointer pb-1">
          <input
            type="checkbox"
            checked={replaceExisting}
            onChange={(e) => setReplaceExisting(e.target.checked)}
            className="h-3.5 w-3.5"
          />
          Deactivate existing locations
        </label>
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
          {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Apply Layout
        </Button>
      </div>
    </div>
  );
}
