export const CASTLE_TILE_PX = 32;

export const CASTLE_SPRITE_SHEET = {
  path: "/textures/castle-tiles.png",
  cols: 3,
  rows: 1,
  tilePx: CASTLE_TILE_PX,
  width: CASTLE_TILE_PX * 3,
  height: CASTLE_TILE_PX,
} as const;

export const CASTLE_SPRITE_IDS = ["stone", "roof", "wood"] as const;

export type CastleSpriteId = (typeof CASTLE_SPRITE_IDS)[number];

export const CASTLE_SPRITE_FRAMES: Record<
  CastleSpriteId,
  { col: number; row: number }
> = {
  stone: { col: 0, row: 0 },
  roof: { col: 1, row: 0 },
  wood: { col: 2, row: 0 },
};

export function castleSpriteUvTransform(sprite: CastleSpriteId) {
  const { cols, rows } = CASTLE_SPRITE_SHEET;
  const frame = CASTLE_SPRITE_FRAMES[sprite];
  const tileWidth = 1 / cols;
  const tileHeight = 1 / rows;

  return {
    repeat: [tileWidth, tileHeight] as [number, number],
    offset: [
      frame.col * tileWidth,
      (rows - 1 - frame.row) * tileHeight,
    ] as [number, number],
  };
}
