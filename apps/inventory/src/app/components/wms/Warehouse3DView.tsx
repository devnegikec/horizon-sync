/* eslint-disable react/no-unknown-property -- react-three-fiber uses custom JSX props (position, args, intensity, etc.) */
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

import { Html, OrbitControls, Grid } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { AlertTriangle, Clock, Flame, Info, Loader2, Lock, RefreshCw, Sparkles, Target, X } from 'lucide-react';
import * as THREE from 'three';

import { useUserStore } from '@horizon-sync/store';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { cn } from '@horizon-sync/ui/lib';

import { environment } from '../../../environments/environment';
import { useWarehouse3D } from '../../hooks/useWarehouse3D';
import type { BinStockItem, FlatBin, Suggestion } from '../../types/wms3d.types';
import { wms3dApi } from '../../utility/api/wms3d';
import { ItemPickerSelect } from '../quotations/ItemPickerSelect';

import { deriveAisleBands, type AisleBand } from './aisleBands';
import { deriveBinMetrics, type BinMetrics } from './binMetrics';
import { LayoutMiniMap } from './LayoutMiniMap';

const NIL_UUID = '00000000-0000-0000-0000-000000000000';

// ─── Color mapping ────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  /**
   * The designer's default bin tone. A stock-free warehouse is mostly "empty" bins, so
   * this is the colour the whole rack face takes: a dark value here reads as unlit rock
   * rather than as racking.
   */
  empty: '#7c8ba1',
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

// ─── Scene palette & geometry ─────────────────────────────────────────────────

/**
 * Scene palette.
 *
 * Mirrors `src/design/theme.ts` in the warehouse designer so the two canvases agree on
 * what "floor", "rack steel" and "selected" look like. Keep them in step.
 */
const SCENE = {
  background: '#0b1220',
  floor: '#132033',
  floorEdge: '#334155',
  grid: '#1b2942',
  gridSection: '#2a3d5c',
  /** Painted uprights and bare beams, as the designer's racking draws them. */
  upright: '#94a3b8',
  beam: '#64748b',
  /** Bins excluded by the active inventory filter. */
  dimmed: '#1e293b',
  /**
   * The walkway, painted like the floor tape a real warehouse marks its aisles with.
   * Deliberately the one warm surface in the scene: it is the part of the plan that is
   * empty, and on a dark floor an unlit grey band reads as more racking.
   */
  aisle: '#8a5a0d',
  aisleEdge: '#fbbf24',
  /** Hover reads amber, selection reads cyan: the designer's convention, not the inverse. */
  hover: '#f59e0b',
  selected: '#22d3ee',
} as const;

/**
 * Rack steel cross-sections, matching the warehouse designer's racking.
 *
 * The bin size is deliberately NOT a constant here. A fixed cube cannot match every
 * warehouse's bay pitch, so the footprint is measured per layout by `deriveBinMetrics` -
 * see that module for why a 0.8 m cube leaves holes in a 2.7 m bay.
 */
const UPRIGHT_WIDTH = 0.12;
const BEAM_HEIGHT = 0.08;
const BEAM_DEPTH = 0.12;

// ─── Rack Frame (instanced structural steel) ──────────────────────────────────

interface Member {
  position: [number, number, number];
  scale: [number, number, number];
}

interface RackMembers {
  uprights: Member[];
  beams: Member[];
}

interface BayColumn {
  worldX: number;
  worldZ: number;
  heights: number[];
}

/** One column per distinct plan position - i.e. one bay of stacked levels. */
function collectBayColumns(bins: FlatBin[]): BayColumn[] {
  const byKey = new Map<string, BayColumn>();

  for (const bin of bins) {
    const key = `${bin.position.x.toFixed(3)}/${bin.position.y.toFixed(3)}`;
    const column = byKey.get(key);
    // `position.z` is already the centre of the bin's level, so it needs no lift.
    if (column) column.heights.push(bin.position.z);
    else byKey.set(key, { worldX: bin.position.x, worldZ: bin.position.y, heights: [bin.position.z] });
  }

  return [...byKey.values()];
}

