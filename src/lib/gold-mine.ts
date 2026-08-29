import {
  getEdgeGateTile,
  getUnusedEntranceEdges,
  isExitTile,
  isRoadTile,
  type GridCoord,
  type WorldLayout,
} from "@/lib/world-layout";

/** Passive income from the main-grid gold mine. */
export const GOLD_MINE_INCOME = 1;
export const GOLD_MINE_INTERVAL_MS = 2500;
/** Gold cost to build on a gold deposit. */
export const GOLD_MINE_COST = 40;

/** Passive income from the main-grid iron mine. */
export const IRON_MINE_INCOME = 1;
export const IRON_MINE_INTERVAL_MS = 3000;
/** Gold cost to build on an iron deposit. */
export const IRON_MINE_COST = 50;

export const STARTING_IRON = 0;

const CARDINAL_DIRS = [
  { dx: 0, dz: -1 },
  { dx: 1, dz: 0 },
  { dx: 0, dz: 1 },
  { dx: -1, dz: 0 },
] as const;

function isEligibleMineTile(
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

  // Keep a little space from the map rim and castle.
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

function pickMineTile(
  layout: WorldLayout,
  salt: number,
  blockedTiles: readonly GridCoord[] = [],
): GridCoord | null {
  let best: GridCoord | null = null;
  let bestScore = -1;

  for (let x = 0; x < layout.size; x += 1) {
    for (let z = 0; z < layout.size; z += 1) {
      if (!isEligibleMineTile(layout, x, z, blockedTiles)) {
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

/** Pick one stable gold-mine tile on the main layout, or null if none fit. */
export function pickGoldMineTile(layout: WorldLayout): GridCoord | null {
  return pickMineTile(layout, layoutSalt(layout, 1000));
}

/** Pick one stable iron-mine tile (not overlapping the gold mine). */
export function pickIronMineTile(
  layout: WorldLayout,
  goldMine: GridCoord | null = null,
): GridCoord | null {
  return pickMineTile(
    layout,
    layoutSalt(layout, 2500),
    goldMine ? [goldMine] : [],
  );
}

export function isMineTile(
  mine: GridCoord | null | undefined,
  x: number,
  z: number,
) {
  return !!mine && mine.x === x && mine.z === z;
}
