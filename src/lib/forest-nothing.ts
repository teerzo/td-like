import { globalCoordKey, type ChunkOrigin } from "@/lib/global-grid";
import type { BuildPlot } from "@/lib/fertile-farm";
import type { TerrainDecorKind } from "@/lib/terrain-decor";
import {
  getEdgeGateTile,
  getUnusedEntranceEdges,
  isEntranceTile,
  isExitTile,
  isRoadTile,
  type GridCoord,
  type WorldLayout,
} from "@/lib/world-layout";

export const FOREST_NOTHING_MODE = true;

export type RevealedTileKind =
  | "grass"
  | "goldDeposit"
  | "ironDeposit"
  | "pond"
  | "fertile"
  | "hill"
  | "rock"
  | "mountain";

export type BuiltMine = {
  gx: number;
  gz: number;
  kind: "gold" | "iron";
};

const CARDINAL_DIRS = [
  { dx: 0, dz: -1 },
  { dx: 1, dz: 0 },
  { dx: 0, dz: 1 },
  { dx: -1, dz: 0 },
] as const;

const REVEAL_WEIGHTS: { kind: RevealedTileKind; weight: number }[] = [
  { kind: "grass", weight: 40 },
  { kind: "rock", weight: 12 },
  { kind: "hill", weight: 12 },
  { kind: "goldDeposit", weight: 8 },
  { kind: "ironDeposit", weight: 8 },
  { kind: "pond", weight: 8 },
  { kind: "fertile", weight: 8 },
  { kind: "mountain", weight: 4 },
];

/** Tile is dirt road or within one cardinal step of a dirt road. */
export function isRoadClearanceTile(
  layout: WorldLayout,
  x: number,
  z: number,
): boolean {
  if (isRoadTile(layout, x, z)) {
    return true;
  }

  for (const { dx, dz } of CARDINAL_DIRS) {
    if (isRoadTile(layout, x + dx, z + dz)) {
      return true;
    }
  }

  return false;
}

export function isGlobalRoadClearanceTile(
  gx: number,
  gz: number,
  isGlobalRoad: (gx: number, gz: number) => boolean,
): boolean {
  if (isGlobalRoad(gx, gz)) {
    return true;
  }

  for (const { dx, dz } of CARDINAL_DIRS) {
    if (isGlobalRoad(gx + dx, gz + dz)) {
      return true;
    }
  }

  return false;
}

/** Dirt path tile — towers and buildings cannot be placed here. */
export function isPathDirtTile(
  gx: number,
  gz: number,
  isGlobalRoad: (gx: number, gz: number) => boolean,
): boolean {
  return isGlobalRoad(gx, gz);
}

/** Gates, roads, castle, and entrance/exit tiles cannot host towers. */
export function isTowerPlacementBlockedTile(
  layout: WorldLayout,
  x: number,
  z: number,
): boolean {
  if (isRoadTile(layout, x, z)) {
    return true;
  }

  if (layout.castle.x === x && layout.castle.z === z) {
    return true;
  }

  if (isExitTile(layout, x, z) || isEntranceTile(layout, x, z)) {
    return true;
  }

  for (const path of layout.paths) {
    if (path.gate.x === x && path.gate.z === z) {
      return true;
    }
  }

  for (const edge of getUnusedEntranceEdges(layout)) {
    const gate = getEdgeGateTile(edge, layout.size);
    if (gate.x === x && gate.z === z) {
      return true;
    }
  }

  return false;
}

/** Tiles that never receive standing forest (includes the road buffer). */
export function isForestExcludedTile(
  layout: WorldLayout,
  x: number,
  z: number,
): boolean {
  return (
    isTowerPlacementBlockedTile(layout, x, z) ||
    isRoadClearanceTile(layout, x, z)
  );
}

export function collectTowerPlacementBlockedKeys(
  layout: WorldLayout,
  origin: ChunkOrigin,
): string[] {
  const keys: string[] = [];

  for (let x = 0; x < layout.size; x += 1) {
    for (let z = 0; z < layout.size; z += 1) {
      if (isTowerPlacementBlockedTile(layout, x, z)) {
        keys.push(globalCoordKey(origin.gx + x, origin.gz + z));
      }
    }
  }

  return keys;
}

