import * as React from 'react';

import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

import {
  AlertTriangle,
  Clock,
  Flame,
  Info,
  Loader2,
  Lock,
  RefreshCw,
  Sparkles,
  Target,
  X,
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
import type { BinStockItem, FlatBin, Suggestion } from '../../types/wms3d.types';
import { ItemPickerSelect } from '../quotations/ItemPickerSelect';

const NIL_UUID = '00000000-0000-0000-0000-000000000000';

// ─── Color helpers ────────────────────────────────────────────────────────────

function getBinColor(
  fillPct: number,
  isReserved: boolean,
  isSuggested: boolean,
  isSelected: boolean,
  hasExpiring: boolean,
  isActive: boolean,
): string {
  if (!isActive) return '#94a3b8';
  if (isSelected) return '#0ea5e9';
  if (isSuggested) return '#d97706';
  if (isReserved) return '#3b82f6';
  if (hasExpiring) return '#ea580c';
  if (fillPct <= 30) return '#22c55e';
  if (fillPct <= 70) return '#f59e0b';
  return '#ef4444';
}

function getEmissiveColor(isReserved: boolean, isSuggested: boolean): string {
  if (isSuggested) return '#fbbf24';
  if (isReserved) return '#60a5fa';
  return '#000000';
}

// ─── BinMesh (individual 3D bin cube) ─────────────────────────────────────────

interface BinMeshProps {
  bin: FlatBin;
  isSelected: boolean;
  isSuggested: boolean;
  onSelect: (bin: FlatBin) => void;
  onHover: (bin: FlatBin | null) => void;
}

function BinMesh({ bin, isSelected, isSuggested, onSelect, onHover }: BinMeshProps) {
  const meshRef = React.useRef<THREE.Mesh>(null);
  const fillPct = bin.live_fill_pct ?? bin.fill_percentage;
  const isReserved = bin.live_is_reserved ?? bin.is_reserved;

  const color = getBinColor(fillPct, isReserved, isSuggested, isSelected, bin.has_expiring_items, bin.is_active);
  const emissive = getEmissiveColor(isReserved, isSuggested);
  const shouldPulse = (isReserved || isSuggested) && bin.is_active;

  // Pulse animation for reserved/suggested bins
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    if (shouldPulse) {
      const t = Math.sin(clock.getElapsedTime() * 3) * 0.3 + 0.3;
      (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = t;
    } else {
      (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
    }
  });

  // Scale based on fill percentage (bin fills up visually)
  const fillHeight = Math.max(0.1, fillPct / 100);

  return (
    <mesh
      ref={meshRef}
      position={[bin.position.x, bin.position.z + 0.5, bin.position.y]}
      onClick={(e) => { e.stopPropagation(); onSelect(bin); }}
      onPointerOver={(e) => { e.stopPropagation(); onHover(bin); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { onHover(null); document.body.style.cursor = 'auto'; }}
    >
      <boxGeometry args={[0.85, 0.9, 0.85]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={0}
        transparent={!bin.is_active}
        opacity={bin.is_active ? 1 : 0.4}
        roughness={0.6}
        metalness={0.1}
      />
      {/* Fill level indicator (inner darker box) */}
      {bin.is_active && fillPct > 0 && (
        <mesh position={[0, -0.45 + (fillHeight * 0.9) / 2, 0]}>
          <boxGeometry args={[0.75, fillHeight * 0.9, 0.75]} />
          <meshStandardMaterial color={color} roughness={0.8} metalness={0.0} opacity={0.7} transparent />
        </mesh>
      )}
      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, 0.5, 0]}>
          <ringGeometry args={[0.4, 0.5, 16]} />
          <meshBasicMaterial color="#0ea5e9" side={THREE.DoubleSide} />
        </mesh>
      )}
    </mesh>
  );
}

// ─── Warehouse Floor Grid ─────────────────────────────────────────────────────

function WarehouseFloor({ bins }: { bins: FlatBin[] }) {
  if (bins.length === 0) return null;
  const xs = bins.map((b) => b.position.x);
  const ys = bins.map((b) => b.position.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const w = Math.max(...xs) - Math.min(...xs) + 4;
  const d = Math.max(...ys) - Math.min(...ys) + 4;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, -0.01, cy]}>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color="#1e293b" roughness={0.9} />
    </mesh>
  );
}

// ─── Hover Tooltip (HTML overlay inside 3D scene) ─────────────────────────────