/** Four uprights at the bay's corners, running the full height of its stack. */
function appendUprights(column: BayColumn, top: number, metrics: BinMetrics, out: Member[]): void {
  for (const dx of [-metrics.sizeX / 2, metrics.sizeX / 2]) {
    for (const dz of [-metrics.sizeZ / 2, metrics.sizeZ / 2]) {
      out.push({
        position: [column.worldX + dx, top / 2, column.worldZ + dz],
        scale: [UPRIGHT_WIDTH, top, UPRIGHT_WIDTH],
      });
    }
  }
}

/** Two beams under each level, spanning the bay front and back. */
function appendBeams(column: BayColumn, levels: number[], metrics: BinMetrics, out: Member[]): void {
  for (const level of levels) {
    const bottom = level - metrics.sizeY / 2;
    for (const dz of [-metrics.sizeZ / 2, metrics.sizeZ / 2]) {
      out.push({
        position: [column.worldX, bottom, column.worldZ + dz],
        scale: [metrics.sizeX, BEAM_HEIGHT, BEAM_DEPTH],
      });
    }
  }
}

/**
 * Uprights and beams derived from the bins themselves.
 *
 * The previous version framed the aisle's bounding box, so the steel floated outside the
 * racking whenever the bins did not fill that box. This frames each bay from its own
 * footprint instead. Both sets go into a single `InstancedMesh` each - two draw calls and
 * two materials regardless of bay or level count, where the per-member version issued one
 * draw call and one material per member (~250 on a realistic warehouse).
 */
function buildRackFrame(bins: FlatBin[], metrics: BinMetrics): RackMembers {
  const uprights: Member[] = [];
  const beams: Member[] = [];

  for (const column of collectBayColumns(bins)) {
    const levels = [...new Set(column.heights)].sort((a, b) => a - b);
    appendUprights(column, Math.max(...levels) + metrics.sizeY / 2, metrics, uprights);
    appendBeams(column, levels, metrics, beams);
  }

  return { uprights, beams };
}

interface RackInstancesProps {
  members: Member[];
  color: string;
  roughness: number;
  metalness: number;
}

