import {
  getEdgeGateTile,
  getUnusedEntranceEdges,
  isExitTile,
  isRoadTile,
  type GridCoord,
  type LevelEdge,
  type WorldLayout,
} from "@/lib/world-layout";
import type { ChunkOrigin } from "@/lib/global-grid";

/** Resource cost to place a farm on fertile dirt. */
export const FARM_COST = {
  gold: 20,
  iron: 20,
  wood: 20,
} as const;

export function canAffordFarm(resources: {
  gold: number;
  iron: number;
  wood: number;
}) {
  return (
    resources.gold >= FARM_COST.gold &&
    resources.iron >= FARM_COST.iron &&
    resources.wood >= FARM_COST.wood
  );
}

/** Food granted per farm when a wave/level is cleared. */
export const FARM_INCOME = 5;

export const BUILD_PLOT_SIZE = 9;

const CARDINAL_DIRS = [
  { dx: 0, dz: -1 },
  { dx: 1, dz: 0 },
  { dx: 0, dz: 1 },
  { dx: -1, dz: 0 },
] as const;

function isEligibleFertileTile(
  layout: WorldLayout,
  x: number,
  z: number,
  blockedTiles: readonly GridCoord[] = [],
) {
  if (blockedTiles.some((tile) => tile.x === x && tile.z === z)) {
    return false;
  }

  if (isRoadTile(layout, x, z)) {
    return false;
  }

  if (layout.castle.x === x && layout.castle.z === z) {
    return false;
  }

  if (isExitTile(layout, x, z)) {
    return false;
  }

  for (const path of layout.paths) {
    if (path.gate.x === x && path.gate.z === z) {
      return false;
    }
  }

  for (const edge of getUnusedEntranceEdges(layout)) {
    const gate = getEdgeGateTile(edge, layout.size);
    if (gate.x === x && gate.z === z) {
      return false;
    }
  }

  if (x <= 1 || z <= 1 || x >= layout.size - 2 || z >= layout.size - 2) {
    return false;
  }

  const distCastle =
    Math.abs(x - layout.castle.x) + Math.abs(z - layout.castle.z);
  if (distCastle < 2) {
    return false;
  }

  for (const { dx, dz } of CARDINAL_DIRS) {
    if (isRoadTile(layout, x + dx, z + dz)) {
      return false;
    }
  }

  return true;
}

function hash01(x: number, z: number, salt: number) {
  const n = Math.sin(x * 127.1 + z * 311.7 + salt * 74.3) * 43758.5453;
  return n - Math.floor(n);
}

function layoutSalt(layout: WorldLayout, seed: number) {
  return (
    seed +
    layout.size * 91 +
    layout.castle.x * 53 +
    layout.castle.z * 29 +
    layout.entrance.x * 17 +
    layout.entrance.z * 41
  );
}

/** Pick one stable fertile-dirt tile on the main layout, or null if none fit. */
export function pickFertileDirtTile(
  layout: WorldLayout,
  blockedTiles: readonly GridCoord[] = [],
): GridCoord | null {
  const salt = layoutSalt(layout, 4100);
  let best: GridCoord | null = null;
  let bestScore = -1;

  for (let x = 0; x < layout.size; x += 1) {
    for (let z = 0; z < layout.size; z += 1) {
      if (!isEligibleFertileTile(layout, x, z, blockedTiles)) {
        continue;
      }

      const score = hash01(x, z, salt);
      if (score > bestScore) {
        bestScore = score;
        best = { x, z };
      }
    }
  }

  return best;
}

export function isFertileDirtTile(
  fertile: GridCoord | null | undefined,
  x: number,
  z: number,
) {
  return !!fertile && fertile.x === x && fertile.z === z;
}

export function hasFarmAt(
  farms: readonly { gx: number; gz: number }[],
  gx: number,
  gz: number,
) {
  return farms.some((farm) => farm.gx === gx && farm.gz === gz);
}

export type BuildPlot = {
  id: number;
  edge: LevelEdge;
  origin: ChunkOrigin;
  size: number;
};

/** Origin for a grass build plot flush to the given main-grid edge, centered on the gate. */
export function computeBuildPlotOrigin(
  edge: LevelEdge,
  mainOrigin: ChunkOrigin,
  mainSize: number,
  plotSize: number = BUILD_PLOT_SIZE,
): ChunkOrigin {
  const gate = getEdgeGateTile(edge, mainSize);
  const gateGx = mainOrigin.gx + gate.x;
  const gateGz = mainOrigin.gz + gate.z;
  const half = Math.floor(plotSize / 2);

  switch (edge) {
    case "north":
      return { gx: gateGx - half, gz: mainOrigin.gz - plotSize };
    case "south":
      return { gx: gateGx - half, gz: mainOrigin.gz + mainSize };
    case "west":
      return { gx: mainOrigin.gx - plotSize, gz: gateGz - half };
    case "east":
      return { gx: mainOrigin.gx + mainSize, gz: gateGz - half };
  }
}

/** All global tiles covered by a build plot. */
export function collectBuildPlotTiles(plot: BuildPlot): { gx: number; gz: number }[] {
  const tiles: { gx: number; gz: number }[] = [];

  for (let x = 0; x < plot.size; x += 1) {
    for (let z = 0; z < plot.size; z += 1) {
      tiles.push({ gx: plot.origin.gx + x, gz: plot.origin.gz + z });
    }
  }

  return tiles;
}
