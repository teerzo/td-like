import {
  getEdgeGateTile,
  getUnusedEntranceEdges,
  isExitTile,
  isRoadTile,
  type GridCoord,
  type WorldLayout,
} from "@/lib/world-layout";

export type TerrainDecorKind =
  | "tree"
  | "rock"
  | "pond"
  | "mountain"
  | "hill";

export type TerrainDecorPlacement = {
  key: string;
  x: number;
  z: number;
  kind: TerrainDecorKind;
};

/** Chance an eligible grass tile gets some decor. */
const DECOR_CHANCE = 0.36;

const KIND_WEIGHTS: { kind: TerrainDecorKind; weight: number }[] = [
  { kind: "tree", weight: 40 },
  { kind: "hill", weight: 22 },
  { kind: "rock", weight: 22 },
  { kind: "pond", weight: 10 },
  { kind: "mountain", weight: 6 },
];

/** Lakes/mountains must stay off tiles next to dirt roads. */
const ROAD_ADJACENT_BLOCKED: ReadonlySet<TerrainDecorKind> = new Set([
  "pond",
  "mountain",
]);

const CARDINAL_DIRS = [
  { dx: 0, dz: -1 },
  { dx: 1, dz: 0 },
  { dx: 0, dz: 1 },
  { dx: -1, dz: 0 },
] as const;

function hash01(x: number, z: number, salt: number) {
  const n = Math.sin(x * 127.1 + z * 311.7 + salt * 74.3) * 43758.5453;
  return n - Math.floor(n);
}

function pickDecorKind(
  roll: number,
  options: readonly { kind: TerrainDecorKind; weight: number }[] = KIND_WEIGHTS,
): TerrainDecorKind {
  const total = options.reduce((sum, entry) => sum + entry.weight, 0);
  let cursor = roll * total;

  for (const entry of options) {
    cursor -= entry.weight;
    if (cursor <= 0) {
      return entry.kind;
    }
  }

  return options[0]?.kind ?? "tree";
}

function isAdjacentToDirt(layout: WorldLayout, x: number, z: number) {
  for (const { dx, dz } of CARDINAL_DIRS) {
    if (isRoadTile(layout, x + dx, z + dz)) {
      return true;
    }
  }

  return false;
}

function isBlockedTile(
  blockedTiles: readonly GridCoord[] | undefined,
  x: number,
  z: number,
) {
  return !!blockedTiles?.some((tile) => tile.x === x && tile.z === z);
}

export function isEligibleDecorTile(
  layout: WorldLayout,
  x: number,
  z: number,
  blockedTiles?: readonly GridCoord[],
) {
  if (isBlockedTile(blockedTiles, x, z)) {
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

  return true;
}

export type GenerateTerrainDecorOptions = {
  blockedTiles?: readonly GridCoord[];
};

/**
 * Deterministic decor for a layout: trees, hills, rocks, ponds, mountains.
 * Stable for the same layout geometry across remounts.
 */
export function generateTerrainDecor(
  layout: WorldLayout,
  options: GenerateTerrainDecorOptions = {},
): TerrainDecorPlacement[] {
  const placements: TerrainDecorPlacement[] = [];
  const salt =
    layout.size * 17 +
    layout.castle.x * 31 +
    layout.castle.z * 47 +
    layout.entrance.x * 13 +
    layout.entrance.z * 19;

  for (let x = 0; x < layout.size; x += 1) {
    for (let z = 0; z < layout.size; z += 1) {
      if (!isEligibleDecorTile(layout, x, z, options.blockedTiles)) {
        continue;
      }

      if (hash01(x, z, salt) > DECOR_CHANCE) {
        continue;
      }

      const nearDirt = isAdjacentToDirt(layout, x, z);
      const kindOptions = nearDirt
        ? KIND_WEIGHTS.filter((entry) => !ROAD_ADJACENT_BLOCKED.has(entry.kind))
        : KIND_WEIGHTS;
      const kind = pickDecorKind(hash01(x, z, salt + 101), kindOptions);
      placements.push({
        key: `${kind}:${x}:${z}`,
        x,
        z,
        kind,
      });
    }
  }

  return placements;
}

export function decorOmitsGrass(kind: TerrainDecorKind) {
  return kind === "pond" || kind === "mountain" || kind === "hill";
}

/** Local pond tiles for a layout (deterministic, same as decor generation). */
export function collectPondTiles(
  layout: WorldLayout,
  options: GenerateTerrainDecorOptions = {},
): GridCoord[] {
  return generateTerrainDecor(layout, options)
    .filter((placement) => placement.kind === "pond")
    .map((placement) => ({ x: placement.x, z: placement.z }));
}

/** Local hill tiles for a layout (deterministic, same as decor generation). */
export function collectHillTiles(
  layout: WorldLayout,
  options: GenerateTerrainDecorOptions = {},
): GridCoord[] {
  return generateTerrainDecor(layout, options)
    .filter((placement) => placement.kind === "hill")
    .map((placement) => ({ x: placement.x, z: placement.z }));
}
