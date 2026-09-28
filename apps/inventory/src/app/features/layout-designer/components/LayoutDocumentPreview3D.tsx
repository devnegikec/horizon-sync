/* eslint-disable react/no-unknown-property -- react-three-fiber uses custom JSX props (position, args, intensity, ...) */
/**
 * 3D preview of a layout **document** (as opposed to `Warehouse3DView`, which renders
 * the published warehouse rows).
 *
 * This is what makes an import reviewable before it is applied: the compiler already
 * computes every box in metres - rack footprints, level heights, obstacle extents - so
 * the scene is derived from `buildLayout` output rather than re-derived from the JSON.
 *
 * Ground-plane conventions match `Warehouse3DView` exactly: a r3f position is
 * `[planX, height, planZ]`, so the compiler's `centerX`/`centerY`/`centerZ` map straight
 * across, and a 90-degree lane rotation is applied as a Y-axis quaternion rather than by
 * swapping scale axes.
 *
 * Racks render as **one instanced mesh**, never one mesh per bay.
 *
 * Design ref: ../../../../../docs/LAYOUT_JSON_DESIGNER_PLAN.md (FE-9)
 */

import * as React from 'react';

import { Grid, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Box } from 'lucide-react';
import * as THREE from 'three';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { cn } from '@horizon-sync/ui/lib';

import { buildLayout, stackHeightM, type CompiledLayout, type LayoutDoc } from '../layout-core';

const RACK_COLOR = '#38bdf8';
const FLOOR_COLOR = '#1e293b';
const AISLE_COLOR = '#334155';

const OBSTACLE_COLORS: Record<string, string> = {
  COLUMN: '#94a3b8',
  PILLAR: '#f59e0b',
  WALL: '#64748b',
  OFFICE: '#8b5cf6',
  CUSTOM: '#14b8a6',
};

// ===========================================
// Pure scene derivation (unit-tested without WebGL)
// ===========================================

export type Vec3 = [number, number, number];

export interface PreviewFraming {
  center: Vec3;
  radius: number;
  camera: Vec3;
}

/** Camera placement that frames the whole building regardless of its proportions. */
export function previewFraming(doc: LayoutDoc): PreviewFraming {
  const { origin, lengthM, widthM, heightM } = doc.warehouse;
  const centerX = origin.x + lengthM / 2;
  const centerZ = origin.z + widthM / 2;
  const radius = Math.max(lengthM, widthM, 4);

  return {
    center: [centerX, 0, centerZ],
    radius,
    camera: [centerX + radius * 0.7, radius * 0.8 + heightM, centerZ + radius * 1.05],
  };
}

/** Total rack height per lane, keyed `aisleCode/laneCode`. */
export function laneStackHeights(doc: LayoutDoc | null): Map<string, number> {
  const heights = new Map<string, number>();
  if (!doc) return heights;

  for (const aisle of doc.aisles) {
    for (const lane of aisle.lanes) {
      heights.set(`${aisle.code}/${lane.code}`, stackHeightM(lane.levels));
    }
  }
  return heights;
}

export interface ObstacleBox {
  key: string;
  position: Vec3;
  size: Vec3;
  color: string;
}

/** Obstacles as axis-aligned boxes, lifting the minimum corner onto the plan centre. */
export function obstacleBoxes(doc: LayoutDoc | null): ObstacleBox[] {
  if (!doc) return [];

  return doc.obstacles.map((obstacle, index) => ({
    key: obstacle.id ?? `${obstacle.kind}-${index}`,
    position: [obstacle.x + obstacle.widthM / 2, obstacle.heightM / 2, obstacle.z + obstacle.depthM / 2],
    size: [obstacle.widthM, obstacle.heightM, obstacle.depthM],
    color: OBSTACLE_COLORS[obstacle.kind] ?? OBSTACLE_COLORS.CUSTOM,
  }));
}

// ===========================================
// Scene pieces
// ===========================================

function Floor({ doc }: { doc: LayoutDoc }) {
  const { origin, lengthM, widthM } = doc.warehouse;
  const rotation: Vec3 = [-Math.PI / 2, 0, 0];

  return (
    <mesh rotation={rotation} position={[origin.x + lengthM / 2, -0.02, origin.z + widthM / 2]}>
      <planeGeometry args={[lengthM, widthM]} />
      <meshStandardMaterial color={FLOOR_COLOR} roughness={1} />
    </mesh>
  );
}

function AisleFloors({ doc }: { doc: LayoutDoc }) {
  return (
    <>
      {doc.aisles.map((aisle) => {
        const midX = (aisle.centerline.x1 + aisle.centerline.x2) / 2;
        const midZ = (aisle.centerline.z1 + aisle.centerline.z2) / 2;
        const length = Math.hypot(aisle.centerline.x2 - aisle.centerline.x1, aisle.centerline.z2 - aisle.centerline.z1);
        const rotation: Vec3 = [0, aisle.orientation === 'Z' ? Math.PI / 2 : 0, 0];

        return (
          <mesh key={aisle.code} position={[midX, 0.03, midZ]} rotation={rotation}>
            <boxGeometry args={[length, 0.06, aisle.widthM]} />
            <meshStandardMaterial color={AISLE_COLOR} transparent opacity={0.7} />
          </mesh>
        );
      })}
    </>
  );
}

