/**
 * Warehouse 3D View — React Three Fiber implementation
 *
 * Renders the warehouse layout as an interactive 3D scene with:
 * - Structural rack frames (uprights + beams per aisle)
 * - GPU-instanced bins for performance (1000+ bins at 60fps)
 * - Dark themed floor with grid overlay
 * - Hover tooltip + selected bin highlight with pulse
 * - OrbitControls for smooth 360° rotation
 * - Status color coding (fill %, reserved, suggested, expiring)
 *
 * Data source: useWarehouse3D hook (GET /wms-3d/layout + /wms-3d/status)
 * Visual reference: warehouse-digital-twin- project
 */
import * as React from 'react';

import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, Grid } from '@react-three/drei';
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

// ─── Color mapping ────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  empty: '#475569',
  inStock: '#10b981',
  lowStock: '#f59e0b',
  expiring: '#ef4444',
  reserved: '#3b82f6',
  suggested: '#f59e0b',
  selected: '#38bdf8',
};

function getBinStatus(bin: FlatBin, suggestedIds: Set<string>): string {
  if (suggestedIds.has(bin.id)) return 'suggested';
  const isReserved = bin.live_is_reserved ?? bin.is_reserved;
  if (isReserved) return 'reserved';
  if (bin.has_expiring_items) return 'expiring';
  const fillPct = bin.live_fill_pct ?? bin.fill_percentage;
  if (fillPct === 0) return 'empty';
  if (fillPct <= 30) return 'inStock';
  if (fillPct <= 70) return 'lowStock';
  return 'expiring';
}

function getBinColor(bin: FlatBin, suggestedIds: Set<string>): string {
  const status = getBinStatus(bin, suggestedIds);
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.inStock;
}

// ─── Rack Frame (structural steel per aisle) ──────────────────────────────────

interface RackFrameProps {
  bins: FlatBin[];
}

function RackFrame({ bins }: RackFrameProps) {
  if (bins.length === 0) return null;

  const xs = bins.map(b => b.position.x);
  const ys = bins.map(b => b.position.y);
  const zs = bins.map(b => b.position.z);

  const minX = Math.min(...xs) - 0.8;
  const maxX = Math.max(...xs) + 0.8;
  const minY = Math.min(...ys) - 0.8;
  const maxY = Math.max(...ys) + 0.8;
  const maxZ = Math.max(...zs) + 1.2;

  // Vertical uprights at corners
  const uprightHeight = maxZ;
  const uprights: React.ReactElement[] = [];
  const beams: React.ReactElement[] = [];

  // Place uprights at min/max x and y boundaries
  const xPositions = [minX, maxX];
  const yPositions = [minY, maxY];

  // Add intermediate uprights every ~3 units along Y
  const ySpan = maxY - minY;
  const ySteps = Math.max(2, Math.ceil(ySpan / 3));
  const yStep = ySpan / ySteps;
  for (let i = 0; i <= ySteps; i++) {
    const yPos = minY + i * yStep;
    if (!yPositions.includes(yPos)) yPositions.push(yPos);
  }

  for (const x of xPositions) {
    for (const y of yPositions) {
      uprights.push(
        <mesh key={`up-${x}-${y}`} position={[x, uprightHeight / 2, y]}>
          <boxGeometry args={[0.08, uprightHeight, 0.08]} />
          <meshStandardMaterial color="#64748b" roughness={0.7} metalness={0.5} />
        </mesh>
      );
    }
  }

  // Horizontal beams at each level
  const levels = [...new Set(zs)].sort((a, b) => a - b);
  for (const z of levels) {
    // Beams along X direction
    const midX = (minX + maxX) / 2;
    const spanX = maxX - minX;
    for (const y of yPositions) {
      beams.push(
        <mesh key={`bx-${z}-${y}`} position={[midX, z, y]}>
          <boxGeometry args={[spanX, 0.06, 0.06]} />
          <meshStandardMaterial color="#475569" roughness={0.8} metalness={0.4} />
        </mesh>
      );
    }
    // Beams along Y direction
    const midY = (minY + maxY) / 2;
    const spanY = maxY - minY;
    for (const x of xPositions) {
      beams.push(
        <mesh key={`by-${z}-${x}`} position={[x, z, midY]}>
          <boxGeometry args={[0.06, 0.06, spanY]} />
          <meshStandardMaterial color="#475569" roughness={0.8} metalness={0.4} />
        </mesh>
      );
    }
  }

  return <group>{uprights}{beams}</group>;
}