function HoverTooltip({ bin }: { bin: FlatBin }) {
  const fillPct = bin.live_fill_pct ?? bin.fill_percentage;
  return (
    <Html
      position={[bin.position.x, bin.position.z + 1.3, bin.position.y]}
      center
      distanceFactor={8}
      style={{ pointerEvents: 'none' }}
    >
      <div className="rounded-md border bg-popover/95 backdrop-blur-sm shadow-md px-2.5 py-1.5 text-xs whitespace-nowrap">
        <p className="font-semibold">{bin.code}</p>
        <p className="text-muted-foreground">
          {fillPct.toFixed(0)}% full · {bin.items_count} item{bin.items_count !== 1 ? 's' : ''}
        </p>
      </div>
    </Html>
  );
}

// ─── 3D Scene Content ─────────────────────────────────────────────────────────

function SceneContent({
  bins,
  selectedBinId,
  suggestedIds,
  hoveredBin,
  onSelectBin,
  onHoverBin,
}: {
  bins: FlatBin[];
  selectedBinId: string | null;
  suggestedIds: Set<string>;
  hoveredBin: FlatBin | null;
  onSelectBin: (bin: FlatBin | null) => void;
  onHoverBin: (bin: FlatBin | null) => void;
}) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 15, 10]} intensity={1} castShadow />
      <directionalLight position={[-5, 8, -5]} intensity={0.3} />

      {/* Floor */}
      <WarehouseFloor bins={bins} />

      {/* Bins */}
      {bins.map((bin) => (
        <BinMesh
          key={bin.id}
          bin={bin}
          isSelected={bin.id === selectedBinId}
          isSuggested={suggestedIds.has(bin.id)}
          onSelect={onSelectBin}
          onHover={onHoverBin}
        />
      ))}

      {/* Hover tooltip */}
      {hoveredBin && <HoverTooltip bin={hoveredBin} />}

      {/* Camera controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.1}
        minDistance={3}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2.1}
      />
    </>
  );
}

// ─── BinDetailPanel ───────────────────────────────────────────────────────────

function BinDetailPanel({ bin, onClose }: { bin: FlatBin; onClose: () => void }) {
  const accessToken = useUserStore((s) => s.accessToken);
  const fillPct = bin.live_fill_pct ?? bin.fill_percentage;
  const isReserved = bin.live_is_reserved ?? bin.is_reserved;

  const [stockItems, setStockItems] = React.useState<BinStockItem[]>([]);
  const [stockLoading, setStockLoading] = React.useState(false);
  const [stockError, setStockError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!accessToken || !bin.id) return;
    let cancelled = false;
    setStockLoading(true);
    setStockError(null);
    wms3dApi
      .getBinStock(accessToken, bin.id)
      .then((res) => { if (!cancelled) setStockItems(res.items); })
      .catch((err) => { if (!cancelled) setStockError(err instanceof Error ? err.message : 'Failed to load stock'); })
      .finally(() => { if (!cancelled) setStockLoading(false); });
    return () => { cancelled = true; };
  }, [accessToken, bin.id]);

  const isExpiringSoon = (expiry: string | null): boolean => {
    if (!expiry) return false;
    const diff = new Date(expiry).getTime() - Date.now();
    return diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="w-80 shrink-0 rounded-lg border bg-card shadow-lg p-4 space-y-3 max-h-[600px] overflow-y-auto">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-sm">{bin.code}</p>
          <p className="text-xs text-muted-foreground">{bin.full_path ?? '—'}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1 -mt-1" onClick={onClose}>×</Button>
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
          <span className="font-medium">{bin.bay_code} / {bin.level_code}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {isReserved && (
          <Badge variant="secondary" className="gap-1 text-blue-700 bg-blue-100">
            <Lock className="h-3 w-3" /> Reserved
          </Badge>
        )}
        {bin.has_expiring_items && (
          <Badge variant="secondary" className="gap-1 text-orange-700 bg-orange-100">
            <AlertTriangle className="h-3 w-3" /> Expiring items
          </Badge>
        )}
        {!bin.is_active && (
          <Badge variant="secondary" className="text-muted-foreground">Inactive</Badge>
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

      {/* Stock Items Section */}
      <div className="border-t pt-3 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stock Items</p>
        {stockLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading items…
          </div>
        )}
        {stockError && <p className="text-xs text-destructive">{stockError}</p>}
        {!stockLoading && !stockError && stockItems.length === 0 && (
          <p className="text-xs text-muted-foreground italic py-1">No stock in this bin</p>
        )}
        {!stockLoading && stockItems.length > 0 && (
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {stockItems.map((item, idx) => (
              <div
                key={`${item.item_id}-${item.batch_number ?? idx}`}
                className={cn(
                  'rounded-md border p-2 text-xs space-y-1',
                  isExpiringSoon(item.expiry_date) && 'border-orange-300 bg-orange-50',
                )}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.item_name}</p>
                    <p className="text-muted-foreground font-mono text-[10px]">
                      {item.item_code}{item.sku ? ` · SKU: ${item.sku}` : ''}
                    </p>
                  </div>
                  <span className="font-semibold whitespace-nowrap">
                    {item.quantity_on_hand}{item.uom ? ` ${item.uom}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  {item.batch_number && <span>Batch: {item.batch_number}</span>}
                  {item.expiry_date && (
                    <span className={cn(isExpiringSoon(item.expiry_date) && 'text-orange-700 font-medium')}>
                      Exp: {item.expiry_date}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BinSuggestionPanel ───────────────────────────────────────────────────────

interface PickerItem { id: string; item_code: string; item_name: string; }

function BinSuggestionPanel({
  warehouseId,
  onResults,
  onClose,
}: {
  warehouseId: string;
  onResults: (suggestions: Suggestion[]) => void;
  onClose: () => void;
}) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [taskType, setTaskType] = React.useState<'put_away' | 'pick'>('put_away');
  const [itemId, setItemId] = React.useState('');
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

  const labelFormatter = React.useCallback((i: PickerItem) => `${i.item_name} (${i.item_code})`, []);

  const handleFind = async () => {
    if (!accessToken || !itemId) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await wms3dApi.suggest(accessToken, {
        task_type: taskType, item_id: itemId, quantity,
        warehouse_id: warehouseId, worker_id: NIL_UUID, limit: 10,
      });
      setResults(resp.suggestions);
      onResults(resp.suggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suggestion failed');
      setResults([]); onResults([]);
    } finally { setLoading(false); }
  };

  return (
    <div className="w-80 shrink-0 rounded-lg border bg-card shadow-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm flex items-center gap-1.5">
          <Target className="h-4 w-4 text-amber-600" /> Find Optimal Bins
        </p>
        <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex gap-1.5">
        <Button variant={taskType === 'put_away' ? 'default' : 'outline'} size="sm"
          className="flex-1 text-xs h-8" onClick={() => setTaskType('put_away')}>Put-away</Button>
        <Button variant={taskType === 'pick' ? 'default' : 'outline'} size="sm"
          className="flex-1 text-xs h-8" onClick={() => setTaskType('pick')}>Pick</Button>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Item</Label>
        <ItemPickerSelect
          value={itemId} onValueChange={(v) => setItemId(v)} searchItems={searchItems}
          labelFormatter={labelFormatter} valueKey="id" placeholder="Select an item…"
          searchPlaceholder="Search items…" minSearchLength={2} selectedItemData={null}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Quantity</Label>
        <Input type="number" min={1} value={quantity}
          onChange={(e) => setQuantity(Math.max(1, parseFloat(e.target.value) || 1))} className="h-8 text-xs" />
      </div>
      <Button size="sm" className="w-full gap-1.5" onClick={handleFind} disabled={loading || !itemId}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Suggest bins
      </Button>
      {error && <p className="text-xs text-destructive flex items-start gap-1"><Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />{error}</p>}
      {results.length > 0 && (
        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {results.map((s) => (
            <div key={s.bin_id} className="rounded-md border p-2 text-xs space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-medium truncate">#{s.rank} {s.bin_code ?? s.bin_id.slice(0, 8)}</span>
                <span className="text-[10px] text-amber-700 font-semibold">{s.score.toFixed(0)} pts</span>
              </div>
              {s.reasons.length > 0 && <p className="text-[10px] text-muted-foreground line-clamp-2">{s.reasons.join(' · ')}</p>}
              <div className="flex gap-3 text-[10px] text-muted-foreground">
                <span>Avail: {s.available_capacity.toFixed(0)}</span>
                <span>~{s.estimated_time_seconds}s</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

const LEGEND = [
  { color: 'bg-green-400', label: '0–30% empty' },
  { color: 'bg-amber-400', label: '31–70% moderate' },
  { color: 'bg-red-400', label: '71–100% full' },
  { color: 'bg-blue-400', label: 'Reserved' },
  { color: 'bg-yellow-400', label: 'Suggested' },
  { color: 'bg-orange-400', label: 'Expiring items' },
  { color: 'bg-slate-400', label: 'Inactive' },
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

// ─── Main Component ───────────────────────────────────────────────────────────

export function Warehouse3DView({ warehouseId }: { warehouseId: string }) {
  const [selectedBinId, setSelectedBinId] = React.useState<string | null>(null);
  const [suggestedIds, setSuggestedIds] = React.useState<Set<string>>(new Set());
  const [hoveredBin, setHoveredBin] = React.useState<FlatBin | null>(null);
  const [showSuggest, setShowSuggest] = React.useState(false);
  const [colorMode, setColorMode] = React.useState<'status' | 'heat'>('status');

  const { activeBins, layout, loading, error, statusLoading, wsConnected, refetch, refetchStatus } =
    useWarehouse3D(warehouseId);

  const selectedBin = selectedBinId ? activeBins.find((b) => b.id === selectedBinId) ?? null : null;

  // Compute camera position based on warehouse size
  const cameraPosition = React.useMemo<[number, number, number]>(() => {
    if (activeBins.length === 0) return [10, 10, 10];
    const xs = activeBins.map((b) => b.position.x);
    const ys = activeBins.map((b) => b.position.y);
    const zs = activeBins.map((b) => b.position.z);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 5);
    const maxZ = Math.max(...zs) + 1;
    return [cx + span * 0.8, maxZ + span * 0.6, cy + span * 0.8];
  }, [activeBins]);

  const targetPosition = React.useMemo<[number, number, number]>(() => {
    if (activeBins.length === 0) return [0, 0, 0];
    const xs = activeBins.map((b) => b.position.x);
    const ys = activeBins.map((b) => b.position.y);
    const zs = activeBins.map((b) => b.position.z);
    return [
      (Math.min(...xs) + Math.max(...xs)) / 2,
      (Math.min(...zs) + Math.max(...zs)) / 2,
      (Math.min(...ys) + Math.max(...ys)) / 2,
    ];
  }, [activeBins]);

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
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant={colorMode === 'heat' ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5"
            onClick={() => setColorMode((m) => (m === 'heat' ? 'status' : 'heat'))}>
            <Flame className="h-4 w-4" /> Heat-map
          </Button>
          <Button
            variant={showSuggest ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5"
            onClick={() => setShowSuggest((s) => !s)}>
            <Target className="h-4 w-4" /> Suggest
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {statusLoading && <Loader2 className="h-3 w-3 animate-spin" />}
          <span>{activeBins.length} bins</span>
          {wsConnected ? (
            <Badge variant="secondary" className="gap-1 text-emerald-700 bg-emerald-100 px-1.5 py-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" /> Live
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-muted-foreground px-1.5 py-0">Polling</Badge>
          )}
          {layout && <span className="font-medium">{layout.warehouse.name}</span>}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={refetchStatus}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 3D Canvas + Side panels */}
      <div className="flex gap-3 items-start">
        {/* Three.js Canvas */}
        <div className="flex-1 min-w-0 rounded-lg border overflow-hidden bg-slate-900" style={{ height: '520px' }}>
          <Canvas
            camera={{ position: cameraPosition, fov: 50, near: 0.1, far: 200 }}
            onPointerMissed={() => setSelectedBinId(null)}
          >
            <SceneContent
              bins={activeBins}
              selectedBinId={selectedBinId}
              suggestedIds={suggestedIds}
              hoveredBin={hoveredBin}
              onSelectBin={(bin) => setSelectedBinId(bin ? bin.id : null)}
              onHoverBin={setHoveredBin}
            />
          </Canvas>
        </div>

        {/* Side panels */}
        {showSuggest && (
          <BinSuggestionPanel
            warehouseId={warehouseId}
            onResults={(s) => setSuggestedIds(new Set(s.map((x) => x.bin_id)))}
            onClose={() => { setShowSuggest(false); setSuggestedIds(new Set()); }}
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
        Left-drag to rotate · Right-drag to pan · Scroll to zoom · Click a bin for details · Hover for quick info
      </p>
    </div>
  );
}