function RackInstances({ members, color, roughness, metalness }: RackInstancesProps) {
  const meshRef = React.useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const object = new THREE.Object3D();
    members.forEach((member, index) => {
      object.position.set(member.position[0], member.position[1], member.position[2]);
      object.scale.set(member.scale[0], member.scale[1], member.scale[2]);
      object.updateMatrix();
      mesh.setMatrixAt(index, object.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    // Bounds are computed once from the identity matrix, so a wide rack gets frustum-culled.
    mesh.computeBoundingSphere();
  }, [members]);

  if (members.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} key={members.length} args={[undefined, undefined, members.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </instancedMesh>
  );
}

function RackFrame({ bins, metrics }: { bins: FlatBin[]; metrics: BinMetrics }) {
  const frame = React.useMemo(() => buildRackFrame(bins, metrics), [bins, metrics]);

  return (
    <group>
      <RackInstances members={frame.uprights} color={SCENE.upright} roughness={0.75} metalness={0.4} />
      <RackInstances members={frame.beams} color={SCENE.beam} roughness={0.75} metalness={0.4} />
    </group>
  );
}

// ─── Instanced Bins (GPU performance) ─────────────────────────────────────────

interface InstancedBinsProps {
  bins: FlatBin[];
  metrics: BinMetrics;
  suggestedIds: Set<string>;
  selectedBinId: string | null;
  hoveredBinId: string | null;
  activeFilter: string;
  onSelect: (bin: FlatBin) => void;
  onHover: (binId: string | null) => void;
}

function InstancedBins({ bins, metrics, suggestedIds, selectedBinId, hoveredBinId, activeFilter, onSelect, onHover }: InstancedBinsProps) {
  const meshRef = React.useRef<THREE.InstancedMesh>(null);
  const tempObject = React.useMemo(() => new THREE.Object3D(), []);
  const tempColor = React.useMemo(() => new THREE.Color(), []);

  // Id-keyed lookup so the highlight overlays never index into a stale array.
  const binsById = React.useMemo(() => new Map(bins.map((bin) => [bin.id, bin] as const)), [bins]);

  // Matrices depend on the bin set alone: filtering must not rewrite 100k transforms.
  React.useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || bins.length === 0) return;

    bins.forEach((bin, index) => {
      // x maps to world X, y maps to world Z (depth), z is the height of the centre.
      tempObject.position.set(bin.position.x, bin.position.z, bin.position.y);
      tempObject.updateMatrix();
      mesh.setMatrixAt(index, tempObject.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [bins, tempObject]);

  // Colours are a separate pass, so a filter change only updates the colour buffer.
  React.useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || bins.length === 0) return;

    bins.forEach((bin, index) => {
      const status = getBinStatus(bin, suggestedIds);
      if (activeFilter !== 'all' && status !== activeFilter) {
        tempColor.set(SCENE.dimmed);
      } else {
        tempColor.set(getBinColor(bin, suggestedIds));
      }
      mesh.setColorAt(index, tempColor);
    });

    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [bins, suggestedIds, activeFilter, tempColor]);

  const hoveredBin = hoveredBinId ? binsById.get(hoveredBinId) : undefined;
  const selectedBin = selectedBinId ? binsById.get(selectedBinId) : undefined;

  return (
    <>
      <instancedMesh ref={meshRef}
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
        }}>
        <boxGeometry args={[metrics.sizeX, metrics.sizeY, metrics.sizeZ]} />
        <meshStandardMaterial roughness={0.45} metalness={0.15} />
      </instancedMesh>

      {/*
        Hover and selection are drawn *over* the instances, not written into their colour
        buffer: the buffer is the inventory status, and overwriting it would lose state on
        the next colour pass.
      */}
      {hoveredBin && hoveredBin.id !== selectedBinId && <HighlightBin bin={hoveredBin} metrics={metrics} color={SCENE.hover} scale={1.04} emissiveIntensity={0.35} opacity={0.55} />}
      {selectedBin && <HighlightBin bin={selectedBin} metrics={metrics} color={SCENE.selected} scale={1.06} emissiveIntensity={0.4} opacity={0.7} />}
    </>
  );
}

// ─── Highlight Bin (hover/selected overlay) ───────────────────────────────────

interface HighlightBinProps {
  bin: FlatBin;
  metrics: BinMetrics;
  color: string;
  /** Multiplier applied to the bin footprint so the overlay reads as a shell. */
  scale: number;
  emissiveIntensity: number;
  opacity: number;
}

function HighlightBin({ bin, metrics, color, scale, emissiveIntensity, opacity }: HighlightBinProps) {
  return (
    <mesh position={[bin.position.x, bin.position.z, bin.position.y]}>
      <boxGeometry args={[metrics.sizeX * scale, metrics.sizeY * scale, metrics.sizeZ * scale]} />
      <meshStandardMaterial color={color}
        emissive={color}
        emissiveIntensity={emissiveIntensity}
        roughness={0.7}
        metalness={0.15}
        transparent
        opacity={opacity}
        depthWrite={false} />
    </mesh>
  );
}

// ─── Hover Tooltip (dark themed, matching reference) ──────────────────────────