// ─── Instanced Bins (GPU performance) ─────────────────────────────────────────

interface InstancedBinsProps {
  bins: FlatBin[];
  suggestedIds: Set<string>;
  selectedBinId: string | null;
  hoveredBinId: string | null;
  activeFilter: string;
  onSelect: (bin: FlatBin) => void;
  onHover: (binId: string | null) => void;
}

function InstancedBins({ bins, suggestedIds, selectedBinId, hoveredBinId, activeFilter, onSelect, onHover }: InstancedBinsProps) {
  const meshRef = React.useRef<THREE.InstancedMesh>(null);
  const tempObject = React.useMemo(() => new THREE.Object3D(), []);
  const tempColor = React.useMemo(() => new THREE.Color(), []);

  React.useEffect(() => {
    if (!meshRef.current || bins.length === 0) return;

    bins.forEach((bin, index) => {
      // Position: x maps to X, y maps to Z (depth), z maps to Y (height)
      tempObject.position.set(bin.position.x, bin.position.z + 0.5, bin.position.y);
      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(index, tempObject.matrix);

      // Color based on status + filter
      const status = getBinStatus(bin, suggestedIds);
      if (activeFilter !== 'all' && status !== activeFilter) {
        tempColor.set('#1e293b'); // dimmed
      } else {
        tempColor.set(getBinColor(bin, suggestedIds));
      }
      meshRef.current!.setColorAt(index, tempColor);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [bins, suggestedIds, activeFilter, tempObject, tempColor]);

  return (
    <>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, bins.length]}
        onClick={(e) => {
          e.stopPropagation();
          if (e.instanceId !== undefined) onSelect(bins[e.instanceId]);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (e.instanceId !== undefined) {
            onHover(bins[e.instanceId].id);
            document.body.style.cursor = 'pointer';
          }
        }}
        onPointerMove={(e) => {
          e.stopPropagation();
          if (e.instanceId !== undefined) {
            onHover(bins[e.instanceId].id);
          }
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <boxGeometry args={[0.8, 0.85, 0.8]} />
        <meshStandardMaterial roughness={0.45} metalness={0.15} />
      </instancedMesh>

      {/* Hover highlight */}
      {hoveredBinId && hoveredBinId !== selectedBinId && (
        <HighlightBin bin={bins.find(b => b.id === hoveredBinId)!} color="#3b82f6" pulse={false} />
      )}

      {/* Selected highlight */}
      {selectedBinId && (
        <HighlightBin bin={bins.find(b => b.id === selectedBinId)!} color="#f59e0b" pulse={true} />
      )}
    </>
  );
}

// ─── Highlight Bin (hover/selected overlay) ───────────────────────────────────

function HighlightBin({ bin, color, pulse }: { bin: FlatBin | undefined; color: string; pulse: boolean }) {
  const meshRef = React.useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current || !pulse) return;
    const t = clock.getElapsedTime();
    (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 + Math.sin(t * 3) * 0.3;
  });

  if (!bin) return null;

  return (
    <mesh ref={meshRef} position={[bin.position.x, bin.position.z + 0.5, bin.position.y]}>
      <boxGeometry args={[0.9, 0.95, 0.9]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        roughness={0.3}
        metalness={0.2}
        transparent
        opacity={0.92}
      />
    </mesh>
  );
}

// ─── Hover Tooltip (dark themed, matching reference) ──────────────────────────

function BinTooltip({ bin, suggestedIds }: { bin: FlatBin; suggestedIds: Set<string> }) {
  const fillPct = bin.live_fill_pct ?? bin.fill_percentage;
  const status = getBinStatus(bin, suggestedIds);
  const statusColor = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#94a3b8';

  return (
    <Html
      center
      distanceFactor={18}
      style={{ pointerEvents: 'none' }}
      zIndexRange={[100, 0]}
    >
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: `1px solid ${statusColor}`,
        borderRadius: 6,
        padding: '8px 12px',
        minWidth: 160,
        boxShadow: `0 0 12px ${statusColor}55`,
        color: '#f8fafc',
        fontSize: 12,
        lineHeight: 1.6,
        whiteSpace: 'nowrap',
      }}>
        <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: 4 }}>{bin.code}</div>
        <div>
          <span style={{ color: '#94a3b8' }}>Fill: </span>
          <span style={{ color: statusColor, fontWeight: 600 }}>{fillPct.toFixed(0)}%</span>
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>Items: </span>{bin.items_count}
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>Zone: </span>{bin.zone_name ?? bin.zone_code}
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>Aisle: </span>{bin.aisle_code}
          <span style={{ color: '#94a3b8', marginLeft: 8 }}>Bay: </span>{bin.bay_code}
          <span style={{ color: '#94a3b8', marginLeft: 8 }}>Level: </span>{bin.level_code}
        </div>
        {(bin.live_is_reserved ?? bin.is_reserved) && (
          <div style={{ color: '#3b82f6', fontWeight: 600, marginTop: 2 }}>Reserved</div>
        )}
        <div style={{ marginTop: 4, fontSize: 10, color: '#64748b' }}>Click to inspect</div>
      </div>
    </Html>
  );
}

