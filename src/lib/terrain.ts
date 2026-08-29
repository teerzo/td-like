export const TERRAIN_SIZE = 11;
export const SPAWN_TERRAIN_SIZE_MIN = 3;
export const SPAWN_TERRAIN_SIZE_MAX = 11;
export const TILE_SIZE = 1;
export const TILE_GAP = 0.12;

/** Distance between adjacent tile centers (grass and dirt share this). */
export const TILE_SPACING = TILE_SIZE + TILE_GAP;

/** Dirt quads match grass inset — gaps between tiles align with the grass grid. */
export const DIRT_TILE_SIZE = TILE_SIZE;

/** Toggle off temporarily while tuning ground UVs/textures. */
export const SHOW_DIRT_TILES = true;

/** Toggle terrain props (trees, rocks, lakes, mountains) on level grids. */
export const SHOW_TERRAIN_DECOR = true;

/** @deprecated Use SHOW_TERRAIN_DECOR */
export const SHOW_TREES = SHOW_TERRAIN_DECOR;

export type TerrainTile = {
  key: string;
  x: number;
  z: number;
};

export function generateTerrain(size = TERRAIN_SIZE): TerrainTile[] {
  const tiles: TerrainTile[] = [];

  for (let x = 0; x < size; x += 1) {
    for (let z = 0; z < size; z += 1) {
      tiles.push({
        key: `${x}:${z}`,
        x,
        z,
      });
    }
  }

  return tiles;
}

export function tileWorldPosition(
  x: number,
  z: number,
  size = TERRAIN_SIZE,
) {
  const offset = ((size - 1) * TILE_SPACING) / 2;

  return {
    x: x * TILE_SPACING - offset,
    z: z * TILE_SPACING - offset,
  };
}

export function gridWorldSize(size = TERRAIN_SIZE) {
  const span = (size - 1) * TILE_SPACING + TILE_SIZE;

  return {
    width: span,
    depth: span,
  };
}