function BinTooltip({ bin, suggestedIds }: { bin: FlatBin; suggestedIds: Set<string> }) {
  const fillPct = bin.live_fill_pct ?? bin.fill_percentage;
  const status = getBinStatus(bin, suggestedIds);
  const statusColor = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#94a3b8';

  return (
    <Html center distanceFactor={18} style={{ pointerEvents: 'none' }} zIndexRange={[100, 0]}>
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
          <span style={{ color: '#94a3b8' }}>Items: </span>
          {bin.items_count}
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>Zone: </span>
          {bin.zone_name ?? bin.zone_code}
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>Aisle: </span>
          {bin.aisle_code}
          <span style={{ color: '#94a3b8', marginLeft: 8 }}>Bay: </span>
          {bin.bay_code}
          <span style={{ color: '#94a3b8', marginLeft: 8 }}>Level: </span>
          {bin.level_code}
        </div>
        {(bin.live_is_reserved ?? bin.is_reserved) && <div style={{ color: '#3b82f6', fontWeight: 600, marginTop: 2 }}>Reserved</div>}
        <div style={{ marginTop: 4, fontSize: 10, color: '#64748b' }}>Click to inspect</div>
      </div>
    </Html>
  );
}

// ─── Floor + Grid ─────────────────────────────────────────────────────────────

/** Floor apron beyond the outermost bin, in scene units. */
const FLOOR_MARGIN = 3;

interface FloorBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  cx: number;
  cy: number;
  w: number;
  d: number;
}

function measureFloor(bins: FlatBin[]): FloorBounds | null {
  if (bins.length === 0) return null;

  const xs = bins.map((b) => b.position.x);
  const ys = bins.map((b) => b.position.y);
  const minX = Math.min(...xs) - FLOOR_MARGIN;
  const maxX = Math.max(...xs) + FLOOR_MARGIN;
  const minY = Math.min(...ys) - FLOOR_MARGIN;
  const maxY = Math.max(...ys) + FLOOR_MARGIN;

  return { minX, maxX, minY, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, w: maxX - minX, d: maxY - minY };
}

/**
 * The floor, grid and warehouse outline.
 *
 * The coloured boundary walls and their FRONT/BACK/LEFT/RIGHT labels are deliberately gone:
 * in a real warehouse those edges are the set of the scene, not props, and four saturated
 * slabs plus four floating tags dominated the frame. A hairline outline keeps the extent
 * legible without competing with the racks.
 */
function WarehouseFloor({ bins }: { bins: FlatBin[] }) {
  const bounds = React.useMemo(() => measureFloor(bins), [bins]);

  const outline = React.useMemo(() => {
    if (!bounds) return null;
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(bounds.minX, 0, bounds.minY),
      new THREE.Vector3(bounds.maxX, 0, bounds.minY),
      new THREE.Vector3(bounds.maxX, 0, bounds.maxY),
      new THREE.Vector3(bounds.minX, 0, bounds.maxY),
    ]);
  }, [bounds]);

  React.useEffect(() => () => outline?.dispose(), [outline]);

  if (!bounds || !outline) return null;
  const { cx, cy, w, d } = bounds;

  return (
    <>
      {/* Floor slab - a box, so the apron reads as a plinth from a low camera */}
      <mesh position={[cx, -0.1, cy]} receiveShadow>
        <boxGeometry args={[w, 0.2, d]} />
        <meshStandardMaterial color={SCENE.floor} roughness={0.95} metalness={0} />
      </mesh>

      {/* 1 m cell / 5 m section survey grid */}
      <Grid position={[cx, 0, cy]}
        args={[w, d]}
        cellSize={1}
        cellThickness={0.6}
        cellColor={SCENE.grid}
        sectionSize={5}
        sectionThickness={1.2}
        sectionColor={SCENE.gridSection}
        fadeDistance={180}
        fadeStrength={1}
        infiniteGrid={false}/>

      {/* Footprint outline */}
      <lineLoop geometry={outline} position={[0, 0.02, 0]}>
        <lineBasicMaterial color={SCENE.floorEdge} />
      </lineLoop>
    </>
  );
}

// ─── Aisle Floor (painted walkways) ───────────────────────────────────────────

/**
 * The walkways, laid on the floor between the rack faces.
 *
 * A slab rather than a decal: it sits proud of the floor by a few centimetres, which reads
 * from a low camera as painted floor tape and cannot z-fight with the slab beneath it. The
 * grid passes under it, so a walkway hides the survey grid exactly where the aisle is —
 * which is the point.
 */