/** Every active bay, as a single instanced box the height of its lane's level stack. */
function RackRuns({ compiled }: { compiled: CompiledLayout }) {
  const meshRef = React.useRef<THREE.InstancedMesh | null>(null);
  const activeBays = React.useMemo(() => compiled.bays.filter((bay) => bay.inRackRun && !bay.isSkipped), [compiled.bays]);
  const heights = React.useMemo(() => laneStackHeights(compiled.doc), [compiled.doc]);
  const fallbackHeight = compiled.doc?.warehouse.heightM ?? 6;

  React.useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const matrix = new THREE.Matrix4();
    const axis = new THREE.Vector3(0, 1, 0);
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    activeBays.forEach((bay, index) => {
      const height = heights.get(`${bay.aisleCode}/${bay.laneCode}`) ?? fallbackHeight;
      position.set(bay.centerX, height / 2, bay.centerZ);
      quaternion.setFromAxisAngle(axis, (bay.rotationDeg * Math.PI) / 180);
      scale.set(bay.widthM, height, bay.depthM);
      mesh.setMatrixAt(index, matrix.compose(position, quaternion, scale));
    });

    mesh.count = activeBays.length;
    mesh.instanceMatrix.needsUpdate = true;
  }, [activeBays, heights, fallbackHeight]);

  if (activeBays.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, activeBays.length]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={RACK_COLOR} roughness={0.6} metalness={0.2} transparent opacity={0.92} />
    </instancedMesh>
  );
}

function Obstacles({ boxes }: { boxes: ObstacleBox[] }) {
  return (
    <>
      {boxes.map((box) => (
        <mesh key={box.key} position={box.position}>
          <boxGeometry args={box.size} />
          <meshStandardMaterial color={box.color} roughness={0.5} transparent opacity={0.85} />
        </mesh>
      ))}
    </>
  );
}

// ===========================================
// Public components
// ===========================================

interface Preview3DToggleProps {
  document: Record<string, unknown>;
}

const Preview3DToggle = ({ document }: Preview3DToggleProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-2">
      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setOpen(!open)}>
        <Box className="h-3.5 w-3.5" /> {open ? 'Hide 3D preview' : 'Show 3D preview'}
      </Button>
      {open && <LayoutDocumentPreview3D document={document} />}
    </div>
  );
};

interface LayoutDocumentPreview3DProps {
  document: Record<string, unknown>;
  height?: number;
  className?: string;
}

/**
 * Render a layout document as a 3D scene.
 *
 * Compiles the document itself rather than accepting a compiled layout, so callers can
 * hand it the raw imported JSON. Nothing is fetched, and nothing is rendered when the
 * document produces no bins.
 */
function LayoutDocumentPreview3D({ document, height = 260, className }: LayoutDocumentPreview3DProps) {
  const compiled = React.useMemo(() => buildLayout(document), [document]);
  const doc = compiled.doc;
  const framing = React.useMemo(() => (doc ? previewFraming(doc) : null), [doc]);
  const boxes = React.useMemo(() => obstacleBoxes(doc), [doc]);

  if (!doc || !framing || compiled.bins.length === 0) {
    return (
      <div className={cn('flex items-center justify-center rounded-lg border bg-muted/20 text-xs text-muted-foreground', className)} style={{ height }}>
        Nothing to preview — this document produces no bins yet.
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden rounded-lg border', className)} style={{ height }}>
      <Canvas camera={{ position: framing.camera, fov: 50 }}>
        <color attach="background" args={['#0b1220']} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[framing.radius, framing.radius * 2, framing.radius]} intensity={1.1} />
        <Floor doc={doc} />
        <AisleFloors doc={doc} />
        <RackRuns compiled={compiled} />
        <Obstacles boxes={boxes} />
        <Grid args={[framing.radius * 2, framing.radius * 2]} cellSize={1} sectionSize={5} position={framing.center} fadeDistance={framing.radius * 4} />
        {/* The camera is placed around the building's centre, so the orbit must target it
            too: left at its default the controls pivot on the origin and a warehouse away
            from the origin opens off-centre or off-screen. */}
        <OrbitControls makeDefault target={framing.center} />
      </Canvas>
      <div className="absolute left-2 top-2 rounded bg-black/50 px-2 py-1 text-[10px] font-mono text-slate-200">
        {compiled.bins.length} bins · {compiled.bays.length} bays · {doc.obstacles.length} obstacles
      </div>
    </div>
  );
}

export { LayoutDocumentPreview3D, Preview3DToggle };
