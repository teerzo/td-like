import { TILE_SPACING } from "@/lib/terrain";
import {
  isOnGrid,
  syncLayoutFromPaths,
  traceRoadPathCoords,
  type WorldLayout,
} from "@/lib/world-layout";

export type GlobalGridCoord = {
  gx: number;
  gz: number;
};

export type ChunkOrigin = GlobalGridCoord;

export function globalCoordKey(gx: number, gz: number) {
  return `${gx}:${gz}`;
}

export function localToGlobal(
  local: { x: number; z: number },
  origin: ChunkOrigin,
): GlobalGridCoord {
  return {
    gx: origin.gx + local.x,
    gz: origin.gz + local.z,
  };
}

/** World position for a cell on the shared global grid. */
export function globalTileWorldPosition(gx: number, gz: number) {
  return {
    x: gx * TILE_SPACING,
    z: gz * TILE_SPACING,
  };
}

/** Place the layout castle at world origin. */
export function centeredChunkOrigin(layout: WorldLayout): ChunkOrigin {
  return centeredOriginForSize(layout.size, layout.castle.x, layout.castle.z);
}

export function centeredOriginForSize(
  size: number,
  centerX = Math.floor(size / 2),
  centerZ = Math.floor(size / 2),
): ChunkOrigin {
  return {
    gx: -centerX,
    gz: -centerZ,
  };
}

export function computeChunkOrigin(
  connectionGlobal: GlobalGridCoord,
  exitLocal: { x: number; z: number },
): ChunkOrigin {
  return {
    gx: connectionGlobal.gx - exitLocal.x,
    gz: connectionGlobal.gz - exitLocal.z,
  };
}

export function getLayoutWorldPath(
  layout: WorldLayout,
  origin: ChunkOrigin,
  y = 0.12,
  pathIndex = 0,
): [number, number, number][] | null {
  const roadPath = layout.paths[pathIndex] ?? layout.paths[0];

  if (!roadPath) {
    return null;
  }

  const single =
    layout.paths.length === 1 && pathIndex === 0
      ? layout
      : syncLayoutFromPaths(layout.size, layout.castle, [roadPath]);

  const path = traceRoadPathCoords(single);

  if (!path) {
    return null;
  }

  return path.map((coord) => {
    const { x, z } = globalTileWorldPosition(
      origin.gx + coord.x,
      origin.gz + coord.z,
    );

    return [x, y, z];
  });
}

const PATH_JOIN_EPSILON = 0.05;

/**
 * World path from an outer level's entrance through parent levels into the main castle.
 * `levels[0]` is the main/root layout; `fromIndex` is where enemies spawn.
 */
export function getChainedWorldPath(
  levels: PlacedLayout[],
  fromIndex: number,
  y = 0.12,
  outerPathIndex = 0,
): [number, number, number][] | null {
  if (levels.length === 0 || fromIndex < 0 || fromIndex >= levels.length) {
    return null;
  }

  const segments: [number, number, number][][] = [];

  for (let i = fromIndex; i >= 0; i -= 1) {
    const level = levels[i]!;
    const pathIndex = i === fromIndex ? outerPathIndex : 0;
    const segment = getLayoutWorldPath(
      level.layout,
      level.origin,
      y,
      pathIndex,
    );

    if (!segment || segment.length < 2) {
      return null;
    }

    segments.push(segment);
  }

  let path = segments[0]!;

  for (let s = 1; s < segments.length; s += 1) {
    const next = segments[s]!;
    const last = path[path.length - 1]!;
    const first = next[0]!;
    const joins =
      Math.hypot(last[0] - first[0], last[2] - first[2]) < PATH_JOIN_EPSILON;
    path = path.concat(joins ? next.slice(1) : next);
  }

  return path.length >= 2 ? path : null;
}

function layoutWorldPoint(
  origin: ChunkOrigin,
  coord: { x: number; z: number },
  y: number,
): [number, number, number] {
  const { x, z } = globalTileWorldPosition(origin.gx + coord.x, origin.gz + coord.z);
  return [x, y, z];
}

function pointsJoin(
  a: [number, number, number],
  b: [number, number, number],
): boolean {
  return Math.hypot(a[0] - b[0], a[2] - b[2]) < PATH_JOIN_EPSILON;
}

/**
 * Flying path: straight lines to each grid's exit (entrance → exit per level),
 * then into the main exit by the castle. Does not follow winding dirt roads.
 */
export function getChainedFlyingWorldPath(
  levels: PlacedLayout[],
  fromIndex: number,
  y = 0.12,
  outerPathIndex = 0,
): [number, number, number][] | null {
  if (levels.length === 0 || fromIndex < 0 || fromIndex >= levels.length) {
    return null;
  }

  const waypoints: [number, number, number][] = [];

  for (let i = fromIndex; i >= 0; i -= 1) {
    const level = levels[i]!;
    const pathIndex = i === fromIndex ? outerPathIndex : 0;
    const roadPath = level.layout.paths[pathIndex] ?? level.layout.paths[0];

    if (!roadPath) {
      return null;
    }

    const entrance = layoutWorldPoint(level.origin, roadPath.entrance, y);
    const exit = layoutWorldPoint(level.origin, roadPath.exit, y);

    if (waypoints.length === 0) {
      waypoints.push(entrance);
    } else if (!pointsJoin(waypoints[waypoints.length - 1]!, entrance)) {
      waypoints.push(entrance);
    }

    if (!pointsJoin(waypoints[waypoints.length - 1]!, exit)) {
      waypoints.push(exit);
    }
  }

  return waypoints.length >= 2 ? waypoints : null;
}