function AisleFloor({ bands }: { bands: AisleBand[] }) {
  return (
    <>
      {bands.map((band) => {
        const run = band.end - band.start;
        return (
          <mesh key={band.id} position={[band.centerX, 0.02, band.centerZ]} receiveShadow>
            <boxGeometry args={[band.alongX ? run : band.widthM, 0.04, band.alongX ? band.widthM : run]} />
            <meshStandardMaterial color={SCENE.aisle} roughness={0.95} metalness={0} />
          </mesh>
        );
      })}
    </>
  );
}

// ─── 3D Scene Content ─────────────────────────────────────────────────────────

interface SceneProps {
  bins: FlatBin[];
  metrics: BinMetrics;
  aisleBands: AisleBand[];
  suggestedIds: Set<string>;
  selectedBinId: string | null;
  hoveredBinId: string | null;
  activeFilter: string;
  onSelect: (bin: FlatBin) => void;
  onHover: (binId: string | null) => void;
}

function Scene({ bins, metrics, aisleBands, suggestedIds, selectedBinId, hoveredBinId, activeFilter, onSelect, onHover }: SceneProps) {
  // Compute center for orbit target
  const center = React.useMemo<[number, number, number]>(() => {
    if (bins.length === 0) return [0, 0, 0];
    const xs = bins.map((b) => b.position.x);
    const ys = bins.map((b) => b.position.y);
    const zs = bins.map((b) => b.position.z);
    return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...zs) + Math.max(...zs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
  }, [bins]);

  const hoveredBin = hoveredBinId ? bins.find((b) => b.id === hoveredBinId) : null;

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

  // Longest plan edge - scales the fog and the sun's shadow frustum to the real building.
  const span = React.useMemo(() => {
    if (bins.length === 0) return 20;
    const xs = bins.map((b) => b.position.x);
    const ys = bins.map((b) => b.position.y);
    return Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 5);
  }, [bins]);

  // Without explicit bounds the shadow camera defaults to +/-5, so only the middle of the
  // warehouse ever received a shadow.
  const shadowReach = Math.max(span, 24);

  return (
    <>
      <color attach="background" args={[SCENE.background]} />
      {/* Fades the far apron into the background instead of ending on a hard floor edge */}
      <fog attach="fog" args={[SCENE.background, span * 1.4, span * 3.2]} />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <hemisphereLight args={['#dbeafe', SCENE.background, 0.8]} />
      <directionalLight position={[span * 0.6, span * 0.9 + 20, span * 0.7]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-shadowReach}
        shadow-camera-right={shadowReach}
        shadow-camera-top={shadowReach}
        shadow-camera-bottom={-shadowReach}
        shadow-camera-near={1}
        shadow-camera-far={shadowReach * 4}/>
      <directionalLight position={[-span * 0.4, span * 0.5, -span * 0.4]} intensity={0.4} color="#bfdbfe" />
      <pointLight position={[center[0], 8, center[2]]} intensity={0.3} color="#e0f2fe" />

      {/* Floor + Grid */}
      <WarehouseFloor bins={bins} />

      {/* Walkways, painted between the rack faces */}
      <AisleFloor bands={aisleBands} />

      {/* Rack frames per aisle */}
      {aisleGroups.map((aisleBins, i) => (
        <RackFrame key={i} bins={aisleBins} metrics={metrics} />
      ))}

      {/* Zone labels */}
      {zoneLabels.map((zl) => (
        <Html key={`zone-${zl.code}`} position={[zl.x, zl.z + 2.5, zl.y]} center distanceFactor={25} style={{ pointerEvents: 'none' }}>
          <div style={{
              background: 'rgba(99, 102, 241, 0.9)',
              color: '#fff',
              padding: '3px 12px',
              borderRadius: 5,
              fontSize: 13,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              letterSpacing: '0.05em',
            }}>
            {zl.name || zl.code}
          </div>
        </Html>
      ))}

      {/* Aisle labels — hung over the walkway, and carrying its measured width */}
      {aisleBands.map((band) => {
        const midRun = (band.start + band.end) / 2;
        return (
          <Html key={`aisle-${band.id}`}
            position={[band.alongX ? midRun : band.centerX, band.topZ + 1.2, band.alongX ? band.centerZ : midRun]}
            center
            distanceFactor={20}
            style={{ pointerEvents: 'none' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(30, 41, 59, 0.9)',
                color: '#e2e8f0',
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                border: `1px solid ${SCENE.aisleEdge}55`,
              }}>
              <span className="inline-block" style={{ width: 7, height: 7, borderRadius: 2, background: SCENE.aisleEdge }} />
              {band.name || band.code}
              <span style={{ color: SCENE.aisleEdge, fontWeight: 700 }}>
                {band.measured ? '' : '≈'}
                {band.widthM.toFixed(1)} m
              </span>
            </div>
          </Html>
        );
      })}

      {/* Instanced bins */}
      <InstancedBins bins={bins}
        metrics={metrics}
        suggestedIds={suggestedIds}
        selectedBinId={selectedBinId}
        hoveredBinId={hoveredBinId}
        activeFilter={activeFilter}
        onSelect={onSelect}
        onHover={onHover}/>

      {/* Hover tooltip */}
      {hoveredBin && (
        <group position={[hoveredBin.position.x, hoveredBin.position.z + metrics.sizeY, hoveredBin.position.y]}>
          <BinTooltip bin={hoveredBin} suggestedIds={suggestedIds} />
        </group>
      )}

      {/* Camera controls */}
      <OrbitControls makeDefault target={center} minDistance={3} maxDistance={span * 3} maxPolarAngle={Math.PI / 2.1} enableDamping dampingFactor={0.1} />
    </>
  );
}

