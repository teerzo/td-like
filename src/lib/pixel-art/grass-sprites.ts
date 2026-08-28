import { GROUND_SPRITE_SHEET } from "@/lib/pixel-art/ground-sprite-sheet";
import { atlasFrameUvTransform } from "@/lib/pixel-art/sprite-atlas-uv";

/** Grass variants live on the shared ground sprite sheet. */
export const GRASS_SPRITE_SHEET = GROUND_SPRITE_SHEET;

export const GRASS_SPRITE_IDS = [
  "grass",
  "grass-2",
  "grass-3",
  "grass-4",
] as const;

export type GrassSpriteId = (typeof GRASS_SPRITE_IDS)[number];

export const GRASS_SPRITE_FRAMES: Record<
  GrassSpriteId,
  { col: number; row: number }
> = {
  grass: { col: 0, row: 0 },
  "grass-2": { col: 1, row: 0 },
  "grass-3": { col: 2, row: 0 },
  "grass-4": { col: 3, row: 0 },
};

export function grassSpriteUvTransform(sprite: GrassSpriteId) {
  return atlasFrameUvTransform(GRASS_SPRITE_SHEET, GRASS_SPRITE_FRAMES[sprite]);
}

export const GRASS_TEXTURE_IDS = GRASS_SPRITE_IDS;

export function grassTextureForTile(x: number, z: number): GrassSpriteId {
  const hash = Math.abs(x * 73856093 ^ z * 19349663);
  return GRASS_SPRITE_IDS[hash % GRASS_SPRITE_IDS.length]!;
}
