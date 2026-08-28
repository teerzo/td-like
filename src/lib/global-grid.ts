import { TILE_SPACING } from "@/lib/terrain";
import { isOnGrid, traceRoadPathCoords, type WorldLayout } from "@/lib/world-layout";

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
): [number, number, number][] | null {
  const path = traceRoadPathCoords(layout);

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

  keys.add(
    globalCoordKey(
      origin.gx + layout.entrance.x,
      origin.gz + layout.entrance.z,
    ),
  );
  keys.add(
    globalCoordKey(origin.gx + layout.exit.x, origin.gz + layout.exit.z),
  );

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