// ─── BinDetailPanel ───────────────────────────────────────────────────────────

// eslint-disable-next-line complexity
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
    wms3dApi
      .getBinStock(accessToken, bin.id)
      .then((res) => {
        if (!cancelled) setStockItems(res.items);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setStockLoading(false);
      });
    return () => {
      cancelled = true;
    };
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
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
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
        <div className="flex justify-between">
          <span className="text-muted-foreground">Zone</span>
          <span className="font-medium">{bin.zone_name ?? bin.zone_code}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Aisle</span>
          <span className="font-medium">{bin.aisle_name ?? bin.aisle_code}</span>
        </div>
        <div className="flex justify-between">
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
            Expiring
          </Badge>
        )}
      </div>
      {/* Stock Items */}
      <div className="border-t pt-3 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stock Items</p>
        {stockLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading…
          </div>
        )}
        {!stockLoading && stockItems.length === 0 && <p className="text-xs text-muted-foreground italic">No stock</p>}
        {!stockLoading &&
          stockItems.map((item, idx) => (
            <div key={`${item.item_id}-${idx}`}
              className={cn('rounded-md border p-2 text-xs space-y-1', isExpiringSoon(item.expiry_date) && 'border-orange-300 bg-orange-50')}>
              <div className="flex justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{item.item_name}</p>
                  <p className="text-muted-foreground font-mono text-[10px]">{item.item_code}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.inventory_status && item.inventory_status !== 'available' && (
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {item.inventory_status}
                    </Badge>
                  )}
                  <span className="font-semibold whitespace-nowrap">
                    {item.quantity_on_hand}
                    {item.uom ? ` ${item.uom}` : ''}
                  </span>
                </div>
              </div>
              {(item.batch_number || item.expiry_date) && (
                <div className="flex gap-3 text-[10px] text-muted-foreground">
                  {item.batch_number && <span>Batch: {item.batch_number}</span>}
                  {item.expiry_date && (
                    <span className={cn(isExpiringSoon(item.expiry_date) && 'text-orange-700 font-medium')}>Exp: {item.expiry_date}</span>
                  )}
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

  const searchItems = React.useCallback(
    async (query: string) => {
      if (!accessToken) return [];
      const res = await fetch(`${environment.apiCoreUrl}/api/v1/items/picker?search=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.items ?? []) as Array<{ id: string; item_code: string; item_name: string }>;
    },
    [accessToken],
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
      setError(err instanceof Error ? err.message : 'Failed');
      setResults([]);
      onResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-80 shrink-0 rounded-lg border bg-card shadow-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm flex items-center gap-1.5">
          <Target className="h-4 w-4 text-amber-600" />
          Find Optimal Bins
        </p>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex gap-1.5">
        <Button variant={taskType === 'put_away' ? 'default' : 'outline'}
          size="sm"
          className="flex-1 text-xs h-8"
          onClick={() => setTaskType('put_away')}>
          Put-away
        </Button>
        <Button variant={taskType === 'pick' ? 'default' : 'outline'} size="sm" className="flex-1 text-xs h-8" onClick={() => setTaskType('pick')}>
          Pick
        </Button>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Item</Label>
        <ItemPickerSelect value={itemId}
          onValueChange={setItemId}
          searchItems={searchItems}
          labelFormatter={(i: { item_name: string; item_code: string }) => `${i.item_name} (${i.item_code})`}
          valueKey="id"
          placeholder="Select item…"
          searchPlaceholder="Search…"
          minSearchLength={2}
          selectedItemData={null}/>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Quantity</Label>
        <Input type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, parseFloat(e.target.value) || 1))}
          className="h-8 text-xs"/>
      </div>
      <Button size="sm" className="w-full gap-1.5" onClick={handleFind} disabled={loading || !itemId}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Suggest bins
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {results.length > 0 && (
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {results.map((s) => (
            <div key={s.bin_id} className="rounded-md border p-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="font-mono font-medium">
                  #{s.rank} {s.bin_code ?? s.bin_id.slice(0, 8)}
                </span>
                <span className="text-amber-700 font-semibold">{s.score.toFixed(0)}pts</span>
              </div>
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

// eslint-disable-next-line complexity
export function Warehouse3DView({ warehouseId }: { warehouseId: string }) {
  const [selectedBinId, setSelectedBinId] = React.useState<string | null>(null);
  const [hoveredBinId, setHoveredBinId] = React.useState<string | null>(null);
  const [suggestedIds, setSuggestedIds] = React.useState<Set<string>>(new Set());
  const [showSuggest, setShowSuggest] = React.useState(false);
  const [activeFilter, setActiveFilter] = React.useState('all');

  const { activeBins, layout, loading, error, statusLoading, wsConnected, refetch, refetchStatus } = useWarehouse3D(warehouseId);

  const selectedBin = selectedBinId ? (activeBins.find((b) => b.id === selectedBinId) ?? null) : null;

  /**
   * Bin footprint measured from the layout rather than assumed.
   *
   * Every geometric consumer reads its size from here - the bin instances, the highlight
   * overlays, the rack steel and the plan view - so they cannot disagree about how big a
   * bay is, and none of them can draw a hole where the racking should be.
   */
  const metrics = React.useMemo(() => deriveBinMetrics(activeBins), [activeBins]);

  /**
   * Walkways, measured from the racks that flank them.
   *
   * Derived from `activeBins` alongside the metrics rather than inside the canvas, so the
   * 3D scene and the plan view band the same aisles the same way.
   */
  const aisleBands = React.useMemo(() => deriveAisleBands(activeBins, metrics), [activeBins, metrics]);

  // Counts for the footer strip. One bay column is one vertical stack of levels.
  const planStats = React.useMemo(() => {
    const aisles = new Set(activeBins.map((bin) => bin.aisle_id));
    const bays = new Set(
      activeBins.map((bin) => `${bin.position.x.toFixed(3)}|${bin.position.y.toFixed(3)}`),
    );
    return { aisles: aisles.size, bays: bays.size, bins: activeBins.length };
  }, [activeBins]);

  // Camera position based on warehouse extent
  const cameraPosition = React.useMemo<[number, number, number]>(() => {
    if (activeBins.length === 0) return [15, 15, 25];
    const xs = activeBins.map((b) => b.position.x);
    const ys = activeBins.map((b) => b.position.y);
    const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 5);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    return [cx + span * 0.75, span * 0.65 + 5, cy + span * 0.95];
  }, [activeBins]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading 3D warehouse…</span>
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

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant={showSuggest ? 'default' : 'outline'} size="sm" className="gap-1.5" onClick={() => setShowSuggest((s) => !s)}>
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

      {/* Canvas + Side panels */}
      <div className="flex gap-3 items-start">
        {/* 3D Canvas with dark background */}
        <div className="flex-1 min-w-0 rounded-lg border overflow-hidden relative" style={{ height: 580, backgroundColor: SCENE.background }}>
          <Canvas camera={{ position: cameraPosition, fov: 42 }} shadows dpr={[1, 2]} onPointerMissed={() => setSelectedBinId(null)}>
            <Scene bins={activeBins}
              metrics={metrics}
              aisleBands={aisleBands}
              suggestedIds={suggestedIds}
              selectedBinId={selectedBinId}
              hoveredBinId={hoveredBinId}
              activeFilter={activeFilter}
              onSelect={(bin) => setSelectedBinId(bin.id)}
              onHover={setHoveredBinId}/>
          </Canvas>

          {/* Filter overlay (top-left) */}
          <div className="absolute top-4 left-4 rounded-lg border border-blue-900 bg-slate-900/90 backdrop-blur-sm p-3 space-y-1.5"
            style={{ minWidth: 160 }}>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2">Inventory Filter</p>
            {FILTER_OPTIONS.map((opt) => (
              <button key={opt.key}
                onClick={() => setActiveFilter(opt.key)}
                className={cn(
                  'flex items-center gap-2 w-full px-2.5 py-1.5 rounded text-xs text-left transition-all',
                  activeFilter === opt.key
                    ? 'bg-slate-800 text-white border border-slate-600'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent',
                )}>
                {opt.color && (
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ background: opt.color, boxShadow: activeFilter === opt.key ? `0 0 6px ${opt.color}` : 'none' }}/>
                )}
                {opt.icon && <span className="text-sm">{opt.icon}</span>}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>

          {/* Plan view (top-right): the same footprints, without the perspective */}
          <LayoutMiniMap bins={activeBins} metrics={metrics} aisleBands={aisleBands} className="absolute right-4 top-4 w-56" />

          {/* Footer strip: layout totals, then the interaction hint */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-full border border-slate-700 bg-slate-900/75 px-4 py-1.5 pointer-events-none">
            <span className="flex items-center gap-1.5 text-[11px] text-slate-300">
              <span className="h-2 w-2 rounded-sm" style={{ background: SCENE.aisleEdge }} />
              {aisleBands.length} walkway{aisleBands.length === 1 ? '' : 's'}
            </span>
            <span className="text-[11px] text-slate-400">
              {planStats.aisles} aisles · {planStats.bays} bays · {planStats.bins} bins
            </span>
            <span className="text-[11px] text-slate-500">
              Hover to preview · Click to inspect · Drag to orbit · Scroll to zoom
            </span>
          </div>
        </div>

        {/* Side panels */}
        {showSuggest && (
          <BinSuggestionPanel warehouseId={warehouseId}
            onResults={(s) => setSuggestedIds(new Set(s.map((x) => x.bin_id)))}
            onClose={() => {
              setShowSuggest(false);
              setSuggestedIds(new Set());
            }}/>
        )}
        {selectedBin && <BinDetailPanel bin={selectedBin} onClose={() => setSelectedBinId(null)} />}
      </div>
    </div>
  );
}
