"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import {
  InstancedMesh,
  Object3D,
  SphereGeometry,
  MeshBasicMaterial,
} from "three";

import {
  globalCoordKey,
  globalTileWorldPosition,
  collectLayoutGlobalKeys,
  type GlobalGridCoord,
  type PlacedLayout,
} from "@/lib/global-grid";
import { TILE_SIZE } from "@/lib/terrain";

const CLOUD_Y = 0.55;
/** One ring keeps fog cheaper; was 2 (~2× cells). */
const RING_COUNT = 1;
const PUFFS_PER_CELL = 1;
const MAX_FOG_INSTANCES = 768;

type CloudPuff = {
  key: string;
  x: number;
  y: number;
  z: number;
  scale: number;
};

function hash01(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function collectClearedFogKeys(
  levels: PlacedLayout[],
  seamTiles: GlobalGridCoord[],
  extraTiles: GlobalGridCoord[] = [],
): Set<string> {
  const keys = new Set<string>();

  for (const { layout, origin } of levels) {
    for (const key of collectLayoutGlobalKeys(layout, origin)) {
      keys.add(key);
    }
  }

  for (const tile of seamTiles) {
    keys.add(globalCoordKey(tile.gx, tile.gz));
  }

  for (const tile of extraTiles) {
    keys.add(globalCoordKey(tile.gx, tile.gz));
  }

  return keys;
}

function buildCloudRingFromPlayable(cleared: Set<string>): CloudPuff[] {
  const fogCells = new Map<string, number>();

  for (const key of cleared) {
    const [gx, gz] = key.split(":").map(Number);

    for (let ring = 1; ring <= RING_COUNT; ring += 1) {
      for (let dx = -ring; dx <= ring; dx += 1) {
        for (let dz = -ring; dz <= ring; dz += 1) {
          const chebyshev = Math.max(Math.abs(dx), Math.abs(dz));

          if (chebyshev !== ring) {
            continue;
          }

          const cellKey = globalCoordKey(gx + dx, gz + dz);

          if (cleared.has(cellKey)) {
            continue;
          }

          const existing = fogCells.get(cellKey);
          if (existing === undefined || ring < existing) {
            fogCells.set(cellKey, ring);
          }
        }
      }
    }
  }

  const puffs: CloudPuff[] = [];
  let seed = 1;

  for (const [cellKey, ring] of fogCells) {
    const [gx, gz] = cellKey.split(":").map(Number);
    const { x: worldX, z: worldZ } = globalTileWorldPosition(gx, gz);

    for (let i = 0; i < PUFFS_PER_CELL; i += 1) {
      const h1 = hash01(seed);
      const h2 = hash01(seed + 17);
      const h3 = hash01(seed + 41);
      const h4 = hash01(seed + 73);
      seed += 1;

      puffs.push({
        key: `${cellKey}:${i}`,
        x: worldX + (h1 - 0.5) * TILE_SIZE * 0.55,
        y: CLOUD_Y + h2 * 0.35 + ring * 0.06,
        z: worldZ + (h3 - 0.5) * TILE_SIZE * 0.55,
        scale: 1.05 + h4 * 0.45 + ring * 0.12,
      });
    }
  }

  return puffs;
}

const sharedGeometry = new SphereGeometry(0.62, 6, 4);
const sharedMaterial = new MeshBasicMaterial({
  color: "#c9d6e8",
  fog: false,
});
const matrixHelper = new Object3D();

function FogInstances({ puffs }: { puffs: CloudPuff[] }) {
  const meshRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }

    const count = Math.min(puffs.length, MAX_FOG_INSTANCES);

    for (let i = 0; i < count; i += 1) {
      const puff = puffs[i]!;
      matrixHelper.position.set(puff.x, puff.y, puff.z);
      matrixHelper.scale.set(puff.scale, puff.scale * 0.5, puff.scale);
      matrixHelper.updateMatrix();
      mesh.setMatrixAt(i, matrixHelper.matrix);
    }

    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [puffs]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[sharedGeometry, sharedMaterial, MAX_FOG_INSTANCES]}
      frustumCulled={false}
      castShadow={false}
      receiveShadow={false}
      raycast={() => null}
    />
  );
}

/** Fog ring around the union of all placed levels; clears over any spawned tile. */
export function FogOfWarClouds({
  levels,
  seamTiles = [],
  extraClearedTiles = [],
}: {
  levels: PlacedLayout[];
  seamTiles?: GlobalGridCoord[];
  /** Additional cleared footprints (e.g. gate build plots). */
  extraClearedTiles?: GlobalGridCoord[];
}) {
  const clearedTiles = useMemo(
    () => collectClearedFogKeys(levels, seamTiles, extraClearedTiles),
    [levels, seamTiles, extraClearedTiles],
  );

  const puffs = useMemo(
    () => buildCloudRingFromPlayable(clearedTiles),
    [clearedTiles],
  );

  if (puffs.length === 0) {
    return null;
  }

  return (
    <group>
      <FogInstances puffs={puffs} />
    </group>
  );
}