export function collectOnGridGlobalKeys(
  layout: WorldLayout,
  origin: ChunkOrigin,
): Set<string> {
  const keys = new Set<string>();

  for (let x = 0; x < layout.size; x += 1) {
    for (let z = 0; z < layout.size; z += 1) {
      keys.add(globalCoordKey(origin.gx + x, origin.gz + z));
    }
  }

  return keys;
}

export function collectLayoutGlobalKeys(
  layout: WorldLayout,
  origin: ChunkOrigin,
): Set<string> {
  const keys = collectOnGridGlobalKeys(layout, origin);

  for (const roadKey of layout.roadKeys) {
    const [x, z] = roadKey.split(":").map(Number);

    if (!isOnGrid(x, z, layout.size)) {
      keys.add(globalCoordKey(origin.gx + x, origin.gz + z));
    }
  }

  for (const path of layout.paths) {
    keys.add(
      globalCoordKey(origin.gx + path.entrance.x, origin.gz + path.entrance.z),
    );
    keys.add(
      globalCoordKey(origin.gx + path.exit.x, origin.gz + path.exit.z),
    );
  }

  return keys;
}

const CARDINAL_OFFSETS = [
  { dx: 0, dz: -1 },
  { dx: 1, dz: 0 },
  { dx: 0, dz: 1 },
  { dx: -1, dz: 0 },
] as const;

export type PlacedLayout = {
  layout: WorldLayout;
  origin: ChunkOrigin;
};

/** Unclaimed global cells that border both on-grid footprints of adjacent levels. */
export function getSeamGrassTileGroups(levels: PlacedLayout[]): GlobalGridCoord[][] {
  if (levels.length < 2) {
    return [];
  }

  const onGridFootprints = levels.map(({ layout, origin }) =>
    collectOnGridGlobalKeys(layout, origin),
  );
  const claimed = new Set<string>();

  for (const level of levels) {
    for (const key of collectLayoutGlobalKeys(level.layout, level.origin)) {
      claimed.add(key);
    }
  }

  const groups: GlobalGridCoord[][] = [];

  for (let index = 0; index < levels.length - 1; index += 1) {
    const footprintA = onGridFootprints[index]!;
    const footprintB = onGridFootprints[index + 1]!;
    const candidateKeys = new Set<string>();
    const seamKeys = new Set<string>();

    for (const key of footprintA) {
      const [gx, gz] = key.split(":").map(Number);

      for (const { dx, dz } of CARDINAL_OFFSETS) {
        const neighborKey = globalCoordKey(gx + dx, gz + dz);

        if (!footprintA.has(neighborKey) && !footprintB.has(neighborKey)) {
          candidateKeys.add(neighborKey);
        }
      }
    }

    for (const key of footprintB) {
      const [gx, gz] = key.split(":").map(Number);

      for (const { dx, dz } of CARDINAL_OFFSETS) {
        const neighborKey = globalCoordKey(gx + dx, gz + dz);

        if (!footprintA.has(neighborKey) && !footprintB.has(neighborKey)) {
          candidateKeys.add(neighborKey);
        }
      }
    }

    for (const key of candidateKeys) {
      if (claimed.has(key)) {
        continue;
      }

      const [gx, gz] = key.split(":").map(Number);
      let touchesA = false;
      let touchesB = false;

      for (const { dx, dz } of CARDINAL_OFFSETS) {
        const neighborKey = globalCoordKey(gx + dx, gz + dz);

        if (footprintA.has(neighborKey)) {
          touchesA = true;
        }

        if (footprintB.has(neighborKey)) {
          touchesB = true;
        }
      }

      if (touchesA && touchesB) {
        seamKeys.add(key);
      }
    }

    groups.push(
      [...seamKeys].map((key) => {
        const [gx, gz] = key.split(":").map(Number);
        return { gx, gz };
      }),
    );
  }

  return groups;
}

export class GlobalTileRegistry {
  private claims = new Map<string, number>();

  reset() {
    this.claims.clear();
  }

  isClaimed(gx: number, gz: number) {
    return this.claims.has(globalCoordKey(gx, gz));
  }

  getClaimedKeys() {
    return new Set(this.claims.keys());
  }

  canPlaceLayout(
    origin: ChunkOrigin,
    layout: WorldLayout,
    sharedKeys: ReadonlySet<string> = new Set(),
  ) {
    for (const key of collectLayoutGlobalKeys(layout, origin)) {
      if (sharedKeys.has(key)) {
        continue;
      }

      if (this.claims.has(key)) {
        return false;
      }
    }

    return true;
  }

  claimLayout(
    origin: ChunkOrigin,
    layout: WorldLayout,
    levelId: number,
    sharedKeys: ReadonlySet<string> = new Set(),
  ) {
    for (const key of collectLayoutGlobalKeys(layout, origin)) {
      if (sharedKeys.has(key)) {
        continue;
      }

      this.claims.set(key, levelId);
    }
  }
}