// ─── Floor + Grid ─────────────────────────────────────────────────────────────

function WarehouseFloor({ bins }: { bins: FlatBin[] }) {
  if (bins.length === 0) return null;
  const xs = bins.map(b => b.position.x);
  const ys = bins.map(b => b.position.y);
  const minX = Math.min(...xs) - 3;
  const maxX = Math.max(...xs) + 3;
  const minY = Math.min(...ys) - 3;
  const maxY = Math.max(...ys) + 3;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const w = maxX - minX;
  const d = maxY - minY;
  const wallH = 0.3;
  const wallThick = 0.08;

  return (
    <>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, -0.02, cy]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>

      {/* Grid */}
      <Grid
        position={[cx, 0, cy]}
        args={[w, d]}
        cellSize={1.5}
        cellThickness={0.4}
        cellColor="#1e3a5f"
        sectionSize={6}
        sectionThickness={0.8}
        sectionColor="#1e40af"
        fadeDistance={80}
        fadeStrength={1}
        infiniteGrid={false}
      />

      {/* Walls — thin colored strips along boundaries */}
      {/* Front wall (Z-min, facing viewer) — Blue */}
      <mesh position={[cx, wallH / 2, minY - wallThick / 2]}>
        <boxGeometry args={[w, wallH, wallThick]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.5} />
      </mesh>
      {/* Back wall (Z-max) — Orange */}
      <mesh position={[cx, wallH / 2, maxY + wallThick / 2]}>
        <boxGeometry args={[w, wallH, wallThick]} />
        <meshStandardMaterial color="#f97316" roughness={0.5} />
      </mesh>
      {/* Left wall (X-min) — Green */}
      <mesh position={[minX - wallThick / 2, wallH / 2, cy]}>
        <boxGeometry args={[wallThick, wallH, d]} />
        <meshStandardMaterial color="#22c55e" roughness={0.5} />
      </mesh>
      {/* Right wall (X-max) — Purple */}
      <mesh position={[maxX + wallThick / 2, wallH / 2, cy]}>
        <boxGeometry args={[wallThick, wallH, d]} />
        <meshStandardMaterial color="#a855f7" roughness={0.5} />
      </mesh>

      {/* Direction labels */}
      <Html position={[cx, 0.6, minY - 1]} center distanceFactor={20} style={{ pointerEvents: 'none' }}>
        <div style={{ background: '#3b82f6', color: '#fff', padding: '2px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
          FRONT WALL
        </div>
      </Html>
      <Html position={[cx, 0.6, maxY + 1]} center distanceFactor={20} style={{ pointerEvents: 'none' }}>
        <div style={{ background: '#f97316', color: '#fff', padding: '2px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
          BACK WALL
        </div>
      </Html>
      <Html position={[minX - 1, 0.6, cy]} center distanceFactor={20} style={{ pointerEvents: 'none' }}>
        <div style={{ background: '#22c55e', color: '#fff', padding: '2px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
          LEFT WALL
        </div>
      </Html>
      <Html position={[maxX + 1, 0.6, cy]} center distanceFactor={20} style={{ pointerEvents: 'none' }}>
        <div style={{ background: '#a855f7', color: '#fff', padding: '2px 10px', borderRadius: 4, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
          RIGHT WALL
        </div>
      </Html>
    </>
  );
}

// ─── 3D Scene Content ─────────────────────────────────────────────────────────

interface SceneProps {
  bins: FlatBin[];
  suggestedIds: Set<string>;
  selectedBinId: string | null;
  hoveredBinId: string | null;
  activeFilter: string;
  onSelect: (bin: FlatBin) => void;
  onHover: (binId: string | null) => void;
}

function Scene({ bins, suggestedIds, selectedBinId, hoveredBinId, activeFilter, onSelect, onHover }: SceneProps) {
  // Compute center for orbit target
  const center = React.useMemo<[number, number, number]>(() => {
    if (bins.length === 0) return [0, 0, 0];
    const xs = bins.map(b => b.position.x);
    const ys = bins.map(b => b.position.y);
    const zs = bins.map(b => b.position.z);
    return [
      (Math.min(...xs) + Math.max(...xs)) / 2,
      (Math.min(...zs) + Math.max(...zs)) / 2,
      (Math.min(...ys) + Math.max(...ys)) / 2,
    ];
  }, [bins]);

  const hoveredBin = hoveredBinId ? bins.find(b => b.id === hoveredBinId) : null;

  // Group bins by aisle for rack frame generation
  const aisleGroups = React.useMemo(() => {
    const map = new Map<string, FlatBin[]>();
    for (const bin of bins) {
      const key = bin.aisle_id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(bin);
    }
    return Array.from(map.values());
  }, [bins]);

  // Compute zone labels (centered above each zone's bins)
  const zoneLabels = React.useMemo(() => {
    const map = new Map<string, { code: string; name: string | null; xs: number[]; ys: number[]; zs: number[] }>();
    for (const bin of bins) {
      if (!map.has(bin.zone_id)) map.set(bin.zone_id, { code: bin.zone_code, name: bin.zone_name, xs: [], ys: [], zs: [] });
      const g = map.get(bin.zone_id)!;
      g.xs.push(bin.position.x);
      g.ys.push(bin.position.y);
      g.zs.push(bin.position.z);
    }
    return Array.from(map.values()).map((g) => ({
      code: g.code,
      name: g.name,
      x: (Math.min(...g.xs) + Math.max(...g.xs)) / 2,
      y: (Math.min(...g.ys) + Math.max(...g.ys)) / 2,
      z: Math.max(...g.zs),
    }));
  }, [bins]);

  // Compute aisle labels (centered above each aisle's bins)
  const aisleLabels = React.useMemo(() => {
    const map = new Map<string, { code: string; name: string | null; xs: number[]; ys: number[]; zs: number[] }>();
    for (const bin of bins) {
      if (!map.has(bin.aisle_id)) map.set(bin.aisle_id, { code: bin.aisle_code, name: bin.aisle_name, xs: [], ys: [], zs: [] });
      const g = map.get(bin.aisle_id)!;
      g.xs.push(bin.position.x);
      g.ys.push(bin.position.y);
      g.zs.push(bin.position.z);
    }
    return Array.from(map.values()).map((g) => ({
      code: g.code,
      name: g.name,
      x: (Math.min(...g.xs) + Math.max(...g.xs)) / 2,
      y: (Math.min(...g.ys) + Math.max(...g.ys)) / 2,
      z: Math.max(...g.zs),
    }));
  }, [bins]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[30, 50, 30]} intensity={1.4} castShadow shadow-mapSize={[2048, 2048]} />
      <directionalLight position={[-20, 30, -20]} intensity={0.4} color="#bfdbfe" />
      <pointLight position={[center[0], 8, center[2]]} intensity={0.3} color="#e0f2fe" />

      {/* Floor + Grid */}
      <WarehouseFloor bins={bins} />

      {/* Rack frames per aisle */}
      {aisleGroups.map((aisleBins, i) => (
        <RackFrame key={i} bins={aisleBins} />
      ))}

      {/* Zone labels */}
      {zoneLabels.map((zl) => (
        <Html key={`zone-${zl.code}`} position={[zl.x, zl.z + 2.5, zl.y]} center distanceFactor={25} style={{ pointerEvents: 'none' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.9)', color: '#fff', padding: '3px 12px', borderRadius: 5, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>
            {zl.name || zl.code}
          </div>
        </Html>
      ))}

      {/* Aisle labels */}
      {aisleLabels.map((al) => (
        <Html key={`aisle-${al.code}`} position={[al.x, al.z + 1.5, al.y]} center distanceFactor={20} style={{ pointerEvents: 'none' }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.9)', color: '#94a3b8', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap', border: '1px solid #334155' }}>
            {al.name || al.code}
          </div>
        </Html>
      ))}

      {/* Instanced bins */}
      <InstancedBins
        bins={bins}
        suggestedIds={suggestedIds}
        selectedBinId={selectedBinId}
        hoveredBinId={hoveredBinId}
        activeFilter={activeFilter}
        onSelect={onSelect}
        onHover={onHover}
      />

      {/* Hover tooltip */}
      {hoveredBin && (
        <group position={[hoveredBin.position.x, hoveredBin.position.z + 1.2, hoveredBin.position.y]}>
          <BinTooltip bin={hoveredBin} suggestedIds={suggestedIds} />
        </group>
      )}

      {/* Camera controls */}
      <OrbitControls
        makeDefault
        target={center}
        minDistance={3}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2.1}
        enableDamping
        dampingFactor={0.1}
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

  React.useEffect(() => {
    if (!accessToken || !bin.id) return;
    let cancelled = false;
    setStockLoading(true);
    wms3dApi.getBinStock(accessToken, bin.id)
      .then((res) => { if (!cancelled) setStockItems(res.items); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setStockLoading(false); });
    return () => { cancelled = true; };
  }, [accessToken, bin.id]);

  const isExpiringSoon = (expiry: string | null) => {
    if (!expiry) return false;
    return new Date(expiry).getTime() - Date.now() <= 30 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="w-80 shrink-0 rounded-lg border bg-card shadow-lg p-4 space-y-3 max-h-[600px] overflow-y-auto">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-sm">{bin.code}</p>
          <p className="text-xs text-muted-foreground">{bin.full_path ?? '\u2014'}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md bg-muted/50 p-2"><p className="text-muted-foreground">Fill</p><p className="font-semibold text-sm">{fillPct.toFixed(1)}%</p></div>
        <div className="rounded-md bg-muted/50 p-2"><p className="text-muted-foreground">Available</p><p className="font-semibold text-sm">{bin.available_capacity.toFixed(1)}</p></div>
        <div className="rounded-md bg-muted/50 p-2"><p className="text-muted-foreground">Items</p><p className="font-semibold text-sm">{bin.items_count}</p></div>
        <div className="rounded-md bg-muted/50 p-2"><p className="text-muted-foreground">Capacity</p><p className="font-semibold text-sm">{bin.capacity.toFixed(1)}</p></div>
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between"><span className="text-muted-foreground">Zone</span><span className="font-medium">{bin.zone_name ?? bin.zone_code}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Aisle</span><span className="font-medium">{bin.aisle_name ?? bin.aisle_code}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Bay / Level</span><span className="font-medium">{bin.bay_code} / {bin.level_code}</span></div>
      </div>
      <div className="flex flex-wrap gap-1">
        {isReserved && <Badge variant="secondary" className="gap-1 text-blue-700 bg-blue-100"><Lock className="h-3 w-3" />Reserved</Badge>}
        {bin.has_expiring_items && <Badge variant="secondary" className="gap-1 text-orange-700 bg-orange-100"><AlertTriangle className="h-3 w-3" />Expiring</Badge>}
      </div>
      {/* Stock Items */}
      <div className="border-t pt-3 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stock Items</p>
        {stockLoading && <div className="flex items-center gap-2 text-xs text-muted-foreground py-2"><Loader2 className="h-3 w-3 animate-spin" />Loading…</div>}
        {!stockLoading && stockItems.length === 0 && <p className="text-xs text-muted-foreground italic">No stock</p>}
        {!stockLoading && stockItems.map((item, idx) => (
          <div key={`${item.item_id}-${idx}`} className={cn('rounded-md border p-2 text-xs space-y-1', isExpiringSoon(item.expiry_date) && 'border-orange-300 bg-orange-50')}>
            <div className="flex justify-between gap-2">
              <div className="min-w-0"><p className="font-medium truncate">{item.item_name}</p><p className="text-muted-foreground font-mono text-[10px]">{item.item_code}</p></div>
              <span className="font-semibold whitespace-nowrap">{item.quantity_on_hand}{item.uom ? ` ${item.uom}` : ''}</span>
            </div>
            {(item.batch_number || item.expiry_date) && (
              <div className="flex gap-3 text-[10px] text-muted-foreground">
                {item.batch_number && <span>Batch: {item.batch_number}</span>}
                {item.expiry_date && <span className={cn(isExpiringSoon(item.expiry_date) && 'text-orange-700 font-medium')}>Exp: {item.expiry_date}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── BinSuggestionPanel ───────────────────────────────────────────────────────

function BinSuggestionPanel({ warehouseId, onResults, onClose }: { warehouseId: string; onResults: (s: Suggestion[]) => void; onClose: () => void }) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [taskType, setTaskType] = React.useState<'put_away' | 'pick'>('put_away');
  const [itemId, setItemId] = React.useState('');
  const [quantity, setQuantity] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [results, setResults] = React.useState<Suggestion[]>([]);

  const searchItems = React.useCallback(async (query: string) => {
    if (!accessToken) return [];
    const res = await fetch(`${environment.apiCoreUrl}/api/v1/items/picker?search=${encodeURIComponent(query)}`, { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items ?? []) as Array<{ id: string; item_code: string; item_name: string }>;
  }, [accessToken]);

  const handleFind = async () => {
    if (!accessToken || !itemId) return;
    setLoading(true); setError(null);
    try {
      const resp = await wms3dApi.suggest(accessToken, { task_type: taskType, item_id: itemId, quantity, warehouse_id: warehouseId, worker_id: NIL_UUID, limit: 10 });
      setResults(resp.suggestions); onResults(resp.suggestions);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed'); setResults([]); onResults([]); }
    finally { setLoading(false); }
  };

  return (
    <div className="w-80 shrink-0 rounded-lg border bg-card shadow-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm flex items-center gap-1.5"><Target className="h-4 w-4 text-amber-600" />Find Optimal Bins</p>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      <div className="flex gap-1.5">
        <Button variant={taskType === 'put_away' ? 'default' : 'outline'} size="sm" className="flex-1 text-xs h-8" onClick={() => setTaskType('put_away')}>Put-away</Button>
        <Button variant={taskType === 'pick' ? 'default' : 'outline'} size="sm" className="flex-1 text-xs h-8" onClick={() => setTaskType('pick')}>Pick</Button>
      </div>
      <div className="space-y-1"><Label className="text-xs">Item</Label>
        <ItemPickerSelect value={itemId} onValueChange={setItemId} searchItems={searchItems} labelFormatter={(i: { item_name: string; item_code: string }) => `${i.item_name} (${i.item_code})`} valueKey="id" placeholder="Select item…" searchPlaceholder="Search…" minSearchLength={2} selectedItemData={null} />
      </div>
      <div className="space-y-1"><Label className="text-xs">Quantity</Label><Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, parseFloat(e.target.value) || 1))} className="h-8 text-xs" /></div>
      <Button size="sm" className="w-full gap-1.5" onClick={handleFind} disabled={loading || !itemId}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Suggest bins</Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {results.length > 0 && (
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {results.map((s) => (
            <div key={s.bin_id} className="rounded-md border p-2 text-xs space-y-1">
              <div className="flex justify-between"><span className="font-mono font-medium">#{s.rank} {s.bin_code ?? s.bin_id.slice(0, 8)}</span><span className="text-amber-700 font-semibold">{s.score.toFixed(0)}pts</span></div>
              {s.reasons.length > 0 && <p className="text-[10px] text-muted-foreground line-clamp-2">{s.reasons.join(' · ')}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Filter Controls (overlay on canvas, matching reference style) ─────────────

const FILTER_OPTIONS = [
  { key: 'all', label: 'All Bins', icon: '🌐' },
  { key: 'inStock', label: 'In Stock', color: STATUS_COLORS.inStock },
  { key: 'lowStock', label: 'Low Stock', color: STATUS_COLORS.lowStock },
  { key: 'expiring', label: 'Expiring', color: STATUS_COLORS.expiring },
  { key: 'empty', label: 'Empty', color: STATUS_COLORS.empty },
  { key: 'reserved', label: 'Reserved', color: STATUS_COLORS.reserved },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function Warehouse3DView({ warehouseId }: { warehouseId: string }) {
  const [selectedBinId, setSelectedBinId] = React.useState<string | null>(null);
  const [hoveredBinId, setHoveredBinId] = React.useState<string | null>(null);
  const [suggestedIds, setSuggestedIds] = React.useState<Set<string>>(new Set());
  const [showSuggest, setShowSuggest] = React.useState(false);
  const [activeFilter, setActiveFilter] = React.useState('all');

  const { activeBins, layout, loading, error, statusLoading, wsConnected, refetch, refetchStatus } =
    useWarehouse3D(warehouseId);

  const selectedBin = selectedBinId ? activeBins.find(b => b.id === selectedBinId) ?? null : null;

  // Camera position based on warehouse extent
  const cameraPosition = React.useMemo<[number, number, number]>(() => {
    if (activeBins.length === 0) return [15, 15, 25];
    const xs = activeBins.map(b => b.position.x);
    const ys = activeBins.map(b => b.position.y);
    const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 5);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    return [cx + span * 0.7, span * 0.6 + 5, cy + span * 0.9];
  }, [activeBins]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /><span>Loading 3D warehouse…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <Info className="h-8 w-8 text-muted-foreground" />
        <p className="font-medium">Could not load 3D layout</p>
        <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
        <Button variant="outline" size="sm" onClick={refetch} className="gap-2"><RefreshCw className="h-4 w-4" />Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant={showSuggest ? 'default' : 'outline'} size="sm" className="gap-1.5" onClick={() => setShowSuggest(s => !s)}>
            <Target className="h-4 w-4" />Suggest
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {statusLoading && <Loader2 className="h-3 w-3 animate-spin" />}
          <span>{activeBins.length} bins</span>
          {wsConnected ? (
            <Badge variant="secondary" className="gap-1 text-emerald-700 bg-emerald-100 px-1.5 py-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />Live
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-muted-foreground px-1.5 py-0">Polling</Badge>
          )}
          {layout && <span className="font-medium">{layout.warehouse.name}</span>}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={refetchStatus}><RefreshCw className="h-3.5 w-3.5" /></Button>
        </div>
      </div>

      {/* Canvas + Side panels */}
      <div className="flex gap-3 items-start">
        {/* 3D Canvas with dark background */}
        <div className="flex-1 min-w-0 rounded-lg border overflow-hidden relative" style={{ height: 580, backgroundColor: '#0f172a' }}>
          <Canvas camera={{ position: cameraPosition, fov: 50 }} shadows onPointerMissed={() => setSelectedBinId(null)}>
            <Scene
              bins={activeBins}
              suggestedIds={suggestedIds}
              selectedBinId={selectedBinId}
              hoveredBinId={hoveredBinId}
              activeFilter={activeFilter}
              onSelect={(bin) => setSelectedBinId(bin.id)}
              onHover={setHoveredBinId}
            />
          </Canvas>

          {/* Filter overlay (top-left) */}
          <div className="absolute top-4 left-4 rounded-lg border border-blue-900 bg-slate-900/90 backdrop-blur-sm p-3 space-y-1.5" style={{ minWidth: 160 }}>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">Inventory Filter</p>
            {FILTER_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setActiveFilter(opt.key)}
                className={cn(
                  'flex items-center gap-2 w-full px-2.5 py-1.5 rounded text-xs text-left transition-all',
                  activeFilter === opt.key ? 'bg-slate-800 text-white border border-slate-600' : 'text-slate-400 hover:text-slate-200 border border-transparent',
                )}>
                {opt.color && <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: opt.color, boxShadow: activeFilter === opt.key ? `0 0 6px ${opt.color}` : 'none' }} />}
                {opt.icon && <span className="text-sm">{opt.icon}</span>}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>

          {/* Bottom hint */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/75 backdrop-blur px-4 py-1.5 rounded-full border border-slate-700 text-[11px] text-slate-500 pointer-events-none whitespace-nowrap">
            Hover to preview · Click to inspect · Drag to orbit · Scroll to zoom
          </div>
        </div>

        {/* Side panels */}
        {showSuggest && (
          <BinSuggestionPanel
            warehouseId={warehouseId}
            onResults={(s) => setSuggestedIds(new Set(s.map(x => x.bin_id)))}
            onClose={() => { setShowSuggest(false); setSuggestedIds(new Set()); }}
          />
        )}
        {selectedBin && <BinDetailPanel bin={selectedBin} onClose={() => setSelectedBinId(null)} />}
      </div>
    </div>
  );
}
