/**
 * Static performance budget audit for the play scene.
 * Run: node scripts/perf-audit.mjs
 */

import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { register } from "node:module";

// Load TS sources via tsx loader if available
async function main() {
  const { generateWorldLayout } = await import("../src/lib/world-layout.ts");
  const { generateTerrainDecor } = await import("../src/lib/terrain-decor.ts");
  const {
    collectLayoutGlobalKeys,
    centeredChunkOrigin,
    globalCoordKey,
    globalTileWorldPosition,
  } = await import("../src/lib/global-grid.ts");
  const { TERRAIN_SIZE } = await import("../src/lib/terrain.ts");

  const RING_COUNT = 2;
  const PUFFS_PER_CELL = 2;

  function buildCloudRingFromPlayable(cleared) {
    const fogCells = new Map();
    for (const key of cleared) {
      const [gx, gz] = key.split(":").map(Number);
      for (let ring = 1; ring <= RING_COUNT; ring += 1) {
        for (let dx = -ring; dx <= ring; dx += 1) {
          for (let dz = -ring; dz <= ring; dz += 1) {
            const chebyshev = Math.max(Math.abs(dx), Math.abs(dz));
            if (chebyshev !== ring) continue;
            const cellKey = globalCoordKey(gx + dx, gz + dz);
            if (cleared.has(cellKey)) continue;
            const existing = fogCells.get(cellKey);
            if (existing === undefined || ring < existing) {
              fogCells.set(cellKey, ring);
            }
          }
        }
      }
    }
    return fogCells.size * PUFFS_PER_CELL;
  }

  // Warm
  generateWorldLayout();

  const samples = 40;
  let layoutMs = 0;
  let decorMs = 0;
  let fogMs = 0;
  let decorKinds = { tree: 0, hill: 0, rock: 0, pond: 0, mountain: 0 };
  let fogPuffs = 0;
  let clearedCells = 0;
  let roadTiles = 0;

  for (let i = 0; i < samples; i += 1) {
    const t0 = performance.now();
    const layout = generateWorldLayout();
    layoutMs += performance.now() - t0;

    const origin = centeredChunkOrigin(layout);

    const t1 = performance.now();
    const decor = generateTerrainDecor(layout);
    decorMs += performance.now() - t1;

    for (const p of decor) {
      decorKinds[p.kind] = (decorKinds[p.kind] ?? 0) + 1;
    }

    roadTiles += layout.roadKeys.size;

    const cleared = collectLayoutGlobalKeys(layout, origin);
    clearedCells += cleared.size;

    const t2 = performance.now();
    fogPuffs += buildCloudRingFromPlayable(cleared);
    fogMs += performance.now() - t2;
  }

  const avg = (n) => n / samples;

  // Approximate mesh costs from known model structures
  const MESH_PER = {
    tree: 3,
    rock: 4,
    pond: 5,
    hill: 2,
    mountain: 61,
  };

  const avgDecor = Object.fromEntries(
    Object.entries(decorKinds).map(([k, v]) => [k, avg(v)]),
  );

  let decorMeshes = 0;
  for (const [kind, count] of Object.entries(avgDecor)) {
    decorMeshes += count * (MESH_PER[kind] ?? 1);
  }

  const avgFogPuffs = avg(fogPuffs);
  const fogMeshes = avgFogPuffs * 3;
  const fogUseFrames = avgFogPuffs;

  const grassApprox = TERRAIN_SIZE * TERRAIN_SIZE - avg(roadTiles) * 0.7;
  // omit some for hills/ponds/mountains
  const omitted =
    (avgDecor.hill ?? 0) + (avgDecor.pond ?? 0) + (avgDecor.mountain ?? 0);
  const grassMeshes = Math.max(0, grassApprox - omitted);

  const castleMeshes = 140; // from buildCastleBlocks size (approx)
  const dirtApprox = avg(roadTiles) * 0.85;

  const mainMeshes =
    grassMeshes +
    dirtApprox +
    decorMeshes +
    castleMeshes +
    fogMeshes +
    20; // markers / gates / mines

  const previewMeshes =
    grassMeshes * 0.9 + dirtApprox + decorMeshes + fogMeshes * 0.15;

  // Combat loop cost estimate
  const towers = 8;
  const enemies = 20;
  const targetingPairs = towers * enemies;
  const positionAllocsPerSec = enemies * 60;

  const report = {
    samples,
    timingMs: {
      generateWorldLayout: Number(avg(layoutMs).toFixed(3)),
      generateTerrainDecor: Number(avg(decorMs).toFixed(3)),
      buildFogRing: Number(avg(fogMs).toFixed(3)),
    },
    averages: {
      roadTiles: Number(avg(roadTiles).toFixed(1)),
      clearedCells: Number(avg(clearedCells).toFixed(1)),
      decor: Object.fromEntries(
        Object.entries(avgDecor).map(([k, v]) => [k, Number(v.toFixed(1))]),
      ),
      fogPuffs: Number(avgFogPuffs.toFixed(1)),
      fogMeshes: Number(fogMeshes.toFixed(0)),
      fogUseFrameCallbacks: Number(fogUseFrames.toFixed(0)),
    },
    meshBudgetEstimate: {
      grass: Number(grassMeshes.toFixed(0)),
      dirtRoads: Number(dirtApprox.toFixed(0)),
      decor: Number(decorMeshes.toFixed(0)),
      castleVoxels: castleMeshes,
      fog: Number(fogMeshes.toFixed(0)),
      mainLevelTotal: Number(mainMeshes.toFixed(0)),
      mainPlusPreviewApprox: Number((mainMeshes + previewMeshes).toFixed(0)),
      perTowerCannon: 81,
      perTowerArcher: 30,
      perEnemy: 4,
    },
    perFramePressure: {
      fogUseFrames: Number(fogUseFrames.toFixed(0)),
      targetingPairsAt8x20: targetingPairs,
      enemyPositionArrayAllocsPerSecAt60fps: positionAllocsPerSec,
      notes: [
        "Each fog puff runs its own useFrame and writes 3 materials",
        "PlayScene gold/iron/projectile setState re-reconciles entire Canvas tree",
        "EnemyWalker allocates a new [x,y,z] array every frame via onPositionUpdate",
      ],
    },
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
