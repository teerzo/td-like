export const GROUND_TILE_PX = 32;

/** All grass variants and dirt road tiles share one sprite sheet (4×7). */
export const GROUND_SPRITE_SHEET = {
  path: "/textures/ground-tiles.png",
  cols: 4,
  rows: 7,
  tilePx: GROUND_TILE_PX,
  width: GROUND_TILE_PX * 4,
  height: GROUND_TILE_PX * 7,
} as const;