/** Towers may only be placed on buildable grass tiles with no forest or tower on the tile. */
export function isEmptyGrassTowerTile(input: {
  gx: number;
  gz: number;
  tileKey: string;
  revealed: RevealedTileKind | undefined;
  standingForestKeys: ReadonlySet<string>;
  towerOccupiedKeys: ReadonlySet<string>;
  towerPlacementBlockedKeys: ReadonlySet<string>;
  clearedObstacleKeys?: ReadonlySet<string>;
  isGlobalRoad: (gx: number, gz: number) => boolean;
}): boolean {
  if (isPathDirtTile(input.gx, input.gz, input.isGlobalRoad)) {
    return false;
  }

  if (input.towerPlacementBlockedKeys.has(input.tileKey)) {
    return false;
  }

  if (input.standingForestKeys.has(input.tileKey)) {
    return false;
  }

  if (input.towerOccupiedKeys.has(input.tileKey)) {
    return false;
  }

  if (
    input.revealed === "grass" ||
    input.revealed === "hill" ||
    (input.revealed === "rock" &&
      input.clearedObstacleKeys?.has(input.tileKey))
  ) {
    return true;
  }

  return (
    input.revealed === undefined &&
    !input.standingForestKeys.has(input.tileKey)
  );
}

/** Standing forest keys for every eligible non-clearance tile on a layout chunk. */
export function collectStandingForestKeys(
  layout: WorldLayout,
  origin: ChunkOrigin,
): string[] {
  const keys: string[] = [];

  for (let x = 0; x < layout.size; x += 1) {
    for (let z = 0; z < layout.size; z += 1) {
      if (isForestExcludedTile(layout, x, z)) {
        continue;
      }

      keys.push(globalCoordKey(origin.gx + x, origin.gz + z));
    }
  }

  return keys;
}

/** Standing forest keys for a plain grass build plot. */
export function collectBuildPlotForestKeys(
  plot: Pick<BuildPlot, "origin" | "size">,
  isGlobalRoad: (gx: number, gz: number) => boolean,
): string[] {
  const keys: string[] = [];

  for (let x = 0; x < plot.size; x += 1) {
    for (let z = 0; z < plot.size; z += 1) {
      const gx = plot.origin.gx + x;
      const gz = plot.origin.gz + z;

      if (isGlobalRoadClearanceTile(gx, gz, isGlobalRoad)) {
        continue;
      }

      keys.push(globalCoordKey(gx, gz));
    }
  }

  return keys;
}

export function rollTreeReveal(gx: number, gz: number): RevealedTileKind {
  const roll = Math.random();
  const total = REVEAL_WEIGHTS.reduce((sum, entry) => sum + entry.weight, 0);
  let cursor = roll * total;

  for (const entry of REVEAL_WEIGHTS) {
    cursor -= entry.weight;
    if (cursor <= 0) {
      return entry.kind;
    }
  }

  return "grass";
}

export function revealedKindToDecorKind(
  kind: RevealedTileKind,
): TerrainDecorKind | null {
  switch (kind) {
    case "rock":
      return "rock";
    case "pond":
      return "pond";
    case "hill":
      return "hill";
    case "mountain":
      return "mountain";
    default:
      return null;
  }
}

export function isBlockingRevealedTile(
  kind: RevealedTileKind,
  key: string,
  builtMineKeys: ReadonlySet<string>,
  clearedObstacleKeys: ReadonlySet<string>,
): boolean {
  if (kind === "grass") {
    return false;
  }

  if (kind === "hill") {
    return false;
  }

  if (kind === "rock") {
    return !clearedObstacleKeys.has(key);
  }

  if (kind === "goldDeposit" || kind === "ironDeposit") {
    return !builtMineKeys.has(key);
  }

  return true;
}

export function localCoordInChunk(
  gx: number,
  gz: number,
  origin: ChunkOrigin,
  size: number,
): GridCoord | null {
  const x = gx - origin.gx;
  const z = gz - origin.gz;

  if (x < 0 || z < 0 || x >= size || z >= size) {
    return null;
  }

  return { x, z };
}
