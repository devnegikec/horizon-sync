import * as React from 'react';

import {
  AlertTriangle,
  Box,
  Clock,
  Flame,
  Info,
  Layers,
  Loader2,
  Lock,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Target,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { cn } from '@horizon-sync/ui/lib';

import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../../environments/environment';
import { useWarehouse3D } from '../../hooks/useWarehouse3D';
import { wms3dApi } from '../../utility/api/wms3d';
import type { FlatBin, Suggestion } from '../../types/wms3d.types';
import { ItemPickerSelect } from '../quotations/ItemPickerSelect';

const NIL_UUID = '00000000-0000-0000-0000-000000000000';

// ─── Isometric projection constants ──────────────────────────────────────────
const BASE_TW = 48; // tile width in px (2× TH)
const BASE_TH = 24; // tile height in px
const BASE_ZH = 30; // vertical px per Z-unit

// ─── Colour helpers ───────────────────────────────────────────────────────────
interface FaceColors {
  top: string;
  right: string;
  left: string;
  border: string;
}

function getBinColors(
  fillPct: number,
  isReserved: boolean,
  isSuggested: boolean,
  isSelected: boolean,
  hasExpiring: boolean,
): FaceColors {
  if (isSelected) {
    return { top: '#f0f9ff', right: '#0369a1', left: '#0ea5e9', border: '#38bdf8' };
  }
  if (isSuggested) {
    return { top: '#fef9c3', right: '#b45309', left: '#d97706', border: '#fbbf24' };
  }
  if (isReserved) {
    return { top: '#dbeafe', right: '#1d4ed8', left: '#3b82f6', border: '#60a5fa' };
  }
  if (hasExpiring) {
    return { top: '#fff7ed', right: '#c2410c', left: '#ea580c', border: '#fb923c' };
  }
  const eff = fillPct ?? 0;
  if (eff <= 30) {
    return { top: '#bbf7d0', right: '#15803d', left: '#22c55e', border: '#4ade80' };
  }
  if (eff <= 70) {
    return { top: '#fef3c7', right: '#b45309', left: '#f59e0b', border: '#fcd34d' };
  }
  return { top: '#fecaca', right: '#b91c1c', left: '#ef4444', border: '#f87171' };
}

function getInactiveBinColors(): FaceColors {
  return { top: '#f1f5f9', right: '#64748b', left: '#94a3b8', border: '#cbd5e1' };
}

/** Pure fill-density gradient (green 0% → yellow 50% → red 100%) for heat-map mode. */
function getHeatColors(fillPct: number): FaceColors {
  const t = Math.max(0, Math.min(1, (fillPct ?? 0) / 100));
  const hue = 120 * (1 - t); // 120=green → 0=red
  return {
    top: `hsl(${hue}, 85%, 75%)`,
    right: `hsl(${hue}, 70%, 40%)`,
    left: `hsl(${hue}, 72%, 54%)`,
    border: `hsl(${hue}, 75%, 62%)`,
  };
}

// ─── Isometric projection ─────────────────────────────────────────────────────
function worldToScreen(
  wx: number,
  wy: number,
  wz: number,
  ox: number,
  oy: number,
  TW: number,
  TH: number,
  ZH: number,
): [number, number] {
  return [ox + (wx - wy) * (TW / 2), oy + (wx + wy) * (TH / 2) - wz * ZH];
}

function drawBin(
  ctx: CanvasRenderingContext2D,
  wx: number,
  wy: number,
  wz: number,
  colors: FaceColors,
  ox: number,
  oy: number,
  TW: number,
  TH: number,
  ZH: number,
  pulseAlpha = 0,
  lod = false,
) {
  const p = (x: number, y: number, z: number) => worldToScreen(x, y, z, ox, oy, TW, TH, ZH);

  // Top face: (wx,wy,wz+1) → (wx+1,wy,wz+1) → (wx+1,wy+1,wz+1) → (wx,wy+1,wz+1)
  const [t1x, t1y] = p(wx, wy, wz + 1);
  const [t2x, t2y] = p(wx + 1, wy, wz + 1);
  const [t3x, t3y] = p(wx + 1, wy + 1, wz + 1);
  const [t4x, t4y] = p(wx, wy + 1, wz + 1);

  // Right face (+X): (wx+1,wy,wz) → (wx+1,wy+1,wz) → (wx+1,wy+1,wz+1) → (wx+1,wy,wz+1)
  const [r1x, r1y] = p(wx + 1, wy, wz);
  const [r2x, r2y] = p(wx + 1, wy + 1, wz);
  const [r3x, r3y] = p(wx + 1, wy + 1, wz + 1);
  const [r4x, r4y] = p(wx + 1, wy, wz + 1);

  // Left face (+Y): (wx,wy+1,wz) → (wx+1,wy+1,wz) → (wx+1,wy+1,wz+1) → (wx,wy+1,wz+1)
  const [l1x, l1y] = p(wx, wy + 1, wz);
  const [l2x, l2y] = p(wx + 1, wy + 1, wz);
  const [l3x, l3y] = p(wx + 1, wy + 1, wz + 1);
  const [l4x, l4y] = p(wx, wy + 1, wz + 1);

  const drawFace = (
    pts: [number, number][],
    fill: string,
  ) => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (!lod) {
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
  };

  drawFace([[r1x, r1y], [r2x, r2y], [r3x, r3y], [r4x, r4y]], colors.right);
  drawFace([[l1x, l1y], [l2x, l2y], [l3x, l3y], [l4x, l4y]], colors.left);
  drawFace([[t1x, t1y], [t2x, t2y], [t3x, t3y], [t4x, t4y]], colors.top);

  // Pulse glow overlay for reserved / suggested bins
  if (pulseAlpha > 0) {
    ctx.beginPath();
    ctx.moveTo(t1x, t1y);
    ctx.lineTo(t2x, t2y);
    ctx.lineTo(t3x, t3y);
    ctx.lineTo(t4x, t4y);
    ctx.closePath();
    ctx.fillStyle = `rgba(255, 220, 60, ${pulseAlpha * 0.45})`;
    ctx.fill();
  }
}

/** Point-in-parallelogram via cross-product sign test. */
function pointInQuad(
  px: number,
  py: number,
  pts: [number, number][],
): boolean {
  const cross = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) =>
    (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const n = pts.length;
  let sign: number | null = null;
  for (let i = 0; i < n; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[(i + 1) % n];
    const c = cross(ax, ay, bx, by, px, py);
    if (c === 0) continue;
    const s = c > 0 ? 1 : -1;
    if (sign === null) sign = s;
    else if (sign !== s) return false;
  }
  return true;
}

/** Return the bin whose top face contains screen point (mx, my). */
function hitTest(
  mx: number,
  my: number,
  sorted: FlatBin[],
  ox: number,
  oy: number,
  TW: number,
  TH: number,
  ZH: number,
): FlatBin | null {
  const p = (x: number, y: number, z: number): [number, number] =>
    worldToScreen(x, y, z, ox, oy, TW, TH, ZH);
  // Test in reverse paint order (front-most first)
  for (let i = sorted.length - 1; i >= 0; i--) {
    const bin = sorted[i];
    const { x: wx, y: wy, z: wz } = bin.position;
    const quad: [number, number][] = [
      p(wx, wy, wz + 1),
      p(wx + 1, wy, wz + 1),
      p(wx + 1, wy + 1, wz + 1),
      p(wx, wy + 1, wz + 1),
    ];
    if (pointInQuad(mx, my, quad)) return bin;
  }
  return null;
}

// ─── BinDetailPanel ───────────────────────────────────────────────────────────
function BinDetailPanel({
  bin,
  onClose,
}: {
  bin: FlatBin;
  onClose: () => void;
}) {
  const fillPct = bin.live_fill_pct ?? bin.fill_percentage;
  const isReserved = bin.live_is_reserved ?? bin.is_reserved;

  return (
    <div className="w-72 shrink-0 rounded-lg border bg-card shadow-lg p-4 space-y-3 animate-in slide-in-from-right-4 duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-sm">{bin.code}</p>
          <p className="text-xs text-muted-foreground">{bin.full_path ?? '—'}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1 -mt-1" onClick={onClose}>
          ×
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md bg-muted/50 p-2">
          <p className="text-muted-foreground">Fill</p>
          <p className="font-semibold text-sm">{fillPct.toFixed(1)}%</p>
        </div>
        <div className="rounded-md bg-muted/50 p-2">
          <p className="text-muted-foreground">Available</p>
          <p className="font-semibold text-sm">{bin.available_capacity.toFixed(1)}</p>
        </div>
        <div className="rounded-md bg-muted/50 p-2">
          <p className="text-muted-foreground">Items</p>
          <p className="font-semibold text-sm">{bin.items_count}</p>
        </div>
        <div className="rounded-md bg-muted/50 p-2">
          <p className="text-muted-foreground">Capacity</p>
          <p className="font-semibold text-sm">{bin.capacity.toFixed(1)}</p>
        </div>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Zone</span>
          <span className="font-medium">{bin.zone_name ?? bin.zone_code}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Aisle</span>
          <span className="font-medium">{bin.aisle_name ?? bin.aisle_code}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Bay / Level</span>
          <span className="font-medium">
            {bin.bay_code} / {bin.level_code}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {isReserved && (
          <Badge variant="secondary" className="gap-1 text-blue-700 bg-blue-100">
            <Lock className="h-3 w-3" />
            Reserved
          </Badge>
        )}
        {bin.has_expiring_items && (
          <Badge variant="secondary" className="gap-1 text-orange-700 bg-orange-100">
            <AlertTriangle className="h-3 w-3" />
            Expiring items
          </Badge>
        )}
        {!bin.is_active && (
          <Badge variant="secondary" className="text-muted-foreground">
            Inactive
          </Badge>
        )}
      </div>

      {isReserved && bin.live_reserved_by && (
        <div className="rounded-md bg-blue-50 border border-blue-200 p-2 text-xs text-blue-800">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Expires in {bin.live_reserved_by.expires_in_seconds}s</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────
const LEGEND = [
  { color: 'bg-green-300', label: '0–30%  empty' },
  { color: 'bg-amber-300', label: '31–70%  moderate' },
  { color: 'bg-red-400', label: '71–100%  full' },
  { color: 'bg-blue-400', label: 'Reserved' },
  { color: 'bg-yellow-300', label: 'Suggested' },
  { color: 'bg-orange-300', label: 'Expiring items' },
  { color: 'bg-slate-200', label: 'Inactive' },
];

function WarehouseLegend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      {LEGEND.map(({ color, label }) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className={cn('h-3 w-3 rounded-sm shrink-0', color)} />
          {label}
        </span>
      ))}
    </div>
  );
}

// ─── BinSuggestionPanel ───────────────────────────────────────────────────────
interface PickerItem {
  id: string;
  item_code: string;
  item_name: string;
}

function BinSuggestionPanel({
  warehouseId,
  onResults,
  onFocusBin,
  onClose,
}: {
  warehouseId: string;
  onResults: (suggestions: Suggestion[]) => void;
  onFocusBin: (binId: string) => void;
  onClose: () => void;
}) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [taskType, setTaskType] = React.useState<'put_away' | 'pick'>('put_away');
  const [itemId, setItemId] = React.useState('');
  const [itemData, setItemData] = React.useState<PickerItem | null>(null);
  const [quantity, setQuantity] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [results, setResults] = React.useState<Suggestion[]>([]);

  const searchItems = React.useCallback(
    async (query: string): Promise<PickerItem[]> => {
      if (!accessToken) return [];
      const res = await fetch(
        `${environment.apiCoreUrl}/api/v1/items/picker?search=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } },
      );
      if (!res.ok) throw new Error('Failed to fetch items');
      const data = await res.json();
      return (data.items ?? []) as PickerItem[];
    },
    [accessToken],
  );

  const labelFormatter = React.useCallback(
    (i: PickerItem) => `${i.item_name} (${i.item_code})`,
    [],
  );

  const handleFind = async () => {
    if (!accessToken || !itemId) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await wms3dApi.suggest(accessToken, {
        task_type: taskType,
        item_id: itemId,
        quantity,
        warehouse_id: warehouseId,
        worker_id: NIL_UUID,
        limit: 10,
      });
      setResults(resp.suggestions);
      onResults(resp.suggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suggestion failed');
      setResults([]);
      onResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setResults([]);
    onResults([]);
  };

  return (
    <div className="w-80 shrink-0 rounded-lg border bg-card shadow-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm flex items-center gap-1.5">
          <Target className="h-4 w-4 text-amber-600" />
          Find Optimal Bins
        </p>
        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-1.5">
        <Button
          variant={taskType === 'put_away' ? 'default' : 'outline'}
          size="sm"
          className="flex-1 text-xs h-8"
          onClick={() => setTaskType('put_away')}>
          Put-away
        </Button>
        <Button
          variant={taskType === 'pick' ? 'default' : 'outline'}
          size="sm"
          className="flex-1 text-xs h-8"
          onClick={() => setTaskType('pick')}>
          Pick
        </Button>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Item</Label>
        <ItemPickerSelect
          value={itemId}
          onValueChange={(v) => setItemId(v)}
          searchItems={searchItems}
          labelFormatter={labelFormatter}
          valueKey="id"
          placeholder="Select an item…"
          searchPlaceholder="Search items…"
          minSearchLength={2}
          selectedItemData={itemData}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Quantity</Label>
        <Input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, parseFloat(e.target.value) || 1))}
          className="h-8 text-xs"
        />
      </div>

      <Button
        size="sm"
        className="w-full gap-1.5"
        onClick={handleFind}
        disabled={loading || !itemId}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        Suggest bins
      </Button>

      {error && (
        <p className="text-xs text-destructive flex items-start gap-1">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              {results.length} ranked suggestions
            </p>
            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={handleClear}>
              Clear
            </Button>
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {results.map((s) => (
              <button
                key={s.bin_id}
                onClick={() => onFocusBin(s.bin_id)}
                className="w-full text-left rounded-md border p-2 hover:bg-accent transition-colors space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-medium truncate">
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] shrink-0">
                      #{s.rank}
                    </Badge>
                    <span className="font-mono truncate">{s.bin_code ?? s.bin_id.slice(0, 8)}</span>
                  </span>
                  <span className="text-[10px] text-amber-700 font-semibold shrink-0">
                    {s.score.toFixed(0)} pts
                  </span>
                </div>
                {s.reasons.length > 0 && (
                  <p className="text-[10px] text-muted-foreground line-clamp-2">
                    {s.reasons.join(' · ')}
                  </p>
                )}
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span>Avail: {s.available_capacity.toFixed(0)}</span>
                  <span>~{s.estimated_time_seconds}s</span>
                  {s.expiry_date && <span>Exp: {s.expiry_date}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function Warehouse3DView({ warehouseId }: { warehouseId: string }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const rafRef = React.useRef<number | null>(null);
  const dragRef = React.useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);

  const [zoom, setZoom] = React.useState(1.0);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [selectedBinId, setSelectedBinId] = React.useState<string | null>(null);
  const [suggestedIds, setSuggestedIds] = React.useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = React.useState<'3d' | '2d'>('3d');
  const [colorMode, setColorMode] = React.useState<'status' | 'heat'>('status');
  const [showSuggest, setShowSuggest] = React.useState(false);
  const [canvasSize, setCanvasSize] = React.useState({ w: 800, h: 520 });

  const { activeBins, layout, loading, error, statusLoading, wsConnected, refetch, refetchStatus } =
    useWarehouse3D(warehouseId);

  // Observe container width for responsive canvas
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setCanvasSize({ w: Math.max(400, width), h: Math.max(400, Math.round(width * 0.6)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Auto-center on first load
  const centeredRef = React.useRef(false);
  React.useEffect(() => {
    if (!activeBins.length || centeredRef.current) return;
    centeredRef.current = true;
    const xs = activeBins.map((b) => b.position.x);
    const ys = activeBins.map((b) => b.position.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const TW = BASE_TW * zoom;
    const TH = BASE_TH * zoom;
    const ZH = BASE_ZH * zoom;
    setOffset({
      x: canvasSize.w / 2 - ((cx - cy) * TW) / 2,
      y: canvasSize.h / 3 - ((cx + cy) * TH) / 2,
    });
  }, [activeBins, canvasSize, zoom]);

  // Sort bins back-to-front for painter's algorithm
  const sorted = React.useMemo(
    () =>
      [...activeBins].sort((a, b) => {
        const da = a.position.x + a.position.y;
        const db = b.position.x + b.position.y;
        if (da !== db) return da - db;
        return a.position.z - b.position.z;
      }),
    [activeBins],
  );

  // Canvas render loop
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animRunning = true;

    const render = (ts: number) => {
      if (!animRunning) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const TW = BASE_TW * zoom;
      const TH = BASE_TH * zoom;
      const ZH = BASE_ZH * zoom;
      const ox = offset.x;
      const oy = offset.y;

      // Pulse phase for animated bins
      const pulse = 0.4 + 0.4 * Math.sin((ts / 1000) * Math.PI * 1.5);

      const hasAnimated = sorted.some(
        (b) => (b.live_is_reserved ?? b.is_reserved) || suggestedIds.has(b.id),
      );

      // Level-of-detail: skip per-face strokes for dense scenes / low zoom
      const lod = sorted.length > 600 || zoom < 0.55;

      const colorFor = (bin: FlatBin) => {
        const fillPct = bin.live_fill_pct ?? bin.fill_percentage;
        const isRes = bin.live_is_reserved ?? bin.is_reserved;
        const isSug = suggestedIds.has(bin.id);
        const isSelected = bin.id === selectedBinId;
        if (!bin.is_active) return getInactiveBinColors();
        if (colorMode === 'heat' && !isSug && !isSelected) return getHeatColors(fillPct);
        return getBinColors(fillPct, isRes, isSug, isSelected, bin.has_expiring_items);
      };

      if (viewMode === '2d') {
        // 2D top-down grid view
        ctx.save();
        ctx.translate(ox, oy);
        for (const bin of sorted) {
          const { x: wx, y: wy } = bin.position;
          const isSelected = bin.id === selectedBinId;
          const colors = colorFor(bin);
          const gap = 2;
          const bw = TW - gap;
          const bh = TH - gap;
          const bx = wx * TW + gap / 2;
          const by = wy * TH + gap / 2;
          ctx.fillStyle = colors.left;
          ctx.fillRect(bx, by, bw, bh);
          if (!lod || isSelected) {
            ctx.strokeStyle = colors.border;
            ctx.lineWidth = isSelected ? 2 : 0.5;
            ctx.strokeRect(bx, by, bw, bh);
          }
        }
        ctx.restore();
      } else {
        // Isometric 3D view
        for (const bin of sorted) {
          const { x: wx, y: wy, z: wz } = bin.position;
          const isRes = bin.live_is_reserved ?? bin.is_reserved;
          const isSug = suggestedIds.has(bin.id);
          const isSelected = bin.id === selectedBinId;
          const colors = colorFor(bin);
          const shouldPulse = (isRes || isSug) && bin.is_active ? pulse : 0;
          // Keep strokes on selected/suggested bins even under LOD
          drawBin(ctx, wx, wy, wz, colors, ox, oy, TW, TH, ZH, shouldPulse, lod && !isSelected && !isSug);
        }
      }

      if (hasAnimated && animRunning) {
        rafRef.current = requestAnimationFrame(render);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(render);
    return () => {
      animRunning = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [sorted, zoom, offset, selectedBinId, suggestedIds, viewMode, colorMode]);

  // Click handler
  const handleCanvasClick = React.useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const TW = BASE_TW * zoom;
      const TH = BASE_TH * zoom;
      const ZH = BASE_ZH * zoom;
      const hit = hitTest(mx, my, sorted, offset.x, offset.y, TW, TH, ZH);
      setSelectedBinId(hit ? hit.id : null);
    },
    [sorted, zoom, offset],
  );

  // Drag-to-pan
  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      dragRef.current = { startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y };
    },
    [offset],
  );

  const handleMouseMove = React.useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      setOffset({ x: dragRef.current.ox + dx, y: dragRef.current.oy + dy });
    }
  }, []);

  const handleMouseUp = React.useCallback(() => {
    dragRef.current = null;
  }, []);

  // Scroll-to-zoom
  const handleWheel = React.useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setZoom((z) => Math.min(3, Math.max(0.3, z - e.deltaY * 0.001)));
  }, []);

  const resetView = () => {
    centeredRef.current = false;
    setZoom(1.0);
  };

  // Center the view on a specific bin and select it (from suggestion list)
  const focusBin = React.useCallback(
    (binId: string) => {
      const bin = activeBins.find((b) => b.id === binId);
      if (!bin) return;
      setSelectedBinId(binId);
      const TW = BASE_TW * zoom;
      const TH = BASE_TH * zoom;
      const ZH = BASE_ZH * zoom;
      const { x, y, z } = bin.position;
      const sx = (x - y) * (TW / 2);
      const sy = (x + y) * (TH / 2) - z * ZH;
      setOffset({ x: canvasSize.w / 2 - sx, y: canvasSize.h / 2 - sy });
    },
    [activeBins, zoom, canvasSize],
  );

  const selectedBin = selectedBinId
    ? activeBins.find((b) => b.id === selectedBinId) ?? null
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading 3D warehouse layout…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <Info className="h-8 w-8 text-muted-foreground" />
        <p className="font-medium">Could not load 3D layout</p>
        <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
        <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (!activeBins.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center text-muted-foreground">
        <Box className="h-10 w-10" />
        <p className="font-medium">No bins configured</p>
        <p className="text-sm max-w-sm">
          Add bin locations to this warehouse from the Layout tab to see the 3D view.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <Button
            variant={viewMode === '3d' ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5"
            onClick={() => setViewMode('3d')}>
            <Layers className="h-4 w-4" />
            3D
          </Button>
          <Button
            variant={viewMode === '2d' ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5"
            onClick={() => setViewMode('2d')}>
            <Sparkles className="h-4 w-4" />
            2D
          </Button>
          <div className="w-px h-5 bg-border mx-1" />
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoom((z) => Math.min(3, z + 0.15))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoom((z) => Math.max(0.3, z - 0.15))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={resetView}>
            <RotateCcw className="h-4 w-4" />
          </Button>
          <div className="w-px h-5 bg-border mx-1" />
          <Button
            variant={colorMode === 'heat' ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5"
            onClick={() => setColorMode((m) => (m === 'heat' ? 'status' : 'heat'))}>
            <Flame className="h-4 w-4" />
            Heat-map
          </Button>
          <Button
            variant={showSuggest ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5"
            onClick={() => setShowSuggest((s) => !s)}>
            <Target className="h-4 w-4" />
            Suggest
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {statusLoading && <Loader2 className="h-3 w-3 animate-spin" />}
          <span>{activeBins.length} bins</span>
          {wsConnected ? (
            <Badge variant="secondary" className="gap-1 text-emerald-700 bg-emerald-100 px-1.5 py-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Live
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-muted-foreground px-1.5 py-0">
              Polling
            </Badge>
          )}
          {layout && <span className="font-medium">{layout.warehouse.name}</span>}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={refetchStatus}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Canvas + detail panel */}
      <div className="flex gap-3 items-start">
        <div ref={containerRef} className="flex-1 min-w-0 rounded-lg border overflow-hidden bg-slate-50 dark:bg-slate-900">
          <canvas
            ref={canvasRef}
            width={canvasSize.w}
            height={canvasSize.h}
            className="cursor-grab active:cursor-grabbing select-none"
            style={{ width: '100%', height: 'auto', display: 'block' }}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          />
        </div>

        {showSuggest && (
          <BinSuggestionPanel
            warehouseId={warehouseId}
            onResults={(s) => setSuggestedIds(new Set(s.map((x) => x.bin_id)))}
            onFocusBin={focusBin}
            onClose={() => {
              setShowSuggest(false);
              setSuggestedIds(new Set());
            }}
          />
        )}

        {selectedBin && (
          <BinDetailPanel bin={selectedBin} onClose={() => setSelectedBinId(null)} />
        )}
      </div>

      {/* Legend */}
      <WarehouseLegend />

      {/* Instructions */}
      <p className="text-xs text-muted-foreground">
        Click a bin for details · Drag to pan · Scroll to zoom
      </p>
    </div>
  );
}
